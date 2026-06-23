import "./LandingFooter.css";
import { useLanguage } from "../../context/LanguageContext";

const text = {
  en: { copyright: "© 2026 NABTA. Built with care in Egypt.", about: "About", features: "Features", contact: "Contact" },
  ar: { copyright: "© 2026 نبتة. صُممت بعناية في مصر.", about: "من نحن", features: "المميزات", contact: "تواصل معنا" }
};

export default function LandingFooter() {
  const { language } = useLanguage();
  const t = text[language] || text.en;
  const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return <footer className="landing-footer" dir={language === "ar" ? "rtl" : "ltr"}>
    <div className="footer-brand"><span className="footer-mark">N</span><p>{t.copyright}</p></div>
    <div className="landing-footer-links"><button onClick={() => goTo("about")}>{t.about}</button><button onClick={() => goTo("features")}>{t.features}</button><button onClick={() => goTo("contact")}>{t.contact}</button></div>
  </footer>;
}
