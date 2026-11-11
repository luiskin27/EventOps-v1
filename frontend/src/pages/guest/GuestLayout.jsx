import { Outlet } from "react-router-dom";
import { BadgeCheck, CalendarDays, Home, Upload } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useList } from "../../api/hooks";
import AppShell from "../../layout/AppShell";

export default function GuestLayout() {
  const { user } = useAuth();
  const items = useList("payment-items", { event: user.participant.event });
  const payments = useList("payments", {}, { refetchInterval: 15_000 });

  // «Требует действия»: статьи без оплаты или с отклонённым чеком
  const todo = (items.data || []).filter((it) => {
    const mine = (payments.data || []).filter((p) => p.item === it.id);
    return !mine.some((p) => p.status !== "REJECTED");
  }).length;

  return (
    <AppShell
      nav={{
        section: "Участник",
        items: [
          { to: "/guest", end: true, label: "Кабинет", icon: Home },
          { to: "/guest/schedule", label: "Моё расписание", icon: CalendarDays },
          { to: "/guest/payments", label: "Оплата", icon: Upload, count: todo, countKind: "alert", countLabel: "Требует действия:" },
          { to: "/guest/badge", label: "Мой бейдж", icon: BadgeCheck },
        ],
        eventCard: (
          <>
            <p className="text-xs muted">Мероприятие</p>
            <p className="mt-0.5 text-sm font-semibold">{user.participant.event_title}</p>
          </>
        ),
      }}
      topbar={{ eventTitle: user.participant.event_title }}
    >
      <Outlet />
    </AppShell>
  );
}
