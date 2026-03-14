import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import Signup from "./pages/signup/signup";
import ResetPassword from "./pages/ResetPassword/ResetPassword";

import Dashboard from "./components/Dashboard/Dashboard";
import AIAssistant from "./pages/dashboard/AIAssistant/AIAssistant";
import History from "./pages/dashboard/History/History";
import Profile from "./pages/dashboard/Profile/Profile";

import ProtectedRoute from "./routes/ProtectedRoute";

import PublicLayout from "./components/layouts/PublicLayout";
import ProtectedLayout from "./components/layouts/ProtectedLayout";
import LandingLayout from "./components/layouts/LandingLayout";

import Landing from "./pages/Landing/Landing";

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