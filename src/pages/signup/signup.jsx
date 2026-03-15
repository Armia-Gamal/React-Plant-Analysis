import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./signup.css";
import { auth, googleProvider, db, functions } from "../../firebase";
import { useLanguage } from "../../context/LanguageContext";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

const text = {
  en: {
    title: "Sign Up | Nabta-System",
    welcome: "Welcome!",
    welcomeText: "Register now to detect plant diseases quickly and accurately using our AI-powered system for healthier crops.",
    registerWith: "Register with",
    signUpGoogle: "Sign up with Google",
    or: "Or",
    name: "Name",
    namePlaceholder: "Your full name",
    email: "Email",
    emailPlaceholder: "Your email address",
    password: "Password",
    passwordPlaceholder: "Your password",
    creating: "Creating account...",
    signUp: "Sign Up",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign In"
  },
  ar: {
    title: "إنشاء حساب | Nabta-System",
    welcome: "مرحبًا!",
    welcomeText: "سجّل الآن لاكتشاف أمراض النباتات بسرعة ودقة باستخدام نظامنا المدعوم بالذكاء الاصطناعي لمحاصيل أكثر صحة.",
    registerWith: "سجّل باستخدام",
    signUpGoogle: "إنشاء حساب باستخدام Google",
    or: "أو",
    name: "الاسم",
    namePlaceholder: "الاسم الكامل",
    email: "البريد الإلكتروني",
    emailPlaceholder: "أدخل بريدك الإلكتروني",
    password: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    creating: "جاري إنشاء الحساب...",
    signUp: "إنشاء حساب",
    alreadyHaveAccount: "لديك حساب بالفعل؟",
    signIn: "تسجيل الدخول"
  }
};

export default function Signup() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = text[language] || text.en;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = t.title;
  }, [t.title]);

  const sendEmail = httpsCallable(functions, "sendWelcomeEmail");

  // ===============================
  // 🟢 Email Signup
  // ===============================
  const handleSignup = async () => {
    try {
      setLoading(true);
      setError("");

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      // 🔥 إنشاء document في Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        createdAt: new Date(),
      });

      // 🔥 إرسال الإيميل
      await sendEmail({
        email,
        name,
      });

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // 🔵 Google Signup
  // ===============================
  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName || "Google User",
        email: user.email,
        createdAt: new Date(),
      });

      await sendEmail({
        email: user.email,
        name: user.displayName || "Google User",
      });

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"}>
      <section className="signup-hero">
        <div className="signup-welcome">
          <h1>{t.welcome}</h1>
          <p>
            {t.welcomeText}
          </p>
        </div>
      </section>

      <div className="signup-layout">
        <div className="signup-card">
          <h2>{t.registerWith}</h2>

          <button
            type="button"
            className="signup-google-btn"
            onClick={handleGoogleSignup}
            disabled={loading}
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
            {t.signUpGoogle}
          </button>

          <div className="signup-divider">
            <span>{t.or}</span>
          </div>

          <label>{t.name}</label>
          <input
            type="text"
            placeholder={t.namePlaceholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label>{t.email}</label>
          <input
            type="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label>{t.password}</label>

          <div className="signup-password-field">
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <i
              className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>


          {error && (
            <p style={{ color: "red", fontSize: "13px", marginTop: "10px" }}>
              {error}
            </p>
          )}

          <button
            className="signup-btn"
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? t.creating : t.signUp}
          </button>

          <div className="signup-footer">
            {t.alreadyHaveAccount}{" "}
            <span onClick={() => navigate("/login")}>{t.signIn}</span>
          </div>
        </div>
      </div>
    </div>
  );
}