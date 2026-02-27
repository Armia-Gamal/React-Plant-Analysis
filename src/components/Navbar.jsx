import "../index.css";
import "./Navbar.css";
import logo from "../assets/images/Logo.svg";
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
        <li onClick={() => scrollToSection("home")}>
          <i className="fa-solid fa-house"></i> Home
        </li>

        <li onClick={() => scrollToSection("about")}>
          <i className="fa-solid fa-circle-info"></i> About
        </li>

        <li onClick={() => scrollToSection("features")}>
          <i className="fa-solid fa-star"></i> Features
        </li>

        <li onClick={() => scrollToSection("how")}>
          <i className="fa-solid fa-gears"></i> How It Works
        </li>

        <li onClick={() => scrollToSection("contact")}>
          <i className="fa-solid fa-envelope"></i> Contact
        </li>
      </ul>

      <button
        className="nav-btn"
        onClick={() => navigate("/login")}
      >
        <i className="fa-solid fa-rocket"></i> Get Started
      </button>
    </nav>
  );
}