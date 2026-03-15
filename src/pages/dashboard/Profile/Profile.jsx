import { useLanguage } from "../../../context/LanguageContext";
import "./Profile.css";

const text = {
  en: {
    title: "Profile Page",
    subtitle: "User profile settings here."
  },
  ar: {
    title: "صفحة الملف الشخصي",
    subtitle: "إعدادات الملف الشخصي للمستخدم هنا."
  }
};

export default function Profile() {
  const { language } = useLanguage();
  const t = text[language] || text.en;

  return (
    <div style={{ padding: "166px" }}>
      <h1>{t.title}</h1>
      <p>{t.subtitle}</p>
    </div>
  );
}
