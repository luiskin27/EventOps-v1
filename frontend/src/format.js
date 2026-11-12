export const EVENT_TYPES = {
  WEDDING: "Свадьба",
  CAMP: "Лагерь",
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

// 1 участник, 2 участника, 5 участников
export function plural(n, one, few, many) {
  const m10 = n % 10;
  const m100 = n % 100;
  const word = m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
  return `${n} ${word}`;
}

const shortDayFmt = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "short" });
export const fmtShortDay = (value) => shortDayFmt.format(new Date(value)).replace(".", "");

// Сколько дней до даты (YYYY-MM-DD), отрицательное — прошло
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${dateStr}T00:00:00`) - today) / 86_400_000);
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Как называть людей мероприятия: на свадьбе — «гости», на остальных — «участники»
export function peopleTerms(eventType) {
  const w = eventType === "WEDDING";
  return w
    ? { Many: "Гости", many: "гости", One: "Гость", one: "гость", gen: "гостей", dat: "гостю", datMany: "гостям", acc: "гостя",
        count: (n) => plural(n, "гость", "гостя", "гостей") }
    : { Many: "Участники", many: "участники", One: "Участник", one: "участник", gen: "участников", dat: "участнику", datMany: "участникам", acc: "участника",
        count: (n) => plural(n, "участник", "участника", "участников") };
}

// Для кого пункт расписания
export const AUDIENCE = {
  GUESTS: { label: "Гости", cls: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" , dot: "bg-sky-500" },
  HOSTS: { label: "Ведущий и диджей", cls: "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300" , dot: "bg-fuchsia-500" },
  STAFF: { label: "Персонал", cls: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" , dot: "bg-amber-500" },
  TEAM: { label: "Организаторы", cls: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" , dot: "bg-violet-500" },
};

// Дедлайн задачи: дата + необязательное время → «12 июня, 15:00»
export function fmtDue(date, time) {
  if (!date) return "";
  return time ? `${fmtDate(date)}, ${time.slice(0, 5)}` : fmtDate(date);
}
export function isOverdueTask(t) {
  if (t.status === "DONE" || !t.due_date) return false;
  const end = new Date(`${t.due_date}T${t.due_time || "23:59:59"}`);
  return end < new Date();
}

// Имя файла из ссылки (у файлов в Supabase Storage после «?» идёт подпись)
export const fileName = (url) => (url ? decodeURIComponent(url.split("?")[0].split("/").pop()) : "");
export const isImageUrl = (url) => /\.(png|jpe?g|webp|gif|heic)$/i.test((url || "").split("?")[0]);
