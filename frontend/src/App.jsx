import { useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8000";
const TOKEN_URL = `${API_BASE}/api/token/`;

const roleMeta = {
  guest: {
    title: "Гость",
    subtitle: "Доступ к расписанию, регистрации и участию в событии",
    accent: "#4f46e5",
  },
  staff: {
    title: "Сотрудник",
    subtitle: "Доступ к рабочим задачам, управлению и админ-разделам",
    accent: "#0f766e",
  },
};

function App() {
  const [role, setRole] = useState("guest");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tokenPreview, setTokenPreview] = useState("");

  const currentRole = roleMeta[role];

  const placeholderUsername = useMemo(() => {
    return role === "guest" ? "guest1" : "staff1";
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setTokenPreview("");

    try {
      const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.non_field_errors?.[0] ||
          "Не удалось войти. Проверьте логин и пароль.";
        throw new Error(message);
      }

      localStorage.setItem("eventops_access_token", data.access);
      localStorage.setItem("eventops_refresh_token", data.refresh);
      localStorage.setItem("eventops_role", role);
      localStorage.setItem("eventops_username", username);

      setSuccess(`Вход выполнен как ${currentRole.title}.`);
      setTokenPreview(`${data.access.slice(0, 28)}...`);
      setPassword("");
    } catch (err) {
      setError(err.message || "Ошибка входа.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="card">
        <div className="brand">
          <div className="logo">E</div>
          <div>
            <h1>EventOps</h1>
            <p>Единый вход для гостей и сотрудников</p>
          </div>
        </div>

        <div className="role-switch">
          <button
            type="button"
            className={role === "guest" ? "role-btn active" : "role-btn"}
            onClick={() => setRole("guest")}
          >
            Гость
          </button>
          <button
            type="button"
            className={role === "staff" ? "role-btn active" : "role-btn"}
            onClick={() => setRole("staff")}
          >
            Сотрудник
          </button>
        </div>

        <div className="role-box" style={{ borderColor: currentRole.accent }}>
          <h2>{currentRole.title}</h2>
          <p>{currentRole.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label>
            Логин
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={placeholderUsername}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        {error ? <div className="message error">{error}</div> : null}
        {success ? <div className="message success">{success}</div> : null}

        {tokenPreview ? (
          <div className="token-box">
            <strong>Токен получен</strong>
            <p>{tokenPreview}</p>
          </div>
        ) : null}

        <p className="hint">
          Если вход не срабатывает, проверьте, что пользователь уже создан в Django.
        </p>
      </section>
    </main>
  );
}

export default App;
