// Карточки на столы для печати: 4 штуки на лист A4, разрезать и поставить на столы.
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../../api/client";
import { useItem, useList } from "../../api/hooks";
import { Button, Skeleton } from "../../ui";

export default function WallPrintPage() {
  const { eventId } = useParams();
  const event = useItem("events", eventId);
  const walls = useList("wall-settings", { event: eventId });
  const wall = walls.data?.[0];
  const qr = wall ? `${API_BASE}/api/public/wall/${wall.post_token}/qr.png` : null;

  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => wasDark && root.classList.add("dark");
  }, []);

  if (!wall || !event.data) return <Skeleton rows={4} />;
  const title = wall.title || event.data.title;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style>{"@page { size: A4; margin: 10mm } @media print { .no-print { display: none !important } }"}</style>
      <div className="no-print flex items-center justify-between gap-3 border-b border-slate-200 p-4">
        <p className="text-sm text-slate-600">4 карточки на лист A4. Распечатайте, разрежьте по пунктиру и поставьте на столы.</p>
        <Button onClick={() => window.print()}>Печать</Button>
      </div>
      <div className="mx-auto grid max-w-[190mm] grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex h-[136mm] flex-col items-center justify-center border border-dashed border-slate-300 p-6 text-center">
            <p className="font-display text-3xl font-semibold leading-tight">{title}</p>
            <p className="mt-2 text-sm text-slate-600">Оставьте пожелание или фото — оно появится на экране в зале</p>
            <img src={qr} alt="QR-код" className="mt-5 h-44 w-44 [image-rendering:pixelated]" />
            <p className="mt-4 text-sm font-semibold">Наведите камеру телефона на код</p>
            <p className="mt-1 text-xs text-slate-500">Регистрация не нужна</p>
          </div>
        ))}
      </div>
    </div>
  );
}
