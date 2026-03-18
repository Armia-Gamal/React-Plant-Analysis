import { useLanguage } from "../../../context/LanguageContext";
import "./CustomData.css";

const text = {
  en: {
    title: "Custom Data Workspace",
    subtitle: "Upload your own dataset and train a custom plant detection workflow.",
    cardOne: "Dataset Upload",
    cardTwo: "Auto Labeling",
    cardThree: "Training Queue",
    helper: "This area is ready for Roboflow-like extensions and integrations."
  },
  ar: {
    title: "مساحة البيانات المخصصة",
    subtitle: "ارفع بياناتك الخاصة وابدأ تدريب مسار اكتشاف نبات مخصص.",
    cardOne: "رفع البيانات",
    cardTwo: "التوسيم التلقائي",
    cardThree: "قائمة التدريب",
    helper: "هذه المساحة جاهزة لتوسعات وتكاملات مشابهة لمنصات التدريب."
  }
};

export default function CustomData() {
  const { language } = useLanguage();
  const t = text[language] || text.en;

  return (
    <section className="custom-data-page" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="custom-data-header">
        <h2>{t.title}</h2>
        <p>{t.subtitle}</p>
      </header>

      <div className="custom-data-cards">
        <article>{t.cardOne}</article>
        <article>{t.cardTwo}</article>
        <article>{t.cardThree}</article>
      </div>

      <p className="custom-data-helper">{t.helper}</p>
    </section>
  );
}
