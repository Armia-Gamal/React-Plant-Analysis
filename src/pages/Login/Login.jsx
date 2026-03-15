import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../index.css";
import "./Login.css";
import image from "../../assets/images/Image.png";
import arImage from "../../assets/images/Ar-Image.png";
import { useLanguage } from "../../context/LanguageContext";

import {
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";

import { auth, googleProvider } from "../../firebase";

const text = {
  en: {
    title: "Login | Nabta-System",
    emptyFields: "Please enter email and password",
    invalidLogin: "Invalid email or password.",
    unregisteredGoogle: "This account is not registered. Please sign up first.",
    loginFailed: "Login failed.",
    notAccess: "Not Access",
    closeNotAccess: "Close Not Access message",
    welcomeBack: "Welcome Back",
    subtitle: "Enter your email and password to sign in",
    email: "Email",
    emailPlaceholder: "Your email address",
    password: "Password",
    passwordPlaceholder: "Your password",
    forgotPassword: "Forgot password?",
    rememberMe: "Remember me",
    signingIn: "Signing in...",
    signIn: "Sign in",
    noAccount: "Don’t have an account?",
    signUp: "Sign up",
    orContinueWith: "OR CONTINUE WITH",
    signInGoogle: "Sign in with Google"
  },
  ar: {
    title: "تسجيل الدخول | Nabta-System",
    emptyFields: "يرجى إدخال البريد الإلكتروني وكلمة المرور",
    invalidLogin: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    unregisteredGoogle: "هذا الحساب غير مسجل. يرجى إنشاء حساب أولاً.",
    loginFailed: "فشل تسجيل الدخول.",
    notAccess: "غير مسموح بالدخول",
    closeNotAccess: "إغلاق رسالة عدم السماح",
    welcomeBack: "مرحبًا بعودتك",
    subtitle: "أدخل البريد الإلكتروني وكلمة المرور لتسجيل الدخول",
    email: "البريد الإلكتروني",
    emailPlaceholder: "أدخل بريدك الإلكتروني",
    password: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    forgotPassword: "نسيت كلمة المرور؟",
    rememberMe: "تذكرني",
    signingIn: "جاري تسجيل الدخول...",
    signIn: "تسجيل الدخول",
    noAccount: "ليس لديك حساب؟",
    signUp: "إنشاء حساب",
    orContinueWith: "أو المتابعة باستخدام",
    signInGoogle: "تسجيل الدخول باستخدام Google"
  }
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = text[language] || text.en;
  const notAccess = location && location.state && location.state.notAccess;
  const [showNotAccess, setShowNotAccess] = useState(false);

  useEffect(() => {
    if (notAccess) {
      setShowNotAccess(true);
      const timer = setTimeout(() => {
        setShowNotAccess(false);
        // Reset state so message doesn't show again
        window.history.replaceState({}, '', window.location.pathname);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notAccess]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRemember, setLoginRemember] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = t.title;
  }, [t.title]);

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
      setLoginError(t.emptyFields);
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
      setLoginError(t.invalidLogin);
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

        setLoginError(t.unregisteredGoogle);
        return;
      }

      navigate("/dashboard", { replace: true });

    } catch (error) {
      setLoginError(t.loginFailed);
    }
  };

  return (
    <main className="login-layout" dir={language === "ar" ? "rtl" : "ltr"}>
      {showNotAccess && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.45)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            minWidth: "320px",
            maxWidth: "90vw",
            padding: "32px 40px 32px 32px",
            borderRadius: "18px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            background: "#fff",
            color: "#dc2626",
            fontSize: "1.6rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: "2px solid #dc2626",
            outline: "4px solid #fff",
            position: "relative"
          }}>
            <span style={{fontSize: "1.7rem", fontWeight: "bold"}}>{t.notAccess}</span>
            <button
              style={{
                background: "none",
                border: "none",
                color: "#dc2626",
                fontSize: "2rem",
                cursor: "pointer",
                marginInlineStart: "24px",
                position: "absolute",
                top: "12px",
                insetInlineEnd: "18px"
              }}
              onClick={() => setShowNotAccess(false)}
              aria-label={t.closeNotAccess}
              autoFocus
            >
              ×
            </button>
          </div>
        </div>
      )}
      <section className="login-left">
        <div className="login-card-box">
          <h2>{t.welcomeBack}</h2>
          <p>{t.subtitle}</p>

          <label>{t.email}</label>
          <input
            type="email"
            placeholder={t.emailPlaceholder}
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />

          <label>{t.password}</label>

          <div className="login-password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t.passwordPlaceholder}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />

            <i
              className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>



          <div style={{ textAlign: "end", marginBottom: "10px" }}>
            <span
              onClick={() => navigate("/reset-password")}
              style={{ cursor: "pointer", fontSize: "13px", color: "#fc0038" }}
            >
              {t.forgotPassword}
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
            <span>{t.rememberMe}</span>
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
            {loginLoading ? t.signingIn : t.signIn}
          </button>

          <p className="login-signup-link">
            {t.noAccount}{" "}
            <span onClick={() => navigate("/signup")}>{t.signUp}</span>
          </p>

          <div className="login-divider">
            <span>{t.orContinueWith}</span>
          </div>

          <button
            type="button"
            className="login-google-btn"
            onClick={handleGoogleLogin}
            disabled={loginLoading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="20"
              height="20"
            >
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.73 1.22 9.24 3.6l6.9-6.9C35.89 2.3 30.34 0 24 0 14.62 0 6.54 5.48 2.63 13.44l8.04 6.24C12.4 13.02 17.72 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.66-.15-3.26-.42-4.8H24v9.1h12.7c-.55 2.96-2.22 5.47-4.73 7.15l7.27 5.65C43.95 37.7 46.5 31.7 46.5 24.5z"/>
              <path fill="#FBBC05" d="M10.67 28.68a14.6 14.6 0 010-9.36l-8.04-6.24A23.97 23.97 0 000 24c0 3.86.92 7.52 2.63 10.92l8.04-6.24z"/>
              <path fill="#34A853" d="M24 48c6.34 0 11.66-2.1 15.55-5.73l-7.27-5.65c-2.02 1.35-4.62 2.15-8.28 2.15-6.28 0-11.6-3.52-13.33-8.68l-8.04 6.24C6.54 42.52 14.62 48 24 48z"/>
            </svg>
            {t.signInGoogle}
          </button>
        </div>
      </section>

      <section className="login-right">
        <img src={language === "ar" ? arImage : image} alt="login" />
      </section>
    </main>
  );
}