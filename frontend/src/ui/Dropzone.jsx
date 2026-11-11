import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileImage, Upload } from "lucide-react";
import { api } from "../api/client";
import { Button, ErrorNote, cx } from "./index";

const MAX_MB = 10;

/**
 * Загрузка одного файла по макету «12 · Загрузка».
 * endpoint — куда POST-ить (например "payments/"), fields — остальные поля формы,
 * fileField — имя поля с файлом, invalidate — какие списки обновить после отправки.
 */
export default function Dropzone({ endpoint, fields, fileField, invalidate, title = "Перетащите фото сюда", sendLabel = "Отправить на проверку" }) {
  const qc = useQueryClient();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState("");
  const send = useMutation({
    mutationFn: () => {
      const data = new FormData();
      Object.entries(fields).forEach(([k, v]) => data.append(k, v));
      data.append(fileField, file);
      return api(endpoint, { method: "POST", body: data });
    },
    onSuccess: () => {
      setFile(null);
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
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
          {send.isPending ? "Отправляем…" : sendLabel}
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
        <span className="hidden sm:inline">{title}</span>
        <span className="sm:hidden">Загрузите фото или PDF</span>
      </p>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">JPG, PNG или PDF, до {MAX_MB} МБ</p>
      <input ref={input} type="file" accept="image/*,application/pdf" className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
      <Button size="lg" className="mt-4" onClick={() => input.current?.click()}>Выбрать файл</Button>
      {err ? <p className="mt-3 text-xs text-rose-700 dark:text-rose-400">{err}</p> : null}
    </div>
  );
}
