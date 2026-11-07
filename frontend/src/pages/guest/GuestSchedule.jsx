import { FileText, MapPin } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useItem, useList } from "../../api/hooks";
import { fmtRange } from "../../format";
import { Empty, QueryState } from "../../ui";
import { Timeline } from "../staff/ScheduleTab";

export default function GuestSchedule() {
  const { user } = useAuth();
  const eventId = user.participant.event;
  const event = useItem("events", eventId);
  const schedule = useList("schedule", { event: eventId });
  const documents = useList("documents", { event: eventId });

  return (
    <>
      {event.data ? (
        <section className="guest-intro">
          <p className="guest-dates">{fmtRange(event.data.start_date, event.data.end_date)}</p>
          {event.data.location ? (
            <p className="event-loc">
              <MapPin size={14} /> {event.data.location}
            </p>
          ) : null}
          {event.data.description ? <p className="guest-desc">{event.data.description}</p> : null}
        </section>
      ) : null}

      <QueryState query={schedule}>
        {(items) =>
          items.length === 0 ? (
            <Empty title="Программу ещё готовят">Как только организатор её опубликует, она появится здесь.</Empty>
          ) : (
            <Timeline items={items} />
          )
        }
      </QueryState>

      {documents.data?.length ? (
        <section className="docs">
          <h3 className="day-title">Документы</h3>
          <ul>
            {documents.data.map((d) => (
              <li key={d.id}>
                <a href={d.file_url} target="_blank" rel="noreferrer" className="link">
                  <FileText size={16} /> {d.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
