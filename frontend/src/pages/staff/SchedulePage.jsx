import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, Copy, Link2, MapPin, Plus, RefreshCw } from "lucide-react";
import { useCrud, useList } from "../../api/hooks";
import { AUDIENCE, fmtDay, fmtShortDay, fmtTime, fromLocalInput, groupByDay, toLocalInput } from "../../format";
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
    audience: item?.audience || "GUESTS",
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
      <fieldset>
        <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Для кого</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {Object.entries(AUDIENCE).map(([v, a]) => (
            <label key={v} className={cx("flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500", form.audience === v ? "border-indigo-500 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-500/10" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50")}>
              <input type="radio" name="aud" value={v} checked={form.audience === v} onChange={set("audience")} className="sr-only" />
              <span className={cx("h-2.5 w-2.5 rounded-full", a.dot)} aria-hidden="true" />
              {a.label}
            </label>
          ))}
        </div>
        <p className="mt-1.5 text-xs muted">Пункты для гостей видят все: гости в кабинете, тамада и персонал — по своим ссылкам.</p>
      </fieldset>
      <ErrorNote error={mutation.error || remove.error} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {item ? <Button variant="danger" onClick={() => remove.mutate(item.id, { onSuccess: onDone })}>Удалить</Button> : <span />}
        <Button type="submit" disabled={mutation.isPending}>{item ? "Сохранить" : "Добавить в расписание"}</Button>
      </div>
    </form>
  );
}

// Список пунктов программы одного дня — используется и у участника
export function DayAgenda({ items, onSelect, showAudience = Boolean(onSelect) }) {
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
            {showAudience ? (
              <span className={cx("h-max shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", AUDIENCE[s.audience]?.cls)}>
                {AUDIENCE[s.audience]?.label}
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

function ShareLinks({ event }) {
  const links = useList("schedule-links", { event: event.id });
  const { create, remove } = useCrud("schedule-links");
  const [copied, setCopied] = useState(null);
  const urlOf = (l) => `${window.location.origin}/s/${l.token}`;
  const copy = async (l) => {
    try {
      await navigator.clipboard.writeText(urlOf(l));
    } catch {
      window.prompt("Скопируйте ссылку:", urlOf(l));
    }
    setCopied(l.id);
    setTimeout(() => setCopied(null), 2000);
  };
  const rows = [
    ["HOSTS", "Тамада и диджей", "Их пункты + общие для гостей: тосты, игры, танцпол, торт"],
    ["STAFF", "Официанты и повара", "Подача блюд, сервировка + общие для гостей"],
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm muted">Отправьте ссылку в WhatsApp или Telegram — откроется только нужное расписание, без входа и пароля. Если ссылка попала не тому, создайте новую: старая перестанет работать.</p>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
        {rows.map(([aud, name, hint]) => {
          const l = (links.data || []).find((x) => x.audience === aud);
          return (
            <li key={aud} className="space-y-2 p-4">
              <div>
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs muted">{hint}</p>
              </div>
              {l ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input readOnly value={urlOf(l)} aria-label={`Ссылка: ${name}`} onFocus={(e) => e.target.select()} className="input h-9 min-w-0 flex-1 text-xs" />
                  <Button size="sm" onClick={() => copy(l)}>
                    {copied === l.id ? <><Check className="h-4 w-4" /> Скопировано</> : <><Copy className="h-4 w-4" /> Копировать</>}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={remove.isPending || create.isPending}
                    onClick={() => remove.mutate(l.id, { onSuccess: () => create.mutate({ event: event.id, audience: aud }) })}>
                    <RefreshCw className="h-4 w-4" /> Новая
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => create.mutate({ event: event.id, audience: aud })} disabled={create.isPending}>
                  <Link2 className="h-4 w-4" /> Создать ссылку
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <ErrorNote error={create.error || remove.error || links.error} />
    </div>
  );
}

export default function SchedulePage() {
  const { event } = useOutletContext();
  const schedule = useList("schedule", { event: event.id });
  const days = useDays(schedule.data);
  const [dayIdx, setDayIdx] = useState(0);
  const [editing, setEditing] = useState(null);
  const [aud, setAud] = useState("");
  const [sharing, setSharing] = useState(false);
  const day = days[Math.min(dayIdx, days.length - 1)];
  const dayItems = (day || []).filter((s) => !aud || s.audience === aud);

  return (
    <>
      <PageHeader
        title="Расписание"
        subtitle="У гостей, тамады с диджеем и персонала — своё расписание. Гости видят его в кабинете, остальные — по ссылке."
        actions={
          <>
            <Button variant="secondary" onClick={() => setSharing(true)}><Link2 className="h-4 w-4" /> Ссылки для команды</Button>
            <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Пункт программы</Button>
          </>
        }
      />
      <QueryState query={schedule}>
        {() =>
          days.length === 0 ? (
            <Empty icon={Plus} title="Программа пустая" action={<Button onClick={() => setEditing("new")}>Добавить первый пункт</Button>}>
              Добавьте пункты: выход молодых, тосты, подачу блюд, торт. Для каждого выберите, для кого он.
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
              <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6" role="group" aria-label="Для кого">
                {[["", "Все"], ...Object.entries(AUDIENCE).map(([v, a]) => [v, a.label])].map(([v, l]) => (
                  <button key={v || "all"} type="button" aria-pressed={aud === v} onClick={() => setAud(v)}
                    className={cx("focus-ring inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium",
                      aud === v ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800")}>
                    {l} <span className="tabular-nums opacity-80">{day.filter((s) => !v || s.audience === v).length}</span>
                  </button>
                ))}
              </div>
              {dayItems.length ? <DayAgenda items={dayItems} onSelect={setEditing} /> : <p className="px-6 py-8 text-center text-sm muted">В этот день для этой группы ничего нет.</p>}
            </section>
          )
        }
      </QueryState>
      {sharing ? (
        <Modal title="Ссылки на расписание для команды" onClose={() => setSharing(false)}>
          <ShareLinks event={event} />
        </Modal>
      ) : null}
      {editing ? (
        <Modal title={editing === "new" ? "Новый пункт программы" : editing.title} onClose={() => setEditing(null)}>
          <ScheduleForm event={event} item={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        </Modal>
      ) : null}
    </>
  );
}
