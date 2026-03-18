import "./PremiumUpgrade.css";

export default function PlanCard({
  title,
  price,
  period,
  features,
  highlighted = false,
  cta,
  onCta,
  language = "en"
}) {
  return (
    <article className={`plan-card ${highlighted ? "plan-card-highlighted" : ""}`} dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="plan-card-head">
        <h4>{title}</h4>
        {highlighted && <span className="plan-badge">PRO</span>}
      </div>

      <div className="plan-price-wrap">
        <span className="plan-price">{price}</span>
        {period ? <span className="plan-period">/{period}</span> : null}
      </div>

      <ul className="plan-feature-list">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      {cta ? (
        <button
          type="button"
          className={`plan-cta ${highlighted ? "plan-cta-highlighted" : ""}`}
          onClick={onCta}
        >
          {cta}
        </button>
      ) : null}
    </article>
  );
}
