// Команда мероприятия: тамада, диджей, фотограф, повар… Им не нужен аккаунт —
// их выбирают ответственными в задачах, а расписание им отправляют ссылкой.
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Pencil, Phone, Plus, Trash2, UserRound } from "lucide-react";
import { useCrud, useList } from "../../api/hooks";
import { isOverdueTask, plural } from "../../format";
import { Button, Empty, ErrorNote, Field, IconButton, Modal, PageHeader, QueryState, initials } from "../../ui";

export const POSITIONS = [
  "Тамада", "Диджей", "Фотограф", "Видеограф", "Координатор", "Флорист", "Декоратор",
  "Шеф-повар", "Официант", "Администратор зала", "Кондитер", "Музыкант", "Водитель",
];

function MemberForm({ event, member, onDone }) {
  const { create, update } = useCrud("team", ["tasks"]);
  const mutation = member ? update : create;
  const [form, setForm] = useState({
    full_name: member?.full_name || "",
    position: member?.position || "",
    phone: member?.phone || "",
    notes: member?.notes || "",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(member ? { id: member.id, ...form } : { ...form, event: event.id }, { onSuccess: onDone });
      }}
    >
      <Field label="Имя">
        <input className="input" value={form.full_name} onChange={set("full_name")} required placeholder="Нурбек Асанов" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Должность" hint="Выберите из списка или впишите свою">
          <input className="input" list="positions" value={form.position} onChange={set("position")} required placeholder="Тамада" />
          <datalist id="positions">{POSITIONS.map((p) => <option key={p} value={p} />)}</datalist>
        </Field>
        <Field label="Телефон">
          <input className="input tabular-nums" type="tel" value={form.phone} onChange={set("phone")} placeholder="+996 555 123 456" />
        </Field>
      </div>
      <Field label="Заметка" hint="Например: агентство, график, предоплата">
        <input className="input" value={form.notes} onChange={set("notes")} />
      </Field>
      <ErrorNote error={mutation.error} />
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>{member ? "Сохранить" : "Добавить в команду"}</Button>
      </div>
    </form>
  );
}

export default function TeamPage() {
  const { event, tasks } = useOutletContext();
  const team = useList("team", { event: event.id });
  const { remove } = useCrud("team", ["tasks"]);
  const [editing, setEditing] = useState(null);

  return (
    <>
      <PageHeader
        title="Команда"
        subtitle="Кто работает на мероприятии. Их можно назначать ответственными за задачи — регистрироваться им не нужно."
        actions={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Человек в команду</Button>}
      />
      <ErrorNote error={remove.error} />
      <QueryState query={team}>
        {(list) =>
          list.length === 0 ? (
            <Empty icon={UserRound} title="Команда пока пустая" action={<Button onClick={() => setEditing("new")}>Добавить первого</Button>}>
              Добавьте тамаду, диджея, фотографа, повара — и назначайте их ответственными за задачи.
            </Empty>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((m) => {
                const mine = tasks.filter((t) => t.responsible === m.id);
                const open = mine.filter((t) => t.status !== "DONE").length;
                const late = mine.filter(isOverdueTask).length;
                return (
                  <li key={m.id} className="card flex flex-col p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" aria-hidden="true">
                        {initials(m.full_name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{m.full_name}</p>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">{m.position}</p>
                      </div>
                      <IconButton label={`Изменить: ${m.full_name}`} onClick={() => setEditing(m)}><Pencil className="h-4 w-4" /></IconButton>
                      <IconButton label={`Удалить: ${m.full_name}`} onClick={() => window.confirm(`Убрать ${m.full_name} из команды? Задачи останутся без ответственного.`) && remove.mutate(m.id)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                    {m.phone ? (
                      <a href={`tel:${m.phone.replace(/[^+\d]/g, "")}`} className="link mt-3 inline-flex items-center gap-1.5 text-sm tabular-nums">
                        <Phone className="h-4 w-4" aria-hidden="true" /> {m.phone}
                      </a>
                    ) : null}
                    {m.notes ? <p className="mt-2 text-sm muted">{m.notes}</p> : null}
                    <p className="mt-auto pt-4 text-xs muted">
                      {mine.length === 0 ? "Задач нет" : `${plural(open, "открытая задача", "открытые задачи", "открытых задач")} из ${mine.length}`}
                      {late ? <span className="font-medium text-rose-700 dark:text-rose-400"> · {late} просрочено</span> : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          )
        }
      </QueryState>
      {editing ? (
        <Modal title={editing === "new" ? "Новый человек в команде" : editing.full_name} onClose={() => setEditing(null)}>
          <MemberForm event={event} member={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        </Modal>
      ) : null}
    </>
  );
}
