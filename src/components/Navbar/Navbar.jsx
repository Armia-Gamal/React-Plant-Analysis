import { useEffect, useRef, useState } from "react";
import "../../index.css";
import "./Navbar.css";
import logo from "../../assets/images/Logo.svg";
import languageIcon from "../../assets/images/language-svgrepo-com.svg";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";

const text = {
  en: {
    home: "Home",
    about: "About",
    features: "Features",
    howItWorks: "How It Works",
    contact: "Contact",
    getStarted: "Get Started",
    langLabel: "Switch language"
  },
  ar: {
    home: "الرئيسية",
    about: "من نحن",
    features: "المميزات",
    howItWorks: "طريقة العمل",
    contact: "تواصل معنا",
    getStarted: "ابدأ الآن",
    langLabel: "تغيير اللغة"
  }
};

export default function Navbar() {

  const navigate = useNavigate();
  const location = useLocation();
  const { language, changeLanguage } = useLanguage();
  const t = text[language] || text.en;
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const languageMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToSection = (id) => {

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="navbar" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="nav-logo">
        <img src={logo} alt="logo" />
      </div>

      <ul className="nav-links">
        <li onClick={() => scrollToSection("home")}>
          <i className="fa-solid fa-house"></i> {t.home}
        </li>

        <li onClick={() => scrollToSection("about")}>
          <i className="fa-solid fa-circle-info"></i> {t.about}
        </li>

        <li onClick={() => scrollToSection("features")}>
          <i className="fa-solid fa-star"></i> {t.features}
        </li>

        <li onClick={() => scrollToSection("how")}>
          <i className="fa-solid fa-gears"></i> {t.howItWorks}
        </li>

        <li onClick={() => scrollToSection("contact")}>
          <i className="fa-solid fa-envelope"></i> {t.contact}
        </li>
      </ul>

      <div className="nav-actions">
        <div className="language-switcher" ref={languageMenuRef}>
          <button
            type="button"
            className="nav-language-btn"
            onClick={() => setShowLanguageMenu((prev) => !prev)}
            aria-label={t.langLabel}
            title={t.langLabel}
          >
            <img src={languageIcon} alt="Language" className="nav-language-icon" />
          </button>

          {showLanguageMenu && (
            <div className="language-dropdown">
              <button
                type="button"
                className={`language-option ${language === "en" ? "active" : ""}`}
                onClick={() => {
                  changeLanguage("en");
                  setShowLanguageMenu(false);
                }}
              >
                <span className="language-option-content">
                  <img
                    src="https://flagcdn.com/16x12/gb.png"
                    srcSet="https://flagcdn.com/32x24/gb.png 2x, https://flagcdn.com/48x36/gb.png 3x"
                    width="16"
                    height="12"
                    alt="United Kingdom"
                    className="language-flag"
                  />
                  <span className="language-flag-emoji" aria-hidden="true">🇬🇧</span>
                  <span>English</span>
                </span>
              </button>

              <button
                type="button"
                className={`language-option ${language === "ar" ? "active" : ""}`}
                onClick={() => {
                  changeLanguage("ar");
                  setShowLanguageMenu(false);
                }}
              >
                <span className="language-option-content">
                  <img
                    src="https://flagcdn.com/16x12/eg.png"
                    srcSet="https://flagcdn.com/32x24/eg.png 2x, https://flagcdn.com/48x36/eg.png 3x"
                    width="16"
                    height="12"
                    alt="Egypt"
                    className="language-flag"
                  />
                  <span className="language-flag-emoji" aria-hidden="true">🇪🇬</span>
                  <span>العربية</span>
                </span>
              </button>
            </div>
          )}
        </div>

        <button
          className="nav-btn"
          onClick={() => navigate("/login")}
        >
          <i className="fa-solid fa-rocket"></i> {t.getStarted}
        </button>
      </div>
    </nav>
  );
}