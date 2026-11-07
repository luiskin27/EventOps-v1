import { useMemo, useState } from "react";
import { BadgePlus, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCrud, useList } from "../../api/hooks";
import { Button, Empty, ErrorNote, Field, Modal, QueryState } from "../../ui";

// Код гостя: 3 буквы из названия + номер, например ALA004
function suggestCode(event, count) {
  const letters = (event.title.match(/[A-Za-zА-Яа-я]/g) || ["E", "V", "T"]).slice(0, 3).join("");
  const latin = letters
    .toUpperCase()
    .replace(/[А-Я]/g, (c) => "ABVGDEZZIIKLMNOPRSTUFHCCSSYYYEUA"["АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".indexOf(c)] || "X");
  return `${latin.padEnd(3, "X")}${String(count + 1).padStart(3, "0")}`;
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
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const body = { ...form, event: event.id, role: form.role || null, guest_code: form.guest_code.toUpperCase() };
    mutation.mutate(participant ? { id: participant.id, ...body } : body, { onSuccess: onDone });
  };

  return (
    <form className="stack" onSubmit={submit}>
      <Field label="ФИО">
        <input value={form.full_name} onChange={set("full_name")} required />
      </Field>
      <div className="row-2">
        <Field label="Телефон" hint="По нему гость входит в приложение">
          <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+996 …" />
        </Field>
        <Field label="Код гостя" hint="Отправьте гостю вместе с ссылкой">
          <input value={form.guest_code} onChange={set("guest_code")} />
        </Field>
      </div>
      <div className="row-2">
        <Field label="Роль">
          <select value={form.role} onChange={set("role")}>
            <option value="">Без роли</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Email">
          <input type="email" value={form.email} onChange={set("email")} />
        </Field>
      </div>
      <Field label="Заметки" hint="Видны только команде: аллергии, размер футболки, трансфер">
        <textarea rows={2} value={form.notes} onChange={set("notes")} />
      </Field>
      <ErrorNote error={mutation.error} />
      <div className="actions">
        <Button type="submit" disabled={mutation.isPending}>
          {participant ? "Сохранить" : "Добавить участника"}
        </Button>
      </div>
    </form>
  );
}

function RolesEditor({ event, roles }) {
  const { create, remove } = useCrud("roles", ["participants"]);
  const [name, setName] = useState("");
  return (
    <div className="stack">
      <ul className="chips">
        {roles.map((r) => (
          <li key={r.id} className="chip">
            {r.name}
            <button type="button" aria-label={`Удалить роль ${r.name}`} onClick={() => remove.mutate(r.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ event: event.id, name }, { onSuccess: () => setName("") });
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Вожатый, фотограф, охрана…" required />
        <Button type="submit" variant="ghost">
          Добавить роль
        </Button>
      </form>
      <ErrorNote error={create.error} />
    </div>
  );
}

export default function ParticipantsTab({ event }) {
  const participants = useList("participants", { event: event.id });
  const roles = useList("roles", { event: event.id });
  const { remove } = useCrud("participants");
  const badges = useCrud("badges", ["participants"]);
  const [editing, setEditing] = useState(null); // null | "new" | participant
  const [showRoles, setShowRoles] = useState(false);
  const [q, setQ] = useState("");

  const roleList = roles.data || [];
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = participants.data || [];
    if (!needle) return list;
    return list.filter((p) => `${p.full_name} ${p.phone} ${p.guest_code}`.toLowerCase().includes(needle));
  }, [participants.data, q]);

  return (
    <section>
      <div className="toolbar">
        <label className="search">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Имя, телефон или код" />
        </label>
        <Button variant="ghost" onClick={() => setShowRoles(true)}>
          Роли ({roleList.length})
        </Button>
        <Button onClick={() => setEditing("new")}>
          <Plus size={16} /> Участник
        </Button>
      </div>
      <ErrorNote error={badges.create.error} />

      <QueryState query={participants}>
        {(list) =>
          list.length === 0 ? (
            <Empty title="Участников пока нет">
              Добавьте гостей вручную. Каждый получит код и сможет войти по своему телефону.
            </Empty>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>Телефон</th>
                    <th>Роль</th>
                    <th>Код</th>
                    <th>Бейдж</th>
                    <th aria-label="Действия" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="strong">{p.full_name}</td>
                      <td className="nowrap">{p.phone || "—"}</td>
                      <td>{p.role_name || "—"}</td>
                      <td className="code">{p.guest_code || "—"}</td>
                      <td>
                        {p.badge_token ? (
                          <a href={`/verify/${p.badge_token}`} target="_blank" rel="noreferrer" className="link">
                            Выдан <ExternalLink size={13} />
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="link"
                            disabled={badges.create.isPending}
                            onClick={() => badges.create.mutate({ participant: p.id })}
                          >
                            <BadgePlus size={14} /> Выдать
                          </button>
                        )}
                      </td>
                      <td className="row-actions">
                        <button type="button" className="icon-btn" aria-label="Изменить" onClick={() => setEditing(p)}>
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          aria-label="Удалить"
                          onClick={() => window.confirm(`Удалить ${p.full_name}?`) && remove.mutate(p.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </QueryState>

      {editing ? (
        <Modal title={editing === "new" ? "Новый участник" : editing.full_name} onClose={() => setEditing(null)}>
          <ParticipantForm
            event={event}
            roles={roleList}
            count={participants.data?.length || 0}
            participant={editing === "new" ? null : editing}
            onDone={() => setEditing(null)}
          />
        </Modal>
      ) : null}

      {showRoles ? (
        <Modal title="Роли в событии" onClose={() => setShowRoles(false)}>
          <RolesEditor event={event} roles={roleList} />
        </Modal>
      ) : null}
    </section>
  );
}
