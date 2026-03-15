import "./LandingFooter.css";
import { useLanguage } from "../../context/LanguageContext";

const text = {
  en: {
    copyright: "© 2026 PlantCare AI. All rights reserved.",
    privacy: "Privacy",
    terms: "Terms",
    support: "Support"
  },
  ar: {
    copyright: "© 2026 بلانت كير للذكاء الاصطناعي. جميع الحقوق محفوظة.",
    privacy: "الخصوصية",
    terms: "الشروط",
    support: "الدعم"
  }
};

export default function LandingFooter() {
  const { language } = useLanguage();
  const t = text[language] || text.en;

  return (
    <footer className="landing-footer" dir={language === "ar" ? "rtl" : "ltr"}>
      <p>{t.copyright}</p>
      <div className="landing-footer-links">
        <span>{t.privacy}</span>
        <span>{t.terms}</span>
        <span>{t.support}</span>
      </div>
    </footer>
  );
}