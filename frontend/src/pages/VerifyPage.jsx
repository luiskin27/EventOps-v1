import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { BadgeCheck, ShieldX } from "lucide-react";
import { api } from "../api/client";
import { Loading } from "../ui";

// Сюда ведёт QR-код с бейджа. Охрана / регистрация сканирует телефоном — вход не нужен.
export default function VerifyPage() {
  const { token } = useParams();
  const query = useQuery({
    queryKey: ["verify", token],
    queryFn: () => api(`public/badges/${token}/`, { auth: false }),
    retry: false,
  });

  if (query.isPending) return <Loading />;

  const data = query.data;
  const valid = Boolean(data?.valid);

  return (
    <main className={`verify ${valid ? "verify-ok" : "verify-bad"}`}>
      <div className="verify-card">
        {valid ? <BadgeCheck size={56} /> : <ShieldX size={56} />}
        <h1>{valid ? "Бейдж действителен" : "Бейдж недействителен"}</h1>
        {data?.full_name ? <p className="verify-name">{data.full_name}</p> : null}
        {data?.role ? <p>{data.role}</p> : null}
        {data?.event ? <p className="verify-event">{data.event}</p> : null}
        {!data ? <p>Такого бейджа нет. Попросите гостя показать бейдж из приложения ещё раз.</p> : null}
      </div>
    </main>
  );
}
