// Экран для проектора / ТВ в зале. Поздравления плавно сменяют друг друга,
// новые подтягиваются сами и показываются первыми. В углу — QR, чтобы гости
// присоединялись. Музыку диджей включает отдельно.
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Heart, Maximize } from "lucide-react";
import { API_BASE, api } from "../api/client";
import { cx } from "../ui";

const SLIDE_MS = 9000;

export default function WallScreenPage() {
  const { token } = useParams();
  const q = useQuery({
    queryKey: ["screen", token],
    queryFn: () => api(`public/screen/${token}/`, { auth: false }),
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    retry: 3,
  });
  const posts = useMemo(() => q.data?.posts || [], [q.data]);
  const seen = useRef(new Set());
  const queue = useRef([]); // новые поздравления — вне очереди
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(true);
  const [idle, setIdle] = useState(false);
  const order = useRef(0);

  // Новые посты (которых ещё не видели) ставим в начало очереди
  useEffect(() => {
    const fresh = posts.filter((p) => !seen.current.has(p.id));
    if (seen.current.size > 0) queue.current.unshift(...fresh.reverse());
    fresh.forEach((p) => seen.current.add(p.id));
    if (!current && posts.length) setCurrent(posts[0]);
  }, [posts, current]);

  useEffect(() => {
    if (!posts.length) return undefined;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        const ids = new Set(posts.map((p) => p.id));
        let next = queue.current.shift();
        while (next && !ids.has(next.id)) next = queue.current.shift(); // скрытые организатором не показываем
        if (!next) {
          order.current = (order.current + 1) % posts.length;
          next = posts[order.current];
        }
        setCurrent(next);
        setVisible(true);
      }, 700);
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, [posts]);

  // Прячем курсор, если мышь не двигалась
  useEffect(() => {
    let t;
    const wake = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), 3000);
    };
    wake();
    window.addEventListener("mousemove", wake);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousemove", wake);
    };
  }, []);

  const d = q.data;
  const qr = d ? `${API_BASE}/api/public/wall/${d.post_token}/qr.png` : null;
  const c = current && posts.some((p) => p.id === current.id) ? current : posts[0];
  const long = (c?.message || "").length > 220;

  return (
    <div className={cx("relative flex min-h-screen flex-col overflow-hidden bg-[#1b1433] text-white", idle && "cursor-none")}>
      {/* мягкий фон: два размытых пятна, медленно «дышат» (отключается при reduced motion) */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-rose-400/25 blur-3xl motion-safe:animate-[pulse_9s_ease-in-out_infinite]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[40rem] w-[40rem] rounded-full bg-indigo-500/30 blur-3xl motion-safe:animate-[pulse_11s_ease-in-out_infinite]" aria-hidden="true" />

      <header className="relative z-10 flex items-center justify-between px-10 pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-wide text-rose-50 lg:text-5xl">{d?.title || ""}</h1>
        {!idle ? (
          <button
            type="button"
            onClick={() => document.documentElement.requestFullscreen?.()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-medium hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Maximize className="h-4 w-4" aria-hidden="true" /> На весь экран
          </button>
        ) : null}
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-10 pb-40 pt-6">
        {q.isError ? <p className="text-xl text-rose-100">Не удалось загрузить поздравления. Проверьте интернет — страница повторит попытку сама.</p> : null}
        {d && !c ? (
          <div className="text-center">
            <Heart className="mx-auto h-14 w-14 fill-rose-300 text-rose-300" aria-hidden="true" />
            <p className="mt-6 font-display text-5xl font-semibold">Оставьте первое поздравление!</p>
            <p className="mt-4 text-2xl text-white/80">Наведите камеру телефона на QR-код на столе</p>
          </div>
        ) : null}
        {c ? (
          <figure
            key={c.id}
            aria-live="polite"
            className={cx(
              "flex w-full max-w-6xl items-center gap-12 transition-all duration-700 ease-out motion-reduce:transition-none",
              visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
              !c.photo && "justify-center text-center"
            )}
          >
            {c.photo ? (
              <img src={c.photo} alt="" className="max-h-[62vh] w-[42%] shrink-0 rotate-[-2deg] rounded-2xl object-cover shadow-2xl ring-8 ring-white" />
            ) : null}
            <div className={cx("min-w-0", c.photo ? "flex-1" : "max-w-4xl")}>
              {c.message ? (
                <blockquote className={cx("font-display font-medium italic leading-snug text-rose-50", long ? "text-4xl" : "text-5xl lg:text-6xl")}>
                  «{c.message}»
                </blockquote>
              ) : null}
              <figcaption className="mt-8">
                <span className="block text-3xl font-semibold">{c.author_name}</span>
                {c.relation ? <span className="mt-1 block text-xl text-rose-200">{c.relation}</span> : null}
              </figcaption>
            </div>
          </figure>
        ) : null}
      </main>

      {qr ? (
        <aside className="absolute bottom-8 right-8 z-10 flex items-center gap-4 rounded-2xl bg-white/95 p-3 pr-6 text-slate-900 shadow-xl">
          <img src={qr} alt="QR-код: оставить поздравление" className="h-28 w-28 [image-rendering:pixelated]" />
          <p className="max-w-[12rem] text-lg font-semibold leading-snug">
            Оставьте своё поздравление
            <span className="mt-1 block text-sm font-normal text-slate-600">Наведите камеру телефона</span>
          </p>
        </aside>
      ) : null}
      {posts.length ? (
        <p className="absolute bottom-10 left-10 z-10 text-lg text-white/60">
          Поздравлений: <span className="tabular-nums">{posts.length}</span>
        </p>
      ) : null}
    </div>
  );
}
