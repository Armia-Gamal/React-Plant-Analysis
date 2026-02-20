import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import "./Login.css";
import image from "../assets/images/Image.png";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";

import { auth, googleProvider } from "../firebase";

export default function Login() {
  const navigate = useNavigate();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRemember, setLoginRemember] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = "Login | Nabta Seniors";
  }, []);

  // تحميل Remember Me
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    const savedPassword = localStorage.getItem("rememberPassword");
    const savedRemember = localStorage.getItem("rememberMe");

    if (savedRemember === "true") {
      setLoginEmail(savedEmail || "");
      setLoginPassword(savedPassword || "");
      setLoginRemember(true);
    }
  }, []);

  // =========================
  // 🟢 Email Login
  // =========================
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter email and password");
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      await setPersistence(
        auth,
        loginRemember
          ? browserLocalPersistence
          : browserSessionPersistence
      );

      await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );

      // Remember Me
      if (loginRemember) {
        localStorage.setItem("rememberEmail", loginEmail);
        localStorage.setItem("rememberPassword", loginPassword);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberEmail");
        localStorage.removeItem("rememberPassword");
        localStorage.setItem("rememberMe", "false");
      }

      navigate("/dashboard", { replace: true });

    } catch (error) {
      setLoginError("Invalid email or password.");
    } finally {
      setLoginLoading(false);
    }
  };

  // =========================
  // 🔵 Google Login
  // =========================
  const handleGoogleLogin = async () => {
    try {
      await setPersistence(
        auth,
        loginRemember
          ? browserLocalPersistence
          : browserSessionPersistence
      );

      const result = await signInWithPopup(auth, googleProvider);

      // 🔥 لو ده أول مرة (يعني Firebase عمل user جديد)
      if (result._tokenResponse?.isNewUser) {

        // نمسح الحساب فورًا قبل ما يتسجل
        await result.user.delete();

        await auth.signOut();

        setLoginError("This account is not registered. Please sign up first.");
        return;
      }

      navigate("/dashboard", { replace: true });

    } catch (error) {
      setLoginError("Login failed.");
    }
  };

  return (
    <main className="login-layout">
      <section className="login-left">
        <div className="login-card-box">
          <h2>Welcome Back</h2>
          <p>Enter your email and password to sign in</p>

          <label>Email</label>
          <input
            type="email"
            placeholder="Your email address"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />

          <label>Password</label>

          <div className="login-password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />

            <i
              className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>



          <div style={{ textAlign: "right", marginBottom: "10px" }}>
            <span
              onClick={() => navigate("/reset-password")}
              style={{ cursor: "pointer", fontSize: "13px", color: "#fc0038" }}
            >
              Forgot password?
            </span>
          </div>

          <div className="login-remember">
            <label className="login-switch">
              <input
                type="checkbox"
                checked={loginRemember}
                onChange={(e) => setLoginRemember(e.target.checked)}
              />
              <span className="login-slider"></span>
            </label>
            <span>Remember me</span>
          </div>

          {loginError && (
            <p style={{ color: "red", fontSize: "13px", marginTop: "10px" }}>
              {loginError}
            </p>
          )}

          <button
            className="login-btn-main"
            onClick={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? "Signing in..." : "Sign in"}
          </button>

          <p className="login-signup-link">
            Don’t have an account?{" "}
            <span onClick={() => navigate("/signup")}>Sign up</span>
          </p>

          <div className="login-social">
            <i className="fa-brands fa-facebook-f"></i>
            <i className="fa-brands fa-apple"></i>
            <i
              className="fa-brands fa-google"
              onClick={handleGoogleLogin}
              style={{ cursor: "pointer" }}
            ></i>
          </div>
        </div>
      </section>

      <section className="login-right">
        <img src={image} alt="login" />
      </section>
    </main>
  );
}