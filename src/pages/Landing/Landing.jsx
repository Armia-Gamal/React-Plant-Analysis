import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Bot, BrainCircuit, Camera, Check, ChevronRight, Code2,
  CloudSun, Database, Droplets, Leaf, MessageCircle, ScanLine,
  ShieldCheck, Sparkles, Sprout, Terminal, Upload, Users, WandSparkles
} from "lucide-react";
import "./Landing.css";
import { useLanguage } from "../../context/LanguageContext";
import plantImage from "../../assets/images/plant.jpg";

const copy = {
  en: {
    eyebrow: "AI-POWERED PLANT INTELLIGENCE",
    titleA: "Know what your plant",
    titleB: "needs. Instantly.",
    heroBody: "NABTA turns a single photo into clear, reliable plant health insights—helping you identify disease, understand symptoms, and take the right next step.",
    analyze: "Analyze your plant", explore: "Explore the platform", noCard: "Free to get started", fast: "Results in seconds", private: "Your data stays private",
    scanComplete: "SCAN COMPLETE", health: "Plant health", confidence: "AI confidence", issue: "Early leaf spot detected", action: "View care plan",
    stat1: "7", stat1Label: "Minds behind NABTA", stat2: "AI", stat2Label: "Image-based diagnosis", stat3: "24/7", stat3Label: "Plant care guidance", stat4: "1", stat4Label: "Photo to get answers",
    aboutTag: "BUILT FOR BETTER GROWTH", aboutTitle: "Plant care should feel clear, not complicated.", aboutBody: "We combine computer vision, practical care guidance, and a conversational AI assistant in one calm, intuitive experience—so every grower can make confident decisions.",
    featureTag: "ONE INTELLIGENT WORKSPACE", featureTitle: "Everything your plants need to thrive.", featureBody: "From the first symptom to the final care step, NABTA keeps the whole journey connected.",
    features: [
      ["Instant plant analysis", "Upload or capture a leaf photo and receive an easy-to-understand health assessment.", "camera"],
      ["AI care assistant", "Ask follow-up questions and get contextual guidance tailored to your plant's condition.", "bot"],
      ["Smart health history", "Keep previous scans organized and follow how your plants improve over time.", "history"],
      ["Clear care plans", "Turn complex symptoms into focused, practical actions you can take today.", "care"],
    ],
    howTag: "SIMPLE BY DESIGN", howTitle: "From photo to action in three steps.", howBody: "No specialist language. No guesswork. Just useful answers at the moment you need them.",
    steps: [["01", "Capture", "Take a clear photo of the affected leaf or plant."], ["02", "Understand", "Our AI studies visual patterns and identifies likely issues."], ["03", "Take action", "Get a focused care plan and continue with the AI assistant."]],
    teamTag: "MEET THE DEVELOPERS", teamTitle: "Built by seven minds that refuse to think small.", teamBody: "Different perspectives, one living system. We combine engineering, AI research and product craft to turn an ambitious idea into something people can actually use.",
    teamRole: "NABTA Developer", together: "Seven developers. Thousands of decisions. One NABTA.", devLabel: "CORE DEVELOPER", devNote: "DESIGNED · BUILT · GROWN IN EGYPT", openProfile: "Focus this developer",
    ctaTag: "YOUR PLANT HAS A STORY", ctaTitle: "Let NABTA help you read it.", ctaBody: "Upload a photo and turn uncertainty into a practical care plan in moments.", ctaButton: "Start your first analysis"
  },
  ar: {
    eyebrow: "ذكاء نباتي مدعوم بالذكاء الاصطناعي",
    titleA: "اعرف ما يحتاجه نباتك",
    titleB: "في لحظات.",
    heroBody: "تحوّل نبتة صورة واحدة إلى معلومات واضحة وموثوقة عن صحة النبات، لتساعدك على اكتشاف المرض وفهم الأعراض واتخاذ الخطوة الصحيحة.",
    analyze: "حلّل نباتك", explore: "اكتشف المنصة", noCard: "ابدأ مجاناً", fast: "نتائج خلال ثوانٍ", private: "بياناتك في أمان",
    scanComplete: "اكتمل الفحص", health: "صحة النبات", confidence: "دقة التحليل", issue: "تم رصد تبقّع مبكر", action: "عرض خطة العناية",
    stat1: "7", stat1Label: "عقول وراء نبتة", stat2: "AI", stat2Label: "تشخيص بالصور", stat3: "24/7", stat3Label: "إرشاد للعناية", stat4: "1", stat4Label: "صورة واحدة للإجابة",
    aboutTag: "صُممت لنمو أفضل", aboutTitle: "العناية بالنبات يجب أن تكون واضحة وليست معقدة.", aboutBody: "نجمع بين الرؤية الحاسوبية وإرشادات العناية العملية ومساعد ذكي في تجربة واحدة بسيطة، ليتمكن كل مزارع من اتخاذ قرارات واثقة.",
    featureTag: "مساحة عمل ذكية متكاملة", featureTitle: "كل ما تحتاجه نباتاتك لتزدهر.", featureBody: "من أول عرض إلى آخر خطوة في العناية، تحافظ نبتة على ترابط الرحلة كاملة.",
    features: [["تحليل فوري للنبات", "ارفع صورة للورقة واحصل على تقييم واضح لصحة النبات.", "camera"], ["مساعد عناية ذكي", "اطرح أسئلة إضافية واحصل على إرشادات تناسب حالة نباتك.", "bot"], ["سجل صحي منظم", "احتفظ بالفحوصات السابقة وتابع تحسن نباتاتك مع الوقت.", "history"], ["خطط عناية واضحة", "حوّل الأعراض المعقدة إلى خطوات عملية يمكنك تنفيذها اليوم.", "care"]],
    howTag: "بساطة مقصودة", howTitle: "من الصورة إلى الحل في ثلاث خطوات.", howBody: "بدون مصطلحات معقدة أو تخمينات، فقط إجابات مفيدة وقت الحاجة.",
    steps: [["01", "التقط", "صوّر الورقة أو الجزء المصاب بوضوح."], ["02", "افهم", "يحلل الذكاء الاصطناعي الأنماط البصرية ويحدد المشكلة المحتملة."], ["03", "تحرّك", "احصل على خطة عناية وواصل مع المساعد الذكي."]],
    teamTag: "تعرّف على المطورين", teamTitle: "سبعة عقول لا ترضى بالتفكير الصغير.", teamBody: "رؤى مختلفة ونظام واحد متكامل. نجمع الهندسة وبحث الذكاء الاصطناعي وتصميم المنتج لنحوّل فكرة طموحة إلى تجربة يستخدمها الناس بالفعل.",
    teamRole: "مطور في نبتة", together: "سبعة مطورين. آلاف القرارات. نبتة واحدة.", devLabel: "مطور أساسي", devNote: "صُممت · بُنيت · ونمت في مصر", openProfile: "اعرض هذا المطور",
    ctaTag: "لنباتك قصة", ctaTitle: "دع نبتة تساعدك على فهمها.", ctaBody: "ارفع صورة وحوّل الحيرة إلى خطة عناية عملية في لحظات.", ctaButton: "ابدأ أول تحليل"
  }
};

const members = [
  { name: "Sherif Karam", code: "SK", color: "#b8ff65" },
  { name: "Armia Gamal", code: "AG", color: "#83e7ff" },
  { name: "Ziad Walid", code: "ZW", color: "#ffc46b" },
  { name: "Peter Polbol", code: "PP", color: "#c7a7ff" },
  { name: "Salsabel Ismail", code: "SI", color: "#ff94bd" },
  { name: "Shada Ayman", code: "SA", color: "#8fffd5" },
  { name: "Sara Essam", code: "SE", color: "#ff9f87" }
];
const icons = { camera: Camera, bot: Bot, history: Database, care: WandSparkles };

export default function Landing() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const t = copy[language] || copy.en;
  const [activeMember, setActiveMember] = useState(0);
  const teamRef = useRef(null);

  const moveTeamGlow = (event) => {
    const bounds = teamRef.current?.getBoundingClientRect();
    if (!bounds) return;
    teamRef.current.style.setProperty("--mouse-x", `${event.clientX - bounds.left}px`);
    teamRef.current.style.setProperty("--mouse-y", `${event.clientY - bounds.top}px`);
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    }), { threshold: 0.14 });
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [language]);

  return (
    <main className="landing" dir={language === "ar" ? "rtl" : "ltr"}>
      <section id="home" className="hero-section">
        <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
        <div className="landing-container hero-grid">
          <div className="hero-copy reveal is-visible">
            <div className="eyebrow"><Sparkles size={15} /> {t.eyebrow}</div>
            <h1>{t.titleA}<br /><span>{t.titleB}</span></h1>
            <p>{t.heroBody}</p>
            <div className="hero-actions">
              <button className="primary-button" onClick={() => navigate("/login")}>{t.analyze} <ArrowRight size={18} /></button>
              <button className="text-button" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>{t.explore} <ChevronRight size={18} /></button>
            </div>
            <div className="hero-trust"><span><Check size={15} /> {t.noCard}</span><span><Check size={15} /> {t.fast}</span><span><Check size={15} /> {t.private}</span></div>
          </div>
          <div className="hero-visual reveal is-visible">
            <div className="image-shell"><img src={plantImage} alt="Healthy green monstera leaves" /><div className="scan-line" /><div className="scan-corners" /></div>
            <div className="analysis-card">
              <div className="analysis-top"><span><ScanLine size={16} /> {t.scanComplete}</span><span className="live-dot" /></div>
              <div className="health-row"><div className="health-score">92<small>%</small></div><div><b>{t.health}</b><div className="meter"><i /></div></div></div>
              <div className="result-row"><span className="result-icon"><Leaf size={18} /></span><div><small>{t.confidence} · 96%</small><strong>{t.issue}</strong></div></div>
              <button>{t.action} <ArrowRight size={15} /></button>
            </div>
            <div className="floating-chip chip-one"><Droplets size={16} /> Moisture 68%</div>
            <div className="floating-chip chip-two"><CloudSun size={16} /> Light optimal</div>
          </div>
        </div>
      </section>

      <section className="stats-strip"><div className="landing-container stats-grid">
        {[[t.stat1,t.stat1Label],[t.stat2,t.stat2Label],[t.stat3,t.stat3Label],[t.stat4,t.stat4Label]].map(([value,label]) => <div className="stat-item" key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </div></section>

      <section id="about" className="about-section section-pad"><div className="landing-container about-grid">
        <div className="about-art reveal"><div className="art-card art-main"><Sprout size={48} /><span>Plant intelligence</span><strong>Made human.</strong></div><div className="art-card art-mini"><BrainCircuit size={28} /><span>AI + care</span></div><div className="art-ring" /></div>
        <div className="section-copy reveal"><div className="section-tag">{t.aboutTag}</div><h2>{t.aboutTitle}</h2><p>{t.aboutBody}</p><div className="about-points"><span><ShieldCheck /> Responsible insights</span><span><MessageCircle /> Guidance in context</span><span><Leaf /> Built around growth</span></div></div>
      </div></section>

      <section id="features" className="features-section section-pad"><div className="landing-container">
        <div className="section-heading reveal"><div className="section-tag">{t.featureTag}</div><h2>{t.featureTitle}</h2><p>{t.featureBody}</p></div>
        <div className="feature-grid">{t.features.map(([title, body, icon], index) => { const Icon = icons[icon]; return <article className="feature-card reveal" key={title}><div className="feature-number">0{index + 1}</div><div className="feature-icon"><Icon /></div><h3>{title}</h3><p>{body}</p><span className="feature-link">Learn more <ArrowRight size={16} /></span></article>; })}</div>
      </div></section>

      <section id="how" className="how-section section-pad"><div className="landing-container">
        <div className="how-header reveal"><div><div className="section-tag light">{t.howTag}</div><h2>{t.howTitle}</h2></div><p>{t.howBody}</p></div>
        <div className="steps-grid">{t.steps.map(([number,title,body], i) => <article className="step-card reveal" key={number}><span className="step-number">{number}</span><div className="step-icon">{i === 0 ? <Upload /> : i === 1 ? <BrainCircuit /> : <Sprout />}</div><h3>{title}</h3><p>{body}</p>{i < 2 && <div className="step-connector"><ChevronRight /></div>}</article>)}</div>
      </div></section>

      <section className="team-section section-pad" ref={teamRef} onMouseMove={moveTeamGlow}>
        <div className="team-ambient" /><div className="team-grid-lines" />
        <div className="team-marquee" aria-hidden="true"><div>NABTA DEVELOPERS · NABTA DEVELOPERS · NABTA DEVELOPERS · NABTA DEVELOPERS ·&nbsp;</div><div>NABTA DEVELOPERS · NABTA DEVELOPERS · NABTA DEVELOPERS · NABTA DEVELOPERS ·&nbsp;</div></div>
        <div className="landing-container team-content">
          <div className="team-header reveal"><div><div className="section-tag">{t.teamTag}</div><h2>{t.teamTitle}</h2></div><p>{t.teamBody}</p></div>
          <div className="developer-stage reveal">
            <div className="developer-console">
              <div className="console-bar"><div className="console-dots"><i /><i /><i /></div><span>nabta.team / developer_0{activeMember + 1}</span><Terminal size={15} /></div>
              <div className="console-body">
                <div className="console-code" aria-hidden="true"><span>01</span><b>const</b> team = <em>"NABTA"</em>;<br /><span>02</span><b>while</b> (idea) &#123;<br /><span>03</span>&nbsp;&nbsp;build(); test(); grow();<br /><span>04</span>&#125;<br /><span>05</span><i>// seven minds, one mission</i></div>
                <div className="active-developer" style={{ "--member-color": members[activeMember].color }}>
                  <div className="active-orbit"><i /><i /><i /><div className="active-monogram">{members[activeMember].code}</div></div>
                  <div className="active-meta"><span>{t.devLabel} · 0{activeMember + 1}</span><h3>{members[activeMember].name}</h3><p>{t.teamRole}</p><div className="developer-tags"><b><Code2 size={13} /> BUILD</b><b><BrainCircuit size={13} /> THINK</b><b><Sprout size={13} /> GROW</b></div></div>
                </div>
              </div>
              <div className="console-status"><span><i /> SYSTEM: COLLABORATING</span><span>{t.devNote}</span></div>
            </div>
            <div className="developer-roster">{members.map((member, index) => <button type="button" className={`developer-row ${activeMember === index ? "active" : ""}`} style={{ "--member-color": member.color }} onMouseEnter={() => setActiveMember(index)} onFocus={() => setActiveMember(index)} onClick={() => setActiveMember(index)} aria-label={`${t.openProfile}: ${member.name}`} key={member.name}><span className="roster-number">0{index + 1}</span><span className="roster-avatar">{member.code}</span><span className="roster-name">{member.name}</span><span className="roster-role">{t.teamRole}</span><ArrowRight /></button>)}</div>
          </div>
          <div className="team-manifesto reveal"><Users size={24} /><span>{t.together}</span><div className="manifesto-line" /><span className="manifesto-count">07</span></div>
        </div>
      </section>

      <section id="contact" className="cta-section"><div className="landing-container"><div className="cta-panel reveal"><div className="cta-leaf"><Leaf /></div><div className="section-tag light">{t.ctaTag}</div><h2>{t.ctaTitle}</h2><p>{t.ctaBody}</p><button className="primary-button light-button" onClick={() => navigate("/signup")}>{t.ctaButton} <ArrowRight size={18} /></button><div className="cta-rings" /></div></div></section>
    </main>
  );
}
