import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { homeFor, useAuth } from "../auth/AuthContext";
import { Button, Field } from "../ui";

// Два способа входа, как устроен backend:
//  - гость: телефон + код из приглашения  → POST /api/guest/login/
//  - сотрудник: логин + пароль            → POST /api/token/ (SimpleJWT)
export default function LoginPage() {
  const { user, ready, loginStaff, loginGuest } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("guest");
  const [form, setForm] = useState({ phone: "", code: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (ready && user) return <Navigate to={homeFor(user)} replace />;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const me =
        mode === "guest"
          ? await loginGuest(form.phone, form.code)
          : await loginStaff(form.username, form.password);
      if (!me || me.kind === "unknown") {
        throw new Error("Аккаунт есть, но он не привязан ни к событию, ни к команде. Обратитесь к организатору.");
      }
      navigate(homeFor(me), { replace: true });
    } catch (err) {
      setError(
        err.status === 401 && mode === "staff"
          ? "Неверный логин или пароль."
          : err.message || "Не удалось войти."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login">
      <section className="login-card">
        <h1 className="wordmark">EventOps</h1>
        <p className="login-lead">
          {mode === "guest"
            ? "Программа, бейдж и оплата вашего мероприятия."
            : "Участники, расписание, задачи и оплаты команды."}
        </p>

        <div className="segmented" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "guest"}
            onClick={() => setMode("guest")}
          >
            Я гость
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "staff"}
            onClick={() => setMode("staff")}
          >
            Я организатор
          </button>
        </div>

        <form className="stack" onSubmit={submit}>
          {mode === "guest" ? (
            <>
              <Field label="Телефон">
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+996 700 123 456"
                  value={form.phone}
                  onChange={set("phone")}
                  required
                />
              </Field>
              <Field label="Код из приглашения" hint="Его прислал организатор: СМС, WhatsApp или на бумаге.">
                <input
                  autoCapitalize="characters"
                  autoComplete="one-time-code"
                  placeholder="ALA001"
                  value={form.code}
                  onChange={set("code")}
                  required
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Логин">
                <input autoComplete="username" value={form.username} onChange={set("username")} required />
              </Field>
              <Field label="Пароль">
                <input
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={set("password")}
                  required
                />
              </Field>
            </>
          )}

          {error ? <div className="note note-error">{error}</div> : null}

          <Button type="submit" disabled={loading} className="btn-block">
            {loading ? "Входим…" : "Войти"}
          </Button>
        </form>
      </section>
    </main>
  );
}
