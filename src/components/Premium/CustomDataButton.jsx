import { useState } from "react";
import "./PremiumUpgrade.css";

import puzzlePiece from "../../assets/images/puzzle-piece-svgrepo-com.svg";
import puzzlePieceHover from "../../assets/images/puzzle-piece-svgrepo-com (1).svg";

const text = {
  en: {
    label: "Custom Data",
    unlocked: "Pro"
  },
  ar: {
    label: "بيانات مخصصة",
    unlocked: "احترافي"
  }
};

export default function CustomDataButton({ language = "en", isSubscribed = false, onClick }) {
  const t = text[language] || text.en;
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      className={`custom-data-btn ${isSubscribed ? "custom-data-btn-active" : ""}`}
      onClick={onClick}
      title={t.label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="custom-data-btn-icon" aria-hidden="true">
        <img
          src={hovered ? puzzlePieceHover : puzzlePiece}
          alt="Custom Data"
          style={{ width: 20, height: 20, display: "block" }}
        />
      </span>
      <span>{t.label}</span>
      {isSubscribed ? <span className="custom-data-chip">{t.unlocked}</span> : null}
    </button>
  );
}
