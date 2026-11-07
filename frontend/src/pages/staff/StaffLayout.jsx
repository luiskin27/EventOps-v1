import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Plus } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useList } from "../../api/hooks";
import { EVENT_TYPES, fmtRange } from "../../format";
import { Modal } from "../../ui";
import EventForm from "./EventForm";

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const events = useList("events");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="staff">
      <aside className="rail">
        <NavLink to="/staff" end className="wordmark wordmark-sm">
          EventOps
        </NavLink>

        <div className="rail-head">
          <span>События</span>
          <button type="button" className="icon-btn" onClick={() => setCreating(true)} aria-label="Новое событие">
            <Plus size={18} />
          </button>
        </div>
        <nav className="rail-list">
          {(events.data || []).map((ev) => (
            <NavLink key={ev.id} to={`/staff/events/${ev.id}`} className="rail-item">
              <span className="rail-title">{ev.title}</span>
              <span className="rail-meta">
                {EVENT_TYPES[ev.event_type]}, {fmtRange(ev.start_date, ev.end_date)}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="rail-foot">
          <span className="rail-user">{user.full_name || user.username}</span>
          <button type="button" className="icon-btn" onClick={logout} aria-label="Выйти" title="Выйти">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="staff-main">
        <Outlet />
      </main>

      {creating ? (
        <Modal title="Новое событие" onClose={() => setCreating(false)}>
          <EventForm
            onDone={(ev) => {
              setCreating(false);
              navigate(`/staff/events/${ev.id}`);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}
