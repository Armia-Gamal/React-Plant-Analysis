import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Sidebar from "../Sidebar/Sidebar";
import PlantAnalysis from "../../pages/dashboard/PlantAnalysis/PlantAnalysis";
import AIAssistant from "../../pages/dashboard/AIAssistant/AIAssistant";
import History from "../../pages/dashboard/History/History";
import Profile from "../../pages/dashboard/Profile/Profile";
import CustomData from "../../pages/dashboard/CustomData/CustomData";
import { auth, db } from "../../firebase";
import { useLanguage } from "../../context/LanguageContext";
import CustomDataButton from "../Premium/CustomDataButton";
import PricingModal from "../Premium/PricingModal";
import languageIcon from "../../assets/images/language-svgrepo-com.svg";
import defaultAvatar from "../../assets/images/profile-svgrepo-com.svg";
import "./Dashboard.css";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 17H5l1.4-1.4A2 2 0 0 0 7 14.2V10a5 5 0 1 1 10 0v4.2a2 2 0 0 0 .6 1.4L19 17h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 20a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2.2M12 19.8V22M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2.2M19.8 12H22M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const text = {
  en: {
    dashboard: "Dashboard",
    plant: "Plant Analysis",
    ai: "AI Assistant",
    history: "History",
    customData: "Custom Data",
    profile: "Profile",
    upload: "Upload",
    detect: "Detect",
    segment: "Segment",
    classify: "Classify",
    aiTitle: "Nabta AI Assistant 🌿",
    newChat: "Start new chat",
    searchPlaceholder: "Type here...",
    english: "English",
    arabic: "Arabic",
    role: "User",
    unknownUser: "User",
    languageLabel: "Language",
    notifications: "Notifications",
    theme: "Theme",
    on: "On",
    off: "Off",
    light: "Light",
    dark: "Dark",
    profileMenu: "Open profile menu"
  },
  ar: {
    dashboard: "لوحة التحكم",
    plant: "تحليل النبات",
    ai: "المساعد الذكي",
    history: "السجل",
    customData: "بيانات مخصصة",
    profile: "الملف الشخصي",
    upload: "رفع",
    detect: "اكتشاف",
    segment: "تقسيم",
    classify: "تصنيف",
    aiTitle: "مساعد نبتة الذكي 🌿",
    newChat: "محادثة جديدة",
    searchPlaceholder: "اكتب هنا...",
    english: "الإنجليزية",
    arabic: "العربية",
    role: "المستخدم",
    unknownUser: "المستخدم"
  }
};

export default function Dashboard() {
  const { language, changeLanguage } = useLanguage();
  const t = text[language] || text.en;
  const languageMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const searchBoxRef = useRef(null);
  const searchInputRef = useRef(null);

  const [activePage, setActivePage] = useState("plant");
  const [isSubscribed, setIsSubscribed] = useState(() => localStorage.getItem("nabta_pro_subscription") === "true");
  const [showPricingModal, setShowPricingModal] = useState(false);

  // 0 Upload
  // 1 Detect
  // 2 Segment
  // 3 Classify
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pendingReport, setPendingReport] = useState(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchStats, setSearchMatchStats] = useState({ current: 0, total: 0 });
  const [searchJumpRequest, setSearchJumpRequest] = useState({ direction: "next", token: 0 });
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isThemeDark, setIsThemeDark] = useState(() => localStorage.getItem("nabta_dashboard_theme") === "dark");
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: "",
    photoURL: "",
    role: ""
  });

  useEffect(() => {
    document.title = `${t.dashboard} | Nabta-System`;
  }, [t.dashboard]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }

      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowSearchBox(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activePage !== "ai") {
      setShowSearchBox(false);
      setSearchQuery("");
      setSearchMatchStats({ current: 0, total: 0 });
    }
  }, [activePage]);

  useEffect(() => {
    setIsSidebarOpen(false);
    setShowProfileMenu(false);
  }, [activePage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 901px)");
    const handleViewportChange = (event) => {
      if (event.matches) {
        setIsSidebarOpen(false);
        setShowProfileMenu(false);
      }
    };

    handleViewportChange(mediaQuery);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleViewportChange);
      return () => mediaQuery.removeEventListener("change", handleViewportChange);
    }

    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    document.body.classList.toggle("sidebar-mobile-open", isSidebarOpen);

    if (!isSidebarOpen) {
      return () => document.body.classList.remove("sidebar-mobile-open");
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("sidebar-mobile-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return undefined;
    }

    document.body.classList.toggle("dashboard-theme-dark", isThemeDark);
    localStorage.setItem("nabta_dashboard_theme", isThemeDark ? "dark" : "light");

    return () => {
      document.body.classList.remove("dashboard-theme-dark");
    };
  }, [isThemeDark]);

  useEffect(() => {
    let unsubscribeUserDoc = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      unsubscribeUserDoc();

      if (!user) {
        setUserProfile({ name: "", photoURL: "", role: "" });
        return;
      }

      const userRef = doc(db, "users", user.uid);
      unsubscribeUserDoc = onSnapshot(userRef, (snap) => {
        const data = snap.exists() ? snap.data() : {};
        setUserProfile({
          name: data.name || "",
          photoURL: data.photoURL || "",
          role: data.role || ""
        });
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUserDoc();
    };
  }, []);

  const handleSendReport = (prompt, isHidden = false) => {
    setPendingReport({ prompt, isHidden });
    setActivePage("ai");
  };

  const handleNewChat = () => {
    setNewChatTrigger(prev => prev + 1);
  };

  const handleSearchJump = (direction) => {
    setSearchJumpRequest((prev) => ({
      direction,
      token: prev.token + 1
    }));
  };

  const handleCustomDataAccess = () => {
    if (isSubscribed) {
      setActivePage("custom-data");
      return;
    }

    setShowPricingModal(true);
  };

  const handleUpgradeToPro = () => {
    setIsSubscribed(true);
    localStorage.setItem("nabta_pro_subscription", "true");
    setShowPricingModal(false);
    setActivePage("custom-data");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleProfileMenuToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth > 768) {
      return;
    }

    setShowProfileMenu((prev) => !prev);
  };

  const handleThemeToggle = () => {
    setIsThemeDark((prev) => !prev);
  };

  // render all pages but hide the inactive ones; this preserves state such as images
  const renderContent = () => {
    return (
      <>
        <div className={activePage === "plant" ? "" : "hidden"}>
          <PlantAnalysis
            setStep={setStep}
            setProgressValue={setProgress}
            onSendReport={handleSendReport}
          />
        </div>
        <div className={activePage === "ai" ? "" : "hidden"}>
          <AIAssistant 
            pendingReport={pendingReport}
            onReportProcessed={() => setPendingReport(null)}
            newChatTrigger={newChatTrigger}
            searchQuery={searchQuery}
            searchJumpRequest={searchJumpRequest}
            onSearchMatchStatsChange={setSearchMatchStats}
          />
        </div>
        <div className={activePage === "history" ? "" : "hidden"}>
          <History />
        </div>
        <div className={activePage === "profile" ? "" : "hidden"}>
          <Profile />
        </div>
        <div className={activePage === "custom-data" ? "" : "hidden"}>
          <CustomData />
        </div>
      </>
    );
  };

  const isDone = (index) => step > index;
  const isActive = (index) => step === index;
  const displayName = userProfile.name || authUser?.displayName || t.unknownUser;
  const displayRole = userProfile.role || t.role;
  const displayAvatar = userProfile.photoURL || authUser?.photoURL || defaultAvatar;
  const currentPageTitle =
    activePage === "plant" ? t.plant
      : activePage === "ai" ? t.ai
        : activePage === "history" ? t.history
          : activePage === "profile" ? t.profile
            : activePage === "custom-data" ? t.customData
              : t.dashboard;
  const progressLabels = [t.upload, t.detect, t.segment, t.classify];
  const getConnectorProgress = (index) => {
    if (index === 0) {
      if (step === 0) {
        return progress;
      }

      return step > 0 ? 100 : 0;
    }

    return step > index ? 100 : 0;
  };

  return (
    <div
      className={`dashboard-layout ${activePage === "plant" ? "dashboard-layout--plant-active" : ""} ${isThemeDark ? "dashboard-layout--theme-dark" : ""}`}
      dir={language === "ar" ? "rtl" : "ltr"}
    >

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isSubscribed={isSubscribed}
        onCustomDataClick={handleCustomDataAccess}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div
        className={`dashboard-sidebar-overlay ${isSidebarOpen ? "is-visible" : ""}`}
        aria-hidden={!isSidebarOpen}
        onClick={closeSidebar}
      />

      <div className="main-content">

        <nav className="navbar-dash">
          <div className="navbar-primary-row">

          <div className="navbar-left">
            <button
              type="button"
              className="mobile-sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              aria-expanded={isSidebarOpen}
              aria-controls="dashboard-sidebar"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <span className="breadcrumb">
              {t.dashboard} /
              <span className="breadcrumb-active">
                {activePage === "plant" && ` ${t.plant}`}
                {activePage === "ai" && ` ${t.ai}`}
                {activePage === "history" && ` ${t.history}`}
                {activePage === "profile" && ` ${t.profile}`}
                {activePage === "custom-data" && ` ${t.customData}`}
              </span>
            </span>
          </div>

          <h2 className="mobile-page-title">{currentPageTitle}</h2>

          {activePage === "plant" && (
            <div className="navbar-center">

              <div className="progress-steps">
                <span>{t.upload}</span>
                <span>→</span>
                <span>{t.detect}</span>
                <span>→</span>
                <span>{t.segment}</span>
                <span>→</span>
                <span>{t.classify}</span>
              </div>

              <div className="progress-dots">

                {/* Upload */}
                <span className={`dot ${isDone(0) ? "dot-done" : isActive(0) ? "dot-active" : "dot-gray"}`}>
                  {isDone(0) && "✓"}
                </span>

                {/* Upload → Detect (progressive line) */}
                <div className="dot-line">
                  <div
                    className="dot-line-fill"
                    style={{
                      width: `${step === 0 ? progress : step > 0 ? 100 : 0}%`
                    }}
                  ></div>
                </div>

                {/* Detect */}
                <span className={`dot ${isDone(1) ? "dot-done" : isActive(1) ? "dot-active" : "dot-gray"}`}>
                  {isDone(1) && "✓"}
                </span>

                <div className={`dot-line ${step > 1 ? "dot-line-active" : ""}`}></div>

                {/* Segment */}
                <span className={`dot ${isDone(2) ? "dot-done" : isActive(2) ? "dot-active" : "dot-gray"}`}>
                  {isDone(2) && "✓"}
                </span>

                <div className={`dot-line ${step > 2 ? "dot-line-active" : ""}`}></div>

                {/* Classify */}
                <span className={`dot ${isDone(3) ? "dot-done" : isActive(3) ? "dot-active" : "dot-gray"}`}>
                  {isDone(3) && "✓"}
                </span>

              </div>

            </div>
          )}

          {activePage === "ai" && (
            <div className="navbar-center chat-header-navbar">
              <h3>{t.aiTitle}</h3>
            </div>
          )}

        <div className="navbar-right">
          {/* ...existing code... */}
          <div className="language-switcher" ref={languageMenuRef}>
            <button
              type="button"
              className="nav-icon nav-icon-button"
              onClick={() => setShowLanguageMenu((prev) => !prev)}
              title={language === "ar" ? t.arabic : t.english}
            >
              <img src={languageIcon} alt="Language" className="language-icon" />
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
          <div className="nav-icon">🔔</div>
          <div className="nav-icon">☀</div>
          <div className="topbar-divider"></div>
          <div className="topbar-user">
            <img
              src={displayAvatar}
              className="topbar-avatar"
              alt="User avatar"
            />

            <div className="topbar-user-info">
              <span className="topbar-name">{displayName}</span>
              <span className="topbar-role">{displayRole}</span>
            </div>
          </div>

          <div className="mobile-profile-menu-wrap" ref={profileMenuRef}>
            <button
              type="button"
              className="mobile-profile-trigger"
              onClick={handleProfileMenuToggle}
              aria-label={t.profileMenu || "Open profile menu"}
              aria-expanded={showProfileMenu}
            >
              <img
                src={displayAvatar}
                className="topbar-avatar"
                alt="User avatar"
              />
            </button>

            <div className={`mobile-profile-menu ${showProfileMenu ? "is-open" : ""}`}>
              <div className="mobile-profile-menu__header">
                <img src={displayAvatar} className="mobile-profile-menu__avatar" alt={displayName} />
                <div className="mobile-profile-menu__copy">
                  <strong>{displayName}</strong>
                  <span>{displayRole}</span>
                </div>
              </div>

              <div className="mobile-profile-menu__row">
                <span className="mobile-profile-menu__label">
                  <img src={languageIcon} alt="" className="mobile-profile-menu__icon-image" />
                  <span>{t.languageLabel || "Language"}</span>
                </span>
                <div className="mobile-profile-menu__segment">
                  <button
                    type="button"
                    className={language === "en" ? "is-active" : ""}
                    onClick={() => {
                      changeLanguage("en");
                      setShowProfileMenu(false);
                    }}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    className={language === "ar" ? "is-active" : ""}
                    onClick={() => {
                      changeLanguage("ar");
                      setShowProfileMenu(false);
                    }}
                  >
                    AR
                  </button>
                </div>
              </div>

              <button
                type="button"
                className={`mobile-profile-menu__row mobile-profile-menu__action ${notificationsEnabled ? "is-active" : ""}`}
                onClick={() => setNotificationsEnabled((prev) => !prev)}
              >
                <span className="mobile-profile-menu__label">
                  <BellIcon />
                  <span>{t.notifications || "Notifications"}</span>
                </span>
                <span className="mobile-profile-menu__state">
                  {notificationsEnabled ? (t.on || "On") : (t.off || "Off")}
                </span>
              </button>

              <button
                type="button"
                className={`mobile-profile-menu__row mobile-profile-menu__action ${isThemeDark ? "is-active" : ""}`}
                onClick={handleThemeToggle}
              >
                <span className="mobile-profile-menu__label">
                  {isThemeDark ? <MoonIcon /> : <SunIcon />}
                  <span>{t.theme || "Theme"}</span>
                </span>
                <span className="mobile-profile-menu__state">
                  {isThemeDark ? (t.dark || "Dark") : (t.light || "Light")}
                </span>
              </button>
            </div>
          </div>
        </div>
          </div>

          {activePage === "plant" && (
            <div className="navbar-mobile-progress" aria-label="Plant analysis progress">
              <div className="navbar-mobile-progress-track">
                {progressLabels.map((label, index) => {
                  const connectorProgress = index < progressLabels.length - 1
                    ? getConnectorProgress(index)
                    : 0;
                  const statusClass = isDone(index)
                    ? "is-completed"
                    : isActive(index)
                      ? "is-current"
                      : "";

                  return (
                    <div key={label} className={`mobile-progress-step ${statusClass}`}>
                      <div className="mobile-progress-marker">
                        <span className="mobile-progress-circle">{index + 1}</span>
                        {index < progressLabels.length - 1 && (
                          <span className="mobile-progress-line" aria-hidden="true">
                            <span style={{ width: `${connectorProgress}%` }}></span>
                          </span>
                        )}
                      </div>
                      <span className="mobile-progress-label">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {renderContent()}
      </div>

      <PricingModal
        isOpen={showPricingModal}
        language={language}
        onClose={() => setShowPricingModal(false)}
        onUpgrade={handleUpgradeToPro}
      />
    </div>
  );
}
