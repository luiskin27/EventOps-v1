import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useItem, useList } from "../../api/hooks";
import { useAuth } from "../../auth/AuthContext";

// Всё, что нужно кабинету участника, одним хуком (react-query кэширует между страницами)
export function useGuestData() {
  const { user } = useAuth();
  const eventId = user.participant.event;
  const event = useItem("events", eventId);
  const schedule = useList("schedule", { event: eventId });
  const items = useList("payment-items", { event: eventId });
  const payments = useList("payments", {}, { refetchInterval: 15_000 });
  const documents = useList("documents", { event: eventId });
  const badge = useQuery({ queryKey: ["my-badge"], queryFn: () => api("my/badge/"), retry: false, refetchInterval: 15_000 });

  // Статус по каждой статье оплаты: approved / pending / rejected / none
  const itemState = (item) => {
    const mine = (payments.data || []).filter((p) => p.item === item.id);
    if (mine.some((p) => p.status === "APPROVED")) return { state: "approved", last: mine[0] };
    if (mine[0]?.status === "PENDING") return { state: "pending", last: mine[0] };
    if (mine[0]?.status === "REJECTED") return { state: "rejected", last: mine[0] };
    return { state: "none", last: null };
  };

  const list = items.data || [];
  const states = list.map(itemState);
  const allPaid = list.length === 0 || states.every((s) => s.state === "approved");
  const hasBadge = Boolean(badge.data);

  return {
    user,
    participant: user.participant,
    event,
    schedule,
    items,
    payments,
    documents,
    badge,
    itemState,
    allPaid,
    hasBadge,
    admitted: Boolean(badge.data?.admitted),
    loading: event.isPending || items.isPending || payments.isPending,
  };
}
