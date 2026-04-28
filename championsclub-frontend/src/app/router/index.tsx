//Definim rutele principale pentru aplicatie, folosind react-router-dom cum ar fi /login, /dashboard, /alerts, /advisor/:id, /leaderboard
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../../pages/LoginPage";
import ManagerDashboardPage from "../../pages/ManagerDashboardPage";
import AdvisorProfilePage from "../../pages/AdvisorProfilePage";
import LeaderboardPage from "../../pages/LeaderboardPage";
import AdvisorDashboardPage from "../../pages/AdvisorDashboardPage";
import AlertsPage from "../../pages/AlertsPage";

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ManagerDashboardPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/advisor/:id" element={<AdvisorProfilePage />} />
            <Route path="/advisor-dashboard" element={<AdvisorDashboardPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} /> 

            {/* fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
    );
}