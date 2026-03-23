import "./Landing.css";
import { useLanguage } from "../../context/LanguageContext";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import PlantModel from "./../../components/PlantModel/PlantModel";
import { Sparkles } from "@react-three/drei";

const text = {
  en: {
    home: "HOME",
    about: "ABOUT",
    features: "FEATURES",
    how: "HOW IT WORKS",
    contact: "CONTACT"
  },
  ar: {
    home: "الرئيسية",
    about: "من نحن",
    features: "المميزات",
    how: "كيف تعمل المنصة",
    contact: "تواصل معنا"
  }
};

export default function Landing() {
  const { language } = useLanguage();
  const t = text[language] || text.en;

  return (
    <div className="landing" dir={language === "ar" ? "rtl" : "ltr"}>

      <section id="home" className="section home">

        {/* 🔥 Title */}
        <h1 className="hero-title">
          NABTA SYSTEM AI
        </h1>

        <div className="blur-overlay"></div>

        <div className="stats stat1">🌿 89% Healthy</div>
        <div className="stats stat2">💧 Low Water</div>
        <div className="stats stat3">⚠️ Disease Risk 12%</div>

        <div className="hero-3d">
          <Canvas camera={{ position: [0, 0, 3] }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 5, 5]} intensity={1.5} />

            <PlantModel />

            <Sparkles
              count={80}
              scale={[4, 4, 4]}
              size={2}
              speed={0.5}
              color="#22c55e"
            />
            <OrbitControls
              enableZoom={false}
              minPolarAngle={0.1}
              maxPolarAngle={Math.PI - 0.1}
            />
            
          </Canvas>
          <div className="scanner"></div>
        </div>
        
        <div className="particles"></div>

      </section>

      <section id="about" className="section about">
        <h1>{t.about}</h1>
      </section>

      <section id="features" className="section features">
        <h1>{t.features}</h1>
      </section>

      <section id="how" className="section how">
        <h1>{t.how}</h1>
      </section>

      <section id="contact" className="section contact">
        <h1>{t.contact}</h1>
      </section>

    </div>
  );
}