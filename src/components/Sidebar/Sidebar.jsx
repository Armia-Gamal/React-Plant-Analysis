import { useNavigate } from "react-router-dom";
import "./Sidebar.css";
import logo from "../../assets/images/Logo.svg";
import logoArabic from "../../assets/images/lllls.png";
import plantIcon from "../../assets/images/plant-icon.png";
import plantIconActive from "../../assets/images/plant-icon-active.png";
import aiIconInactive from "../../assets/images/hubot-svgrepo-com.svg";
import aiIcon from "../../assets/images/hubot-svgrepo-com (3).svg";
import historyIconInactive from "../../assets/images/history-svgrepo-com.svg";
import historyIcon from "../../assets/images/history-svgrepo-com (2).svg";
import puzzlePiece from "../../assets/images/puzzle-piece-svgrepo-com.svg";
import puzzlePieceHover from "../../assets/images/puzzle-piece-svgrepo-com.svg";
import profileIconInactive from "../../assets/images/profile-svgrepo-com.svg";
import profileIcon from "../../assets/images/profile-svgrepo-com (1).svg";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useLanguage } from "../../context/LanguageContext";

const text = {
  en: {
    plant: "Plant Analysis",
    ai: "AI Assistant",
    history: "History",
    customData: "Custom Data",
    pro: "PRO",
    accountPages: "ACCOUNT PAGES",
    profile: "Profile",
    signOut: "Sign Out"
  },
  ar: {
    plant: "تحليل النبات",
    ai: "المساعد الذكي",
    history: "السجل",
    customData: "بيانات مخصصة",
    pro: "pro",
    accountPages: "صفحات الحساب",
    profile: "الملف الشخصي",
    signOut: "تسجيل الخروج"
  }
};


import { useState } from "react";

export default function Sidebar({ activePage, setActivePage, onCustomDataClick, isSubscribed = false }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = text[language] || text.en;
  const activeLogo = language === "ar" ? logoArabic : logo;
  const [customDataHovered, setCustomDataHovered] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="sidebar" dir={language === "ar" ? "rtl" : "ltr"}>

      <div>
        <div className="sidebar-header">
          <img
            src={activeLogo}
            alt="Nabta Logo"
            className={language === "ar" ? "sidebar-logo-ar" : ""}
          />
        </div>

        <hr />

        <ul className="menu">
          <li
            className={activePage === "plant" ? "active-item" : ""}
            onClick={() => setActivePage("plant")}
          >
            <div className="menu-icon">
              <img src={activePage === "plant" ? plantIcon : plantIconActive} alt="Plant" />
            </div>
            <span>{t.plant}</span>
          </li>

          <li
            className={activePage === "ai" ? "active-item" : ""}
            onClick={() => setActivePage("ai")}
          >
            <div className="menu-icon">
              <img src={activePage === "ai" ? aiIcon : aiIconInactive} alt="AI" />
            </div>
            <span>{t.ai}</span>
          </li>

          <li
            className={activePage === "history" ? "active-item" : ""}
            onClick={() => setActivePage("history")}
          >
            <div className="menu-icon">
              <img src={activePage === "history" ? historyIcon : historyIconInactive} alt="History" />
            </div>
            <span>{t.history}</span>
          </li>

          <li
            className={activePage === "custom-data" ? "active-item" : ""}
            onClick={() => {
              if (typeof onCustomDataClick === "function") {
                onCustomDataClick();
                return;
              }
              setActivePage("custom-data");
            }}
            onMouseEnter={() => setCustomDataHovered(true)}
            onMouseLeave={() => setCustomDataHovered(false)}
          >
            <div className="menu-icon">
              <img
                src={customDataHovered ? puzzlePieceHover : puzzlePiece}
                alt="Custom Data"
                style={{ width: 22, height: 22, display: "block" }}
              />
            </div>
            <span>{t.customData}</span>
            {!isSubscribed ? <span className="pro-pill">{t.pro}</span> : null}
          </li>
        </ul>

        <hr className="sidebar-hr-bottom" />

        <p className="section-label">{t.accountPages}</p>

        <ul className="menu">
          <li
            className={activePage === "profile" ? "active-item" : ""}
            onClick={() => setActivePage("profile")}
          >
            <div className="menu-icon">
              <img src={activePage === "profile" ? profileIcon : profileIconInactive} alt="Profile" />
            </div>
            <span>{t.profile}</span>
          </li>
        </ul>
      </div>

      {/* ===== Sign Out Bottom ===== */}
      <div className="sidebar-footer" onClick={handleLogout}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>{t.signOut}</span>
      </div>

    </aside>
  );
}
