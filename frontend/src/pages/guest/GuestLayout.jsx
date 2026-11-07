import { NavLink, Outlet } from "react-router-dom";
import { CalendarDays, IdCard, LogOut, Wallet } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

export default function GuestLayout() {
  const { user, logout } = useAuth();
  const p = user.participant;

  return (
    <div className="guest">
      <header className="guest-head">
        <div>
          <p className="guest-hello">{p.full_name}</p>
          <h1 className="guest-event">{p.event_title}</h1>
        </div>
        <button type="button" className="icon-btn" onClick={logout} aria-label="Выйти" title="Выйти">
          <LogOut size={18} />
        </button>
      </header>

      <main className="guest-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/guest" end>
          <CalendarDays size={22} />
          Программа
        </NavLink>
        <NavLink to="/guest/badge">
          <IdCard size={22} />
          Бейдж
        </NavLink>
        <NavLink to="/guest/payments">
          <Wallet size={22} />
          Оплата
        </NavLink>
      </nav>
    </div>
  );
}
