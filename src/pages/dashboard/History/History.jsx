import { useLanguage } from "../../../context/LanguageContext";
import "./History.css";

const text = {
  en: {
    title: "History",
    subtitle: "Previous analyses will appear here."
  },
  ar: {
    title: "السجل",
    subtitle: "ستظهر التحليلات السابقة هنا."
  }
};

export default function History() {
  const { language } = useLanguage();
  const t = text[language] || text.en;

  return (
    <>
        <div style={{ padding: "166px" }}>
            <h2>{t.title}</h2>
            <p>{t.subtitle}</p>
        </div>
    </>
  );
}
