import { useState } from "react";
import { EyeOff, Plus } from "lucide-react";
import { useCrud, useList } from "../../api/hooks";
import { fmtDay, fmtTime, fromLocalInput, groupByDay, toLocalInput } from "../../format";
import { Button, Empty, ErrorNote, Field, Modal, QueryState } from "../../ui";

function ScheduleForm({ event, item, onDone }) {
  const { create, update, remove } = useCrud("schedule");
  const mutation = item ? update : create;
  const [form, setForm] = useState({
    title: item?.title || "",
    location: item?.location || "",
    starts_at: toLocalInput(item?.starts_at) || (event.start_date ? `${event.start_date}T10:00` : ""),
    ends_at: toLocalInput(item?.ends_at),
    description: item?.description || "",
    is_public: item?.is_public ?? true,
  });
  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const body = {
      ...form,
      event: event.id,
      starts_at: fromLocalInput(form.starts_at),
      ends_at: fromLocalInput(form.ends_at),
    };
    mutation.mutate(item ? { id: item.id, ...body } : body, { onSuccess: onDone });
  };

  return (
    <form className="stack" onSubmit={submit}>
      <Field label="Что происходит">
        <input value={form.title} onChange={set("title")} required placeholder="Регистрация гостей" />
      </Field>
      <div className="row-2">
        <Field label="Начало">
          <input type="datetime-local" value={form.starts_at} onChange={set("starts_at")} required />
        </Field>
        <Field label="Окончание">
          <input type="datetime-local" value={form.ends_at} onChange={set("ends_at")} />
        </Field>
      </div>
      <Field label="Место">
        <input value={form.location} onChange={set("location")} />
      </Field>
      <Field label="Описание">
        <textarea rows={2} value={form.description} onChange={set("description")} />
      </Field>
      <label className="check">
        <input type="checkbox" checked={form.is_public} onChange={set("is_public")} />
        Показывать гостям
      </label>
      <ErrorNote error={mutation.error} />
      <div className="actions">
        {item ? (
          <Button variant="danger" onClick={() => remove.mutate(item.id, { onSuccess: onDone })}>
            Удалить
          </Button>
        ) : null}
        <Button type="submit" disabled={mutation.isPending}>
          {item ? "Сохранить" : "Добавить в расписание"}
        </Button>
      </div>
    </form>
  );
}

export function Timeline({ items, onSelect }) {
  return groupByDay(items).map((day) => (
    <section key={day[0].id} className="day">
      <h3 className="day-title">{fmtDay(day[0].starts_at)}</h3>
      <ol className="timeline">
        {day.map((item) => {
          const content = (
            <>
              <span className="tl-time">
                {fmtTime(item.starts_at)}
                {item.ends_at ? <small>{fmtTime(item.ends_at)}</small> : null}
              </span>
              <span className="tl-body">
                <span className="tl-title">
                  {item.title}
                  {!item.is_public ? (
                    <span className="tl-hidden" title="Гости не видят">
                      <EyeOff size={14} /> только команда
                    </span>
                  ) : null}
                </span>
                {item.location ? <span className="tl-loc">{item.location}</span> : null}
                {item.description ? <span className="tl-desc">{item.description}</span> : null}
              </span>
            </>
          );
          return (
            <li key={item.id}>
              {onSelect ? (
                <button type="button" className="tl-item" onClick={() => onSelect(item)}>
                  {content}
                </button>
              ) : (
                <div className="tl-item">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  ));
}

export default function ScheduleTab({ event }) {
  const schedule = useList("schedule", { event: event.id });
  const [editing, setEditing] = useState(null);

  return (
    <section>
      <div className="toolbar toolbar-end">
        <Button onClick={() => setEditing("new")}>
          <Plus size={16} /> Пункт программы
        </Button>
      </div>
      <QueryState query={schedule}>
        {(items) =>
          items.length === 0 ? (
            <Empty title="Программа пустая">Добавьте первый пункт — гости увидят его у себя в телефоне.</Empty>
          ) : (
            <Timeline items={items} onSelect={setEditing} />
          )
        }
      </QueryState>
      {editing ? (
        <Modal title={editing === "new" ? "Новый пункт" : editing.title} onClose={() => setEditing(null)}>
          <ScheduleForm event={event} item={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        </Modal>
      ) : null}
    </section>
  );
}

