import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { EyeOff, MapPin, Plus } from "lucide-react";
import { useCrud, useList } from "../../api/hooks";
import { fmtDay, fmtShortDay, fmtTime, fromLocalInput, groupByDay, toLocalInput } from "../../format";
import { Button, Empty, ErrorNote, Field, Modal, PageHeader, QueryState, Tabs, cx } from "../../ui";

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
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const body = { ...form, event: event.id, starts_at: fromLocalInput(form.starts_at), ends_at: fromLocalInput(form.ends_at) };
    mutation.mutate(item ? { id: item.id, ...body } : body, { onSuccess: onDone });
  };
  return (
    <form className="space-y-5" onSubmit={submit}>
      <Field label="Что происходит">
        <input className="input" value={form.title} onChange={set("title")} required placeholder="Регистрация и выдача бейджей" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Начало">
          <input className="input" type="datetime-local" value={form.starts_at} onChange={set("starts_at")} required />
        </Field>
        <Field label="Окончание">
          <input className="input" type="datetime-local" value={form.ends_at} onChange={set("ends_at")} />
        </Field>
      </div>
      <Field label="Место">
        <input className="input" value={form.location} onChange={set("location")} placeholder="Главный зал" />
      </Field>
      <Field label="Описание">
        <textarea className="input" rows={2} value={form.description} onChange={set("description")} />
      </Field>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={form.is_public} onChange={set("is_public")} />
        Показывать участникам (иначе — только персоналу)
      </label>
      <ErrorNote error={mutation.error || remove.error} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {item ? <Button variant="danger" onClick={() => remove.mutate(item.id, { onSuccess: onDone })}>Удалить</Button> : <span />}
        <Button type="submit" disabled={mutation.isPending}>{item ? "Сохранить" : "Добавить в расписание"}</Button>
      </div>
    </form>
  );
}

// Список пунктов программы одного дня — используется и у участника
export function DayAgenda({ items, onSelect }) {
  return (
    <ol className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((s) => {
        const body = (
          <>
            <div className="w-14 shrink-0">
              <p className="text-sm font-semibold tabular-nums">{fmtTime(s.starts_at)}</p>
              {s.ends_at ? <p className="text-xs tabular-nums muted">{fmtTime(s.ends_at)}</p> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{s.title}</p>
              {s.location ? (
                <p className="mt-0.5 flex items-center gap-1 text-xs muted"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{s.location}</p>
              ) : null}
              {s.description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{s.description}</p> : null}
            </div>
            {onSelect ? (
              <span className={cx("h-max shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", s.is_public ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" : "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300")}>
                {s.is_public ? "Участники" : <span className="inline-flex items-center gap-1"><EyeOff className="h-3 w-3" aria-hidden="true" />Персонал</span>}
              </span>
            ) : null}
          </>
        );
        return (
          <li key={s.id}>
            {onSelect ? (
              <button type="button" onClick={() => onSelect(s)} className="focus-ring flex w-full gap-4 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-6">{body}</button>
            ) : (
              <div className="flex gap-4 px-4 py-3 sm:px-6">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function useDays(items) {
  return useMemo(() => groupByDay(items || []), [items]);
}

export default function SchedulePage() {
  const { event } = useOutletContext();
  const schedule = useList("schedule", { event: event.id });
  const days = useDays(schedule.data);
  const [dayIdx, setDayIdx] = useState(0);
  const [editing, setEditing] = useState(null);
  const day = days[Math.min(dayIdx, days.length - 1)];

  return (
    <>
      <PageHeader
        title="Расписание"
        subtitle="Пункты для участников видны в их кабинете. Пункты для персонала — только команде."
        actions={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Пункт программы</Button>}
      />
      <QueryState query={schedule}>
        {() =>
          days.length === 0 ? (
            <Empty icon={Plus} title="Программа пустая" action={<Button onClick={() => setEditing("new")}>Добавить первый пункт</Button>}>
              Добавьте пункты — участники увидят их у себя в кабинете с телефона.
            </Empty>
          ) : (
            <section className="card">
              <div className="card-head flex-wrap">
                <h2 className="text-lg font-semibold first-letter:uppercase">{fmtDay(day[0].starts_at)}</h2>
                <Tabs
                  label="День"
                  value={Math.min(dayIdx, days.length - 1)}
                  onChange={setDayIdx}
                  options={days.map((d, i) => ({ value: i, label: fmtShortDay(d[0].starts_at) }))}
                />
              </div>
              <DayAgenda items={day} onSelect={setEditing} />
            </section>
          )
        }
      </QueryState>
      {editing ? (
        <Modal title={editing === "new" ? "Новый пункт программы" : editing.title} onClose={() => setEditing(null)}>
          <ScheduleForm event={event} item={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        </Modal>
      ) : null}
    </>
  );
}
