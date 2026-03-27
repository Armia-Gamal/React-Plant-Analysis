import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../index.css";
import "./Navbar.css";
import logo from "../../assets/images/Logo.svg";
import arabicLogo from "../../assets/images/lllls.png";
import languageIcon from "../../assets/images/language-svgrepo-com.svg";
import { useLanguage } from "../../context/LanguageContext";

const text = {
  en: {
    home: "Home",
    about: "About",
    features: "Features",
    howItWorks: "How It Works",
    contact: "Contact",
    getStarted: "Get Started",
    langLabel: "Switch language",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu"
  },
  ar: {
    home: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    about: "\u0645\u0646 \u0646\u062D\u0646",
    features: "\u0627\u0644\u0645\u0645\u064A\u0632\u0627\u062A",
    howItWorks: "\u0637\u0631\u064A\u0642\u0629 \u0627\u0644\u0639\u0645\u0644",
    contact: "\u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627",
    getStarted: "\u0627\u0628\u062F\u0623 \u0627\u0644\u0622\u0646",
    langLabel: "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0644\u063A\u0629",
    openMenu: "\u0641\u062A\u062D \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062A\u0646\u0642\u0644",
    closeMenu: "\u0625\u063A\u0644\u0627\u0642 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062A\u0646\u0642\u0644"
  }
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, changeLanguage } = useLanguage();
  const t = text[language] || text.en;

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeLanguageMenu, setActiveLanguageMenu] = useState(null);

  const navbarRef = useRef(null);
  const pendingSectionRef = useRef(null);
  const desktopLanguageMenuRef = useRef(null);
  const mobileLanguageMenuRef = useRef(null);

  const navItems = [
    { sectionId: "home", label: t.home, icon: "fa-solid fa-house" },
    { sectionId: "about", label: t.about, icon: "fa-solid fa-circle-info" },
    { sectionId: "features", label: t.features, icon: "fa-solid fa-star" },
    { sectionId: "how", label: t.howItWorks, icon: "fa-solid fa-gears" },
    { sectionId: "contact", label: t.contact, icon: "fa-solid fa-envelope" }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideNavbar = navbarRef.current?.contains(event.target);
      const clickedInsideDesktopLanguage = desktopLanguageMenuRef.current?.contains(event.target);
      const clickedInsideMobileLanguage = mobileLanguageMenuRef.current?.contains(event.target);

      if (!clickedInsideNavbar) {
        setShowMobileMenu(false);
      }

      if (!clickedInsideDesktopLanguage && !clickedInsideMobileLanguage) {
        setActiveLanguageMenu(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowMobileMenu(false);
        setActiveLanguageMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/" && pendingSectionRef.current) {
      const sectionId = pendingSectionRef.current;
      const timeoutId = window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
        pendingSectionRef.current = null;
      }, 120);

      return () => window.clearTimeout(timeoutId);
    }
  }, [location.pathname]);

  const closeAllMenus = () => {
    setShowMobileMenu(false);
    setActiveLanguageMenu(null);
  };

  const handleSectionNavigation = (sectionId) => {
    closeAllMenus();

    if (location.pathname !== "/") {
      pendingSectionRef.current = sectionId;
      navigate("/");
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLoginNavigation = () => {
    closeAllMenus();
    navigate("/login");
  };

  const toggleLanguageMenu = (variant) => {
    setActiveLanguageMenu((currentVariant) => (
      currentVariant === variant ? null : variant
    ));
  };

  const handleLanguageChange = (nextLanguage) => {
    changeLanguage(nextLanguage);
    closeAllMenus();
  };

  const renderLanguageSwitcher = (variant) => {
    const isOpen = activeLanguageMenu === variant;
    const languageMenuRef = variant === "desktop"
      ? desktopLanguageMenuRef
      : mobileLanguageMenuRef;

    return (
      <div
        className={`language-switcher ${variant === "mobile" ? "mobile-language-switcher" : ""}`}
        ref={languageMenuRef}
      >
        <button
          type="button"
          className="nav-language-btn"
          onClick={() => toggleLanguageMenu(variant)}
          aria-label={t.langLabel}
          aria-expanded={isOpen}
          title={t.langLabel}
        >
          <img src={languageIcon} alt="Language" className="nav-language-icon" />
        </button>

        {isOpen && (
          <div className={`language-dropdown ${variant === "mobile" ? "mobile-language-dropdown" : ""}`}>
            <button
              type="button"
              className={`language-option ${language === "en" ? "active" : ""}`}
              onClick={() => handleLanguageChange("en")}
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
                <span className="language-flag-emoji" aria-hidden="true">
                  {"\uD83C\uDDEC\uD83C\uDDE7"}
                </span>
                <span>English</span>
              </span>
            </button>

            <button
              type="button"
              className={`language-option ${language === "ar" ? "active" : ""}`}
              onClick={() => handleLanguageChange("ar")}
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
                <span className="language-flag-emoji" aria-hidden="true">
                  {"\uD83C\uDDEA\uD83C\uDDEC"}
                </span>
                <span>{"\u0627\u0644\u0639\u0631\u0628\u064A\u0629"}</span>
              </span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="navbar" dir={language === "ar" ? "rtl" : "ltr"} ref={navbarRef}>
      <div className="nav-logo">
        <img src={language === "ar" ? arabicLogo : logo} alt="logo" />
      </div>

      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.sectionId} onClick={() => handleSectionNavigation(item.sectionId)}>
            <i className={item.icon}></i> {item.label}
          </li>
        ))}
      </ul>

      <div className="nav-actions desktop-nav-actions">
        {renderLanguageSwitcher("desktop")}

        <button className="nav-btn" onClick={handleLoginNavigation}>
          <i className="fa-solid fa-rocket"></i> {t.getStarted}
        </button>
      </div>

      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => {
          setShowMobileMenu((prev) => !prev);
          setActiveLanguageMenu(null);
        }}
        aria-label={showMobileMenu ? t.closeMenu : t.openMenu}
        aria-expanded={showMobileMenu}
        aria-controls="mobile-navigation-menu"
      >
        {showMobileMenu ? "\u2715" : "\u2630"}
      </button>

      <div
        id="mobile-navigation-menu"
        className={`mobile-menu ${showMobileMenu ? "open" : ""}`}
      >
        <div className="mobile-menu-inner">
          <div className="mobile-nav-list">
            {navItems.map((item) => (
              <button
                key={item.sectionId}
                type="button"
                className="mobile-nav-item"
                onClick={() => handleSectionNavigation(item.sectionId)}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="mobile-menu-divider"></div>

          <div className="mobile-menu-footer">
            <div className="mobile-language-group">
              <span className="mobile-menu-label">{t.langLabel}</span>
              {renderLanguageSwitcher("mobile")}
            </div>

            <button className="nav-btn mobile-nav-btn" onClick={handleLoginNavigation}>
              <i className="fa-solid fa-rocket"></i> {t.getStarted}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
