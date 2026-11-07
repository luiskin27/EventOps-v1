import { useState } from "react";
import { useCrud } from "../../api/hooks";
import { EVENT_TYPES } from "../../format";
import { Button, ErrorNote, Field } from "../../ui";

export default function EventForm({ event, onDone }) {
  const { create, update } = useCrud("events");
  const [form, setForm] = useState({
    title: event?.title || "",
    event_type: event?.event_type || "CAMP",
    location: event?.location || "",
    start_date: event?.start_date || "",
    end_date: event?.end_date || "",
    description: event?.description || "",
  });
  const mutation = event ? update : create;
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const body = { ...form, start_date: form.start_date || null, end_date: form.end_date || null };
    mutation.mutate(event ? { id: event.id, ...body } : body, { onSuccess: onDone });
  };

  return (
    <form className="stack" onSubmit={submit}>
      <Field label="Название">
        <input value={form.title} onChange={set("title")} required placeholder="Свадьба Айжан и Тимура" />
      </Field>
      <div className="row-2">
        <Field label="Тип">
          <select value={form.event_type} onChange={set("event_type")}>
            {Object.entries(EVENT_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Место">
          <input value={form.location} onChange={set("location")} />
        </Field>
      </div>
      <div className="row-2">
        <Field label="Начало">
          <input type="date" value={form.start_date} onChange={set("start_date")} />
        </Field>
        <Field label="Окончание">
          <input type="date" value={form.end_date} onChange={set("end_date")} min={form.start_date || undefined} />
        </Field>
      </div>
      <Field label="Описание">
        <textarea rows={3} value={form.description} onChange={set("description")} />
      </Field>
      <ErrorNote error={mutation.error} />
      <div className="actions">
        <Button type="submit" disabled={mutation.isPending}>
          {event ? "Сохранить" : "Создать событие"}
        </Button>
      </div>
    </form>
  );
}
