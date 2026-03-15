import { useState, useEffect } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import "./ResetPassword.css";

const text = {
  en: {
    title: "Reset-Password | Nabta-System",
    emptyEmail: "Please enter your email.",
    resetSent: "Password reset email sent successfully.",
    resetFailed: "Failed to send reset email.",
    heroTitle: "Reset Password",
    heroSubtitle: "Enter your email to receive a reset link.",
    cardTitle: "Forgot your password?",
    email: "Email",
    emailPlaceholder: "Your email address",
    sendLink: "Send Reset Link",
    backToLogin: "Back to login?",
    signIn: "Sign in"
  },
  ar: {
    title: "إعادة تعيين كلمة المرور | Nabta-System",
    emptyEmail: "يرجى إدخال البريد الإلكتروني.",
    resetSent: "تم إرسال رابط إعادة تعيين كلمة المرور بنجاح.",
    resetFailed: "فشل إرسال رابط إعادة التعيين.",
    heroTitle: "إعادة تعيين كلمة المرور",
    heroSubtitle: "أدخل بريدك الإلكتروني لاستلام رابط إعادة التعيين.",
    cardTitle: "هل نسيت كلمة المرور؟",
    email: "البريد الإلكتروني",
    emailPlaceholder: "أدخل بريدك الإلكتروني",
    sendLink: "إرسال رابط إعادة التعيين",
    backToLogin: "العودة لتسجيل الدخول؟",
    signIn: "تسجيل الدخول"
  }
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = text[language] || text.en;

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = t.title;
  }, [t.title]);

  const handleReset = async () => {
    if (!email) {
      setError(t.emptyEmail);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(t.resetSent);
      setError("");
    } catch (err) {
      setError(t.resetFailed);
      setMessage("");
    }
  };

  return (
    <div className="reset-page" dir={language === "ar" ? "rtl" : "ltr"}>
      <section className="Reset-hero">
        <div className="Reset-welcome">
          <h1>{t.heroTitle}</h1>
          <p>{t.heroSubtitle}</p>
        </div>
      </section>

      <div className="Reset-layout">
        <div className="Reset-card">

          <h2>{t.cardTitle}</h2>

          <label>{t.email}</label>
          <input
            type="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && (
            <p style={{ color: "red", fontSize: "13px", marginTop: "10px" }}>
              {error}
            </p>
          )}

          {message && (
            <p style={{ color: "green", fontSize: "13px", marginTop: "10px" }}>
              {message}
            </p>
          )}

          <button
            className="Reset-btn"
            onClick={handleReset}
          >
            {t.sendLink}
          </button>

          <div className="Reset-footer">
            {t.backToLogin}{" "}
            <span onClick={() => navigate("/login")}>{t.signIn}</span>
          </div>

        </div>
      </div>
    </div>
  );
}
