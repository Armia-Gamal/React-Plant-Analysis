import "./Landing.css";
import { useLanguage } from "../../context/LanguageContext";

const text = {
  en: {
    home: "HOME",
    about: "ABOUT",
    features: "FEATURES",
    how: "HOW IT WORKS",
    contact: "CONTACT"
  },
  ar: {
    home: "الرئيسية",
    about: "من نحن",
    features: "المميزات",
    how: "كيف تعمل المنصة",
    contact: "تواصل معنا"
  }
};

export default function Landing() {
  const { language } = useLanguage();
  const t = text[language] || text.en;

  return (
    <div className="landing" dir={language === "ar" ? "rtl" : "ltr"}>

      <section id="home" className="section home">
        <h1>{t.home}</h1>
      </section>

      <section id="about" className="section about">
        <h1>{t.about}</h1>
      </section>

      <section id="features" className="section features">
        <h1>{t.features}</h1>
      </section>

      <section id="how" className="section how">
        <h1>{t.how}</h1>
      </section>

      <section id="contact" className="section contact">
        <h1>{t.contact}</h1>
      </section>

    </div>
  );
}