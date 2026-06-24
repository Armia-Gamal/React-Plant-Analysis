import { useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  FlaskConical,
  Gauge,
  Leaf,
  Loader2,
  MapPin,
  Navigation,
  Sprout,
  Wheat
} from "lucide-react";
import { useLanguage } from "../../../../context/LanguageContext";
import "./Crop-Recommendation.css";

const API_BASE = "https://armia-gamal-agritech-api.hf.space";

const text = {
  en: {
    eyebrow: "Agriculture / Crop Recommendation",
    title: "Crop Recommendation",
    subtitle: "Match your soil type, NPK values, and local weather with the crops most likely to perform well.",
    status: "Location",
    locationPending: "Detecting your location...",
    locationLoading: "Loading local weather data...",
    locationDenied: "Location is unavailable. Cairo will be used as a fallback.",
    locationUnsupported: "Location is unsupported. Cairo will be used as a fallback.",
    weatherError: "Unable to detect city. Cairo will be used as a fallback.",
    metadataError: "Unable to load soil data from the server.",
    soil: "Soil Type",
    npkTitle: "Soil NPK Levels",
    nitrogen: "Nitrogen",
    phosphorus: "Phosphorus",
    potassium: "Potassium",
    analyze: "Discover Best Crops",
    analyzing: "Analyzing...",
    refreshLocation: "Refresh location",
    cityFallback: "Cairo",
    resultsTitle: "Suggested crops",
    noResult: "Run the analysis to see your top crop matches.",
    confidence: "Confidence",
    recommendation: "Recommendation",
    topMatch: "Top match",
    soilLoaded: "Soil options ready",
    currentCity: "Current city"
  },
  ar: {
    eyebrow: "الزراعة / ترشيح المحاصيل",
    title: "ترشيح المحاصيل",
    subtitle: "اربط نوع التربة وقيم NPK والطقس المحلي بالمحاصيل الأكثر مناسبة للزراعة.",
    status: "الموقع",
    locationPending: "جاري تحديد الموقع...",
    locationLoading: "جاري جلب بيانات المنطقة...",
    locationDenied: "تعذر تحديد الموقع. سيتم استخدام القاهرة كبديل.",
    locationUnsupported: "المتصفح لا يدعم تحديد الموقع. سيتم استخدام القاهرة كبديل.",
    weatherError: "تعذر تحديد المدينة. سيتم استخدام القاهرة كبديل.",
    metadataError: "فشل في جلب بيانات التربة من الخادم.",
    soil: "نوع التربة",
    npkTitle: "مستويات NPK في التربة",
    nitrogen: "النيتروجين",
    phosphorus: "الفسفور",
    potassium: "البوتاسيوم",
    analyze: "اكتشف أفضل المحاصيل",
    analyzing: "جاري التحليل...",
    refreshLocation: "تحديث الموقع",
    cityFallback: "Cairo",
    resultsTitle: "المحاصيل المقترحة",
    noResult: "شغّل التحليل لعرض أفضل المحاصيل المناسبة.",
    confidence: "الثقة",
    recommendation: "الترشيح",
    topMatch: "أفضل اختيار",
    soilLoaded: "خيارات التربة جاهزة",
    currentCity: "المدينة الحالية"
  }
};

const defaultNpk = {
  N: 80,
  P: 45,
  K: 80
};

export default function CropRecommendation() {
  const { language } = useLanguage();
  const t = text[language] || text.en;
  const [soils, setSoils] = useState([]);
  const [soil, setSoil] = useState("");
  const [city, setCity] = useState(t.cityFallback);
  const [npk, setNpk] = useState(defaultNpk);
  const [status, setStatus] = useState(t.locationPending);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);

  const canAnalyze = soil && !isMetadataLoading && !isAnalyzing;
  const topCrop = results[0];

  useEffect(() => {
    let isMounted = true;

    async function fetchMetaData() {
      setIsMetadataLoading(true);

      try {
        const response = await fetch(`${API_BASE}/meta-data`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || t.metadataError);
        }

        if (!isMounted) {
          return;
        }

        const nextSoils = Array.isArray(data.soils) ? data.soils : [];
        setSoils(nextSoils);
        setSoil(nextSoils[0] || "");
      } catch (err) {
        if (isMounted) {
          setError(err.message || t.metadataError);
        }
      } finally {
        if (isMounted) {
          setIsMetadataLoading(false);
        }
      }
    }

    fetchMetaData();

    return () => {
      isMounted = false;
    };
  }, [t.metadataError]);

  const loadLocation = () => {
    setError("");
    setIsLocationLoading(true);
    setStatus(t.locationPending);

    if (!navigator.geolocation) {
      setCity(t.cityFallback);
      setStatus(t.locationUnsupported);
      setIsLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus(t.locationLoading);

        try {
          const response = await fetch(`${API_BASE}/weather`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            })
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.detail || t.weatherError);
          }

          setCity(data.city || t.cityFallback);
          setStatus(data.city || t.cityFallback);
        } catch (err) {
          setCity(t.cityFallback);
          setStatus(t.weatherError);
        } finally {
          setIsLocationLoading(false);
        }
      },
      () => {
        setCity(t.cityFallback);
        setStatus(t.locationDenied);
        setIsLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    loadLocation();
    // Run once on mount; users can refresh location from the page action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNpkChange = (key, value) => {
    setNpk((current) => ({
      ...current,
      [key]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canAnalyze) {
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch(`${API_BASE}/recommend-crop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city || t.cityFallback,
          soil,
          N: Number.parseFloat(npk.N),
          P: Number.parseFloat(npk.P),
          K: Number.parseFloat(npk.K)
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || t.weatherError);
      }

      setResults(Array.isArray(data.top_3_crops) ? data.top_3_crops : []);
    } catch (err) {
      setError(err.message || t.weatherError);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="crop-rec-page">
      <div className="crop-rec-shell">
        <header className="crop-rec-hero">
          <div className="crop-rec-hero__copy">
            <span className="crop-rec-eyebrow">{t.eyebrow}</span>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>

          <div className="crop-rec-status-card">
            <span>{t.status}</span>
            <strong>{status}</strong>
            <button type="button" onClick={loadLocation} disabled={isLocationLoading}>
              {isLocationLoading ? <Loader2 className="crop-rec-spin" size={16} /> : <Navigation size={16} />}
              {t.refreshLocation}
            </button>
          </div>
        </header>

        <div className="crop-rec-kpi-grid">
          <article>
            <MapPin size={21} />
            <span>{t.currentCity}</span>
            <strong>{city}</strong>
          </article>
          <article>
            <FlaskConical size={21} />
            <span>{t.soil}</span>
            <strong>{soil || "--"}</strong>
          </article>
          <article>
            <Gauge size={21} />
            <span>{t.npkTitle}</span>
            <strong>{npk.N}-{npk.P}-{npk.K}</strong>
          </article>
          <article>
            <CheckCircle2 size={21} />
            <span>{t.topMatch}</span>
            <strong>{topCrop?.crop || "--"}</strong>
          </article>
        </div>

        <div className="crop-rec-grid">
          <form className="crop-rec-card crop-rec-form" onSubmit={handleSubmit}>
            <div className="crop-rec-card__title">
              <Sprout size={22} />
              <h2>{t.recommendation}</h2>
            </div>

            <label className="crop-rec-field">
              <span>{t.soil}</span>
              <select value={soil} onChange={(event) => setSoil(event.target.value)} disabled={isMetadataLoading}>
                {soils.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className="crop-rec-npk-block">
              <div className="crop-rec-field-title">
                <BarChart3 size={18} />
                <span>{t.npkTitle}</span>
              </div>

              <div className="crop-rec-npk-grid">
                <label className="crop-rec-field">
                  <span>{t.nitrogen} (N)</span>
                  <input
                    type="number"
                    min="0"
                    value={npk.N}
                    onChange={(event) => handleNpkChange("N", event.target.value)}
                    required
                  />
                </label>
                <label className="crop-rec-field">
                  <span>{t.phosphorus} (P)</span>
                  <input
                    type="number"
                    min="0"
                    value={npk.P}
                    onChange={(event) => handleNpkChange("P", event.target.value)}
                    required
                  />
                </label>
                <label className="crop-rec-field">
                  <span>{t.potassium} (K)</span>
                  <input
                    type="number"
                    min="0"
                    value={npk.K}
                    onChange={(event) => handleNpkChange("K", event.target.value)}
                    required
                  />
                </label>
              </div>
            </div>

            <button className="crop-rec-submit" type="submit" disabled={!canAnalyze}>
              {isAnalyzing ? <Loader2 className="crop-rec-spin" size={18} /> : <Wheat size={18} />}
              {isAnalyzing ? t.analyzing : t.analyze}
            </button>

            {error ? <div className="crop-rec-alert">{error}</div> : null}
          </form>

          <aside className="crop-rec-card crop-rec-results">
            <div className="crop-rec-card__title">
              <Leaf size={22} />
              <h2>{t.resultsTitle}</h2>
            </div>

            {results.length > 0 ? (
              <div className="crop-rec-list">
                {results.map((item, index) => (
                  <article className="crop-rec-result-item" key={`${item.crop}-${index}`}>
                    <div className="crop-rec-rank">{index + 1}</div>
                    <div>
                      <strong>{item.crop}</strong>
                      <span>{t.confidence}</span>
                    </div>
                    <b>{item.confidence}%</b>
                  </article>
                ))}
              </div>
            ) : (
              <div className="crop-rec-empty">
                <Wheat size={34} />
                <p>{t.noResult}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
