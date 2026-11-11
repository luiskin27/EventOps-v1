import { Lock } from "lucide-react";
import { cx } from "./index";

// Бейдж по макету «Мой бейдж»: шапка indigo, имя, роль, QR
export default function BadgeCard({ eventTitle, eventMeta, name, role, qrUrl, code, active = true, background = "#FFFFFF", logoUrl, size = 152 }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
      <div className="bg-indigo-600 px-5 py-3 text-white">
        {logoUrl ? <img src={logoUrl} alt="" className="mb-2 h-6 w-auto object-contain" /> : null}
        {eventMeta ? <p className="text-xs font-medium uppercase tracking-wide text-indigo-100">{eventMeta}</p> : null}
        <p className="mt-0.5 text-sm font-semibold">{eventTitle}</p>
      </div>
      <div className="flex flex-col items-center px-5 py-5 text-center text-slate-900" style={{ background }}>
        <p className="text-xl font-bold">{name}</p>
        {role ? <span className="mt-2 rounded-full bg-sky-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">{role}</span> : null}
        <div className="relative mt-4" style={{ width: size, height: size }}>
          {qrUrl ? (
            <img src={qrUrl} alt="QR-код бейджа" width={size} height={size} className={cx("h-full w-full [image-rendering:pixelated]", !active && "opacity-25 blur-[1px]")} />
          ) : (
            <div className="h-full w-full rounded-md bg-[repeating-linear-gradient(45deg,#e2e8f0_0_6px,#f8fafc_6px_12px)]" aria-hidden="true" />
          )}
          {!active ? (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow ring-1 ring-slate-200">
                <Lock className="h-5 w-5 text-slate-600" aria-hidden="true" />
              </span>
            </span>
          ) : null}
        </div>
        {code ? <p className="mt-2 text-xs tabular-nums text-slate-500">{code}</p> : null}
      </div>
    </div>
  );
}
