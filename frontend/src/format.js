export const EVENT_TYPES = {
  CAMP: "Лагерь",
  WEDDING: "Свадьба",
  TRAINING: "Корпоративное обучение",
  OTHER: "Другое",
};

export const TASK_STATUS = { TODO: "К выполнению", IN_PROGRESS: "В работе", DONE: "Выполнено" };
export const PAYMENT_STATUS = { PENDING: "На проверке", APPROVED: "Подтверждён", REJECTED: "Отклонён" };

const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const dayFmt = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" });
const timeFmt = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" });

export const fmtDate = (value) => (value ? dateFmt.format(new Date(value)) : "");
export const fmtDay = (value) => dayFmt.format(new Date(value));
export const fmtTime = (value) => (value ? timeFmt.format(new Date(value)) : "");

export function fmtRange(start, end) {
  if (!start) return "Даты не указаны";
  if (!end || end === start) return fmtDate(start);
  return `${fmtDate(start)} – ${fmtDate(end)}`;
}

export function fmtMoney(amount, currency = "KGS") {
  const n = Number(amount);
  return `${n.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ${currency === "KGS" ? "сом" : currency}`;
}

// <input type="datetime-local"> ↔ ISO
export function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);

// Группировка расписания по дням
export function groupByDay(items) {
  const groups = new Map();
  for (const item of items) {
    const key = new Date(item.starts_at).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.values()];
}
