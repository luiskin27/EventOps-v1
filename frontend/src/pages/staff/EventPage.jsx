import { useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { Download, MapPin, Pencil, Trash2 } from "lucide-react";
import { api } from "../../api/client";
import { useCrud, useItem } from "../../api/hooks";
import { EVENT_TYPES, fmtRange } from "../../format";
import { Button, ErrorNote, Modal, QueryState } from "../../ui";
import EventForm from "./EventForm";
import ParticipantsTab from "./ParticipantsTab";
import ScheduleTab from "./ScheduleTab";
import TasksTab from "./TasksTab";
import PaymentsTab from "./PaymentsTab";

const TABS = [
  { key: "participants", label: "Участники", Component: ParticipantsTab },
  { key: "schedule", label: "Расписание", Component: ScheduleTab },
  { key: "tasks", label: "Задачи", Component: TasksTab },
  { key: "payments", label: "Оплаты", Component: PaymentsTab },
];

// CSV требует Authorization-заголовок, поэтому качаем через fetch, а не простой ссылкой
async function downloadCsv(eventId) {
  const res = await api(`events/${eventId}/export/participants.csv`, { raw: true });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `participants_event_${eventId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EventPage() {
  const { eventId, tab = "participants" } = useParams();
  const event = useItem("events", eventId);
  const { remove } = useCrud("events");
  const [editing, setEditing] = useState(false);
  const [csvError, setCsvError] = useState(null);
  const navigate = useNavigate();
  const current = TABS.find((t) => t.key === tab) || TABS[0];

  return (
    <QueryState query={event}>
      {(ev) => (
        <>
          <header className="page-head event-head">
            <div>
              <p className="event-kicker">
                {EVENT_TYPES[ev.event_type]}, {fmtRange(ev.start_date, ev.end_date)}
              </p>
              <h1>{ev.title}</h1>
              {ev.location ? (
                <p className="event-loc">
                  <MapPin size={14} /> {ev.location}
                </p>
              ) : null}
            </div>
            <div className="actions">
              <Button variant="ghost" onClick={() => downloadCsv(ev.id).catch(setCsvError)}>
                <Download size={16} /> CSV участников
              </Button>
              <Button variant="ghost" onClick={() => setEditing(true)}>
                <Pencil size={16} /> Изменить
              </Button>
            </div>
          </header>
          <ErrorNote error={csvError} />

          <nav className="tabs">
            {TABS.map((t) => (
              <NavLink
                key={t.key}
                to={`/staff/events/${ev.id}/${t.key}`}
                className={({ isActive }) => (isActive || (t.key === current.key) ? "tab active" : "tab")}
              >
                {t.label}
              </NavLink>
            ))}
          </nav>

          <current.Component event={ev} />

          {editing ? (
            <Modal title="Изменить событие" onClose={() => setEditing(false)}>
              <EventForm event={ev} onDone={() => setEditing(false)} />
              <hr className="sep" />
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Удалить «${ev.title}» со всеми участниками и оплатами?`)) {
                    remove.mutate(ev.id, { onSuccess: () => navigate("/staff") });
                  }
                }}
              >
                <Trash2 size={16} /> Удалить событие
              </Button>
            </Modal>
          ) : null}
        </>
      )}
    </QueryState>
  );
}
