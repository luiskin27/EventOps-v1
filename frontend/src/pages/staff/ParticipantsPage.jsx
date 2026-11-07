import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { api } from "../../api/client";
import { useCrud, useList } from "../../api/hooks";
import { Badge, Button, Empty, ErrorNote, Field, IconButton, Modal, PageHeader, initials } from "../../ui";

// Код гостя: 3 латинские буквы из названия + номер, например FMP004
const TR = { А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "E", Ж: "Z", З: "Z", И: "I", Й: "I", К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P", Р: "R", С: "S", Т: "T", У: "U", Ф: "F", Х: "H", Ц: "C", Ч: "C", Ш: "S", Щ: "S", Ы: "Y", Э: "E", Ю: "U", Я: "A" };
function suggestCode(event, count) {
  const words = event.title.toUpperCase().match(/[A-ZА-ЯЁ]+/g) || ["EVT"];
  let letters = words.length >= 3 ? words.slice(0, 3).map((w) => w[0]).join("") : words[0].slice(0, 3);
  letters = [...letters].map((c) => TR[c] || c).join("").replace(/[^A-Z]/g, "X");
  return `${letters.padEnd(3, "X")}${String(count + 1).padStart(3, "0")}`;
}

async function downloadCsv(eventId) {
  const res = await api(`events/${eventId}/export/participants.csv`, { raw: true });
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = `participants_event_${eventId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ParticipantForm({ event, roles, participant, count, onDone }) {
  const { create, update } = useCrud("participants");
  const mutation = participant ? update : create;
  const [form, setForm] = useState({
    full_name: participant?.full_name || "",
    phone: participant?.phone || "",
    email: participant?.email || "",
    role: participant?.role ?? "",
    guest_code: participant?.guest_code || suggestCode(event, count),
    notes: participant?.notes || "",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const body = { ...form, event: event.id, role: form.role || null, guest_code: form.guest_code.trim().toUpperCase() };
    mutation.mutate(participant ? { id: participant.id, ...body } : body, { onSuccess: onDone });
  };
  return (
    <form className="space-y-5" onSubmit={submit}>
      <Field label="Имя и фамилия" hint="Так будет написано на бейдже">
        <input className="input" value={form.full_name} onChange={set("full_name")} required autoComplete="off" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Телефон" hint="По нему участник входит в кабинет">
          <input className="input tabular-nums" type="tel" value={form.phone} onChange={set("phone")} placeholder="+996 555 123 456" />
        </Field>
        <Field label="Код для входа" hint="Отправьте участнику вместе со ссылкой">
          <input className="input uppercase tracking-wider" value={form.guest_code} onChange={set("guest_code")} />
        </Field>
        <Field label="Роль">
          <select className="input" value={form.role} onChange={set("role")}>
            <option value="">Без роли</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={form.email} onChange={set("email")} />
        </Field>
      </div>
      <Field label="Заметки" hint="Видны только команде: аллергии, размер футболки, трансфер">
        <textarea className="input" rows={2} value={form.notes} onChange={set("notes")} />
      </Field>
      <ErrorNote error={mutation.error} />
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>{participant ? "Сохранить" : "Добавить участника"}</Button>
      </div>
    </form>
  );
}

export default function ParticipantsPage() {
  const { event, participants } = useOutletContext();
  const roles = useList("roles", { event: event.id });
  const approved = useList("payments", { item__event: event.id, status: "APPROVED" });
  const items = useList("payment-items", { event: event.id });
  const { remove } = useCrud("participants");
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [csvError, setCsvError] = useState(null);

  // Оплачено полностью = подтверждены все статьи оплаты
  const paidState = useMemo(() => {
    const need = (items.data || []).length;
    const by = {};
    for (const p of approved.data || []) (by[p.participant] ??= new Set()).add(p.item);
    return (id) => (!need ? null : (by[id]?.size || 0) >= need ? "full" : by[id]?.size ? "part" : "none");
  }, [approved.data, items.data]);

  const needle = q.trim().toLowerCase();
  const list = participants.filter(
    (p) => (!role || String(p.role) === role) && (!needle || `${p.full_name} ${p.phone} ${p.email} ${p.guest_code}`.toLowerCase().includes(needle))
  );

  return (
    <>
      <PageHeader
        title="Участники"
        subtitle={`${participants.length} в списке. Каждый входит в кабинет по телефону и своему коду.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => downloadCsv(event.id).catch(setCsvError)}>
              <Download className="h-4 w-4" /> Экспорт CSV
            </Button>
            <Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Участник</Button>
          </>
        }
      />
      <ErrorNote error={csvError || remove.error} />

      <section className="card">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          <div className="relative w-full sm:w-72">
            <label htmlFor="p-q" className="sr-only">Поиск участников</label>
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden="true" />
            <input id="p-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, телефон, email или код" className="input h-9 pl-9" />
          </div>
          <label htmlFor="p-r" className="sr-only">Роль</label>
          <select id="p-r" value={role} onChange={(e) => setRole(e.target.value)} className="input h-9 w-auto">
            <option value="">Все роли</option>
            {(roles.data || []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <span className="ml-auto text-xs muted">Показано: {list.length}</span>
        </div>

        {participants.length === 0 ? (
          <div className="p-5">
            <Empty icon={Users} title="Участников пока нет" action={<Button onClick={() => setEditing("new")}>Добавить участника</Button>}>
              Добавьте участников — каждый получит код и сможет войти в кабинет со своего телефона.
            </Empty>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th scope="col" className="px-4 py-2.5 font-medium">Участник</th>
                    <th scope="col" className="px-2 py-2.5 font-medium">Телефон</th>
                    <th scope="col" className="px-2 py-2.5 font-medium">Роль</th>
                    <th scope="col" className="px-2 py-2.5 font-medium">Код</th>
                    <th scope="col" className="px-2 py-2.5 font-medium">Оплата</th>
                    <th scope="col" className="px-2 py-2.5 font-medium">Бейдж</th>
                    <th scope="col" className="px-4 py-2.5"><span className="sr-only">Действия</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {list.map((p) => {
                    const paid = paidState(p.id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300" aria-hidden="true">{initials(p.full_name)}</span>
                            <span>
                              <span className="block font-medium">{p.full_name}</span>
                              {p.email ? <span className="block text-xs muted">{p.email}</span> : null}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 tabular-nums text-slate-600 dark:text-slate-300">{p.phone || "—"}</td>
                        <td className="px-2 py-2.5 text-slate-600 dark:text-slate-300">{p.role_name || "—"}</td>
                        <td className="px-2 py-2.5 font-medium tabular-nums tracking-wider">{p.guest_code || "—"}</td>
                        <td className="px-2 py-2.5">
                          {paid === "full" ? <Badge tone="success">Оплачено</Badge> : paid === "part" ? <Badge tone="pending">Частично</Badge> : paid === "none" ? <Badge tone="neutral" icon={false}>Не оплачено</Badge> : <span className="muted">—</span>}
                        </td>
                        <td className="px-2 py-2.5">{p.badge_token ? <Badge tone="info" icon={false}>Выдан</Badge> : <span className="text-xs muted">Нет</span>}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right">
                          <IconButton label={`Изменить: ${p.full_name}`} onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></IconButton>
                          <IconButton label={`Удалить: ${p.full_name}`} onClick={() => window.confirm(`Удалить ${p.full_name}? Его оплаты тоже удалятся.`) && remove.mutate(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
              {list.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => setEditing(p)} className="flex min-h-11 w-full items-start justify-between gap-3 px-4 py-3 text-left">
                    <span>
                      <span className="block text-sm font-medium">{p.full_name}</span>
                      <span className="block text-xs muted">{[p.role_name, p.phone, p.guest_code].filter(Boolean).join(" · ")}</span>
                    </span>
                    {p.badge_token ? <Badge tone="info" icon={false}>Бейдж</Badge> : null}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {editing ? (
        <Modal title={editing === "new" ? "Новый участник" : editing.full_name} onClose={() => setEditing(null)}>
          <ParticipantForm
            event={event}
            roles={roles.data || []}
            count={participants.length}
            participant={editing === "new" ? null : editing}
            onDone={() => setEditing(null)}
          />
        </Modal>
      ) : null}
    </>
  );
}
