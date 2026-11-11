import { useState } from "react";
import { useCrud } from "../../api/hooks";
import { EVENT_TYPES } from "../../format";
import { Button, ErrorNote, Field } from "../../ui";

export default function EventForm({ event, onDone }) {
  const { create, update } = useCrud("events");
  const mutation = event ? update : create;
  const [form, setForm] = useState({
    title: event?.title || "",
    event_type: event?.event_type || "WEDDING",
    location: event?.location || "",
    start_date: event?.start_date || "",
    end_date: event?.end_date || "",
    description: event?.description || "",
    is_active: event?.is_active ?? true,
  });
  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const body = { ...form, start_date: form.start_date || null, end_date: form.end_date || null };
    mutation.mutate(event ? { id: event.id, ...body } : body, { onSuccess: onDone });
  };

  return (
    <form className="space-y-5" onSubmit={submit}>
      <Field label="Название">
        <input className="input" value={form.title} onChange={set("title")} required placeholder="Свадьба Айжан и Тимура" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Тип мероприятия">
          <select className="input" value={form.event_type} onChange={set("event_type")}>
            {Object.entries(EVENT_TYPES).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Город и площадка">
          <input className="input" value={form.location} onChange={set("location")} placeholder="Бишкек, ресторан «Ала-Тоо Холл»" />
        </Field>
        <Field label="Начало">
          <input className="input" type="date" value={form.start_date} onChange={set("start_date")} />
        </Field>
        <Field label="Окончание">
          <input className="input" type="date" value={form.end_date} min={form.start_date || undefined} onChange={set("end_date")} />
        </Field>
      </div>
      <Field label="Описание" hint="Гости увидят его в своём кабинете">
        <textarea className="input" rows={3} value={form.description} onChange={set("description")} />
      </Field>
      {event ? (
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={form.is_active} onChange={set("is_active")} />
          Мероприятие активно (снимите, когда оно завершится)
        </label>
      ) : null}
      <ErrorNote error={mutation.error} />
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {event ? "Сохранить" : "Создать мероприятие"}
        </Button>
      </div>
    </form>
  );
}
