import "../../index.css";
import "./Footer.css";
import { useLanguage } from "../../context/LanguageContext";

const text = {
  en: {
    copyright: "© 2026, Made with team seniors Dr. Mourad",
    creativeTim: "Creative Tim",
    simplimple: "Simplimple",
    blog: "Blog",
    license: "License"
  },
  ar: {
    copyright: "© 2026، تم التطوير بواسطة فريق السنيرز د. مراد",
    creativeTim: "كرييتف تيم",
    simplimple: "سيمبل",
    blog: "المدونة",
    license: "الترخيص"
  }
};

export default function Footer() {
  const { language } = useLanguage();
  const t = text[language] || text.en;

  return (
    <footer className="footer" dir={language === "ar" ? "rtl" : "ltr"}>
      <p>{t.copyright}</p>
      <ul>
        <li>{t.creativeTim}</li>
        <li>{t.simplimple}</li>
        <li>{t.blog}</li>
        <li>{t.license}</li>
      </ul>
    </footer>
  );
}
