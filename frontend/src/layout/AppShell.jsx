// Каркас по макетам: Sidebar (w-64) + Topbar (h-16). На мобильном — выдвижное меню.
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Check, ChevronsUpDown, HelpCircle, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../theme";
import { IconButton, cx, initials } from "../ui";

export function Logo({ to = "/" }) {
  return (
    <Link to={to} className="focus-ring flex items-center gap-2 rounded-lg">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7h16M4 12h10M4 17h6M17 15l2 2 3-4" />
        </svg>
      </span>
      <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">EventOps</span>
    </Link>
  );
}

const COUNT_CLS = {
  alert: "rounded-full bg-rose-50 px-1.5 py-0.5 text-xs font-medium tabular-nums text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  pending: "rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium tabular-nums text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  muted: "text-xs tabular-nums text-slate-500 dark:text-slate-400",
};

function SidebarNav({ section, items, eventCard, onClose }) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
        <Logo />
        {onClose ? (
          <IconButton label="Закрыть меню" onClick={onClose} className="h-11 w-11">
            <X className="h-5 w-5" />
          </IconButton>
        ) : null}
      </div>
      {onClose && eventCard ? <div className="border-b border-slate-200 p-4 dark:border-slate-800">{eventCard}</div> : null}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{section}</p>
        {items.map(({ to, label, icon: Icon, count, countKind, countLabel, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx(
                "group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 lg:min-h-0",
                isActive
                  ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                  : "font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cx(
                    "h-5 w-5 shrink-0",
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                  )}
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="flex-1 truncate">{label}</span>
                {count ? (
                  <span className={COUNT_CLS[countKind || "muted"]}>
                    <span className="sr-only">{countLabel} </span>
                    {count}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3 dark:border-slate-800">
        <a
          href="mailto:support@eventops.kg"
          className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:min-h-0"
        >
          <HelpCircle className="h-5 w-5 text-slate-500 dark:text-slate-400" strokeWidth={1.75} aria-hidden="true" />
          Помощь и поддержка
        </a>
      </div>
    </>
  );
}

// Переключатель мероприятий в топбаре (для организатора)
function EventSwitcher({ current, events = [], linkFor }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const list = events.filter((e) => e.title.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="focus-ring flex min-h-11 min-w-0 max-w-xs items-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-2.5 text-left hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 lg:min-h-0"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
          {initials(current.title)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{current.title}</span>
          {current.meta ? <span className="hidden truncate text-xs muted sm:block">{current.meta}</span> : null}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-1rem)] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="p-1.5">
            <label htmlFor="ev-s" className="sr-only">Найти мероприятие</label>
            <input id="ev-s" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти мероприятие" className="input h-9" />
          </div>
          <ul role="listbox" aria-label="Мероприятия" className="max-h-72 overflow-y-auto">
            {list.map((e) => (
              <li key={e.id} role="option" aria-selected={e.id === current.id}>
                <Link
                  to={linkFor(e)}
                  onClick={() => setOpen(false)}
                  className={cx(
                    "flex items-center gap-3 rounded-lg px-2.5 py-2",
                    e.id === current.id ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{e.title}</span>
                    <span className="block text-xs muted">{e.meta}</span>
                  </span>
                  {e.id === current.id ? <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" /> : null}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-1 border-t border-slate-200 p-1 pt-2 dark:border-slate-700">
            <Link to="/staff" onClick={() => setOpen(false)} className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
              Все мероприятия
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Topbar({ onMenu, eventSwitcher, eventTitle }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const name = user.participant?.full_name || user.full_name || user.username;
  const roleLabel = user.kind === "staff" ? "Организатор" : user.participant?.role || "Участник";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-slate-200 bg-white px-2 dark:border-slate-800 dark:bg-slate-900 sm:gap-3 sm:px-4 lg:px-6">
      {onMenu ? (
        <IconButton label="Открыть меню" onClick={onMenu} className="h-11 w-11 lg:hidden">
          <Menu className="h-5 w-5" />
        </IconButton>
      ) : (
        <div className="pl-2">
          <Logo />
        </div>
      )}
      {eventSwitcher}
      {eventTitle ? <p className="min-w-0 truncate text-sm font-semibold">{eventTitle}</p> : null}

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <IconButton label={dark ? "Светлая тема" : "Тёмная тема"} onClick={toggle} className="h-11 w-11 lg:h-9 lg:w-9">
          {dark ? <Sun className="h-5 w-5" strokeWidth={1.75} /> : <Moon className="h-5 w-5" strokeWidth={1.75} />}
        </IconButton>
        <div className="flex items-center gap-2 rounded-lg p-1 lg:pr-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white" aria-hidden="true">
            {initials(name)}
          </span>
          <span className="hidden text-left lg:block">
            <span className="block text-sm font-medium leading-tight">{name}</span>
            <span className="block text-xs leading-tight muted">{roleLabel}</span>
          </span>
        </div>
        <IconButton label="Выйти" onClick={logout} className="h-11 w-11 lg:h-9 lg:w-9">
          <LogOut className="h-5 w-5" strokeWidth={1.75} />
        </IconButton>
      </div>
    </header>
  );
}

/**
 * nav: { section, items, eventCard } — если не передан, сайдбара нет (страница «Мероприятия»).
 * topbar: { eventSwitcher, eventTitle }
 */
export default function AppShell({ nav, topbar = {}, children }) {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  useEffect(() => setDrawer(false), [location.pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {nav ? (
        <aside aria-label="Основная навигация" className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex">
          <SidebarNav {...nav} />
        </aside>
      ) : null}

      {nav && drawer ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" aria-hidden="true" onClick={() => setDrawer(false)} />
          <aside aria-label="Основная навигация" className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <SidebarNav {...nav} onClose={() => setDrawer(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={nav ? () => setDrawer(true) : null} {...topbar} />
        <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export { EventSwitcher };
