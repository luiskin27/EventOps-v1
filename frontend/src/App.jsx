import { Navigate, Route, Routes } from "react-router-dom";
import { homeFor, useAuth } from "./auth/AuthContext";
import { Skeleton } from "./ui";
import LoginPage from "./pages/LoginPage";
import VerifyPage from "./pages/VerifyPage";
import EventsPage from "./pages/staff/EventsPage";
import EventLayout from "./pages/staff/EventLayout";
import OverviewPage from "./pages/staff/OverviewPage";
import TasksPage from "./pages/staff/TasksPage";
import SchedulePage from "./pages/staff/SchedulePage";
import ParticipantsPage from "./pages/staff/ParticipantsPage";
import PaymentsPage from "./pages/staff/PaymentsPage";
import BadgesPage from "./pages/staff/BadgesPage";
import SettingsPage from "./pages/staff/SettingsPage";
import GuestLayout from "./pages/guest/GuestLayout";
import CabinetPage from "./pages/guest/CabinetPage";
import GuestSchedulePage from "./pages/guest/GuestSchedulePage";
import GuestPaymentsPage from "./pages/guest/GuestPaymentsPage";
import GuestBadgePage from "./pages/guest/GuestBadgePage";

// Пускает на страницу только нужный тип пользователя (staff / guest)
function RequireKind({ kind, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Skeleton />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.kind !== kind) return <Navigate to={homeFor(user)} replace />;
  return children;
}

function Home() {
  const { user, ready } = useAuth();
  if (!ready) return <Skeleton />;
  return <Navigate to={homeFor(user)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify/:token" element={<VerifyPage />} />

      <Route path="/staff" element={<RequireKind kind="staff"><EventsPage /></RequireKind>} />
      <Route path="/staff/events/:eventId" element={<RequireKind kind="staff"><EventLayout /></RequireKind>}>
        <Route index element={<OverviewPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="participants" element={<ParticipantsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="badges" element={<BadgesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="/guest" element={<RequireKind kind="guest"><GuestLayout /></RequireKind>}>
        <Route index element={<CabinetPage />} />
        <Route path="schedule" element={<GuestSchedulePage />} />
        <Route path="payments" element={<GuestPaymentsPage />} />
        <Route path="badge" element={<GuestBadgePage />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  );
}
