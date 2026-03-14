import { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import PlantAnalysis from "../../pages/dashboard/PlantAnalysis/PlantAnalysis";
import AIAssistant from "../../pages/dashboard/AIAssistant/AIAssistant";
import History from "../../pages/dashboard/History/History";
import Profile from "../../pages/dashboard/Profile/Profile";
import "./Dashboard.css";

export default function Dashboard() {

  const [activePage, setActivePage] = useState("plant");

  // 0 Upload
  // 1 Detect
  // 2 Segment
  // 3 Classify
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pendingReport, setPendingReport] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [newChatTrigger, setNewChatTrigger] = useState(0);

  useEffect(() => {
    document.title = "Dashboard | Nabta-System";
  }, []);

  const handleSendReport = (prompt, isHidden = false) => {
    setPendingReport({ prompt, isHidden });
    setActivePage("ai");
  };

  const handleNewChat = () => {
    setNewChatTrigger(prev => prev + 1);
    setShowChatMenu(false);
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
    <div className="dashboard-layout">

      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <div className="main-content">

        <nav className="navbar-dash">

          <div className="navbar-left">
            <span className="breadcrumb">
              Dashboard /
              <span className="breadcrumb-active">
                {activePage === "plant" && " Plant Analysis"}
                {activePage === "ai" && " AI Assistant"}
                {activePage === "history" && " History"}
                {activePage === "profile" && " Profile"}
              </span>
            </span>
          </div>

          {activePage === "plant" && (
            <div className="navbar-center">

              <div className="progress-steps">
                <span>Upload</span>
                <span>→</span>
                <span>Detect</span>
                <span>→</span>
                <span>Segment</span>
                <span>→</span>
                <span>Classify</span>
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
              <h3>Nabta AI Assistant 🌿</h3>

              <div className="nav-icon" onClick={handleNewChat} title="Start new chat">
                +
              </div>

            </div>
          )}

        <div className="navbar-right">
          <div className="search-box">
            <input type="text" placeholder="Type here..." />
          </div>
          <div className="nav-icon">⚙</div>
          <div className="nav-icon">🔔</div>
          <div className="nav-icon">☀</div>
        </div>
        </nav>

        {renderContent()}
      </div>
    </div>
  );
}