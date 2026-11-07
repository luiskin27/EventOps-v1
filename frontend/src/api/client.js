// Единая точка общения с backend.
// - хранит JWT (access + refresh) в localStorage
// - сам добавляет Authorization: Bearer ...
// - при 401 один раз пробует обновить access через /api/token/refresh/

export const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const ACCESS = "eventops_access";
const REFRESH = "eventops_refresh";

export const tokens = {
  get access() {
    return safeGet(ACCESS);
  },
  get refresh() {
    return safeGet(REFRESH);
  },
  set({ access, refresh }) {
    safeSet(ACCESS, access);
    if (refresh) safeSet(REFRESH, refresh);
  },
  clear() {
    safeSet(ACCESS, null);
    safeSet(REFRESH, null);
  },
};

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* приватный режим браузера — просто живём без сохранения */
  }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

// Превращает ответ DRF с ошибками в одну понятную строку
function errorMessage(data, status) {
  if (!data) return `Ошибка сервера (${status})`;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const parts = Object.entries(data).map(([field, val]) => {
    const text = Array.isArray(val) ? val.join(" ") : String(val);
    return field === "non_field_errors" ? text : `${field}: ${text}`;
  });
  return parts.join("\n") || `Ошибка сервера (${status})`;
}

let refreshing = null;
async function refreshAccess() {
  if (!tokens.refresh) return false;
  // если несколько запросов одновременно получили 401 — обновляем токен один раз
  refreshing ??= fetch(`${API_BASE}/api/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  })
    .then(async (r) => {
      if (!r.ok) return false;
      tokens.set(await r.json());
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function api(path, { method = "GET", body, auth = true, raw = false } = {}, retry = true) {
  const headers = {};
  let payload = body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  if (auth && tokens.access) headers.Authorization = `Bearer ${tokens.access}`;

  let res;
  try {
    res = await fetch(`${API_BASE}/api/${path.replace(/^\//, "")}`, { method, headers, body: payload });
  } catch {
    throw new ApiError("Сервер недоступен. Проверьте, что backend запущен на " + API_BASE, 0);
  }

  if (res.status === 401 && auth && retry && (await refreshAccess())) {
    return api(path, { method, body, auth, raw }, false);
  }
  if (res.status === 401 && auth) {
    tokens.clear();
    window.dispatchEvent(new Event("eventops:logout"));
  }

  if (raw && res.ok) return res;
  if (res.status === 204) return null;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(errorMessage(data, res.status), res.status, data);
  return data;
}

// Короткие помощники для CRUD
export const get = (path) => api(path);
export const post = (path, body) => api(path, { method: "POST", body });
export const patch = (path, body) => api(path, { method: "PATCH", body });
export const del = (path) => api(path, { method: "DELETE" });
