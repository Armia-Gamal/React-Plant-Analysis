import { useEffect, useMemo, useState } from "react";
import {
  CloudSun,
  Droplets,
  Loader2,
  MapPin,
  Navigation,
  Sprout,
  Thermometer,
  Waves,
  Wind
} from "lucide-react";
import { useLanguage } from "../../../../context/LanguageContext";
import "./Irrigation.css";

const API_BASE = "https://armia-gamal-agritech-api.hf.space";

const text = {
  en: {
    eyebrow: "Agriculture / Irrigation",
    title: "Irrigation Management",
    subtitle: "Use live weather, crop type, soil type, and current soil moisture to decide whether irrigation is needed.",
    locationPending: "Detecting your location...",
    locationLoading: "Loading local weather data...",
    locationDenied: "Please allow location access to run irrigation analysis.",
    locationUnsupported: "Your browser does not support location detection.",
    weatherError: "Unable to load weather data.",
    metadataError: "Unable to load crop and soil data from the server.",
    crop: "Crop Type",
    soil: "Soil Type",
    moisture: "Current Soil Moisture",
    moistureHint: "The valid range changes based on the selected soil type.",
    analyze: "Analyze Irrigation",
    analyzing: "Analyzing...",
    waiting: "Waiting for location...",
    temp: "Temperature",
    humidity: "Humidity",
    wind: "Wind",
    cityFallback: "Current area",
    resultTitle: "Decision",
    waterAmount: "Required amount",
    confidence: "Model confidence",
    soilMoisture: "Moisture",
    irrigationThreshold: "Irrigation threshold",
    millimeter: "mm",
    kmh: "km/h",
    ready: "Weather is ready",
    status: "Status",
    noResult: "Run an analysis to see the irrigation decision.",
    retryLocation: "Refresh location",
    needsIrrigation: "Irrigation needed",
    noIrrigation: "No irrigation needed"
  },
  ar: {
    eyebrow: "الزراعة / الري",
    title: "إدارة الري",
    subtitle: "استخدم الطقس المباشر ونوع المحصول والتربة ورطوبة التربة الحالية لمعرفة هل النبات يحتاج ري أم لا.",
    locationPending: "جاري تحديد الموقع...",
    locationLoading: "جاري جلب بيانات المنطقة...",
    locationDenied: "يرجى السماح بالوصول للموقع لتشغيل تحليل الري.",
    locationUnsupported: "متصفحك لا يدعم تحديد الموقع.",
    weatherError: "تعذر جلب بيانات الطقس.",
    metadataError: "فشل الاتصال بالخادم لجلب بيانات المحاصيل والتربة.",
    crop: "نوع المحصول",
    soil: "نوع التربة",
    moisture: "رطوبة التربة الحالية",
    moistureHint: "النطاق المسموح يتغير حسب نوع التربة المختار.",
    analyze: "تحليل حالة الري",
    analyzing: "جاري التحليل...",
    waiting: "انتظار تحديد الموقع...",
    temp: "الحرارة",
    humidity: "الرطوبة",
    wind: "الرياح",
    cityFallback: "المنطقة الحالية",
    resultTitle: "قرار الري",
    waterAmount: "الكمية المطلوبة",
    confidence: "ثقة الموديل",
    soilMoisture: "الرطوبة",
    irrigationThreshold: "عتبة الري",
    millimeter: "ملم",
    kmh: "كم/س",
    ready: "بيانات الطقس جاهزة",
    status: "الحالة",
    noResult: "شغّل التحليل لعرض قرار الري.",
    retryLocation: "تحديث الموقع",
    needsIrrigation: "يحتاج ري",
    noIrrigation: "لا يحتاج ري"
  }
};

const initialWeather = {
  city: "",
  temp: "--",
  hum: "--",
  wind: "--"
};

export default function Irrigation() {
  const { language } = useLanguage();
  const t = text[language] || text.en;
  const [crops, setCrops] = useState([]);
  const [soils, setSoils] = useState([]);
  const [soilMoistureRanges, setSoilMoistureRanges] = useState({});
  const [crop, setCrop] = useState("");
  const [soil, setSoil] = useState("");
  const [moisture, setMoisture] = useState("");
  const [weather, setWeather] = useState(initialWeather);
  const [status, setStatus] = useState(t.locationPending);
  const [isWeatherReady, setIsWeatherReady] = useState(false);
  const [isMetadataLoading, setIsMetadataLoading] = useState(true);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const selectedRange = useMemo(() => soilMoistureRanges[soil], [soilMoistureRanges, soil]);
  const canAnalyze = isWeatherReady && crop && soil && moisture !== "" && !isMetadataLoading && !isAnalyzing;

  useEffect(() => {
    setStatus((currentStatus) => {
      if (
        currentStatus === text.en.locationPending ||
        currentStatus === text.ar.locationPending ||
        currentStatus === text.en.locationDenied ||
        currentStatus === text.ar.locationDenied
      ) {
        return t.locationPending;
      }

      return currentStatus;
    });
  }, [t.locationPending]);

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

        const nextCrops = Array.isArray(data.crops) ? data.crops : [];
        const nextSoils = Array.isArray(data.soils) ? data.soils : [];
        const nextRanges = data.soil_moisture_ranges || {};

        setCrops(nextCrops);
        setSoils(nextSoils);
        setSoilMoistureRanges(nextRanges);
        setCrop(nextCrops[0] || "");
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

  useEffect(() => {
    if (!selectedRange) {
      return;
    }

    const midpoint = ((Number(selectedRange.min) + Number(selectedRange.max)) / 2).toFixed(2);
    setMoisture(midpoint);
  }, [selectedRange]);

  const loadWeather = () => {
    setError("");
    setResult(null);
    setIsWeatherReady(false);
    setIsWeatherLoading(true);
    setStatus(t.locationPending);

    if (!navigator.geolocation) {
      setStatus(t.locationUnsupported);
      setIsWeatherLoading(false);
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

          setWeather({
            city: data.city || t.cityFallback,
            temp: data.temp ?? "--",
            hum: data.hum ?? "--",
            wind: data.wind ?? "--"
          });
          setStatus(`${t.ready}: ${data.city || t.cityFallback}`);
          setIsWeatherReady(true);
        } catch (err) {
          setStatus(t.weatherError);
          setError(err.message || t.weatherError);
        } finally {
          setIsWeatherLoading(false);
        }
      },
      () => {
        setStatus(t.locationDenied);
        setIsWeatherLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    loadWeather();
    // Location is requested once on mount; the refresh button runs the same flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canAnalyze) {
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/predict-irrigation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: weather.city,
          crop,
          soil,
          moisture: Number.parseFloat(moisture)
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || t.weatherError);
      }

      setResult(data);
    } catch (err) {
      setError(err.message || t.weatherError);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const rangeHelp = selectedRange
    ? `${soil}: ${(Number(selectedRange.min) * 100).toFixed(0)}% - ${(Number(selectedRange.max) * 100).toFixed(0)}%`
    : t.moistureHint;
  const decisionText = result
    ? result.needs_irrigation ? t.needsIrrigation : t.noIrrigation
    : "";

  return (
    <section className="irrigation-page">
      <div className="irrigation-shell">
        <header className="irrigation-hero">
          <div className="irrigation-hero__copy">
            <span className="irrigation-eyebrow">{t.eyebrow}</span>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>

          <div className="irrigation-status-card">
            <span>{t.status}</span>
            <strong>{status}</strong>
            <button type="button" onClick={loadWeather} disabled={isWeatherLoading}>
              {isWeatherLoading ? <Loader2 className="irrigation-spin" size={16} /> : <Navigation size={16} />}
              {t.retryLocation}
            </button>
          </div>
        </header>

        <div className="irrigation-weather-grid">
          <article className="irrigation-weather-card">
            <Thermometer size={21} />
            <span>{t.temp}</span>
            <strong>{weather.temp}°C</strong>
          </article>
          <article className="irrigation-weather-card">
            <Droplets size={21} />
            <span>{t.humidity}</span>
            <strong>{weather.hum}%</strong>
          </article>
          <article className="irrigation-weather-card">
            <Wind size={21} />
            <span>{t.wind}</span>
            <strong>{weather.wind} {t.kmh}</strong>
          </article>
          <article className="irrigation-weather-card irrigation-weather-card--location">
            <MapPin size={21} />
            <span>{t.cityFallback}</span>
            <strong>{weather.city || "--"}</strong>
          </article>
        </div>

        <div className="irrigation-grid">
          <form className="irrigation-card irrigation-form" onSubmit={handleSubmit}>
            <div className="irrigation-card__title">
              <Sprout size={22} />
              <h2>{t.analyze}</h2>
            </div>

            <label className="irrigation-field">
              <span>{t.crop}</span>
              <select value={crop} onChange={(event) => setCrop(event.target.value)} disabled={isMetadataLoading}>
                {crops.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="irrigation-field">
              <span>{t.soil}</span>
              <select value={soil} onChange={(event) => setSoil(event.target.value)} disabled={isMetadataLoading}>
                {soils.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="irrigation-field">
              <span>{t.moisture}</span>
              <input
                type="number"
                step="0.01"
                min={selectedRange?.min ?? undefined}
                max={selectedRange?.max ?? undefined}
                value={moisture}
                onChange={(event) => setMoisture(event.target.value)}
                required
              />
              <small>{rangeHelp}</small>
            </label>

            <button className="irrigation-submit" type="submit" disabled={!canAnalyze}>
              {isAnalyzing ? <Loader2 className="irrigation-spin" size={18} /> : <CloudSun size={18} />}
              {isAnalyzing ? t.analyzing : isWeatherReady ? t.analyze : t.waiting}
            </button>

            {error ? <div className="irrigation-alert">{error}</div> : null}
          </form>

          <aside className="irrigation-card irrigation-result">
            <div className="irrigation-card__title">
              <Waves size={22} />
              <h2>{t.resultTitle}</h2>
            </div>

            {result ? (
              <div className={`irrigation-decision ${result.needs_irrigation ? "is-needed" : "is-safe"}`}>
                <strong>{decisionText}</strong>
                {Number(result.water_amount_liters_per_m2) > 0 ? (
                  <p>
                    {t.waterAmount}: <b>{result.water_amount_liters_per_m2} {t.millimeter}</b>
                  </p>
                ) : null}
                {result.confidence_percentage ? (
                  <div className="irrigation-result-metrics">
                    <span>
                      <CloudSun size={18} />
                      <small>{t.confidence}</small>
                      <b>{result.confidence_percentage}%</b>
                    </span>
                    <span>
                      <Droplets size={18} />
                      <small>{t.soilMoisture}</small>
                      <b>{result.soil_moisture_percentage}%</b>
                    </span>
                    <span>
                      <Waves size={18} />
                      <small>{t.irrigationThreshold}</small>
                      <b>{result.mad_percentage}%</b>
                    </span>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="irrigation-empty-result">
                <Droplets size={34} />
                <p>{t.noResult}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
