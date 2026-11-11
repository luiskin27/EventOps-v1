import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, CheckCircle2, CircleDashed, MapPin, Plus, Search, Users } from "lucide-react";
import { useList } from "../../api/hooks";
import { EVENT_TYPES, fmtRange, peopleTerms } from "../../format";
import AppShell from "../../layout/AppShell";
import { Badge, Button, Modal, PageHeader, Skeleton, Tabs, ErrorNote } from "../../ui";
import EventForm from "./EventForm";

export default function EventsPage() {
  const events = useList("events");
  const tasks = useList("tasks");
  const participants = useList("participants");
  const [tab, setTab] = useState("active");
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const all = events.data || [];
  const stats = useMemo(() => {
    const by = {};
    for (const t of tasks.data || []) {
      by[t.event] ??= { total: 0, done: 0, people: 0 };
      by[t.event].total += 1;
      if (t.status === "DONE") by[t.event].done += 1;
    }
    for (const p of participants.data || []) {
      by[p.event] ??= { total: 0, done: 0, people: 0 };
      by[p.event].people += 1;
    }
    return by;
  }, [tasks.data, participants.data]);

  const needle = q.trim().toLowerCase();
  const list = all
    .filter((e) => (tab === "active" ? e.is_active : !e.is_active))
    .filter((e) => !needle || `${e.title} ${e.location}`.toLowerCase().includes(needle))
    .sort((a, b) => (a.start_date || "9999").localeCompare(b.start_date || "9999"));

  return (
    <AppShell>
      <PageHeader
        title="Мероприятия"
        subtitle="Свадьбы, корпоративы, форумы и лагеря. Выберите мероприятие — гости, расписание и задачи откроются в его контексте."
        actions={
          <Button size="lg" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Создать мероприятие
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          label="Статус мероприятий"
          value={tab}
          onChange={setTab}
          options={[
            { value: "active", label: "Активные", count: all.filter((e) => e.is_active).length },
            { value: "done", label: "Завершённые", count: all.filter((e) => !e.is_active).length },
          ]}
        />
        <div className="relative w-full sm:w-72">
          <label htmlFor="ev-q" className="sr-only">Поиск мероприятий</label>
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
          <input id="ev-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Название или город" className="input h-9 pl-9" />
        </div>
      </div>

      <ErrorNote error={events.error} />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {events.isPending ? (
          <li className="card"><Skeleton rows={4} /></li>
        ) : null}
        {list.map((e) => {
          const s = stats[e.id] || { total: 0, done: 0, people: 0 };
          const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
          return (
            <li key={e.id}>
              <Link
                to={`/staff/events/${e.id}`}
                className="focus-ring group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50"
              >
                <div className="flex items-start justify-between gap-3">
                  {e.is_active ? (
                    <Badge tone="success" icon={false}>
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Активно
                    </Badge>
                  ) : (
                    <Badge tone="neutral" icon={false}>
                      <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" /> Завершено
                    </Badge>
                  )}
                  <span className="text-xs muted">{EVENT_TYPES[e.event_type]}</span>
                </div>
                <h2 className="mt-3 text-base font-semibold group-hover:text-indigo-700 dark:group-hover:text-indigo-300">{e.title}</h2>
                <dl className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Даты</dt>
                    <CalendarDays className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" strokeWidth={1.75} aria-hidden="true" />
                    <dd>{fmtRange(e.start_date, e.end_date)}</dd>
                  </div>
                  {e.location ? (
                    <div className="flex items-center gap-2">
                      <dt className="sr-only">Локация</dt>
                      <MapPin className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" strokeWidth={1.75} aria-hidden="true" />
                      <dd className="truncate">{e.location}</dd>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <dt className="sr-only">Гости и участники</dt>
                    <Users className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" strokeWidth={1.75} aria-hidden="true" />
                    <dd>{peopleTerms(e.event_type).count(s.people)}</dd>
                  </div>
                </dl>
                <div className="mt-auto pt-5">
                  <div className="flex justify-between text-xs">
                    <span className="muted">Готовность · {s.done} / {s.total} задач</span>
                    <span className="font-medium tabular-nums">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label="Готовность подготовки" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
        {tab === "active" ? (
          <li>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="focus-ring flex h-full min-h-56 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 p-5 text-center hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-slate-700 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Plus className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium">Новое мероприятие</span>
              <span className="text-xs muted">Свадьба, корпоратив, форум или лагерь</span>
            </button>
          </li>
        ) : null}
      </ul>

      {creating ? (
        <Modal title="Новое мероприятие" onClose={() => setCreating(false)}>
          <EventForm onDone={(ev) => navigate(`/staff/events/${ev.id}`)} />
        </Modal>
      ) : null}
    </AppShell>
  );
}
