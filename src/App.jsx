import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./components/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";

import Dashboard from "./pages/Dashboard";
import AIAssistant from "./pages/dashboard/AIAssistant";
import History from "./pages/dashboard/History";
import Profile from "./pages/dashboard/Profile";

import ProtectedRoute from "./routes/ProtectedRoute";

import PublicLayout from "./layouts/PublicLayout";
import ProtectedLayout from "./layouts/ProtectedLayout";
import LandingLayout from "./layouts/LandingLayout";

import Landing from "./pages/Landing";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ===== Landing Page (Navbar + Landing Footer) ===== */}
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Landing />} />
        </Route>

        {/* ===== Public Pages (Login / Signup) ===== */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* ===== Protected Pages ===== */}
        <Route
          element={
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;