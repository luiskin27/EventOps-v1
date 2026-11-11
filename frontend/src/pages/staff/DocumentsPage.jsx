// Проверка документов участников — по макету «06 · Документы»
import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, FileText, RotateCcw, Settings } from "lucide-react";
import { openProtectedFile, useBlobUrl, useCrud, useList } from "../../api/hooks";
import { PAYMENT_STATUS, fmtDate } from "../../format";
import { Badge, Button, Empty, ErrorNote, PageHeader, STATUS_TONE, Skeleton, cx } from "../../ui";

const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} МБ` : `${Math.max(1, Math.round(b / 1024))} КБ`);
const DOC_STATUS = { ...PAYMENT_STATUS, APPROVED: "Подтверждено", REJECTED: "Отклонено", PENDING: "Ожидает" };

function Preview({ doc }) {
  const blob = useBlobUrl(doc.is_image ? doc.file_url : null);
  return (
    <figure className="rounded-lg border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-h-72 items-center justify-center">
        {doc.is_image ? (
          blob.data ? (
            <img src={blob.data} alt={`${doc.type_title}: ${doc.participant_name}`} className="max-h-[28rem] rounded-md bg-white object-contain shadow-sm" />
          ) : blob.isError ? (
            <ErrorNote error={blob.error} />
          ) : (
            <div className="h-72 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" aria-label="Загрузка файла" />
          )
        ) : (
          <button type="button" onClick={() => openProtectedFile(doc.file_url)} className="link flex flex-col items-center gap-2 text-sm">
            <FileText className="h-10 w-10" aria-hidden="true" /> Открыть PDF
          </button>
        )}
      </div>
      <figcaption className="mt-3 flex items-center justify-between gap-2 text-xs muted">
        <span className="truncate">{doc.original_name} · {fmtSize(doc.size)} · загружен {fmtDate(doc.created_at)}</span>
        <button
          type="button"
          onClick={() => openProtectedFile(doc.file_url, doc.original_name)}
          className="focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-800"
          aria-label="Скачать оригинал"
        >
          <Download className="h-4 w-4" />
        </button>
      </figcaption>
    </figure>
  );
}

function Decision({ doc, onNext }) {
  const { update } = useCrud("participant-documents");
  const [status, setStatus] = useState(doc.status);
  const [comment, setComment] = useState(doc.admin_comment || "");
  const [err, setErr] = useState("");
  useEffect(() => {
    setStatus(doc.status);
    setComment(doc.admin_comment || "");
    setErr("");
  }, [doc.id, doc.status, doc.admin_comment]);

  const save = () => {
    if (status === "REJECTED" && !comment.trim()) return setErr("Напишите, что не так — участник увидит это в кабинете.");
    update.mutate({ id: doc.id, status, admin_comment: comment }, { onSuccess: onNext });
  };
  const opts = [
    ["PENDING", "Оставить на проверке"],
    ["APPROVED", "Документ в порядке"],
    ["REJECTED", "Нужна замена"],
  ];

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Решение</legend>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {opts.map(([v, hint]) => (
            <label
              key={v}
              className={cx(
                "flex min-h-11 cursor-pointer flex-col gap-1 rounded-lg border p-3 text-xs muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500",
                status === v ? "border-indigo-500 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-500/10" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
              )}
            >
              <input type="radio" name={`dec-${doc.id}`} value={v} checked={status === v} onChange={() => { setStatus(v); setErr(""); }} className="sr-only" />
              <Badge tone={STATUS_TONE[v]}>{DOC_STATUS[v]}</Badge>
              {hint}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="d-c" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Комментарий для участника {status === "REJECTED" ? <span className="text-rose-600" aria-hidden="true">*</span> : null}
        </label>
        <textarea
          id="d-c"
          rows={3}
          value={comment}
          onChange={(e) => { setComment(e.target.value); setErr(""); }}
          aria-invalid={Boolean(err)}
          placeholder="Например: фото обрезано — не видна дата выдачи. Сфотографируйте документ целиком."
          className={cx("input mt-1.5", err && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/30")}
        />
        {err ? <p className="mt-1.5 text-xs text-rose-700 dark:text-rose-400">{err}</p> : <p className="mt-1.5 text-xs muted">Участник увидит комментарий в кабинете рядом с документом.</p>}
      </div>
      <ErrorNote error={update.error} />
      <div className="flex justify-end">
        <Button size="lg" onClick={save} disabled={update.isPending || (status === doc.status && comment === (doc.admin_comment || ""))}>
          Сохранить решение
        </Button>
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  const { event } = useOutletContext();
  const types = useList("document-types", { event: event.id });
  const all = useList("participant-documents", { doc_type__event: event.id }, { refetchInterval: 15_000 });
  const [typeId, setTypeId] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [selId, setSelId] = useState(null);

  const docs = all.data || [];
  // Повторная загрузка: у участника уже был отклонённый документ этого типа
  const isRetry = (d) => docs.some((o) => o.participant === d.participant && o.doc_type === d.doc_type && o.id < d.id && o.status === "REJECTED");
  const inStatus = docs.filter((d) => !status || d.status === status);
  const queue = inStatus.filter((d) => !typeId || d.doc_type === typeId);
  const sel = queue.find((d) => d.id === selId) || queue[0];
  const idx = sel ? queue.indexOf(sel) : -1;
  const go = (step) => queue[idx + step] && setSelId(queue[idx + step].id);
  const pendingCount = docs.filter((d) => d.status === "PENDING").length;

  const chip = "focus-ring inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium";
  const chipOn = "border-indigo-600 bg-indigo-600 text-white";
  const chipOff = "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <>
      <PageHeader
        title="Документы"
        subtitle={`Очередь проверки: ${pendingCount} · типы документов настраиваются для каждого мероприятия`}
        actions={
          <Link to={`/staff/events/${event.id}/settings`} className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <Settings className="h-4 w-4" /> Типы документов
          </Link>
        }
      />

      {types.data?.length ? (
        <div role="group" aria-label="Тип документа" className="flex flex-wrap gap-2">
          {[{ id: "", title: "Все типы" }, ...types.data].map((t) => (
            <button key={t.id || "all"} type="button" aria-pressed={typeId === t.id} onClick={() => { setTypeId(t.id); setSelId(null); }} className={cx(chip, typeId === t.id ? chipOn : chipOff)}>
              {t.title}
              <span className="tabular-nums opacity-80">{inStatus.filter((d) => !t.id || d.doc_type === t.id).length}</span>
            </button>
          ))}
        </div>
      ) : null}

      {all.isPending ? <div className="card"><Skeleton rows={6} /></div> : null}
      <ErrorNote error={all.error} />

      {types.data && types.data.length === 0 ? (
        <Empty icon={FileText} title="Типы документов не настроены" action={<Link to={`/staff/events/${event.id}/settings`} className="link text-sm">Добавить в настройках</Link>}>
          Добавьте, какие документы должны загрузить участники: удостоверение, согласие, справку.
        </Empty>
      ) : all.data ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section aria-label="Очередь на проверку" className="card h-max lg:col-span-2">
            <div className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
              <label htmlFor="d-st" className="sr-only">Статус</label>
              <select id="d-st" value={status} onChange={(e) => { setStatus(e.target.value); setSelId(null); }} className="input h-9 w-auto">
                <option value="PENDING">На проверке</option>
                <option value="REJECTED">Отклонённые</option>
                <option value="APPROVED">Подтверждённые</option>
                <option value="">Все статусы</option>
              </select>
              <p className="ml-auto text-xs muted">Старые сверху</p>
            </div>
            {queue.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm muted">{status === "PENDING" ? "Всё проверено — новых документов нет." : "Документов нет."}</p>
            ) : (
              <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {queue.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      aria-current={sel?.id === d.id ? "true" : undefined}
                      onClick={() => setSelId(d.id)}
                      className={cx(
                        "flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500",
                        sel?.id === d.id ? "bg-indigo-50/70 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <FileText className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{d.participant_name}</span>
                        <span className="block truncate text-xs muted">{d.type_title} · {fmtDate(d.created_at)}</span>
                      </span>
                      {d.status === "PENDING" && isRetry(d) ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20">
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Повторно
                        </span>
                      ) : (
                        <Badge tone={STATUS_TONE[d.status]}>{DOC_STATUS[d.status]}</Badge>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {sel ? (
            <section aria-label="Просмотр документа" className="card lg:col-span-3">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="text-xs muted">{sel.type_title} · D-{sel.id}</p>
                  <h2 className="mt-0.5 text-lg font-semibold">{sel.participant_name}</h2>
                  <p className="text-sm muted">{[sel.participant_role || "Участник", sel.participant_email].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => go(-1)} disabled={idx <= 0} aria-label="Предыдущий документ" className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-sm tabular-nums muted">{idx + 1} из {queue.length}</span>
                  <button type="button" onClick={() => go(1)} disabled={idx >= queue.length - 1} aria-label="Следующий документ" className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-5 p-5">
                <Preview doc={sel} />
                <Decision doc={sel} onNext={() => setSelId(queue[idx + 1]?.id ?? null)} />
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

