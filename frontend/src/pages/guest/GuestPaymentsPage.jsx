// «Оплата и документы» — по макету «12 · Загрузка чека и документов»
import { Link } from "react-router-dom";
import { FileImage } from "lucide-react";
import { openProtectedFile } from "../../api/hooks";
import { PAYMENT_STATUS, fileName, fmtDate, fmtMoney } from "../../format";
import { Badge, Empty, STATUS_TONE, Skeleton } from "../../ui";
import Dropzone from "../../ui/Dropzone";
import { BadgeAside } from "./CabinetPage";
import { useGuestData } from "./useGuestData";

const DOC_STATUS = { PENDING: "На проверке", APPROVED: "Принят", REJECTED: "Нужна замена" };

function UploadCard({ id, title, subtitle, state, last, history, statusLabels, dropzone, historyItem, waitingText }) {
  return (
    <section aria-labelledby={id} className="card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
        <div className="min-w-0">
          <h3 id={id} className="text-base font-semibold">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-sm muted">{subtitle}</p> : null}
        </div>
        {state === "none" ? (
          <Badge tone="neutral" icon={false}>Не загружено</Badge>
        ) : (
          <Badge tone={STATUS_TONE[state.toUpperCase()]}>{statusLabels[state.toUpperCase()]}</Badge>
        )}
      </div>
      <div className="space-y-4 px-4 py-5 sm:px-6">
        {state === "rejected" && last?.admin_comment ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-500/30 dark:bg-rose-500/10">
            <p className="text-sm text-rose-900 dark:text-rose-100"><span className="font-semibold">Комментарий администратора:</span> {last.admin_comment}</p>
            <p className="mt-1 text-xs text-rose-800 dark:text-rose-200">{fmtDate(last.updated_at)}</p>
          </div>
        ) : null}
        {state === "none" || state === "rejected" ? dropzone : null}
        {state === "pending" ? <p className="text-sm muted">{waitingText}</p> : null}
        {history.length ? (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
            {history.map(historyItem)}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export default function GuestPaymentsPage() {
  const g = useGuestData();
  if (g.loading) return <div className="card"><Skeleton rows={6} /></div>;
  const items = g.items.data || [];
  const types = g.docTypes.data || [];

  return (
    <>
      <div>
        <nav aria-label="Хлебные крошки" className="text-xs muted">
          <Link to="/guest" className="rounded hover:underline">Кабинет</Link> / Оплата и документы
        </nav>
        <h1 className="mt-1 text-2xl font-semibold">Оплата и документы</h1>
        <p className="mt-1 text-sm muted">Загрузите чек об оплате и документы. Организатор проверит их — решение появится здесь и в кабинете.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {items.length === 0 && types.length === 0 ? <Empty title="Загружать ничего не нужно">Организатор не добавил оплат и документов.</Empty> : null}

          {items.length ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Оплата</h2>
              {items.map((it) => {
                const s = g.itemState(it);
                return (
                  <UploadCard
                    key={it.id}
                    id={`it-${it.id}`}
                    title={it.title}
                    subtitle={<>К оплате <span className="font-medium tabular-nums text-slate-700 dark:text-slate-200">{fmtMoney(it.amount, it.currency)}</span></>}
                    {...s}
                    statusLabels={PAYMENT_STATUS}
                    waitingText="Чек отправлен. Обычно проверка занимает до одного рабочего дня."
                    dropzone={<Dropzone endpoint="payments/" fields={{ item: it.id }} fileField="receipt" invalidate={["payments", "my-badge"]} title="Перетащите фото чека сюда" sendLabel="Отправить чек на проверку" />}
                    historyItem={(p) => (
                      <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                        <FileImage className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {p.receipt ? fileName(p.receipt) : "Без файла"}
                          <span className="block text-xs muted">загружен {fmtDate(p.created_at)}</span>
                        </span>
                        <Badge tone={STATUS_TONE[p.status]}>{PAYMENT_STATUS[p.status]}</Badge>
                      </li>
                    )}
                  />
                );
              })}
            </div>
          ) : null}

          {types.length ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Документы</h2>
              {types.map((t) => {
                const s = g.docState(t);
                return (
                  <UploadCard
                    key={t.id}
                    id={`dt-${t.id}`}
                    title={<>{t.title} {t.is_required ? null : <span className="text-sm font-normal muted">· по желанию</span>}</>}
                    subtitle={t.description}
                    {...s}
                    statusLabels={DOC_STATUS}
                    waitingText="Документ отправлен. Организатор проверит его в ближайшее время."
                    dropzone={<Dropzone endpoint="participant-documents/" fields={{ doc_type: t.id }} fileField="file" invalidate={["participant-documents", "my-badge"]} title="Перетащите фото документа сюда" sendLabel="Отправить документ на проверку" />}
                    historyItem={(d) => (
                      <li key={d.id} className="flex items-center gap-3 px-3 py-2.5">
                        <FileImage className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                        <button type="button" onClick={() => openProtectedFile(d.file_url)} className="min-w-0 flex-1 truncate rounded text-left text-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                          {d.original_name}
                          <span className="block text-xs muted">загружен {fmtDate(d.created_at)}</span>
                        </button>
                        <Badge tone={STATUS_TONE[d.status]}>{DOC_STATUS[d.status]}</Badge>
                      </li>
                    )}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
        <BadgeAside g={g} />
      </div>
    </>
  );
}
