import { useMemo, useState } from "react";
import PlanCard from "./PlanCard";
import "./PremiumUpgrade.css";

const text = {
  en: {
    title: "Unlock Custom Data",
    subtitle: "Train your own plant detection model using your custom dataset.",
    monthly: "Monthly",
    yearly: "Yearly",
    freePlan: "Free",
    proPlan: "Pro",
    month: "month",
    freeFeatures: [
      "Detect plant disease",
      "Generate report",
      "Limited daily usage"
    ],
    proFeatures: [
      "Unlimited usage",
      "Access to Custom Data",
      "Upload and train on custom datasets",
      "Roboflow-like integration workflow"
    ],
    upgrade: "Upgrade to Pro",
    close: "Not now"
  },
  ar: {
    title: "تفعيل ميزة البيانات المخصصة",
    subtitle: "درّب نموذج اكتشاف النبات الخاص بك باستخدام بياناتك المخصصة.",
    monthly: "شهري",
    yearly: "سنوي",
    freePlan: "مجاني",
    proPlan: "pro",
    month: "شهر",
    freeFeatures: [
      "اكتشاف مرض النبات",
      "إنشاء تقرير",
      "استخدام يومي محدود"
    ],
    proFeatures: [
      "استخدام غير محدود",
      "الوصول إلى البيانات المخصصة",
      "رفع وتدريب النموذج ببياناتك",
      "تكاملات مشابهة لمنصات التدريب"
    ],
    upgrade: "الترقية إلى pro",
    close: "لاحقا"
  }
};

function getPricing(language, billingCycle) {
  const isArabic = language === "ar";

  if (billingCycle === "yearly") {
    return isArabic ? "4320 EGP" : "$200";
  }

  return isArabic ? "400 EGP" : "$20";
}

export default function PricingModal({
  isOpen,
  language = "en",
  onClose
}) {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [showPhase2, setShowPhase2] = useState(false);
  const t = text[language] || text.en;

  const proPrice = useMemo(() => getPricing(language, billingCycle), [language, billingCycle]);
  const proBadge = billingCycle === "yearly" ? (language === "ar" ? "سنه" : "Year") : t.proPlan;
  const proPeriod = billingCycle === "yearly" ? (language === "ar" ? "سنه" : "year") : t.month;

  const phase2Msg = language === "ar"
    ? "ميزة البيانات المخصصة (pro) ستتوفر قريبًا في المرحلة الثانية."
    : "Custom Data Pro is coming soon in Phase 2.";

  if (!isOpen) {
    return null;
  }

  return (
    <div className="pricing-modal-overlay" onClick={onClose}>
      <div
        className="pricing-modal"
        dir={language === "ar" ? "rtl" : "ltr"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pricing-modal-head">
          <div>
            <h3 id="pricing-modal-title">{t.title}</h3>
            <p>{t.subtitle}</p>
          </div>

          <div className="pricing-toggle">
            <button
              type="button"
              className={billingCycle === "monthly" ? "active" : ""}
              onClick={() => setBillingCycle("monthly")}
            >
              {t.monthly}
            </button>
            <button
              type="button"
              className={billingCycle === "yearly" ? "active" : ""}
              onClick={() => setBillingCycle("yearly")}
            >
              {t.yearly}
            </button>
          </div>
        </div>

        <div className="pricing-plan-grid">
          <PlanCard
            title={t.freePlan}
            price={language === "ar" ? "0 EGP" : "$0"}
            period={t.month}
            features={t.freeFeatures}
            language={language}
          />

          <PlanCard
            title={proBadge}
            price={proPrice}
            period={proPeriod}
            features={t.proFeatures}
            highlighted
            cta={t.upgrade}
            onCta={() => setShowPhase2(true)}
            language={language}
          />
        </div>

        <button type="button" className="pricing-close" onClick={onClose}>
          {t.close}
        </button>

        {showPhase2 && (
          <div className="phase2-modal-overlay" onClick={() => setShowPhase2(false)}>
            <div className="phase2-modal" onClick={e => e.stopPropagation()} dir={language === "ar" ? "rtl" : "ltr"}>
              <h4 style={{margin:0, color:'#0f766e', fontWeight:700}}>
                {phase2Msg}
              </h4>
              <button
                type="button"
                className="pricing-close"
                style={{marginTop:16}}
                onClick={() => setShowPhase2(false)}
              >
                {language === "ar" ? "حسنًا" : "OK"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
