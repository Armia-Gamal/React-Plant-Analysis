import "../index.css";
import "./Navbar.css";
import logo from "../assets/images/Logo.png";
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {

  const navigate = useNavigate();
  const location = useLocation();

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
    <nav className="navbar">
      <div className="nav-logo">
        <img src={logo} alt="logo" />
      </div>

      <ul className="nav-links">
        <li onClick={() => scrollToSection("home")}>Home</li>
        <li onClick={() => scrollToSection("about")}>About</li>
        <li onClick={() => scrollToSection("features")}>Features</li>
        <li onClick={() => scrollToSection("how")}>How It Works</li>
        <li onClick={() => scrollToSection("contact")}>Contact</li>
      </ul>

      <button
        className="nav-btn"
        onClick={() => navigate("/login")}
      >
        Get Started
      </button>
    </nav>
  );
}