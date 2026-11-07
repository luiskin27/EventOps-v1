import { useState } from "react";
import { Plus } from "lucide-react";
import { useCrud, useList } from "../../api/hooks";
import { TASK_STATUS, fmtDate } from "../../format";
import { Button, ErrorNote, Field, Modal, QueryState } from "../../ui";

function TaskForm({ event, task, onDone }) {
  const { create, update, remove } = useCrud("tasks");
  const mutation = task ? update : create;
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "TODO",
    due_date: task?.due_date || "",
  });
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const body = { ...form, event: event.id, due_date: form.due_date || null };
    mutation.mutate(task ? { id: task.id, ...body } : body, { onSuccess: onDone });
  };

  return (
    <form className="stack" onSubmit={submit}>
      <Field label="Задача">
        <input value={form.title} onChange={set("title")} required />
      </Field>
      <div className="row-2">
        <Field label="Статус">
          <select value={form.status} onChange={set("status")}>
            {Object.entries(TASK_STATUS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Срок">
          <input type="date" value={form.due_date} onChange={set("due_date")} />
        </Field>
      </div>
      <Field label="Подробности">
        <textarea rows={3} value={form.description} onChange={set("description")} />
      </Field>
      <ErrorNote error={mutation.error} />
      <div className="actions">
        {task ? (
          <Button variant="danger" onClick={() => remove.mutate(task.id, { onSuccess: onDone })}>
            Удалить
          </Button>
        ) : null}
        <Button type="submit" disabled={mutation.isPending}>
          {task ? "Сохранить" : "Добавить задачу"}
        </Button>
      </div>
    </form>
  );
}

export default function TasksTab({ event }) {
  const tasks = useList("tasks", { event: event.id });
  const { update } = useCrud("tasks");
  const [editing, setEditing] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section>
      <div className="toolbar toolbar-end">
        <Button onClick={() => setEditing("new")}>
          <Plus size={16} /> Задача
        </Button>
      </div>
      <ErrorNote error={update.error} />
      <QueryState query={tasks}>
        {(list) => (
          <div className="board">
            {Object.entries(TASK_STATUS).map(([status, label]) => {
              const column = list.filter((t) => t.status === status);
              return (
                <section key={status} className={`column column-${status.toLowerCase()}`}>
                  <h3>
                    {label} <span className="count">{column.length}</span>
                  </h3>
                  {column.map((t) => (
                    <article key={t.id} className="task">
                      <button type="button" className="task-title" onClick={() => setEditing(t)}>
                        {t.title}
                      </button>
                      <div className="task-meta">
                        {t.due_date ? (
                          <span className={t.due_date < today && status !== "DONE" ? "overdue" : ""}>
                            до {fmtDate(t.due_date)}
                          </span>
                        ) : null}
                        {t.assignee_username ? <span>{t.assignee_username}</span> : null}
                      </div>
                      <select
                        aria-label="Статус"
                        className="task-status"
                        value={t.status}
                        onChange={(e) => update.mutate({ id: t.id, status: e.target.value })}
                      >
                        {Object.entries(TASK_STATUS).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </article>
                  ))}
                </section>
              );
            })}
          </div>
        )}
      </QueryState>
      {editing ? (
        <Modal title={editing === "new" ? "Новая задача" : "Задача"} onClose={() => setEditing(null)}>
          <TaskForm event={event} task={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        </Modal>
      ) : null}
    </section>
  );
}
