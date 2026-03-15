import { useState, useEffect, useRef } from "react";
import Sidebar from "../Sidebar/Sidebar";
import PlantAnalysis from "../../pages/dashboard/PlantAnalysis/PlantAnalysis";
import AIAssistant from "../../pages/dashboard/AIAssistant/AIAssistant";
import History from "../../pages/dashboard/History/History";
import Profile from "../../pages/dashboard/Profile/Profile";
import { useLanguage } from "../../context/LanguageContext";
import languageIcon from "../../assets/images/language-svgrepo-com.svg";
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
    arabic: "Arabic"
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
    arabic: "العربية"
  }
};

export default function Dashboard() {
  const { language, changeLanguage } = useLanguage();
  const t = text[language] || text.en;
  const languageMenuRef = useRef(null);

  const [activePage, setActivePage] = useState("plant");

  // 0 Upload
  // 1 Detect
  // 2 Segment
  // 3 Classify
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pendingReport, setPendingReport] = useState(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [newChatTrigger, setNewChatTrigger] = useState(0);

  useEffect(() => {
    document.title = `${t.dashboard} | Nabta-System`;
  }, [t.dashboard]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSendReport = (prompt, isHidden = false) => {
    setPendingReport({ prompt, isHidden });
    setActivePage("ai");
  };

  const handleNewChat = () => {
    setNewChatTrigger(prev => prev + 1);
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

              <div className="nav-icon" onClick={handleNewChat} title={t.newChat}>
                +
              </div>

            </div>
          )}

        <div className="navbar-right">
          <div className="search-box">
            <input type="text" placeholder={t.searchPlaceholder} />
          </div>
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
        </div>
        </nav>

        {renderContent()}
      </div>
    </div>
  );
}