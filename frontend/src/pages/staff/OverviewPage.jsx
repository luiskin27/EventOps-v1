import { Link, useOutletContext } from "react-router-dom";
import { AlertTriangle, Check, Clock, Info, Plus, Users } from "lucide-react";
import { useList } from "../../api/hooks";
import { daysUntil, fmtDate, fmtMoney, fmtShortDay, fmtTime, plural, todayISO } from "../../format";
import { PageHeader, cx } from "../../ui";

const TONES = {
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

function Kpi({ to, label, value, note, icon: Icon, tone, alert }) {
  return (
    <li>
      <Link
        to={to}
        className={cx(
          "focus-ring block h-full rounded-xl border bg-white p-5 shadow-sm transition hover:shadow dark:bg-slate-900",
          alert ? "border-rose-200 dark:border-rose-500/30" : "border-slate-200 dark:border-slate-800"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
          <span className={cx("flex h-8 w-8 items-center justify-center rounded-lg", TONES[tone])}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
        <p className={cx("mt-1 text-xs", alert ? "font-medium text-rose-700 dark:text-rose-400" : "muted")}>{note}</p>
      </Link>
    </li>
  );
}

const ATT = {
  high: [TONES.rose, AlertTriangle, "Срочно"],
  mid: [TONES.amber, Clock, "Ожидает"],
  info: ["bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", Info, "К сведению"],
};

export default function OverviewPage() {
  const { event, tasks, participants, pendingPayments, overdue } = useOutletContext();
  const schedule = useList("schedule", { event: event.id });
  const items = useList("payment-items", { event: event.id });
  const approved = useList("payments", { item__event: event.id, status: "APPROVED" });
  const base = `/staff/events/${event.id}`;
  const today = todayISO();

  const done = tasks.filter((t) => t.status === "DONE").length;
  const paidPeople = new Set((approved.data || []).map((p) => p.participant)).size;
  const collected = (approved.data || []).reduce((s, p) => s + Number(p.amount), 0);
  const expected = (items.data || []).reduce((s, i) => s + Number(i.amount), 0) * participants.length;
  const currency = items.data?.[0]?.currency || "KGS";
  const noBadge = participants.filter((p) => !p.badge_token).length;
  const overdueTasks = tasks.filter((t) => t.status !== "DONE" && t.due_date && t.due_date < today);
  const oldestPending = [...pendingPayments].sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  const days = daysUntil(event.start_date);

  const attention = [
    overdueTasks.length && {
      s: "high",
      title: `${plural(overdueTasks.length, "задача просрочена", "задачи просрочены", "задач просрочено")}`,
      meta: `«${overdueTasks[0].title}» — срок ${fmtDate(overdueTasks[0].due_date)}`,
      action: "Открыть",
      to: `${base}/tasks`,
    },
    pendingPayments.length && {
      s: "mid",
      title: `${plural(pendingPayments.length, "оплата ждёт", "оплаты ждут", "оплат ждут")} проверки`,
      meta: `Самая старая — от ${oldestPending.participant_name}, ${fmtDate(oldestPending.created_at)}`,
      action: "Проверить",
      to: `${base}/payments`,
    },
    noBadge && {
      s: "info",
      title: `${plural(noBadge, "участнику", "участникам", "участникам")} не выдан бейдж`,
      meta: "Бейдж с QR-кодом нужен для входа на мероприятие",
      action: "Выдать",
      to: `${base}/badges`,
    },
  ].filter(Boolean);

  const now = new Date().toISOString();
  const upcoming = (schedule.data || []).filter((s) => (s.ends_at || s.starts_at) >= now).slice(0, 5);

  return (
    <>
      <PageHeader
        title="Обзор"
        subtitle={[
          days == null ? "Даты не указаны" : days > 0 ? `До начала ${plural(days, "день", "дня", "дней")}` : days === 0 ? "Начинается сегодня" : "Идёт или завершено",
          event.start_date && fmtDate(event.start_date),
          event.location,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <Link to={`${base}/tasks`} className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Новая задача
          </Link>
        }
      />

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi to={`${base}/participants`} label="Участники" value={participants.length} note={`Без бейджа: ${noBadge}`} icon={Users} tone="indigo" />
        <Kpi to={`${base}/payments`} label="Оплатили" value={paidPeople} note={`${fmtMoney(collected, currency)} · ${pendingPayments.length} ждут проверки`} icon={Check} tone="emerald" />
        <Kpi to={`${base}/payments`} label="Оплаты на проверке" value={pendingPayments.length} note={oldestPending ? `Самая старая — ${fmtDate(oldestPending.created_at)}` : "Всё проверено"} icon={Clock} tone="amber" />
        <Kpi to={`${base}/tasks`} label="Просроченные задачи" value={overdue} note={overdue ? `Самая давняя — ${fmtDate(overdueTasks[0].due_date)}` : "Всё в срок"} icon={AlertTriangle} tone="rose" alert={overdue > 0} />
      </ul>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section aria-labelledby="att" className="card lg:col-span-2">
          <div className="card-head">
            <h2 id="att" className="text-lg font-semibold">Требует внимания</h2>
            <span className="text-xs muted">{plural(attention.length, "пункт", "пункта", "пунктов")}</span>
          </div>
          {attention.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm muted">Срочного ничего нет — всё под контролем.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {attention.map((a) => {
                const [cls, Icon, sev] = ATT[a.s];
                return (
                  <li key={a.title} className="flex flex-wrap items-start gap-3 px-5 py-3.5 sm:flex-nowrap">
                    <span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", cls)}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium"><span className="sr-only">{sev}: </span>{a.title}</p>
                      <p className="mt-0.5 text-xs muted">{a.meta}</p>
                    </div>
                    <Link to={a.to} className="focus-ring inline-flex h-8 shrink-0 items-center rounded-lg px-3 text-sm font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                      {a.action}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="bud" className="card p-5">
          <h2 id="bud" className="text-lg font-semibold">Сбор взносов</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="muted">Собрано</dt><dd className="font-medium tabular-nums">{fmtMoney(collected, currency)}</dd></div>
            <div className="flex justify-between"><dt className="muted">Ожидается всего</dt><dd className="font-medium tabular-nums">{fmtMoney(expected, currency)}</dd></div>
            <div className="flex justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
              <dt className="font-medium">Осталось собрать</dt>
              <dd className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">{fmtMoney(Math.max(expected - collected, 0), currency)}</dd>
            </div>
          </dl>
          <div className="mt-5 space-y-3">
            <Progress label="Сбор взносов" value={collected} max={expected} color="bg-emerald-600 dark:bg-emerald-500" />
            <Progress label="Готовность задач" value={done} max={tasks.length} color="bg-indigo-600 dark:bg-indigo-500" />
          </div>
        </section>
      </div>

      <section aria-labelledby="sch" className="card">
        <div className="card-head">
          <h2 id="sch" className="text-lg font-semibold">Ближайшее в расписании</h2>
          <Link to={`${base}/schedule`} className="link text-sm">Всё расписание</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm muted">В программе нет предстоящих пунктов.</p>
        ) : (
          <ol className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcoming.map((u) => (
              <li key={u.id} className="grid grid-cols-12 items-center gap-3 px-5 py-3">
                <div className="col-span-3 sm:col-span-2">
                  <p className="text-sm font-semibold tabular-nums">{fmtTime(u.starts_at)}</p>
                  <p className="text-xs muted">{fmtShortDay(u.starts_at)}</p>
                </div>
                <div className="col-span-9 min-w-0 sm:col-span-8">
                  <p className="truncate text-sm font-medium">{u.title}</p>
                  <p className="truncate text-xs muted">{u.location}</p>
                </div>
                <div className="col-span-12 sm:col-span-2 sm:text-right">
                  <span className={cx("rounded-full px-2 py-0.5 text-xs font-medium", u.is_public ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" : "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300")}>
                    {u.is_public ? "Участники" : "Персонал"}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

function Progress({ label, value, max, color }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="muted">{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={cx("h-2 rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
