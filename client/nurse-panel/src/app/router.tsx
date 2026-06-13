import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "./store";
import { Layout } from "@/widgets/layout/Layout";
import { LoginPage } from "@/pages/login/LoginPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { StudentsPage } from "@/pages/students/StudentsPage";
import { StudentDetailPage } from "@/pages/student-detail/StudentDetailPage";
import { DailyLogPage } from "@/pages/daily-log/DailyLogPage";
import { AppointmentsPage } from "@/pages/appointments/AppointmentsPage";
import { MedRemindersPage } from "@/pages/med-reminders/MedRemindersPage";
import { InventoryPage } from "@/pages/inventory/InventoryPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  if (!accessToken) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/daily-log" element={<DailyLogPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/students/:id" element={<StudentDetailPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/med-reminders" element={<MedRemindersPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
