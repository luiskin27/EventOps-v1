// Экран для проектора / ТВ в зале. Два вида (выбирается в настройках стены):
//  - «Доска» (по умолчанию): все пожелания вместе на фоне фото молодых, новые
//    сразу «прилетают» наверх; если не помещаются — доска медленно прокручивается;
//  - «По одному»: крупно, по очереди.
// В углу — QR, чтобы гости присоединялись. Музыку диджей включает отдельно.
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Heart, Maximize } from "lucide-react";
import { API_BASE, api } from "../api/client";
import { cx } from "../ui";

const SLIDE_MS = 9000;

function useScreen(token) {
  return useQuery({
    queryKey: ["screen", token],
    queryFn: () => api(`public/screen/${token}/`, { auth: false }),
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
    retry: 3,
  });
}

export default function WallScreenPage() {
  const { token } = useParams();
  const q = useScreen(token);
  if (q.data?.display_mode === "SLIDES") return <SlidesScreen token={token} />;
  return <BoardScreen token={token} />;
}

function useIdle() {
  const [idle, setIdle] = useState(false);
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
  return idle;
}

// Фон: фото молодых (затемнённое для читаемости) или мягкий градиент
function Backdrop({ src }) {
  if (src) {
    return (
      <>
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1b1433]/70 via-[#1b1433]/45 to-[#1b1433]/80" aria-hidden="true" />
      </>
    );
  }
  return (
    <>
      <div className="pointer-events-none absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-rose-400/25 blur-3xl motion-safe:animate-[pulse_9s_ease-in-out_infinite]" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[40rem] w-[40rem] rounded-full bg-indigo-500/30 blur-3xl motion-safe:animate-[pulse_11s_ease-in-out_infinite]" aria-hidden="true" />
    </>
  );
}

function FullscreenButton({ idle }) {
  if (idle) return null;
  return (
    <button
      type="button"
      onClick={() => document.documentElement.requestFullscreen?.()}
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-white/15 px-4 text-sm font-medium backdrop-blur hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <Maximize className="h-4 w-4" aria-hidden="true" /> На весь экран
    </button>
  );
}

function QrCorner({ d }) {
  if (!d) return null;
  return (
    <aside className="absolute bottom-6 right-6 z-20 flex items-center gap-4 rounded-2xl bg-white/95 p-3 pr-6 text-slate-900 shadow-xl">
      <img src={`${API_BASE}/api/public/wall/${d.post_token}/qr.png`} alt="QR-код: оставить поздравление" className="h-28 w-28 [image-rendering:pixelated]" />
      <p className="max-w-[12rem] text-lg font-semibold leading-snug">
        Оставьте своё поздравление
        <span className="mt-1 block text-sm font-normal text-slate-600">Наведите камеру телефона</span>
      </p>
    </aside>
  );
}

// Немного «живого» беспорядка: каждая карточка чуть повёрнута, всегда одинаково
const tilt = (id) => ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0", "-rotate-[1.5deg]"][id % 6];
const PAPER = ["bg-white", "bg-rose-50", "bg-amber-50", "bg-white", "bg-indigo-50", "bg-white"];

function BoardScreen({ token }) {
  const q = useScreen(token);
  const idle = useIdle();
  const d = q.data;
  const posts = useMemo(() => d?.posts || [], [d]);
  const seen = useRef(null);
  const [fresh, setFresh] = useState(new Set());
  const viewport = useRef(null);

  // Что появилось после открытия экрана — подсвечиваем и прокручиваем наверх, к нему
  useEffect(() => {
    if (!d) return;
    if (seen.current === null) {
      seen.current = new Set(posts.map((p) => p.id));
      return;
    }
    const added = posts.filter((p) => !seen.current.has(p.id)).map((p) => p.id);
    if (!added.length) return;
    added.forEach((id) => seen.current.add(id));
    setFresh((prev) => new Set([...prev, ...added]));
    viewport.current?.scrollTo({ top: 0, behavior: "smooth" });
    const t = setTimeout(() => setFresh((prev) => new Set([...prev].filter((id) => !added.includes(id)))), 6000);
    return () => clearTimeout(t);
  }, [d, posts]);

  // Если пожелания не помещаются — медленно листаем вниз, внизу пауза и обратно наверх
  useEffect(() => {
    const el = viewport.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    let raf;
    let pauseUntil = performance.now() + 4000;
    let pos = el.scrollTop;
    const step = (now) => {
      if (el.scrollHeight - el.clientHeight > 8 && now > pauseUntil) {
        if (Math.abs(el.scrollTop - pos) > 2) pos = el.scrollTop; // прокрутили вручную / прыгнули наверх
        pos += 0.35;
        el.scrollTop = pos;
        if (pos >= el.scrollHeight - el.clientHeight - 1) {
          pauseUntil = now + 5000;
          setTimeout(() => {
            el.scrollTo({ top: 0, behavior: "smooth" });
            pos = 0;
            pauseUntil = performance.now() + 5000;
          }, 4000);
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [posts.length]);

  return (
    <div className={cx("relative h-screen overflow-hidden bg-[#1b1433] text-white", idle && "cursor-none")}>
      <Backdrop src={d?.background} />
      <header className="absolute inset-x-0 top-0 z-20 flex h-28 items-center justify-between gap-6 px-10">
        <h1 className="font-display text-5xl font-semibold tracking-wide text-white drop-shadow-lg">{d?.title || ""}</h1>
        <div className="flex items-center gap-4">
          {posts.length ? <span className="text-lg text-white/80">Пожеланий: <span className="tabular-nums">{posts.length}</span></span> : null}
          <FullscreenButton idle={idle} />
        </div>
      </header>

      {q.isError ? <p className="relative z-10 p-32 text-center text-xl text-rose-100">Не удалось загрузить пожелания. Страница повторит попытку сама.</p> : null}

      {d && !posts.length ? (
        <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
          <Heart className="h-14 w-14 fill-rose-300 text-rose-300" aria-hidden="true" />
          <p className="mt-6 font-display text-6xl font-semibold drop-shadow-lg">Оставьте первое пожелание!</p>
          <p className="mt-4 text-2xl text-white/85">Наведите камеру телефона на QR-код на столе</p>
        </div>
      ) : null}

      {/* Область доски начинается под заголовком; края мягко растворяются, чтобы карточки не налезали на текст */}
      <div
        ref={viewport}
        className="absolute inset-x-0 bottom-0 top-28 z-10 overflow-y-auto px-10 pb-48 pt-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0, #000 40px, #000 calc(100% - 120px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 40px, #000 calc(100% - 120px), transparent 100%)",
        }}
      >
        <ul className="columns-2 gap-6 md:columns-3 xl:columns-4 2xl:columns-5" aria-live="polite">
          {posts.map((p) => (
            <li key={p.id} className={cx("mb-6 break-inside-avoid", fresh.has(p.id) && "motion-safe:animate-pop")}>
             <div
              className={cx(
                "rounded-xl p-4 text-slate-900 shadow-xl ring-1 ring-black/5",
                PAPER[p.id % PAPER.length],
                tilt(p.id),
                fresh.has(p.id) && "ring-4 ring-rose-300 motion-safe:animate-glow"
              )}
            >
              {p.photo ? <img src={p.photo} alt="" className="mb-3 w-full rounded-lg object-cover" /> : null}
              {p.message ? (
                <p className={cx("font-display italic leading-snug text-slate-800", p.message.length > 160 ? "text-xl" : "text-2xl")}>{p.message}</p>
              ) : null}
              <p className="mt-3 text-base font-semibold">
                {p.author_name}
                {p.relation ? <span className="block text-sm font-normal text-rose-700">{p.relation}</span> : null}
              </p>
              {fresh.has(p.id) ? <span className="mt-2 inline-block rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">Новое</span> : null}
             </div>
            </li>
          ))}
        </ul>
      </div>

      <QrCorner d={d} />
    </div>
  );
}

function SlidesScreen({ token }) {
  const q = useScreen(token);
  const posts = useMemo(() => q.data?.posts || [], [q.data]);
  const seen = useRef(new Set());
  const queue = useRef([]); // новые поздравления — вне очереди
  const [current, setCurrent] = useState(null);
  const [visible, setVisible] = useState(true);
  const idle = useIdle();
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

  const d = q.data;
  const c = current && posts.some((p) => p.id === current.id) ? current : posts[0];
  const long = (c?.message || "").length > 220;

  return (
    <div className={cx("relative flex min-h-screen flex-col overflow-hidden bg-[#1b1433] text-white", idle && "cursor-none")}>
      <Backdrop src={d?.background} />
      <header className="relative z-10 flex items-center justify-between px-10 pt-8">
        <h1 className="font-display text-4xl font-semibold tracking-wide text-rose-50 drop-shadow-lg lg:text-5xl">{d?.title || ""}</h1>
        <FullscreenButton idle={idle} />
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

      <QrCorner d={d} />
      {posts.length ? (
        <p className="absolute bottom-10 left-10 z-10 text-lg text-white/60">
          Поздравлений: <span className="tabular-nums">{posts.length}</span>
        </p>
      ) : null}
    </div>
  );
}
