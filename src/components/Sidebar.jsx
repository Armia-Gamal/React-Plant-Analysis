import { useNavigate } from "react-router-dom";
import "./Sidebar.css";
import logo from "../assets/images/Logo.svg";
import plantIcon from "../assets/images/plant-icon.png";
import plantIconActive from "../assets/images/plant-icon-active.png";
import aiIconInactive from "../assets/images/hubot-svgrepo-com.svg";
import aiIcon from "../assets/images/hubot-svgrepo-com (3).svg";
import historyIconInactive from "../assets/images/history-svgrepo-com.svg";
import historyIcon from "../assets/images/history-svgrepo-com (2).svg";
import profileIconInactive from "../assets/images/profile-svgrepo-com.svg";
import profileIcon from "../assets/images/profile-svgrepo-com (1).svg";
import logoutIcon from "../assets/images/logout.svg";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Sidebar({ activePage, setActivePage }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="sidebar">

      <div>
        <div className="sidebar-header">
          <img src={logo} alt="Nabta Logo" />
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
            <span>Plant Analysis</span>
          </li>

          <li
            className={activePage === "ai" ? "active-item" : ""}
            onClick={() => setActivePage("ai")}
          >
            <div className="menu-icon">
              <img src={activePage === "ai" ? aiIcon : aiIconInactive} alt="AI" />
            </div>
            <span>AI Assistant</span>
          </li>

          <li
            className={activePage === "history" ? "active-item" : ""}
            onClick={() => setActivePage("history")}
          >
            <div className="menu-icon">
              <img src={activePage === "history" ? historyIcon : historyIconInactive} alt="History" />
            </div>
            <span>History</span>
          </li>
        </ul>

        <hr className="sidebar-hr-bottom" />

        <p className="section-label">ACCOUNT PAGES</p>

        <ul className="menu">
          <li
            className={activePage === "profile" ? "active-item" : ""}
            onClick={() => setActivePage("profile")}
          >
            <div className="menu-icon">
              <img src={activePage === "profile" ? profileIcon : profileIconInactive} alt="Profile" />
            </div>
            <span>Profile</span>
          </li>
        </ul>
      </div>

      {/* ===== Logout Bottom ===== */}
      <div className="logout-section">
        <li className="logout-item" onClick={handleLogout}>
          <div className="menu-icon logout-icon">
            <img src={logoutIcon} alt="Logout" />
          </div>
          <span>Logout</span>
        </li>
      </div>

    </aside>
  );
}
