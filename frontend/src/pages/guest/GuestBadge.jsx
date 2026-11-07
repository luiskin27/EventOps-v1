import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import { Empty, ErrorNote, Loading } from "../../ui";

export default function GuestBadge() {
  const badge = useQuery({ queryKey: ["my-badge"], queryFn: () => api("my/badge/"), retry: false });

  if (badge.isPending) return <Loading />;
  if (badge.error?.status === 404) {
    return (
      <Empty title="Бейдж ещё не выдан">
        Организатор выдаст его ближе к началу. Тогда здесь появится QR-код для входа.
      </Empty>
    );
  }
  if (badge.isError) return <ErrorNote error={badge.error} />;

  const b = badge.data;
  return (
    <div className="ticket-wrap">
      <article className="ticket" style={{ "--badge-bg": b.background_color || "#FFFFFF" }}>
        <div className="ticket-top">
          {b.logo_url ? <img src={b.logo_url} alt="" className="ticket-logo" /> : null}
          <p className="ticket-event">{b.event}</p>
          <h2 className="ticket-name">{b.full_name}</h2>
          {b.role ? <p className="ticket-role">{b.role}</p> : null}
        </div>
        <div className="ticket-tear" aria-hidden="true" />
        <div className="ticket-bottom">
          {b.valid ? (
            <img src={b.qr_image_url} alt="QR-код бейджа" className="ticket-qr" width="220" height="220" />
          ) : (
            <p className="note note-error">Бейдж отключён организатором.</p>
          )}
          <p className="ticket-hint">Покажите этот код на входе</p>
        </div>
      </article>
    </div>
  );
}
