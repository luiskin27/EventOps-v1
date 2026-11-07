// Компоненты по UI-киту EventOps (Tailwind: slate + indigo-600)
import { useEffect, useRef } from "react";
import { AlertTriangle, Check, Clock, X } from "lucide-react";

const cx = (...c) => c.filter(Boolean).join(" ");
export { cx };

const BTN = {
  primary:
    "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800",
  secondary:
    "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
  danger:
    "border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-500/10",
  dangerSolid: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
  ghost: "text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10",
};
const SIZE = { sm: "h-8 px-3", md: "h-9 px-4", lg: "h-11 px-4 text-base sm:h-10 sm:text-sm" };

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }) {
  return (
    <button
      type={type}
      className={cx(
        "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50",
        BTN[variant],
        SIZE[size],
        className
      )}
      {...props}
    />
  );
}

export function IconButton({ label, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        "focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
        className
      )}
      {...props}
    />
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {error ? (
        <span className="mt-1.5 block text-xs text-rose-700 dark:text-rose-400">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

// Статус-бейдж: tone = success | pending | danger | neutral | info
const TONE = {
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
  pending:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  danger: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20",
  info: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600/40",
};
const TONE_ICON = { success: Check, pending: Clock, danger: X };

export function Badge({ tone = "neutral", icon = true, children }) {
  const Icon = icon ? TONE_ICON[tone] : null;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE[tone]
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export const STATUS_TONE = {
  PENDING: "pending",
  APPROVED: "success",
  REJECTED: "danger",
  TODO: "neutral",
  IN_PROGRESS: "info",
  DONE: "success",
};

export function Modal({ title, description, onClose, children, size = "md" }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cx(
        "w-[calc(100vw-2rem)] rounded-xl bg-white p-0 text-slate-900 shadow-lg ring-1 ring-slate-200 backdrop:bg-slate-900/50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700",
        size === "lg" ? "max-w-2xl" : "max-w-lg"
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {description ? <p className="mt-1 text-sm muted">{description}</p> : null}
        </div>
        <IconButton label="Закрыть" onClick={onClose}>
          <X className="h-5 w-5" />
        </IconButton>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}

export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      {Icon ? (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      <p className="text-sm font-semibold">{title}</p>
      {children ? <p className="max-w-sm text-sm muted">{children}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ rows = 3 }) {
  return (
    <div className="animate-pulse space-y-3 p-5" aria-busy="true" aria-label="Загрузка">
      <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-3 rounded bg-slate-200 dark:bg-slate-800" style={{ width: `${80 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <p className="flex items-start gap-2 whitespace-pre-line rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {error.message || String(error)}
    </p>
  );
}

export function QueryState({ query, children, skeleton }) {
  if (query.isPending) return skeleton ?? <Skeleton />;
  if (query.isError) return <ErrorNote error={query.error} />;
  return children(query.data);
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

// Сегментированный переключатель как в макетах (вкладки статусов)
export function Tabs({ value, onChange, options, label }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "focus-ring inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium",
            value === o.value
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          )}
        >
          {o.label}
          {o.count != null ? <span className="tabular-nums opacity-80">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}
