import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import Sidebar from "../Sidebar/Sidebar";
import PlantAnalysis from "../../pages/dashboard/PlantAnalysis/PlantAnalysis";
import AIAssistant from "../../pages/dashboard/AIAssistant/AIAssistant";
import History from "../../pages/dashboard/History/History";
import Profile from "../../pages/dashboard/Profile/Profile";
import { auth, db } from "../../firebase";
import { useLanguage } from "../../context/LanguageContext";
import languageIcon from "../../assets/images/language-svgrepo-com.svg";
import defaultAvatar from "../../assets/images/profile-svgrepo-com.svg";
import "./Dashboard.css";

const text = {
  en: {
    dashboard: "Dashboard",
    plant: "Plant Analysis",
    ai: "AI Assistant",
    history: "History",
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
    unknownUser: "User"
  },
  ar: {
    dashboard: "لوحة التحكم",
    plant: "تحليل النبات",
    ai: "المساعد الذكي",
    history: "السجل",
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
  const searchBoxRef = useRef(null);
  const searchInputRef = useRef(null);

  const [activePage, setActivePage] = useState("plant");

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
      </>
    );
  };

  const isDone = (index) => step > index;
  const isActive = (index) => step === index;
  const displayName = userProfile.name || authUser?.displayName || t.unknownUser;
  const displayRole = userProfile.role || t.role;
  const displayAvatar = userProfile.photoURL || authUser?.photoURL || defaultAvatar;

  return (
    <div className="dashboard-layout" dir={language === "ar" ? "rtl" : "ltr"}>

      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <div className="main-content">

        <nav className="navbar-dash">

          <div className="navbar-left">
            <span className="breadcrumb">
              {t.dashboard} /
              <span className="breadcrumb-active">
                {activePage === "plant" && ` ${t.plant}`}
                {activePage === "ai" && ` ${t.ai}`}
                {activePage === "history" && ` ${t.history}`}
                {activePage === "profile" && ` ${t.profile}`}
              </span>
            </span>
          </div>

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

              <button type="button" className="new-chat-cta" onClick={handleNewChat} title={t.newChat}>
                <span className="new-chat-plus">+</span>
                <span>{t.newChat}</span>
              </button>

            </div>
          )}

        <div className="navbar-right">
          {activePage === "ai" && (
            <div className="ai-search-wrap" ref={searchBoxRef}>
              <button
                type="button"
                className="nav-icon nav-icon-button"
                onClick={() => setShowSearchBox((prev) => !prev)}
                title={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
              >
                <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M11 4a7 7 0 1 1 0 14a7 7 0 0 1 0-14Zm0-2a9 9 0 1 0 5.65 16l4.17 4.18l1.42-1.42L18.07 16A9 9 0 0 0 11 2Z" />
                </svg>
              </button>

              {showSearchBox && (
                <div className="search-box search-box--dropdown">
                  <div className="search-input-row">
                    <input
                      ref={searchInputRef}
                      autoFocus
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        onClick={() => {
                          setSearchQuery("");
                          searchInputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                        title="Clear search"
                      >
                        x
                      </button>
                    )}
                  </div>
                  {searchQuery.trim() && searchMatchStats.total > 1 && (
                    <div className="search-nav-row">
                      <span className="search-nav-count">
                        {searchMatchStats.current}/{searchMatchStats.total}
                      </span>
                      <button
                        type="button"
                        className="search-nav-btn"
                        onClick={() => handleSearchJump("prev")}
                        aria-label="Previous result"
                        title="Previous result"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="search-nav-btn"
                        onClick={() => handleSearchJump("next")}
                        aria-label="Next result"
                        title="Next result"
                      >
                        ↓
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
        </div>
        </nav>

        {renderContent()}
      </div>
    </div>
  );
}