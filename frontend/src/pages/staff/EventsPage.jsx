import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { useList } from "../../api/hooks";
import { EVENT_TYPES, fmtRange } from "../../format";
import { Empty, QueryState } from "../../ui";

export default function EventsPage() {
  const events = useList("events");
  return (
    <>
      <header className="page-head">
        <h1>События</h1>
      </header>
      <QueryState query={events}>
        {(list) =>
          list.length === 0 ? (
            <Empty title="Событий пока нет">Создайте первое событие кнопкой «+» слева — лагерь, свадьбу или тренинг.</Empty>
          ) : (
            <ul className="event-list">
              {list.map((ev) => (
                <li key={ev.id}>
                  <Link to={`/staff/events/${ev.id}`} className="event-row">
                    <span className="event-type">{EVENT_TYPES[ev.event_type]}</span>
                    <span className="event-title">{ev.title}</span>
                    <span className="event-dates">{fmtRange(ev.start_date, ev.end_date)}</span>
                    {ev.location ? (
                      <span className="event-loc">
                        <MapPin size={14} /> {ev.location}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
    </>
  );
}
