import { Navigate, Route, Routes } from "react-router-dom";
import { homeFor, useAuth } from "./auth/AuthContext";
import { Loading } from "./ui";
import LoginPage from "./pages/LoginPage";
import VerifyPage from "./pages/VerifyPage";
import StaffLayout from "./pages/staff/StaffLayout";
import EventsPage from "./pages/staff/EventsPage";
import EventPage from "./pages/staff/EventPage";
import GuestLayout from "./pages/guest/GuestLayout";
import GuestSchedule from "./pages/guest/GuestSchedule";
import GuestBadge from "./pages/guest/GuestBadge";
import GuestPayments from "./pages/guest/GuestPayments";

// Пускает на страницу только нужный тип пользователя
function RequireKind({ kind, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.kind !== kind) return <Navigate to={homeFor(user)} replace />;
  return children;
}

function Home() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  return <Navigate to={homeFor(user)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify/:token" element={<VerifyPage />} />

      <Route
        path="/staff"
        element={
          <RequireKind kind="staff">
            <StaffLayout />
          </RequireKind>
        }
      >
        <Route index element={<EventsPage />} />
        <Route path="events/:eventId/:tab?" element={<EventPage />} />
      </Route>

      <Route
        path="/guest"
        element={
          <RequireKind kind="guest">
            <GuestLayout />
          </RequireKind>
        }
      >
        <Route index element={<GuestSchedule />} />
        <Route path="badge" element={<GuestBadge />} />
        <Route path="payments" element={<GuestPayments />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
