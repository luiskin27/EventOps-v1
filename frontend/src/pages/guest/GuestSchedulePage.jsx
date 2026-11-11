import { MapPin } from "lucide-react";
import { fmtDay, fmtRange } from "../../format";
import { PageHeader, Skeleton } from "../../ui";
import { DayAgenda, useDays } from "../staff/SchedulePage";
import { useGuestData } from "./useGuestData";

export default function GuestSchedulePage() {
  const g = useGuestData();
  const days = useDays(g.schedule.data);
  const ev = g.event.data;

  return (
    <>
      <PageHeader
        title="Моё расписание"
        subtitle={ev ? [fmtRange(ev.start_date, ev.end_date), ev.location].filter(Boolean).join(" · ") : null}
      />
      {ev?.description ? (
        <section className="card p-5">
          <p className="text-sm text-slate-700 dark:text-slate-200">{ev.description}</p>
          {ev.location ? <p className="mt-2 flex items-center gap-1 text-xs muted"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{ev.location}</p> : null}
        </section>
      ) : null}
      {g.schedule.isPending ? <div className="card"><Skeleton /></div> : null}
      {g.schedule.data && days.length === 0 ? (
        <p className="card px-6 py-10 text-center text-sm muted">Программу ещё готовят — она появится здесь.</p>
      ) : null}
      {days.map((day) => (
        <section key={day[0].id} className="card">
          <div className="card-head"><h2 className="text-lg font-semibold first-letter:uppercase">{fmtDay(day[0].starts_at)}</h2></div>
          <DayAgenda items={day} />
        </section>
      ))}
    </>
  );
}
