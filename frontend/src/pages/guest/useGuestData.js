import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { useItem, useList } from "../../api/hooks";
import { useAuth } from "../../auth/AuthContext";

const LIVE = { refetchInterval: 15_000 };

// approved / pending / rejected / none по истории загрузок (чеков или документов)
function stateOf(history) {
  const newest = [...history].sort((a, b) => b.id - a.id);
  if (newest.some((p) => p.status === "APPROVED")) return { state: "approved", last: newest[0], history: newest };
  if (newest[0]?.status === "PENDING") return { state: "pending", last: newest[0], history: newest };
  if (newest[0]?.status === "REJECTED") return { state: "rejected", last: newest[0], history: newest };
  return { state: "none", last: null, history: newest };
}

// Всё, что нужно кабинету участника, одним хуком (react-query кэширует между страницами)
export function useGuestData() {
  const { user } = useAuth();
  const eventId = user.participant.event;
  const event = useItem("events", eventId);
  const schedule = useList("schedule", { event: eventId });
  const items = useList("payment-items", { event: eventId });
  const payments = useList("payments", {}, LIVE);
  const docTypes = useList("document-types", { event: eventId });
  const myDocs = useList("participant-documents", {}, LIVE);
  const documents = useList("documents", { event: eventId });
  const badge = useQuery({ queryKey: ["my-badge"], queryFn: () => api("my/badge/"), retry: false, ...LIVE });

  const itemState = (item) => stateOf((payments.data || []).filter((p) => p.item === item.id));
  const docState = (type) => stateOf((myDocs.data || []).filter((d) => d.doc_type === type.id));

  const itemList = items.data || [];
  const typeList = docTypes.data || [];
  const allPaid = itemList.every((it) => itemState(it).state === "approved");
  const requiredTypes = typeList.filter((t) => t.is_required);
  const allDocs = requiredTypes.every((t) => docState(t).state === "approved");

  // «Требует действия»: нечего ждать — нужно загрузить (нет файла или отклонён)
  const needsAction =
    itemList.filter((it) => ["none", "rejected"].includes(itemState(it).state)).length +
    requiredTypes.filter((t) => ["none", "rejected"].includes(docState(t).state)).length;

  return {
    user,
    participant: user.participant,
    event,
    schedule,
    items,
    payments,
    docTypes,
    myDocs,
    documents,
    badge,
    itemState,
    docState,
    allPaid,
    allDocs,
    needsAction,
    hasBadge: Boolean(badge.data),
    admitted: Boolean(badge.data?.admitted),
    loading: event.isPending || items.isPending || payments.isPending || docTypes.isPending || myDocs.isPending,
  };
}
