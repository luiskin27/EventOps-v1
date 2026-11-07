import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AlertTriangle, Check, CreditCard, Download, FileImage, Search, X } from "lucide-react";
import { useCrud, useList } from "../../api/hooks";
import { PAYMENT_STATUS, fmtDate, fmtMoney } from "../../format";
import { Badge, Button, Empty, ErrorNote, Modal, PageHeader, STATUS_TONE, Skeleton, cx } from "../../ui";

const isImage = (url) => /\.(png|jpe?g|webp|gif|heic)$/i.test(url || "");

function ReviewPanel({ payment, onDecided }) {
  const { update } = useCrud("payments");
  const [comment, setComment] = useState(payment.admin_comment || "");
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => {
    setComment(payment.admin_comment || "");
    setErr("");
  }, [payment.id, payment.admin_comment]);

  const decide = (status) =>
    update.mutate({ id: payment.id, status, admin_comment: comment }, { onSuccess: () => { setConfirming(false); onDecided?.(); } });

  const askReject = () => {
    if (!comment.trim()) {
      setErr("Напишите причину — участник увидит её в кабинете.");
      return;
    }
    setConfirming(true);
  };

  return (
    <aside aria-label="Проверка оплаты" className="card flex flex-col lg:col-span-2">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <p className="text-xs muted">Оплата №{payment.id} · загружена {fmtDate(payment.created_at)}</p>
          <h2 className="mt-0.5 text-lg font-semibold">{payment.participant_name}</h2>
        </div>
        <Badge tone={STATUS_TONE[payment.status]}>{PAYMENT_STATUS[payment.status]}</Badge>
      </div>
      <div className="space-y-4 p-5">
        <figure className="rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-950">
          {payment.receipt && isImage(payment.receipt) ? (
            <a href={payment.receipt} target="_blank" rel="noreferrer" className="focus-ring block rounded-md">
              <img src={payment.receipt} alt={`Чек: ${payment.participant_name}`} className="mx-auto max-h-80 rounded-md bg-white object-contain shadow-sm" />
            </a>
          ) : payment.receipt ? (
            <a href={payment.receipt} target="_blank" rel="noreferrer" className="link flex items-center justify-center gap-2 py-8 text-sm">
              <FileImage className="h-5 w-5" /> Открыть чек (PDF)
            </a>
          ) : (
            <p className="py-8 text-center text-sm muted">Чек не приложен</p>
          )}
          {payment.receipt ? (
            <figcaption className="mt-3 flex items-center justify-between text-xs muted">
              <span className="truncate">{decodeURIComponent(payment.receipt.split("/").pop())}</span>
              <a href={payment.receipt} download className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-800" aria-label="Скачать оригинал">
                <Download className="h-4 w-4" />
              </a>
            </figcaption>
          ) : null}
        </figure>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-xs muted">За что</dt><dd className="font-medium">{payment.item_title}</dd></div>
          <div><dt className="text-xs muted">К оплате</dt><dd className="font-medium tabular-nums">{fmtMoney(payment.amount, payment.currency)}</dd></div>
        </dl>
        <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          Сверьте сумму и получателя в чеке с суммой к оплате.
        </p>
        <div>
          <label htmlFor="p-cmt" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Комментарий администратора</label>
          <textarea
            id="p-cmt"
            rows={2}
            value={comment}
            onChange={(e) => { setComment(e.target.value); setErr(""); }}
            aria-invalid={Boolean(err)}
            placeholder="Обязателен при отклонении — участник увидит его в кабинете"
            className={cx("input mt-1.5", err && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30")}
          />
          {err ? <p className="mt-1.5 text-xs text-rose-700 dark:text-rose-400">{err}</p> : null}
        </div>
        <ErrorNote error={update.error} />
      </div>
      <div className="mt-auto flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:justify-end">
        <Button variant="danger" size="lg" onClick={askReject} disabled={payment.status === "REJECTED" || update.isPending}>
          <X className="h-4 w-4" /> Отклонить…
        </Button>
        <Button size="lg" onClick={() => decide("APPROVED")} disabled={payment.status === "APPROVED" || update.isPending}>
          <Check className="h-4 w-4" /> Подтвердить
        </Button>
      </div>

      {confirming ? (
        <Modal title={`Отклонить оплату №${payment.id}?`} onClose={() => setConfirming(false)}>
          <p className="text-sm muted">{payment.participant_name} увидит в кабинете комментарий: «{comment}»</p>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setConfirming(false)}>Отмена</Button>
            <Button variant="dangerSolid" onClick={() => decide("REJECTED")} disabled={update.isPending}>Отклонить оплату</Button>
          </div>
        </Modal>
      ) : null}
    </aside>
  );
}

export default function PaymentsPage() {
  const { event } = useOutletContext();
  const all = useList("payments", { item__event: event.id });
  const [status, setStatus] = useState("PENDING");
  const [q, setQ] = useState("");
  const [selId, setSelId] = useState(null);

  const list = all.data || [];
  const count = (s) => list.filter((p) => !s || p.status === s).length;
  const needle = q.trim().toLowerCase();
  const rows = list.filter((p) => (!status || p.status === status) && (!needle || p.participant_name.toLowerCase().includes(needle)));
  const sel = list.find((p) => p.id === selId) || rows[0];

  const tabs = [
    ["PENDING", "На проверке"],
    ["APPROVED", "Подтверждены"],
    ["REJECTED", "Отклонены"],
    ["", "Все"],
  ];

  return (
    <>
      <PageHeader title="Проверка оплат" subtitle="Сверьте сумму и назначение платежа в чеке. Участник увидит решение и комментарий в кабинете." />

      {all.isPending ? <div className="card"><Skeleton rows={6} /></div> : null}
      <ErrorNote error={all.error} />

      {all.data ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section aria-label="Список оплат" className="min-w-0 lg:col-span-3">
            <div className="card">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
                <div role="tablist" aria-label="Статус" className="flex flex-wrap gap-1">
                  {tabs.map(([value, name]) => (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={status === value}
                      onClick={() => { setStatus(value); setSelId(null); }}
                      className={cx(
                        "focus-ring inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium",
                        status === value ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      )}
                    >
                      {name} <span className="tabular-nums opacity-80">{count(value)}</span>
                    </button>
                  ))}
                </div>
                <div className="relative ml-auto w-full sm:w-52">
                  <label htmlFor="pay-q" className="sr-only">Поиск по участнику</label>
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" />
                  <input id="pay-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя участника" className="input h-9 pl-9" />
                </div>
              </div>

              {rows.length === 0 ? (
                <div className="p-5">
                  <Empty icon={CreditCard} title={status === "PENDING" ? "Нечего проверять" : "Оплат нет"}>
                    Участник загружает чек в своём кабинете — он сразу появляется здесь.
                  </Empty>
                </div>
              ) : (
                <>
                  <div className="hidden max-h-[28rem] overflow-auto md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-slate-50 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                          <th scope="col" className="px-4 py-2.5 font-medium">Участник</th>
                          <th scope="col" className="px-2 py-2.5 font-medium">За что</th>
                          <th scope="col" className="px-2 py-2.5 text-right font-medium">Сумма</th>
                          <th scope="col" className="px-2 py-2.5 font-medium">Загружен</th>
                          <th scope="col" className="px-4 py-2.5 font-medium">Статус</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rows.map((r) => (
                          <tr key={r.id} aria-selected={sel?.id === r.id} className={cx(sel?.id === r.id ? "bg-indigo-50/60 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/40")}>
                            <td className="px-4 py-2.5">
                              <button type="button" onClick={() => setSelId(r.id)} className="focus-ring rounded text-left">
                                <span className="block font-medium">{r.participant_name}</span>
                                <span className="block text-xs muted">Оплата №{r.id}</span>
                              </button>
                            </td>
                            <td className="px-2 py-2.5 text-slate-600 dark:text-slate-300">{r.item_title}</td>
                            <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">{fmtMoney(r.amount, r.currency)}</td>
                            <td className="whitespace-nowrap px-2 py-2.5 tabular-nums text-slate-600 dark:text-slate-300">{fmtDate(r.created_at)}</td>
                            <td className="px-4 py-2.5"><Badge tone={STATUS_TONE[r.status]}>{PAYMENT_STATUS[r.status]}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
                    {rows.map((r) => (
                      <li key={r.id}>
                        <button type="button" onClick={() => setSelId(r.id)} className="flex min-h-11 w-full items-start justify-between gap-3 px-4 py-3 text-left">
                          <span>
                            <span className="block text-sm font-medium">{r.participant_name}</span>
                            <span className="block text-xs muted">{r.item_title} · {fmtMoney(r.amount, r.currency)} · {fmtDate(r.created_at)}</span>
                          </span>
                          <Badge tone={STATUS_TONE[r.status]}>{PAYMENT_STATUS[r.status]}</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>
          {sel ? <ReviewPanel payment={sel} onDecided={() => setSelId(null)} /> : null}
        </div>
      ) : null}
    </>
  );
}
