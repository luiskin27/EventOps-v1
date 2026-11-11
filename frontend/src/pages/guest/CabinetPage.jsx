import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Circle, Clock, FileText, Lock, X } from "lucide-react";
import { daysUntil, fmtMoney, fmtRange, fmtShortDay, plural } from "../../format";
import { Badge, Skeleton, Tabs, cx } from "../../ui";
import BadgeCard from "../../ui/BadgeCard";
import { DayAgenda, useDays } from "../staff/SchedulePage";
import { useGuestData } from "./useGuestData";

const STEP = {
  done: ["bg-emerald-500", "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", Check],
  wait: ["bg-amber-400", "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", Clock],
  todo: ["bg-slate-200 dark:bg-slate-700", "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", Circle],
  bad: ["bg-rose-500", "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", X],
};

export function BadgeAside({ g }) {
  const ev = g.event.data;
  const b = g.badge.data;
  return (
    <section aria-labelledby="bd" className="card h-max p-4 sm:p-6">
      <h2 id="bd" className="text-lg font-semibold">Мой бейдж</h2>
      <div className="mt-4">
        <BadgeCard
          eventTitle={ev?.title || g.participant.event_title}
          eventMeta={ev ? fmtRange(ev.start_date, ev.end_date) : ""}
          name={g.participant.full_name}
          role={b?.role || g.participant.role}
          qrUrl={b?.qr_image_url}
          active={Boolean(g.admitted)}
          background={b?.background_color}
          logoUrl={b?.logo_url}
          code={b ? `№ ${b.verification_token.slice(0, 8).toUpperCase()}` : null}
        />
      </div>
      {g.admitted ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Вы допущены. Покажите QR-код на входе с телефона.
        </p>
      ) : (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {b ? "QR-код заработает, когда организатор подтвердит оплату и документы." : "Бейдж появится, когда организатор его выдаст."}
        </p>
      )}
    </section>
  );
}

export default function CabinetPage() {
  const g = useGuestData();
  const days = useDays(g.schedule.data);
  const [dayIdx, setDayIdx] = useState(0);
  if (g.loading) return <div className="card"><Skeleton rows={6} /></div>;

  const ev = g.event.data;
  const items = g.items.data || [];
  const firstName = g.participant.full_name.split(" ").slice(-1)[0];
  const left = daysUntil(ev?.start_date);

  const docTypes = (g.docTypes.data || []).filter((t) => t.is_required);
  const anyRejected = items.some((it) => g.itemState(it).state === "rejected");
  const anyPending = items.some((it) => g.itemState(it).state === "pending");
  const docRejected = docTypes.some((t) => g.docState(t).state === "rejected");
  const docPending = docTypes.some((t) => g.docState(t).state === "pending");

  // Единый список «что осталось сделать»: оплаты + обязательные документы
  const todo = [
    ...items.map((it) => ({
      key: `p${it.id}`,
      title: `${it.title} · ${fmtMoney(it.amount, it.currency)}`,
      ...g.itemState(it),
      text: { approved: "Оплата подтверждена", pending: "Чек на проверке у организатора", rejected: "Чек отклонён — загрузите новый", none: "Оплатите и загрузите чек" },
      cta: { rejected: "Загрузить снова", none: "Загрузить чек" },
    })),
    ...docTypes.map((t) => ({
      key: `d${t.id}`,
      title: t.title,
      ...g.docState(t),
      text: { approved: "Документ принят", pending: "Документ на проверке у организатора", rejected: "Нужна замена — загрузите заново", none: t.description || "Загрузите фото или скан" },
      cta: { rejected: "Загрузить снова", none: "Загрузить" },
    })),
  ];

  const steps = [
    { name: "Регистрация", note: "Готово", kind: "done" },
    {
      name: "Оплата",
      note: items.length === 0 ? "Не требуется" : g.allPaid ? "Подтверждена" : anyRejected ? "Чек отклонён" : anyPending ? "На проверке" : "Нужно оплатить",
      kind: g.allPaid ? "done" : anyRejected ? "bad" : anyPending ? "wait" : "todo",
    },
    {
      name: "Документы",
      note: docTypes.length === 0 ? "Не требуются" : g.allDocs ? "Приняты" : docRejected ? "Нужна замена" : docPending ? "На проверке" : "Нужно загрузить",
      kind: g.allDocs ? "done" : docRejected ? "bad" : docPending ? "wait" : "todo",
    },
    { name: "Бейдж", note: g.hasBadge ? "Выдан" : "Ещё не выдан", kind: g.hasBadge ? "done" : "todo" },
    { name: "Допуск", note: g.admitted ? "Можно приходить" : "После оплаты, документов и бейджа", kind: g.admitted ? "done" : "todo" },
  ];
  const doneSteps = steps.filter((s) => s.kind === "done").length;
  const day = days[Math.min(dayIdx, days.length - 1)];

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold">Здравствуйте, {firstName}</h1>
        <p className="mt-1 text-sm muted">
          {left > 0 ? `До начала ${plural(left, "день", "дня", "дней")}. ` : ""}
          {g.admitted ? "Всё готово — ждём вас!" : `Осталось ${plural(steps.length - doneSteps, "шаг", "шага", "шагов")} до допуска.`}
        </p>
      </div>

      <section aria-labelledby="st" className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="st" className="text-sm font-medium muted">Статус участия</h2>
            <p className="mt-1 text-lg font-semibold">{g.admitted ? "Допущен" : anyPending || docPending ? "Ожидает проверки" : "Не завершено"}</p>
          </div>
          {g.admitted ? <Badge tone="success">Допущен</Badge> : <Badge tone="pending">Не допущен пока</Badge>}
        </div>
        <ol className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-5">
          {steps.map((s) => {
            const [bar, icon, Icon] = STEP[s.kind];
            return (
              <li key={s.name} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                <span className={cx("hidden h-1.5 w-full rounded-full sm:block", bar)} aria-hidden="true" />
                <span className="flex items-center gap-2 text-sm">
                  <span className={cx("flex h-6 w-6 items-center justify-center rounded-full", icon)}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block font-medium">{s.name}</span>
                    <span className="block text-xs muted">{s.note}</span>
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {todo.length ? (
            <section aria-labelledby="todo" className="card">
              <div className="card-head">
                <h2 id="todo" className="text-lg font-semibold">Что осталось сделать</h2>
                <span className="text-sm tabular-nums muted">{todo.filter((t) => t.state === "approved").length} из {todo.length}</span>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {todo.map((t) => {
                  const kind = { approved: "done", pending: "wait", rejected: "bad", none: "todo" }[t.state];
                  const [, icon, Icon] = STEP[kind];
                  const cta = t.cta[t.state];
                  return (
                    <li key={t.key} className="flex flex-wrap items-start gap-3 px-4 py-4 sm:flex-nowrap sm:px-6">
                      <span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", icon)}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1 max-sm:basis-[calc(100%-2.75rem)]">
                        <p className={cx("text-sm font-medium", t.state === "approved" && "text-slate-500 line-through dark:text-slate-400")}>{t.title}</p>
                        <p className="mt-0.5 text-xs muted">{t.text[t.state]}</p>
                        {t.state === "rejected" && t.last?.admin_comment ? (
                          <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-500/10 dark:text-rose-100">
                            <span className="font-medium">Комментарий администратора:</span> {t.last.admin_comment}
                          </p>
                        ) : null}
                      </div>
                      {cta ? (
                        <Link
                          to="/guest/payments"
                          className={cx(
                            "focus-ring inline-flex h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-medium max-sm:ml-11 max-sm:w-[calc(100%-2.75rem)] lg:h-9",
                            t.state === "rejected" ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          )}
                        >
                          {cta}
                        </Link>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="my" className="card">
            <div className="card-head flex-wrap">
              <h2 id="my" className="text-lg font-semibold">Моё расписание</h2>
              {days.length > 1 ? (
                <Tabs label="День" value={Math.min(dayIdx, days.length - 1)} onChange={setDayIdx} options={days.map((d, i) => ({ value: i, label: fmtShortDay(d[0].starts_at) }))} />
              ) : null}
            </div>
            {day ? <DayAgenda items={day} /> : <p className="px-6 py-8 text-center text-sm muted">Программу ещё готовят — она появится здесь.</p>}
          </section>

          {g.documents.data?.length ? (
            <section className="card">
              <div className="card-head"><h2 className="text-lg font-semibold">Документы мероприятия</h2></div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {g.documents.data.map((d) => (
                  <li key={d.id}>
                    <a href={d.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" /> {d.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <BadgeAside g={g} />
      </div>
    </>
  );
}
