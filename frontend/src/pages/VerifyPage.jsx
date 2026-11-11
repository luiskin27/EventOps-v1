import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Check, Clock, X } from "lucide-react";
import { api } from "../api/client";
import { Logo } from "../layout/AppShell";
import { Skeleton, cx, initials } from "../ui";

// Сюда ведёт QR-код бейджа. Охрана сканирует камерой телефона — вход не нужен.
export default function VerifyPage() {
  const { token } = useParams();
  const query = useQuery({
    queryKey: ["verify", token],
    queryFn: () => api(`public/badges/${token}/`, { auth: false }),
    retry: false,
  });

  const d = query.data;
  const admitted = Boolean(d?.admitted ?? d?.valid);
  const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(new Date());

  const checks = d
    ? [
        { label: "Бейдж", ok: d.valid, value: d.valid ? "Действителен" : "Отключён" },
        d.payment && { label: "Оплата", ok: d.payment === "paid", wait: d.payment === "pending", value: { paid: "Подтверждена", pending: "На проверке", unpaid: "Не оплачено", none: "Не требуется" }[d.payment] },
      ].filter(Boolean)
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <header className="flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
        <Logo to="/" />
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold">Проверка бейджа</p>
        <span className="text-xs tabular-nums muted">{time}</span>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
        {query.isPending ? <div className="card"><Skeleton /></div> : (
          <>
            <section
              role="status"
              aria-live="assertive"
              className={cx("flex flex-col items-center rounded-xl px-4 py-8 text-center text-white", admitted ? "bg-emerald-600" : "bg-rose-600")}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                {admitted ? <Check className="h-10 w-10" strokeWidth={3} aria-hidden="true" /> : <X className="h-10 w-10" strokeWidth={3} aria-hidden="true" />}
              </span>
              <p className="mt-3 text-3xl font-bold uppercase tracking-wide">{admitted ? "Допущен" : "Не допущен"}</p>
              <p className="mt-1 text-sm font-medium opacity-95">
                {!d ? "Такого бейджа нет — попросите показать бейдж из кабинета ещё раз" : admitted ? "Можно пропускать" : "Направьте на стойку регистрации"}
              </p>
            </section>

            {d?.full_name ? (
              <section aria-label="Участник" className="card p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-2xl font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300" aria-hidden="true">
                    {initials(d.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-semibold leading-tight">{d.full_name}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2">
                      {d.role ? <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">{d.role}</span> : null}
                      <span className="text-xs muted">{d.event}</span>
                    </p>
                  </div>
                </div>
                <ul className="mt-4 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                  {checks.map((c) => (
                    <li key={c.label} className="flex items-center justify-between gap-3 py-3">
                      <span className="text-sm text-slate-600 dark:text-slate-300">{c.label}</span>
                      <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                        c.ok ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                          : c.wait ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300"
                          : "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-300")}>
                        {c.ok ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : c.wait ? <Clock className="h-3.5 w-3.5" aria-hidden="true" /> : <X className="h-3.5 w-3.5" aria-hidden="true" />}
                        {c.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
