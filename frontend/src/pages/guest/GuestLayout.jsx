import { Outlet } from "react-router-dom";
import { BadgeCheck, CalendarDays, Home, Upload } from "lucide-react";
import AppShell from "../../layout/AppShell";
import { useGuestData } from "./useGuestData";

export default function GuestLayout() {
  const g = useGuestData();

  return (
    <AppShell
      nav={{
        section: "Участник",
        items: [
          { to: "/guest", end: true, label: "Кабинет", icon: Home },
          { to: "/guest/schedule", label: "Моё расписание", icon: CalendarDays },
          { to: "/guest/payments", label: "Оплата и документы", icon: Upload, count: g.needsAction, countKind: "alert", countLabel: "Требует действия:" },
          { to: "/guest/badge", label: "Мой бейдж", icon: BadgeCheck },
        ],
        eventCard: (
          <>
            <p className="text-xs muted">Мероприятие</p>
            <p className="mt-0.5 text-sm font-semibold">{g.participant.event_title}</p>
          </>
        ),
      }}
      topbar={{ eventTitle: g.participant.event_title }}
    >
      <Outlet />
    </AppShell>
  );
}
