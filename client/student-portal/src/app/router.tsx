import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "./store";
import { MobileLayout } from "@/widgets/layout/MobileLayout";
import { LoginPage } from "@/pages/login/LoginPage";
import { HomePage } from "@/pages/home/HomePage";
import { MyMedicationsPage } from "@/pages/my-medications/MyMedicationsPage";
import { MyAppointmentsPage } from "@/pages/my-appointments/MyAppointmentsPage";
import { VisitHistoryPage } from "@/pages/visit-history/VisitHistoryPage";
import { ProfilePage } from "@/pages/profile/ProfilePage";

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
            <MobileLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/medications" element={<MyMedicationsPage />} />
        <Route path="/appointments" element={<MyAppointmentsPage />} />
        <Route path="/history" element={<VisitHistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
