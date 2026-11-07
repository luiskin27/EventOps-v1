import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { homeFor, useAuth } from "../auth/AuthContext";
import { Logo } from "../layout/AppShell";
import { Button, cx } from "../ui";

// Вход по макету «Регистрация»: слева indigo-панель, справа форма.
//  - участник: телефон + код из приглашения → POST /api/guest/login/
//  - организатор: логин + пароль           → POST /api/token/
export default function LoginPage() {
  const { user, ready, loginStaff, loginGuest } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("guest");
  const [form, setForm] = useState({ phone: "", code: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (ready && user) return <Navigate to={homeFor(user)} replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const me = mode === "guest" ? await loginGuest(form.phone, form.code) : await loginStaff(form.username, form.password);
      if (!me || me.kind === "unknown") throw new Error("Аккаунт не привязан ни к мероприятию, ни к команде. Обратитесь к организатору.");
      navigate(homeFor(me), { replace: true });
    } catch (err) {
      setError(err.status === 401 && mode === "staff" ? "Неверный логин или пароль." : err.message || "Не удалось войти.");
    } finally {
      setLoading(false);
    }
  };

  const input =
    "mt-1.5 block h-11 w-full rounded-lg border bg-white px-3 text-base focus:outline-none focus:ring-2 dark:bg-slate-900 sm:h-10 sm:text-sm";
  const ok = "border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/30 dark:border-slate-700";
  const bad = "border-rose-500 focus:ring-rose-500/30";

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 lg:grid lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-indigo-600 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M4 12h10M4 17h6M17 15l2 2 3-4" /></svg>
          </span>
          <span className="text-base font-semibold">EventOps</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-4xl font-semibold leading-tight">Всё о вашем мероприятии в одном месте</h2>
          <ol className="mt-8 space-y-4 text-sm text-indigo-50">
            {["Войдите по телефону и коду из приглашения", "Оплатите взнос и загрузите чек в личном кабинете", "После проверки появится бейдж с QR-кодом для входа"].map((t, i) => (
              <li key={t} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-indigo-100">Лагеря, свадьбы, форумы и корпоративное обучение</p>
      </aside>

      <main className="flex items-start justify-center px-4 py-8 sm:px-6 lg:items-center lg:py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden"><Logo to="/login" /></div>
          <h1 className="mt-8 text-2xl font-semibold lg:mt-0">Вход в EventOps</h1>
          <p className="mt-1 text-sm muted">
            {mode === "guest" ? "Для участников и гостей мероприятия." : "Для организаторов и команды."}
          </p>

          <div role="tablist" aria-label="Кто входит" className="mt-6 grid grid-cols-2 rounded-lg border border-slate-200 p-1 dark:border-slate-800">
            {[["guest", "Я участник"], ["staff", "Я организатор"]].map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={mode === v}
                onClick={() => { setMode(v); setError(""); }}
                className={cx(
                  "focus-ring h-10 rounded-md text-sm font-medium sm:h-9",
                  mode === v ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <form className="mt-6 space-y-5" onSubmit={submit}>
            {mode === "guest" ? (
              <>
                <div>
                  <label htmlFor="l-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Телефон</label>
                  <input id="l-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+996 555 123 456" value={form.phone} onChange={set("phone")} required aria-invalid={Boolean(error)} className={cx(input, "tabular-nums", error ? bad : ok)} />
                </div>
                <div>
                  <label htmlFor="l-code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Код из приглашения</label>
                  <input id="l-code" autoCapitalize="characters" autoComplete="one-time-code" placeholder="FMP001" value={form.code} onChange={set("code")} required aria-invalid={Boolean(error)} aria-describedby="l-code-h" className={cx(input, "uppercase tracking-wider", error ? bad : ok)} />
                  <p id="l-code-h" className="mt-1.5 text-xs muted">Организатор присылает его в СМС, WhatsApp или на почту.</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="l-user" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Логин</label>
                  <input id="l-user" autoComplete="username" value={form.username} onChange={set("username")} required aria-invalid={Boolean(error)} className={cx(input, error ? bad : ok)} />
                </div>
                <div>
                  <label htmlFor="l-pass" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Пароль</label>
                  <input id="l-pass" type="password" autoComplete="current-password" value={form.password} onChange={set("password")} required aria-invalid={Boolean(error)} className={cx(input, error ? bad : ok)} />
                </div>
              </>
            )}

            {error ? (
              <p role="alert" className="flex items-start gap-1.5 text-sm text-rose-700 dark:text-rose-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "Входим…" : "Войти"}</Button>
          </form>
        </div>
      </main>
    </div>
  );
}
