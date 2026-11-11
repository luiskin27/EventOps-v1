import { Outlet, useParams } from "react-router-dom";
import { BadgeCheck, CalendarDays, Columns3, CreditCard, FileText, Home, Settings, UserRound, Users } from "lucide-react";
import { useItem, useList } from "../../api/hooks";
import { fmtRange, isOverdueTask, peopleTerms } from "../../format";
import AppShell, { EventSwitcher } from "../../layout/AppShell";
import { ErrorNote, Skeleton } from "../../ui";

// Всё внутри /staff/events/:eventId — в контексте одного мероприятия
export default function EventLayout() {
  const { eventId } = useParams();
  const event = useItem("events", eventId);
  const events = useList("events");
  const tasks = useList("tasks", { event: eventId });
  const participants = useList("participants", { event: eventId });
  const pending = useList("payments", { item__event: eventId, status: "PENDING" }, { refetchInterval: 15_000 });
  const pendingDocs = useList("participant-documents", { doc_type__event: eventId, status: "PENDING" }, { refetchInterval: 15_000 });

  const overdue = (tasks.data || []).filter(isOverdueTask).length;
  const terms = peopleTerms(event.data?.event_type);
  const base = `/staff/events/${eventId}`;

  const items = [
    { to: base, end: true, label: "Обзор", icon: Home },
    { to: `${base}/tasks`, label: "Задачи", icon: Columns3, count: overdue, countKind: "alert", countLabel: "Просрочено:" },
    { to: `${base}/team`, label: "Команда", icon: UserRound },
    { to: `${base}/schedule`, label: "Расписание", icon: CalendarDays },
    { to: `${base}/participants`, label: terms.Many, icon: Users, count: participants.data?.length, countKind: "muted", countLabel: "Всего:" },
    { to: `${base}/payments`, label: "Оплаты", icon: CreditCard, count: pending.data?.length, countKind: "pending", countLabel: "На проверке:" },
    { to: `${base}/documents`, label: "Документы", icon: FileText, count: pendingDocs.data?.length, countKind: "pending", countLabel: "На проверке:" },
    { to: `${base}/badges`, label: "Бейджи", icon: BadgeCheck },
    { to: `${base}/settings`, label: "Настройки мероприятия", icon: Settings },
  ];

  const meta = (e) => [fmtRange(e.start_date, e.end_date), e.location?.split(",")[0]].filter(Boolean).join(" · ");
  const ev = event.data;

  return (
    <AppShell
      nav={{
        section: "Организатор",
        items,
        eventCard: ev ? (
          <>
            <p className="text-xs muted">Мероприятие</p>
            <p className="mt-0.5 text-sm font-semibold">{ev.title}</p>
            <p className="text-xs muted">{meta(ev)}</p>
          </>
        ) : null,
      }}
      topbar={{
        eventSwitcher: ev ? (
          <EventSwitcher
            current={{ id: ev.id, title: ev.title, meta: meta(ev) }}
            events={(events.data || []).map((e) => ({ id: e.id, title: e.title, meta: meta(e) }))}
            linkFor={(e) => `/staff/events/${e.id}`}
          />
        ) : null,
      }}
    >
      {event.isPending ? <div className="card"><Skeleton rows={5} /></div> : null}
      <ErrorNote error={event.error} />
      {ev ? (
        <Outlet
          context={{
            event: ev,
            tasks: tasks.data || [],
            participants: participants.data || [],
            pendingPayments: pending.data || [],
            pendingDocs: pendingDocs.data || [],
            overdue,
            terms,
          }}
        />
      ) : null}
    </AppShell>
  );
}
