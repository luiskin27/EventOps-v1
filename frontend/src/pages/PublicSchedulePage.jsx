// Расписание по ссылке для тамады, диджея или персонала — без входа.
// Крупный текст и отметка «сейчас», чтобы смотреть на телефоне прямо во время вечера.
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { api } from "../api/client";
import { AUDIENCE, fmtDay, fmtTime, groupByDay } from "../format";
import { Logo } from "../layout/AppShell";
import { ErrorNote, Skeleton, cx } from "../ui";

export default function PublicSchedulePage() {
  const { token } = useParams();
  const q = useQuery({
    queryKey: ["public-schedule", token],
    queryFn: () => api(`public/schedule/${token}/`, { auth: false }),
    retry: false,
    refetchInterval: 60_000, // организатор поменял время — обновится само
  });
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const d = q.data;
  const nowIso = now.toISOString();
  const isNow = (s) => s.starts_at <= nowIso && (s.ends_at ? s.ends_at > nowIso : false);
  const nextId = d?.items.find((s) => s.starts_at > nowIso)?.id;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
        <Logo to="/login" />
        <span className="ml-auto text-sm tabular-nums muted">{fmtTime(now)}</span>
      </header>
      <main className="mx-auto w-full max-w-2xl space-y-4 p-4">
        {q.isPending ? <div className="card"><Skeleton rows={6} /></div> : null}
        {q.isError ? <ErrorNote error={q.error} /> : null}
        {d ? (
          <>
            <div>
              <p className={cx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", AUDIENCE[d.audience]?.cls)}>
                Расписание: {d.audience_label}
              </p>
              <h1 className="mt-2 text-2xl font-semibold">{d.event}</h1>
              {d.location ? <p className="mt-1 flex items-center gap-1 text-sm muted"><MapPin className="h-4 w-4" aria-hidden="true" />{d.location}</p> : null}
            </div>
            {groupByDay(d.items).map((day) => (
              <section key={day[0].id} className="card">
                <div className="card-head"><h2 className="text-lg font-semibold first-letter:uppercase">{fmtDay(day[0].starts_at)}</h2></div>
                <ol className="divide-y divide-slate-100 dark:divide-slate-800">
                  {day.map((s) => {
                    const mine = s.audience === d.audience;
                    return (
                      <li
                        key={s.id}
                        aria-current={isNow(s) ? "time" : undefined}
                        className={cx("flex gap-4 px-4 py-4 sm:px-6", isNow(s) && "bg-emerald-50 dark:bg-emerald-500/10", !mine && "opacity-75")}
                      >
                        <div className="w-16 shrink-0">
                          <p className="text-lg font-semibold tabular-nums">{fmtTime(s.starts_at)}</p>
                          {s.ends_at ? <p className="text-xs tabular-nums muted">до {fmtTime(s.ends_at)}</p> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cx("text-base", mine ? "font-semibold" : "font-medium")}>{s.title}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs muted">
                            {s.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{s.location}</span> : null}
                            {!mine ? <span className={cx("rounded-full px-2 py-0.5 font-medium", AUDIENCE[s.audience]?.cls)}>для гостей</span> : null}
                          </p>
                          {s.description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{s.description}</p> : null}
                        </div>
                        {isNow(s) ? <span className="h-max shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">Сейчас</span>
                          : s.id === nextId ? <span className="h-max shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">Далее</span> : null}
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
            {d.items.length === 0 ? <p className="card px-6 py-10 text-center text-sm muted">Организатор ещё не добавил пункты в это расписание.</p> : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
