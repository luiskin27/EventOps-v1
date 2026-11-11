import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileImage, Upload } from "lucide-react";
import { api } from "../../api/client";
import { PAYMENT_STATUS, fmtDate, fmtMoney } from "../../format";
import { Badge, Button, Empty, ErrorNote, STATUS_TONE, Skeleton, cx } from "../../ui";
import { BadgeAside } from "./CabinetPage";
import { useGuestData } from "./useGuestData";

const MAX_MB = 10;

function Dropzone({ item }) {
  const qc = useQueryClient();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState("");
  const send = useMutation({
    mutationFn: () => {
      const data = new FormData();
      data.append("item", item.id);
      data.append("receipt", file);
      return api("payments/", { method: "POST", body: data });
    },
    onSuccess: () => {
      setFile(null);
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  const pick = (f) => {
    setErr("");
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) return setErr(`Файл больше ${MAX_MB} МБ. Сожмите фото или сделайте скриншот.`);
    setFile(f);
  };

  if (file) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <FileImage className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs muted">{(file.size / 1024 / 1024).toFixed(1).replace(".", ",")} МБ</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setFile(null)} disabled={send.isPending}>Убрать</Button>
        </div>
        <ErrorNote error={send.error} />
        <Button size="lg" className="w-full sm:w-auto" onClick={() => send.mutate()} disabled={send.isPending}>
          {send.isPending ? "Отправляем…" : "Отправить чек на проверку"}
        </Button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}
      className={cx(
        "rounded-xl border-2 border-dashed p-6 text-center",
        over ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15" : "border-indigo-300 bg-indigo-50/60 dark:border-indigo-500/50 dark:bg-indigo-500/10"
      )}
    >
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-300">
        <Upload className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-medium">
        <span className="hidden sm:inline">Перетащите фото чека сюда</span>
        <span className="sm:hidden">Загрузите фото чека</span>
      </p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">JPG, PNG или PDF, до {MAX_MB} МБ</p>
      <input ref={input} type="file" accept="image/*,application/pdf" className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
      <Button size="lg" className="mt-4" onClick={() => input.current?.click()}>Выбрать файл</Button>
      {err ? <p className="mt-3 text-xs text-rose-700 dark:text-rose-400">{err}</p> : null}
    </div>
  );
}

export default function GuestPaymentsPage() {
  const g = useGuestData();
  if (g.loading) return <div className="card"><Skeleton rows={6} /></div>;
  const items = g.items.data || [];
  const mine = g.payments.data || [];

  return (
    <>
      <div>
        <nav aria-label="Хлебные крошки" className="text-xs muted">
          <Link to="/guest" className="rounded hover:underline">Кабинет</Link> / Оплата
        </nav>
        <h1 className="mt-1 text-2xl font-semibold">Оплата</h1>
        <p className="mt-1 text-sm muted">Оплатите переводом и загрузите фото чека. Организатор проверит его и подтвердит оплату.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {items.length === 0 ? <Empty title="Оплачивать ничего не нужно">Организатор не добавил платных статей.</Empty> : null}
          {items.map((it) => {
            const { state, last } = g.itemState(it);
            const history = mine.filter((p) => p.item === it.id);
            return (
              <section key={it.id} aria-labelledby={`it-${it.id}`} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
                  <div>
                    <h2 id={`it-${it.id}`} className="text-lg font-semibold">{it.title}</h2>
                    <p className="mt-0.5 text-sm muted">
                      К оплате <span className="font-medium tabular-nums text-slate-700 dark:text-slate-200">{fmtMoney(it.amount, it.currency)}</span>
                    </p>
                  </div>
                  {state === "none" ? <Badge tone="neutral" icon={false}>Не оплачено</Badge> : <Badge tone={STATUS_TONE[state.toUpperCase()]}>{PAYMENT_STATUS[state.toUpperCase()]}</Badge>}
                </div>

                <div className="space-y-4 px-4 py-5 sm:px-6">
                  {state === "rejected" && last?.admin_comment ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
                      <p className="text-sm text-rose-900 dark:text-rose-100"><span className="font-semibold">Комментарий администратора:</span> {last.admin_comment}</p>
                      <p className="mt-1 text-xs text-rose-800 dark:text-rose-200">{fmtDate(last.updated_at)}</p>
                    </div>
                  ) : null}
                  {state === "none" || state === "rejected" ? <Dropzone item={it} /> : null}
                  {state === "pending" ? <p className="text-sm muted">Чек отправлен. Обычно проверка занимает до одного рабочего дня.</p> : null}

                  {history.length ? (
                    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                      {history.map((p) => (
                        <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                          <FileImage className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {p.receipt ? decodeURIComponent(p.receipt.split("/").pop()) : "Без файла"}
                            <span className="block text-xs muted">загружен {fmtDate(p.created_at)}</span>
                          </span>
                          <Badge tone={STATUS_TONE[p.status]}>{PAYMENT_STATUS[p.status]}</Badge>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
        <BadgeAside g={g} />
      </div>
    </>
  );
}
