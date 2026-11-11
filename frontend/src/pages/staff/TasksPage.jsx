import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AlertTriangle, CalendarDays, Plus, Search } from "lucide-react";
import { useCrud } from "../../api/hooks";
import { TASK_STATUS, fmtDate, plural, todayISO } from "../../format";
import { Button, ErrorNote, Field, Modal, PageHeader, cx, initials } from "../../ui";

const COLS = [
  { key: "TODO", dot: "bg-slate-400" },
  { key: "IN_PROGRESS", dot: "bg-indigo-500" },
  { key: "DONE", dot: "bg-emerald-500" },
];

function TaskForm({ event, task, status, onDone }) {
  const { create, update, remove } = useCrud("tasks");
  const mutation = task ? update : create;
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || status || "TODO",
    due_date: task?.due_date || "",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const body = { ...form, event: event.id, due_date: form.due_date || null };
    mutation.mutate(task ? { id: task.id, ...body } : body, { onSuccess: onDone });
  };
  return (
    <form className="space-y-5" onSubmit={submit}>
      <Field label="Задача">
        <input className="input" value={form.title} onChange={set("title")} required placeholder="Согласовать меню кофе-брейков" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Статус">
          <select className="input" value={form.status} onChange={set("status")}>
            {Object.entries(TASK_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Дедлайн">
          <input className="input" type="date" value={form.due_date} onChange={set("due_date")} />
        </Field>
      </div>
      <Field label="Описание">
        <textarea className="input" rows={3} value={form.description} onChange={set("description")} />
      </Field>
      <ErrorNote error={mutation.error || remove.error} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {task ? (
          <Button variant="danger" onClick={() => remove.mutate(task.id, { onSuccess: onDone })}>Удалить</Button>
        ) : <span />}
        <Button type="submit" disabled={mutation.isPending}>{task ? "Сохранить" : "Добавить задачу"}</Button>
      </div>
    </form>
  );
}

export default function TasksPage() {
  const { event, tasks } = useOutletContext();
  const { update } = useCrud("tasks");
  const [editing, setEditing] = useState(null); // {task} | {status}
  const [q, setQ] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const today = todayISO();

  const isOverdue = (t) => t.status !== "DONE" && t.due_date && t.due_date < today;
  const overdue = tasks.filter(isOverdue).length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const needle = q.trim().toLowerCase();
  const visible = tasks.filter((t) => (!needle || t.title.toLowerCase().includes(needle)) && (!onlyOverdue || isOverdue(t)));

  return (
    <>
      <PageHeader
        title="Задачи"
        subtitle={
          <>
            {plural(tasks.length, "задача", "задачи", "задач")} · {done} готово
            {overdue ? <> · <span className="font-medium text-rose-700 dark:text-rose-400">{overdue} просрочено</span></> : null}
          </>
        }
        actions={<Button onClick={() => setEditing({ status: "TODO" })}><Plus className="h-4 w-4" /> Новая задача</Button>}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <label htmlFor="t-q" className="sr-only">Поиск задач</label>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" />
          <input id="t-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по задачам" className="input h-9 pl-9" />
        </div>
        <button
          type="button"
          aria-pressed={onlyOverdue}
          onClick={() => setOnlyOverdue((v) => !v)}
          className={cx(
            "focus-ring inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium",
            onlyOverdue
              ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          )}
        >
          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden="true" /> Только просроченные
        </button>
      </div>
      <ErrorNote error={update.error} />

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-start gap-4">
          {COLS.map((col) => {
            const cards = visible.filter((t) => t.status === col.key);
            return (
              <section key={col.key} aria-label={TASK_STATUS[col.key]} className="flex w-72 shrink-0 flex-col rounded-xl bg-slate-100 dark:bg-slate-900/60">
                <header className="flex items-center justify-between px-3 pb-2 pt-3">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <span className={cx("h-2 w-2 rounded-full", col.dot)} aria-hidden="true" />
                    {TASK_STATUS[col.key]} <span className="font-normal tabular-nums muted">{cards.length}</span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => setEditing({ status: col.key })}
                    aria-label={`Добавить задачу в колонку «${TASK_STATUS[col.key]}»`}
                    className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </header>
                <ul className="space-y-2 px-2 pb-2">
                  {cards.map((t) => (
                    <li key={t.id} className={cx("rounded-lg border bg-white p-3 shadow-sm dark:bg-slate-900", isOverdue(t) ? "border-rose-200 dark:border-rose-500/30" : "border-slate-200 dark:border-slate-800")}>
                      <button type="button" onClick={() => setEditing({ task: t })} className="focus-ring block w-full rounded text-left">
                        <span className={cx("block text-sm font-medium leading-snug", t.status === "DONE" && "text-slate-500 line-through dark:text-slate-400")}>{t.title}</span>
                      </button>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {t.due_date ? (
                          <span className={cx("inline-flex items-center gap-1 text-xs tabular-nums", isOverdue(t) ? "font-medium text-rose-700 dark:text-rose-400" : "muted")}>
                            {isOverdue(t) ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> : <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
                            {fmtDate(t.due_date)}
                          </span>
                        ) : <span />}
                        <div className="flex items-center gap-2">
                          <label className="sr-only" htmlFor={`st-${t.id}`}>Статус</label>
                          <select
                            id={`st-${t.id}`}
                            value={t.status}
                            onChange={(e) => update.mutate({ id: t.id, status: e.target.value })}
                            className="h-7 rounded-md border border-slate-200 bg-white px-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                          >
                            {Object.entries(TASK_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                          {t.assignee_username ? (
                            <span title={t.assignee_username} className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                              <span className="sr-only">Исполнитель: </span>{initials(t.assignee_username)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                  {cards.length === 0 ? <li className="px-2 py-6 text-center text-xs muted">Пусто</li> : null}
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      {editing ? (
        <Modal title={editing.task ? "Задача" : "Новая задача"} onClose={() => setEditing(null)}>
          <TaskForm event={event} task={editing.task} status={editing.status} onDone={() => setEditing(null)} />
        </Modal>
      ) : null}
    </>
  );
}
