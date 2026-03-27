import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
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
    plant: "\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0646\u0628\u0627\u062a",
    ai: "\u0627\u0644\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0630\u0643\u064a",
    history: "\u0627\u0644\u0633\u062c\u0644",
    customData: "\u0628\u064a\u0627\u0646\u0627\u062a \u0645\u062e\u0635\u0635\u0629",
    pro: "PRO",
    accountPages: "\u0635\u0641\u062d\u0627\u062a \u0627\u0644\u062d\u0633\u0627\u0628",
    profile: "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a",
    signOut: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c"
  }
};

export default function Sidebar({
  activePage,
  setActivePage,
  onCustomDataClick,
  isSubscribed = false,
  isOpen = false,
  onClose
}) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = text[language] || text.en;
  const activeLogo = language === "ar" ? logoArabic : logo;
  const [customDataHovered, setCustomDataHovered] = useState(false);

  const closeSidebar = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    closeSidebar();
  };

  const handleCustomDataSelect = () => {
    if (typeof onCustomDataClick === "function") {
      onCustomDataClick();
    } else {
      setActivePage("custom-data");
    }

    closeSidebar();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      closeSidebar();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside
      id="dashboard-sidebar"
      className={`sidebar ${isOpen ? "sidebar-open" : ""}`}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div>
        <div className="sidebar-header">
          <button
            type="button"
            className="sidebar-mobile-close"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            X
          </button>
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
            onClick={() => handlePageChange("plant")}
          >
            <div className="menu-icon">
              <img src={activePage === "plant" ? plantIcon : plantIconActive} alt="Plant" />
            </div>
            <span>{t.plant}</span>
          </li>

          <li
            className={activePage === "ai" ? "active-item" : ""}
            onClick={() => handlePageChange("ai")}
          >
            <div className="menu-icon">
              <img src={activePage === "ai" ? aiIcon : aiIconInactive} alt="AI" />
            </div>
            <span>{t.ai}</span>
          </li>

          <li
            className={activePage === "history" ? "active-item" : ""}
            onClick={() => handlePageChange("history")}
          >
            <div className="menu-icon">
              <img src={activePage === "history" ? historyIcon : historyIconInactive} alt="History" />
            </div>
            <span>{t.history}</span>
          </li>

          <li
            className={activePage === "custom-data" ? "active-item" : ""}
            onClick={handleCustomDataSelect}
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
            onClick={() => handlePageChange("profile")}
          >
            <div className="menu-icon">
              <img src={activePage === "profile" ? profileIcon : profileIconInactive} alt="Profile" />
            </div>
            <span>{t.profile}</span>
          </li>
        </ul>
      </div>

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
