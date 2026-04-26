//Definim rutele principale pentru aplicatie, folosind react-router-dom cum ar fi /login, /dashboard, /alerts, /advisor/:id, /leaderboard
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../../pages/LoginPage";
import ManagerDashboardPage from "../../pages/ManagerDashboardPage";
import AdvisorProfilePage from "../../pages/AdvisorProfilePage";
import LeaderboardPage from "../../pages/LeaderboardPage";

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ManagerDashboardPage />} />
            <Route path="/advisor/:id" element={<AdvisorProfilePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} /> 

            {/* fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
    );
}