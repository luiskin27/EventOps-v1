import { Check, Lock } from "lucide-react";
import { fmtRange } from "../../format";
import { PageHeader, Skeleton } from "../../ui";
import BadgeCard from "../../ui/BadgeCard";
import { useGuestData } from "./useGuestData";

export default function GuestBadgePage() {
  const g = useGuestData();
  if (g.loading || g.badge.isPending) return <div className="card"><Skeleton /></div>;
  const ev = g.event.data;
  const b = g.badge.data;

  return (
    <>
      <PageHeader title="Мой бейдж" subtitle="Покажите QR-код на входе с телефона — яркость экрана лучше прибавить." />
      <div className="mx-auto w-full max-w-sm space-y-4">
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
          size={220}
        />
        {g.admitted ? (
          <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100">
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> Вы допущены на мероприятие.
          </p>
        ) : (
          <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {!b ? "Бейдж ещё не выдан организатором." : !g.allPaid ? "QR-код заработает после подтверждения оплаты." : "Бейдж отключён организатором."}
          </p>
        )}
      </div>
    </>
  );
}
