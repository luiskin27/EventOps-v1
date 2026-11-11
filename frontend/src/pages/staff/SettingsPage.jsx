import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Plus, Trash2, X } from "lucide-react";
import { useCrud, useList } from "../../api/hooks";
import { fmtMoney } from "../../format";
import { Button, ErrorNote, Field, IconButton, PageHeader } from "../../ui";
import EventForm from "./EventForm";

function PaymentItems({ event }) {
  const items = useList("payment-items", { event: event.id });
  const { create, remove } = useCrud("payment-items");
  const [form, setForm] = useState({ title: "", amount: "", currency: "KGS" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2 className="text-lg font-semibold">Что оплачивают участники</h2>
          <p className="mt-0.5 text-sm muted">Взнос, проживание, трансфер. Участник загружает чек по каждой статье.</p>
        </div>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {(items.data || []).map((it) => (
          <li key={it.id} className="flex items-center gap-3 px-5 py-3">
            <span className="flex-1 text-sm font-medium">{it.title}</span>
            <span className="text-sm tabular-nums">{fmtMoney(it.amount, it.currency)}</span>
            <IconButton label={`Удалить «${it.title}»`} onClick={() => remove.mutate(it.id)}><X className="h-4 w-4" /></IconButton>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-wrap items-end gap-2 border-t border-slate-200 p-5 dark:border-slate-800"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ ...form, event: event.id }, { onSuccess: () => setForm({ title: "", amount: "", currency: form.currency }) });
        }}
      >
        <div className="min-w-48 flex-1"><Field label="Статья"><input className="input h-9" value={form.title} onChange={set("title")} required placeholder="Взнос за участие" /></Field></div>
        <div className="w-32"><Field label="Сумма"><input className="input h-9" type="number" min="0" step="0.01" value={form.amount} onChange={set("amount")} required /></Field></div>
        <div className="w-28">
          <Field label="Валюта">
            <select className="input h-9" value={form.currency} onChange={set("currency")}>
              {["KGS", "USD", "KZT", "RUB"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Button type="submit" variant="secondary" disabled={create.isPending}><Plus className="h-4 w-4" /> Добавить</Button>
        <div className="w-full"><ErrorNote error={create.error || remove.error} /></div>
      </form>
    </section>
  );
}

function DocumentTypes({ event }) {
  const types = useList("document-types", { event: event.id });
  const { create, update, remove } = useCrud("document-types", ["participant-documents"]);
  const [form, setForm] = useState({ title: "", description: "", is_required: true });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2 className="text-lg font-semibold">Документы участников</h2>
          <p className="mt-0.5 text-sm muted">Что участник загружает в кабинете. Обязательные нужны для допуска по QR.</p>
        </div>
      </div>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {(types.data || []).map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description ? <p className="text-xs muted">{t.description}</p> : null}
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={t.is_required} onChange={(e) => update.mutate({ id: t.id, is_required: e.target.checked })} />
              Обязателен
            </label>
            <IconButton
              label={`Удалить «${t.title}»`}
              onClick={() => window.confirm(`Удалить «${t.title}»? Загруженные участниками файлы этого типа тоже удалятся.`) && remove.mutate(t.id)}
            >
              <X className="h-4 w-4" />
            </IconButton>
          </li>
        ))}
      </ul>
      <form
        className="space-y-3 border-t border-slate-200 p-5 dark:border-slate-800"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ ...form, event: event.id, order: types.data?.length || 0 }, { onSuccess: () => setForm({ title: "", description: "", is_required: true }) });
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Документ"><input className="input h-9" value={form.title} onChange={set("title")} required placeholder="Удостоверение личности" /></Field>
          <Field label="Подсказка участнику"><input className="input h-9" value={form.description} onChange={set("description")} placeholder="Фото целиком, без бликов" /></Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={form.is_required} onChange={set("is_required")} /> Обязателен для допуска
          </label>
          <Button type="submit" variant="secondary" disabled={create.isPending}><Plus className="h-4 w-4" /> Добавить</Button>
        </div>
        <ErrorNote error={create.error || update.error || remove.error} />
      </form>
    </section>
  );
}

function Roles({ event }) {
  const roles = useList("roles", { event: event.id });
  const { create, remove } = useCrud("roles", ["participants"]);
  const [name, setName] = useState("");
  return (
    <section className="card p-5">
      <h2 className="text-lg font-semibold">Роли участников</h2>
      <p className="mt-0.5 text-sm muted">Роль печатается на бейдже: участник, спикер, волонтёр, вожатый.</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {(roles.data || []).map((r) => (
          <li key={r.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1 text-sm dark:bg-slate-800">
            {r.name}
            <button type="button" aria-label={`Удалить роль ${r.name}`} onClick={() => remove.mutate(r.id)} className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10">
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); create.mutate({ event: event.id, name }, { onSuccess: () => setName("") }); }}>
        <label htmlFor="role-n" className="sr-only">Новая роль</label>
        <input id="role-n" className="input h-9" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Новая роль" />
        <Button type="submit" variant="secondary">Добавить</Button>
      </form>
      <div className="mt-2"><ErrorNote error={create.error} /></div>
    </section>
  );
}

export default function SettingsPage() {
  const { event } = useOutletContext();
  const { remove } = useCrud("events");
  const navigate = useNavigate();
  return (
    <>
      <PageHeader title="Настройки мероприятия" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">Основное</h2>
          <EventForm key={event.id} event={event} onDone={() => {}} />
        </section>
        <div className="space-y-6">
          <PaymentItems event={event} />
          <DocumentTypes event={event} />
          <Roles event={event} />
        </div>
      </div>
      <section className="rounded-xl border border-rose-200 bg-white p-5 dark:border-rose-500/30 dark:bg-slate-900">
        <h2 className="text-base font-semibold text-rose-700 dark:text-rose-300">Удалить мероприятие</h2>
        <p className="mt-1 text-sm muted">Удалятся все участники, оплаты, задачи и расписание. Отменить нельзя.</p>
        <Button
          variant="danger"
          className="mt-4"
          onClick={() => window.confirm(`Удалить «${event.title}» без возможности восстановления?`) && remove.mutate(event.id, { onSuccess: () => navigate("/staff") })}
        >
          <Trash2 className="h-4 w-4" /> Удалить мероприятие
        </Button>
        <ErrorNote error={remove.error} />
      </section>
    </>
  );
}
