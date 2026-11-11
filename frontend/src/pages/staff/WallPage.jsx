// Стена поздравлений у организатора: настройки, QR для столов, экран, модерация.
import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Check, Copy, EyeOff, Heart, MonitorPlay, Printer, Trash2 } from "lucide-react";
import { API_BASE } from "../../api/client";
import { useCrud, useList } from "../../api/hooks";
import { fmtDate, fmtTime } from "../../format";
import { Badge, Button, Empty, ErrorNote, Field, PageHeader, Skeleton, Tabs, cx } from "../../ui";

const STATUS = { PENDING: ["pending", "На модерации"], APPROVED: ["success", "На экране"], HIDDEN: ["neutral", "Скрыто"] };

function useCopy() {
  const [copied, setCopied] = useState("");
  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Скопируйте ссылку:", text);
    }
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };
  return [copied, copy];
}

function SettingsCard({ event, wall }) {
  const { update } = useCrud("wall-settings");
  const [title, setTitle] = useState(wall.title);
  useEffect(() => setTitle(wall.title), [wall.title]);
  const [copied, copy] = useCopy();
  const postUrl = `${window.location.origin}/w/${wall.post_token}`;
  const screenUrl = `${window.location.origin}/screen/${wall.screen_token}`;
  const qr = `${API_BASE}/api/public/wall/${wall.post_token}/qr.png`;
  const save = (patch) => update.mutate({ id: wall.id, ...patch });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="card p-5 lg:col-span-2">
        <h2 className="text-lg font-semibold">Настройки</h2>
        <div className="mt-4 space-y-5">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-indigo-600" checked={wall.is_enabled} onChange={(e) => save({ is_enabled: e.target.checked })} />
            <span>
              <span className="block font-medium">Принимать поздравления</span>
              <span className="block muted">Снимите после свадьбы — по QR больше нельзя будет отправить новое.</span>
            </span>
          </label>
          <fieldset>
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Когда поздравление попадает на экран</legend>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                ["BEFORE", "После одобрения", "Вы смотрите каждое и нажимаете «Показать». Ничего неуместного на экране."],
                ["AFTER", "Сразу", "Живее и без вашей работы. Лишнее можно скрыть в любой момент."],
              ].map(([v, name, hint]) => (
                <label key={v} className={cx("flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-indigo-500",
                  wall.moderation === v ? "border-indigo-500 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-500/10" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50")}>
                  <input type="radio" name="mod" className="sr-only" checked={wall.moderation === v} onChange={() => save({ moderation: v })} />
                  <span className="font-medium">{name}</span>
                  <span className="text-xs muted">{hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); save({ title }); }}>
            <div className="min-w-56 flex-1">
              <Field label="Заголовок на экране" hint={`Пусто — будет «${event.title}»`}>
                <input className="input h-9" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Айжан ♥ Тимур" />
              </Field>
            </div>
            <Button type="submit" variant="secondary" disabled={update.isPending || title === wall.title}>Сохранить</Button>
          </form>
          <ErrorNote error={update.error} />
        </div>
      </section>

      <section className="card flex flex-col p-5">
        <h2 className="text-lg font-semibold">QR для столов</h2>
        <p className="mt-1 text-sm muted">Гости сканируют его камерой и оставляют поздравление без регистрации.</p>
        <img src={qr} alt="QR-код для гостей" className="mx-auto mt-4 h-40 w-40 rounded-lg bg-white p-2 ring-1 ring-slate-200 [image-rendering:pixelated]" />
        <div className="mt-4 grid gap-2">
          <Link to={`/staff/events/${event.id}/wall/print`} target="_blank" className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
            <Printer className="h-4 w-4" /> Распечатать карточки на столы
          </Link>
          <Button variant="secondary" onClick={() => copy("post", postUrl)}>
            {copied === "post" ? <><Check className="h-4 w-4" /> Скопировано</> : <><Copy className="h-4 w-4" /> Ссылка для гостей</>}
          </Button>
        </div>
        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="text-sm font-medium">Экран в зале</p>
          <p className="mt-0.5 text-xs muted">Откройте на ноутбуке, подключённом к проектору или ТВ, и нажмите «На весь экран».</p>
          <div className="mt-3 grid gap-2">
            <a href={screenUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              <MonitorPlay className="h-4 w-4" /> Открыть экран
            </a>
            <Button variant="ghost" size="sm" onClick={() => copy("screen", screenUrl)}>
              {copied === "screen" ? "Скопировано" : "Скопировать ссылку на экран"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function PostCard({ post }) {
  const { update, remove } = useCrud("wall-posts");
  const set = (status) => update.mutate({ id: post.id, status });
  return (
    <li className="card flex flex-col overflow-hidden">
      {post.photo ? <img src={post.photo} alt={`Фото от ${post.author_name}`} className="aspect-[4/3] w-full object-cover" /> : null}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{post.author_name}</p>
            {post.relation ? <p className="truncate text-xs muted">{post.relation}</p> : null}
          </div>
          <Badge tone={STATUS[post.status][0]}>{STATUS[post.status][1]}</Badge>
        </div>
        {post.message ? <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{post.message}</p> : null}
        <p className="mt-3 text-xs muted">{fmtDate(post.created_at)}, {fmtTime(post.created_at)}</p>
        <ErrorNote error={update.error || remove.error} />
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {post.status !== "APPROVED" ? <Button size="sm" onClick={() => set("APPROVED")} disabled={update.isPending}><Check className="h-4 w-4" /> Показать</Button> : null}
          {post.status !== "HIDDEN" ? <Button size="sm" variant="secondary" onClick={() => set("HIDDEN")} disabled={update.isPending}><EyeOff className="h-4 w-4" /> Скрыть</Button> : null}
          <Button size="sm" variant="danger" className="ml-auto" aria-label={`Удалить поздравление от ${post.author_name}`}
            onClick={() => window.confirm(`Удалить поздравление от ${post.author_name} навсегда?`) && remove.mutate(post.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}

export default function WallPage() {
  const { event } = useOutletContext();
  const walls = useList("wall-settings", { event: event.id });
  const { create } = useCrud("wall-settings");
  const posts = useList("wall-posts", { event: event.id }, { refetchInterval: 10_000 });
  const wall = walls.data?.[0];
  const [tab, setTab] = useState("PENDING");

  // Первый заход — создаём стену для мероприятия
  useEffect(() => {
    if (walls.data && !walls.data.length && !create.isPending && !create.isSuccess) create.mutate({ event: event.id });
  }, [walls.data, create, event.id]);

  const list = posts.data || [];
  const count = (s) => list.filter((p) => p.status === s).length;
  const shown = list.filter((p) => p.status === tab);

  return (
    <>
      <PageHeader
        title="Стена поздравлений"
        subtitle="Гости сканируют QR на столе и оставляют пожелание или фото. Поздравления по очереди показываются на экране в зале."
      />
      <ErrorNote error={walls.error || create.error} />
      {wall ? <SettingsCard event={event} wall={wall} /> : <div className="card"><Skeleton rows={4} /></div>}

      <section aria-labelledby="mod" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="mod" className="text-lg font-semibold">Поздравления</h2>
          <Tabs
            label="Статус"
            value={tab}
            onChange={setTab}
            options={[
              { value: "PENDING", label: "На модерации", count: count("PENDING") },
              { value: "APPROVED", label: "На экране", count: count("APPROVED") },
              { value: "HIDDEN", label: "Скрытые", count: count("HIDDEN") },
            ]}
          />
        </div>
        {posts.isPending ? <div className="card"><Skeleton /></div> : null}
        {posts.data && shown.length === 0 ? (
          <Empty icon={Heart} title={tab === "PENDING" ? "Новых поздравлений нет" : tab === "APPROVED" ? "На экране пока ничего" : "Скрытых нет"}>
            {tab === "PENDING" ? "Как только гость отправит поздравление, оно появится здесь (обновляется само)." : null}
          </Empty>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((p) => <PostCard key={p.id} post={p} />)}
          </ul>
        )}
      </section>
    </>
  );
}
