import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import PlantAnalysis from "./dashboard/PlantAnalysis";
import AIAssistant from "./dashboard/AIAssistant";
import History from "./dashboard/History";
import Profile from "./dashboard/Profile";
import "./Dashboard.css";

export default function Dashboard() {

  const [activePage, setActivePage] = useState("plant");

  // 0 Upload
  // 1 Detect
  // 2 Segment
  // 3 Classify
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    document.title = "Dashboard | Nabta Seniors";
  }, []);

  const renderContent = () => {
    switch (activePage) {
      case "ai":
        return <AIAssistant />;
      case "history":
        return <History />;
      case "profile":
        return <Profile />;
      default:
        return (
          <PlantAnalysis
            setStep={setStep}
            setProgressValue={setProgress}
          />
        );
    }
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