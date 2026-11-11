// Гость сканирует QR на столе → эта страница. Без входа: имя, кем приходится,
// пожелание и/или фото. Имя запоминаем в браузере, чтобы второе поздравление было быстрее.
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Camera, Heart, Send, X } from "lucide-react";
import { api } from "../api/client";
import { Button, ErrorNote, Skeleton, cx } from "../ui";

const MAX_LEN = 600;
const NAME_KEY = "eventops_wall_name";

function readName() {
  try {
    return JSON.parse(localStorage.getItem(NAME_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function WallPostPage() {
  const { token } = useParams();
  const info = useQuery({ queryKey: ["wall", token], queryFn: () => api(`public/wall/${token}/`, { auth: false }), retry: false });
  const saved = readName();
  const [name, setName] = useState(saved.name || "");
  const [relation, setRelation] = useState(saved.relation || "");
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  // Страница всегда светлая (свадебная), даже если у гостя в телефоне тёмная тема
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => wasDark && root.classList.add("dark");
  }, []);

  const send = useMutation({
    mutationFn: () => {
      const data = new FormData();
      data.append("author_name", name.trim());
      data.append("relation", relation.trim());
      data.append("message", message.trim());
      if (photo) data.append("photo", photo);
      return api(`public/wall/${token}/`, { method: "POST", body: data, auth: false });
    },
    onSuccess: (post) => {
      try {
        localStorage.setItem(NAME_KEY, JSON.stringify({ name: name.trim(), relation: relation.trim() }));
      } catch {
        /* без сохранения */
      }
      setSent(post);
      setMessage("");
      setPhoto(null);
      setPreview(null);
    },
  });

  const pick = (f) => {
    setErr("");
    if (!f) return;
    if (!f.type.startsWith("image/")) return setErr("Подойдёт только фото.");
    if (f.size > 12 * 1024 * 1024) return setErr("Фото больше 12 МБ — выберите другое.");
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return setErr("Напишите, как вас зовут.");
    if (!message.trim() && !photo) return setErr("Напишите пожелание или прикрепите фото.");
    setErr("");
    send.mutate();
  };

  const d = info.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-indigo-50 text-slate-900">
      <main className="mx-auto w-full max-w-md px-4 pb-10 pt-8">
        {info.isPending ? <div className="card"><Skeleton rows={5} /></div> : null}
        {info.isError ? <ErrorNote error={info.error} /> : null}

        {d ? (
          <>
            <header className="text-center">
              <Heart className="mx-auto h-7 w-7 fill-rose-400 text-rose-400" aria-hidden="true" />
              <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{d.title}</h1>
              <p className="mt-2 text-sm text-slate-600">
                Оставьте пожелание или фото — оно появится на большом экране в зале
                {d.moderation === "BEFORE" ? " после проверки" : ""}.
              </p>
            </header>

            {!d.is_enabled ? (
              <p className="mt-8 rounded-xl bg-white p-6 text-center text-sm shadow-sm ring-1 ring-slate-200">Приём поздравлений закрыт. Спасибо, что были с нами!</p>
            ) : sent ? (
              <section className="mt-8 rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200" aria-live="polite">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Heart className="h-7 w-7 fill-current" aria-hidden="true" />
                </span>
                <h2 className="mt-3 text-lg font-semibold">Спасибо, {sent.author_name}!</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {sent.status === "APPROVED" ? "Ваше поздравление уже на экране." : "Поздравление отправлено. Оно появится на экране, когда организатор его посмотрит."}
                </p>
                <Button size="lg" className="mt-5 w-full" onClick={() => setSent(null)}>Написать ещё одно</Button>
              </section>
            ) : (
              <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="block text-sm font-medium text-slate-700">Ваше имя</span>
                    <input className="input mt-1.5 h-11 text-base" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="given-name" placeholder="Нургуль" />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium text-slate-700">Кем приходитесь <span className="font-normal text-slate-500">(необяз.)</span></span>
                    <input className="input mt-1.5 h-11 text-base" value={relation} onChange={(e) => setRelation(e.target.value)} maxLength={80} placeholder="Подруга невесты" />
                  </label>
                </div>
                <label className="block">
                  <span className="flex items-baseline justify-between text-sm font-medium text-slate-700">
                    Пожелание
                    <span className={cx("text-xs font-normal tabular-nums", message.length > MAX_LEN - 50 ? "text-amber-700" : "text-slate-500")}>{message.length} / {MAX_LEN}</span>
                  </span>
                  <textarea className="input mt-1.5 text-base" rows={5} maxLength={MAX_LEN} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Будьте счастливы! Пусть…" />
                </label>

                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Выбранное фото" className="max-h-72 w-full rounded-lg object-cover" />
                    <button type="button" onClick={() => { setPhoto(null); setPreview(null); }} aria-label="Убрать фото"
                      className="focus-ring absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/70 text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="focus-ring flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-rose-200 bg-rose-50/50 text-sm font-medium text-rose-700 hover:bg-rose-50">
                    <Camera className="h-5 w-5" aria-hidden="true" /> Добавить фото <span className="font-normal text-rose-600/80">(необязательно)</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />

                {err ? <p role="alert" className="text-sm text-rose-700">{err}</p> : null}
                <ErrorNote error={send.error} />
                <Button type="submit" size="lg" className="w-full" disabled={send.isPending}>
                  <Send className="h-4 w-4" /> {send.isPending ? "Отправляем…" : "Отправить поздравление"}
                </Button>
              </form>
            )}
            <p className="mt-6 text-center text-xs text-slate-500">Работает на EventOps</p>
          </>
        ) : null}
      </main>
    </div>
  );
}
