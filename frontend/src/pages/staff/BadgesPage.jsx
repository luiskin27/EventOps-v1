import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { API_BASE } from "../../api/client";
import { useCrud, useList } from "../../api/hooks";
import { fmtRange } from "../../format";
import { Badge, Button, ErrorNote, Field, PageHeader } from "../../ui";
import BadgeCard from "../../ui/BadgeCard";

function TemplateEditor({ event, template, sample }) {
  const { create, update } = useCrud("badge-templates");
  const [form, setForm] = useState({ background_color: "#FFFFFF", logo_url: "", show_role: true, show_qr: true });
  useEffect(() => {
    if (template) setForm({ background_color: template.background_color, logo_url: template.logo_url, show_role: template.show_role, show_qr: template.show_qr });
  }, [template]);
  const mutation = template ? update : create;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <section className="card p-5">
      <h2 className="text-lg font-semibold">Шаблон бейджа</h2>
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(template ? { id: template.id, ...form } : { ...form, event: event.id });
          }}
        >
          <Field label="Цвет фона">
            <span className="flex items-center gap-2">
              <input type="color" value={form.background_color} onChange={set("background_color")} className="h-10 w-12 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900" />
              <input className="input uppercase" value={form.background_color} onChange={set("background_color")} pattern="#[0-9A-Fa-f]{6}" />
            </span>
          </Field>
          <Field label="Ссылка на логотип" hint="PNG или SVG на прозрачном фоне">
            <input className="input" type="url" value={form.logo_url} onChange={set("logo_url")} placeholder="https://…" />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={form.show_role} onChange={set("show_role")} /> Показывать роль
          </label>
          <ErrorNote error={mutation.error} />
          <Button type="submit" disabled={mutation.isPending}>{mutation.isSuccess ? "Сохранено" : "Сохранить шаблон"}</Button>
        </form>
        <div className="mx-auto w-full max-w-64">
          <BadgeCard
            eventTitle={event.title}
            eventMeta={fmtRange(event.start_date, event.end_date)}
            name={sample?.full_name || "Имя Фамилия"}
            role={form.show_role ? sample?.role_name || "Участник" : null}
            qrUrl={sample?.badge_token ? `${API_BASE}/api/public/badges/${sample.badge_token}/qr.png` : null}
            background={form.background_color}
            logoUrl={form.logo_url}
            size={120}
          />
        </div>
      </div>
    </section>
  );
}

export default function BadgesPage() {
  const { event, participants, terms } = useOutletContext();
  const templates = useList("badge-templates", { event: event.id });
  const badges = useCrud("badges", ["participants"]);
  const without = participants.filter((p) => !p.badge_token);

  const issueAll = async () => {
    for (const p of without) await badges.create.mutateAsync({ participant: p.id });
  };

  return (
    <>
      <PageHeader
        title="Бейджи"
        subtitle="QR-код на бейдже ведёт на страницу проверки: охрана сканирует его телефоном на входе."
        actions={
          without.length ? (
            <Button onClick={issueAll} disabled={badges.create.isPending}>
              <BadgeCheck className="h-4 w-4" /> Выдать всем без бейджа ({without.length})
            </Button>
          ) : null
        }
      />
      <ErrorNote error={badges.create.error} />
      <TemplateEditor event={event} template={templates.data?.[0]} sample={participants.find((p) => p.badge_token) || participants[0]} />

      <section className="card">
        <div className="card-head">
          <h2 className="text-lg font-semibold">{terms.Many}</h2>
          <span className="text-xs muted">Выдано {participants.length - without.length} из {participants.length}</span>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {participants.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{p.full_name}</p>
                <p className="text-xs muted">{p.role_name || "Без роли"}</p>
              </div>
              {p.badge_token ? (
                <>
                  <Badge tone="success">Выдан</Badge>
                  <a href={`/verify/${p.badge_token}`} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1 text-sm">
                    Проверка <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => badges.create.mutate({ participant: p.id })} disabled={badges.create.isPending}>
                  Выдать бейдж
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
