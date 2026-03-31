import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useLanguage } from "../../../context/LanguageContext";
import { auth, db } from "../../../firebase";
import "./History.css";

const HISTORY_COLLECTION = "histroy";
const HISTORY_FALLBACK_PLANT_NAME = "Not Detected Yet";
const HISTORY_FALLBACK_DISEASE_NAME = "Not Classified Yet";
const HISTORY_ALL_FILTER_VALUE = "__all__";
const COLOR_PALETTE = [
  "#166534",
  "#15803d",
  "#16a34a",
  "#22c55e",
  "#4ade80",
  "#0f766e",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#2563eb",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#dc2626",
  "#ef4444"
];

const text = {
  en: {
    title: "Nabta Smart Analysis Center",
    subtitle: "A Power BI-style analytics board built directly from your saved Firebase plant analyses.",
    loading: "Loading your analytics dashboard...",
    loadError: "Could not load your analytics dashboard right now.",
    empty: "No analyses have been saved yet. Run Plant Analysis to start filling this dashboard.",
    totalAnalyses: "Total Analyses",
    diseasedDetections: "Diseased Detections",
    uniqueDiseases: "Unique Diseases",
    trackedPlants: "Tracked Plants",
    plantTypes: "Plant Types",
    total: "Total",
    count: "Count",
    percentage: "Percentage",
    noChartData: "No data available yet.",
    noVisibleDiseases: "All diseases are hidden. Click a legend chip to show them again.",
    notAvailable: "Not available",
    noDiseaseDetected: "No disease detected",
    healthy: "Healthy",
    diseased: "Diseased",
    analyzedAt: "Analyzed At",
    account: "Account",
    leaves: "Leaves",
    status: "Status",
    healthPercentage: "Health %",
    plantName: "Plant Name",
    diseaseName: "Disease",
    filtersLabel: "Filters",
    plantFilter: "Plant",
    diseaseFilter: "Disease",
    allPlants: "All Plants",
    allDiseases: "All Diseases",
    clearFilters: "Clear",
    timelineHourly: "Hourly view",
    timelineDaily: "Daily view",
    timelineMonthly: "Monthly view",
    donutTitle: "Disease Distribution",
    donutSubtitle: "Every detected disease appears with exact count and percentage. Hover any segment for precise values.",
    timelineTitle: "Smart Infection Timeline",
    timelineSubtitle: "Automatically switches between hourly, daily, and monthly grouping based on your saved analysis dates.",
    plantTableTitle: "Top Plant Types",
    plantTableSubtitle: "Full ranked table for all plant types with percentage bars and scroll support instead of grouped summaries.",
    groupedTitle: "Disease vs Plant",
    groupedSubtitle: "Grouped disease bars per plant type. Click legend items to hide or reveal any disease without changing the data.",
    recentTitle: "Recent Analyses",
    recentSubtitle: "Latest five saved analyses including health percentage based on healthy leaves versus total leaves."
  },
  ar: {
    title: "مركز تحليلات Nabta الذكي",
    subtitle: "لوحة تحليلات احترافية بأسلوب Power BI مبنية مباشرة على نتائج النبات المحفوظة في Firebase.",
    loading: "جار تحميل لوحة التحليلات...",
    loadError: "تعذر تحميل لوحة التحليلات الآن.",
    empty: "لا توجد تحاليل محفوظة بعد. قم بتشغيل Plant Analysis لبدء تعبئة اللوحة.",
    totalAnalyses: "إجمالي التحليلات",
    diseasedDetections: "مرات اكتشاف المرض",
    uniqueDiseases: "الأمراض المختلفة",
    trackedPlants: "النباتات المتعقبة",
    plantTypes: "أنواع النباتات",
    total: "الإجمالي",
    count: "العدد",
    percentage: "النسبة",
    noChartData: "لا توجد بيانات كافية بعد.",
    noVisibleDiseases: "كل الأمراض مخفية الآن. اضغط على عنصر في الليجند لإظهارها من جديد.",
    notAvailable: "غير متاح",
    noDiseaseDetected: "لا يوجد مرض مكتشف",
    healthy: "سليم",
    diseased: "مصاب",
    analyzedAt: "وقت التحليل",
    account: "الحساب",
    leaves: "الأوراق",
    status: "الحالة",
    healthPercentage: "نسبة الصحة",
    plantName: "اسم النبات",
    diseaseName: "المرض",
    filtersLabel: "الفلاتر",
    plantFilter: "النبات",
    diseaseFilter: "المرض",
    allPlants: "كل النباتات",
    allDiseases: "كل الأمراض",
    clearFilters: "مسح",
    timelineHourly: "عرض بالساعات",
    timelineDaily: "عرض بالأيام",
    timelineMonthly: "عرض بالشهور",
    donutTitle: "توزيع الأمراض",
    donutSubtitle: "كل مرض ظاهر بعدده ونسبته الحقيقية. مرر المؤشر فوق أي جزء لرؤية التفاصيل الدقيقة.",
    timelineTitle: "الخط الزمني الذكي للإصابات",
    timelineSubtitle: "يبدل تلقائيًا بين الساعات والأيام والشهور حسب نطاق التواريخ المحفوظة داخل التحليلات.",
    plantTableTitle: "أكثر أنواع النباتات",
    plantTableSubtitle: "جدول كامل مرتب لكل أنواع النباتات مع أشرطة نسبة وتمرير بدل أي تجميع مختصر.",
    groupedTitle: "المرض مقابل النبات",
    groupedSubtitle: "أعمدة مجمعة لكل مرض داخل كل نوع نبات. يمكنك إخفاء أو إظهار أي مرض من الليجند بدون تغيير البيانات.",
    recentTitle: "أحدث التحليلات",
    recentSubtitle: "آخر خمس نتائج محفوظة مع نسبة الصحة المحسوبة من عدد الأوراق السليمة إلى إجمالي الأوراق."
  }
};

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");
const getLocale = (language) => (language === "ar" ? "ar-EG" : "en-US");
const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);
const pad2 = (value) => String(value).padStart(2, "0");

const formatNumber = (value, language, options = {}) =>
  new Intl.NumberFormat(getLocale(language), options).format(value);

const formatPercentage = (value, language, digits = 1) =>
  `${formatNumber(value, language, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}%`;

const getHistoryTimeValue = (item) => {
  if (typeof item?.analyzedAtMs === "number") {
    return item.analyzedAtMs;
  }

  const rawDate = item?.analyzedAt?.toDate ? item.analyzedAt.toDate() : item?.analyzedAtIso;
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const timeValue = parsedDate?.getTime?.() || 0;
  return Number.isNaN(timeValue) ? 0 : timeValue;
};

const getHistoryDate = (item) => {
  if (typeof item?.analyzedAtMs === "number") {
    const parsed = new Date(item.analyzedAtMs);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (item?.analyzedAt?.toDate) {
    const parsed = item.analyzedAt.toDate();
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (item?.analyzedAtIso) {
    const parsed = new Date(item.analyzedAtIso);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

const formatAnalysisDateTime = (item, language) => {
  const locale = getLocale(language);
  const analysisDate = getHistoryDate(item);

  if (!analysisDate) {
    return {
      date: item?.analysisDate || "",
      time: item?.analysisTime || ""
    };
  }

  return {
    date: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(analysisDate),
    time: new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit"
    }).format(analysisDate)
  };
};

const getDisplayPlantName = (entry, language) =>
  language === "ar" ? entry.localizedPlantNameAr || entry.plantName : entry.plantName;

const getDisplayDiseaseName = (entry, language) =>
  language === "ar" ? entry.localizedDiseaseNameAr || entry.diseaseName : entry.diseaseName;

const isSameCalendarDay = (firstDate, secondDate) =>
  firstDate.getFullYear() === secondDate.getFullYear() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getDate() === secondDate.getDate();

const isSameCalendarMonth = (firstDate, secondDate) =>
  firstDate.getFullYear() === secondDate.getFullYear() &&
  firstDate.getMonth() === secondDate.getMonth();

const getStartOfWeek = (date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const mondayOffset = (normalized.getDay() + 6) % 7;
  normalized.setDate(normalized.getDate() - mondayOffset);
  return normalized;
};

const isSameCalendarWeek = (firstDate, secondDate) =>
  getStartOfWeek(firstDate).getTime() === getStartOfWeek(secondDate).getTime();

const alignDateToUnit = (date, unit) => {
  const normalized = new Date(date);

  if (unit === "hour") {
    normalized.setMinutes(0, 0, 0);
    return normalized;
  }

  if (unit === "day") {
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  normalized.setDate(1);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const addToTimelineUnit = (date, unit, amount) => {
  const nextDate = new Date(date);

  if (unit === "hour") {
    nextDate.setHours(nextDate.getHours() + amount);
    return nextDate;
  }

  if (unit === "day") {
    nextDate.setDate(nextDate.getDate() + amount);
    return nextDate;
  }

  nextDate.setMonth(nextDate.getMonth() + amount);
  return nextDate;
};

const createTimelineKey = (date, unit) => {
  if (unit === "hour") {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}-${pad2(date.getHours())}`;
  }

  if (unit === "day") {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
};

const formatTimelineAxisLabel = (date, unit, language, useWeekdayLabel) => {
  const locale = getLocale(language);

  if (unit === "hour") {
    return new Intl.DateTimeFormat(locale, { hour: "numeric" }).format(date);
  }

  if (unit === "day") {
    if (useWeekdayLabel) {
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
    }

    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short"
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
};

const formatTimelineTooltipLabel = (date, unit, language) => {
  const locale = getLocale(language);

  if (unit === "hour") {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      hour: "numeric"
    }).format(date);
  }

  if (unit === "day") {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric"
  }).format(date);
};

const resolveTooltipPosition = (event, containerElement) => {
  if (!containerElement) {
    return { x: 120, y: 48 };
  }

  const containerRect = containerElement.getBoundingClientRect();
  const targetRect = event.currentTarget.getBoundingClientRect();
  const padding = Math.min(120, Math.max(72, containerRect.width * 0.18));

  return {
    x: clampValue(
      targetRect.left - containerRect.left + targetRect.width / 2,
      padding,
      Math.max(padding, containerRect.width - padding)
    ),
    y: Math.max(56, targetRect.top - containerRect.top)
  };
};

const buildSmoothLinePath = (points) => {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    const onlyPoint = points[0];
    return `M ${onlyPoint.x} ${onlyPoint.y} L ${onlyPoint.x + 0.01} ${onlyPoint.y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const currentPoint = points[index];
    const nextPoint = points[index + 1];
    const controlX = (currentPoint.x + nextPoint.x) / 2;

    path += ` C ${controlX} ${currentPoint.y}, ${controlX} ${nextPoint.y}, ${nextPoint.x} ${nextPoint.y}`;
  }

  return path;
};

const buildSmoothAreaPath = (points, baselineY) => {
  if (!points.length) {
    return "";
  }

  const linePath = buildSmoothLinePath(points);
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  return `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;
};

const buildTimelineAnalytics = (events, language, t) => {
  if (!events.length) {
    return {
      viewLabel: t.timelineMonthly,
      unit: "month",
      series: []
    };
  }

  const sortedDates = events
    .map((event) => event.date)
    .filter(Boolean)
    .sort((firstDate, secondDate) => firstDate.getTime() - secondDate.getTime());

  const firstDate = sortedDates[0];
  const lastDate = sortedDates[sortedDates.length - 1];
  const sameDay = isSameCalendarDay(firstDate, lastDate);
  const sameWeek = isSameCalendarWeek(firstDate, lastDate);
  const sameMonth = isSameCalendarMonth(firstDate, lastDate);
  const unit = sameDay ? "hour" : sameWeek || sameMonth ? "day" : "month";
  const viewLabel = unit === "hour" ? t.timelineHourly : unit === "day" ? t.timelineDaily : t.timelineMonthly;
  const useWeekdayLabel = unit === "day" && sameWeek;
  const alignedStart = alignDateToUnit(firstDate, unit);
  const alignedEnd = alignDateToUnit(lastDate, unit);
  const bucketCounts = new Map();

  events.forEach((event) => {
    const key = createTimelineKey(event.date, unit);
    bucketCounts.set(key, (bucketCounts.get(key) || 0) + 1);
  });

  const series = [];

  for (
    let cursor = new Date(alignedStart);
    cursor.getTime() <= alignedEnd.getTime();
    cursor = addToTimelineUnit(cursor, unit, 1)
  ) {
    const key = createTimelineKey(cursor, unit);
    const value = bucketCounts.get(key) || 0;

    series.push({
      key,
      value,
      percentage: events.length ? (value / events.length) * 100 : 0,
      axisLabel: formatTimelineAxisLabel(cursor, unit, language, useWeekdayLabel),
      tooltipLabel: formatTimelineTooltipLabel(cursor, unit, language)
    });
  }

  return {
    viewLabel,
    unit,
    series
  };
};

// COMPONENTS
function MetricCard({ metric, language }) {
  const displayValue = formatNumber(metric.value, language);

  return (
    <article className="history-bi-kpi">
      <span>{metric.label}</span>
      <strong>{displayValue}</strong>
    </article>
  );
}

function DashboardCard({ title, subtitle, meta, className = "", bodyClassName = "", children }) {
  return (
    <section className={joinClasses("history-bi-card", className)}>
      <div className="history-bi-card__header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {meta ? <span className="history-bi-card__meta">{meta}</span> : null}
      </div>
      <div className={joinClasses("history-bi-card__body", bodyClassName)}>{children}</div>
    </section>
  );
}

function EmptyChart({ label }) {
  return <div className="history-bi-chart-empty">{label}</div>;
}

function ChartTooltip({ tooltip }) {
  if (!tooltip) {
    return null;
  }

  return (
    <div className="history-bi-tooltip" style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
      <div className="history-bi-tooltip__title">
        {tooltip.accent ? (
          <span className="history-bi-tooltip__dot" style={{ backgroundColor: tooltip.accent }} />
        ) : null}
        <strong>{tooltip.title}</strong>
      </div>

      <div className="history-bi-tooltip__rows">
        {tooltip.rows.map((row) => (
          <div key={`${tooltip.title}-${row.label}`} className="history-bi-tooltip__row">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data, total, totalLabel, emptyLabel, language, t }) {
  const [activeLabel, setActiveLabel] = useState("");
  const [tooltip, setTooltip] = useState(null);
  const surfaceRef = useRef(null);

  if (!data.length || total <= 0) {
    return <EmptyChart label={emptyLabel} />;
  }

  const size = 236;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const handleItemHover = (event, item) => {
    const position = resolveTooltipPosition(event, surfaceRef.current);
    setActiveLabel(item.label);
    setTooltip({
      ...position,
      accent: item.color,
      title: item.label,
      rows: [
        { label: t.count, value: formatNumber(item.value, language) },
        { label: t.percentage, value: formatPercentage(item.percentage, language) }
      ]
    });
  };

  const clearHoverState = () => {
    setActiveLabel("");
    setTooltip(null);
  };

  return (
    <div className="history-bi-chart-shell history-bi-donut" ref={surfaceRef} onMouseLeave={clearHoverState}>
      <div className="history-bi-donut__figure">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={totalLabel}>
          <circle className="history-bi-donut__track" cx={size / 2} cy={size / 2} r={radius} />

          {data.map((item) => {
            const ratio = item.value / total;
            const dashLength = circumference * ratio;
            const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += dashLength;

            return (
              <circle
                key={item.label}
                className={joinClasses(
                  "history-bi-donut__segment",
                  activeLabel === item.label && "is-active",
                  activeLabel && activeLabel !== item.label && "is-dimmed"
                )}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={item.color}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                onMouseEnter={(event) => handleItemHover(event, item)}
                style={{ transformOrigin: "50% 50%" }}
              />
            );
          })}

          <text className="history-bi-donut__value" x="50%" y="48%" textAnchor="middle">
            {formatNumber(total, language)}
          </text>
          <text className="history-bi-donut__label" x="50%" y="60%" textAnchor="middle">
            {totalLabel}
          </text>
        </svg>
      </div>

      <div className="history-bi-donut__legend">
        {data.map((item) => (
          <button
            key={item.label}
            type="button"
            className={joinClasses(
              "history-bi-donut__legend-item",
              activeLabel === item.label && "is-active",
              activeLabel && activeLabel !== item.label && "is-dimmed"
            )}
            onMouseEnter={(event) => handleItemHover(event, item)}
          >
            <span className="history-bi-donut__legend-swatch" style={{ backgroundColor: item.color }} />
            <span className="history-bi-donut__legend-copy">
              <strong>{item.label}</strong>
              <span>{formatNumber(item.value, language)}</span>
            </span>
            <span className="history-bi-donut__legend-share">
              {formatPercentage(item.percentage, language)}
            </span>
          </button>
        ))}
      </div>

      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}

function SmartTimelineChart({ data, unit, emptyLabel, language, t }) {
  const [activeKey, setActiveKey] = useState("");
  const [tooltip, setTooltip] = useState(null);
  const surfaceRef = useRef(null);

  if (!data.length) {
    return <EmptyChart label={emptyLabel} />;
  }

  const width = Math.max(600, data.length * (unit === "hour" ? 70 : unit === "day" ? 78 : 88));
  const height = 320;
  const paddingLeft = 28;
  const paddingRight = 28;
  const paddingTop = 18;
  const paddingBottom = 56;
  const chartHeight = height - paddingTop - paddingBottom;
  const yMax = Math.max(...data.map((item) => item.value), 1);
  const stepX = data.length === 1 ? 0 : (width - paddingLeft - paddingRight) / (data.length - 1);
  const points = data.map((item, index) => ({
    ...item,
    x: paddingLeft + index * stepX,
    y: paddingTop + chartHeight - (item.value / yMax) * chartHeight
  }));
  const linePath = buildSmoothLinePath(points);
  const areaPath = buildSmoothAreaPath(points, height - paddingBottom);
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const value = Math.round(yMax - ratio * yMax);
    return { value, y: paddingTop + ratio * chartHeight };
  });
  const activePoint = points.find((point) => point.key === activeKey) || null;

  const handlePointHover = (event, point) => {
    const position = resolveTooltipPosition(event, surfaceRef.current);
    setActiveKey(point.key);
    setTooltip({
      ...position,
      accent: "#22c55e",
      title: point.tooltipLabel,
      rows: [
        { label: t.count, value: formatNumber(point.value, language) },
        { label: t.percentage, value: formatPercentage(point.percentage, language) }
      ]
    });
  };

  const clearHoverState = () => {
    setActiveKey("");
    setTooltip(null);
  };

  return (
    <div className="history-bi-chart-shell history-bi-trend" ref={surfaceRef} onMouseLeave={clearHoverState}>
      <div className="history-bi-trend__scroll">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Smart infection timeline">
          <defs>
            <linearGradient id="historyTrendAreaFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => (
            <g key={`${tick.value}-${tick.y}`}>
              <line className="history-bi-trend__grid-line" x1={paddingLeft} y1={tick.y} x2={width - paddingRight} y2={tick.y} />
              <text className="history-bi-trend__axis history-bi-trend__axis--y" x={6} y={tick.y + 4}>
                {formatNumber(tick.value, language)}
              </text>
            </g>
          ))}

          {activePoint ? (
            <line className="history-bi-trend__focus-line" x1={activePoint.x} y1={paddingTop} x2={activePoint.x} y2={height - paddingBottom} />
          ) : null}

          <path className="history-bi-trend__area" d={areaPath} />
          <path className="history-bi-trend__line" d={linePath} />

          {points.map((point) => (
            <g
              key={point.key}
              className={joinClasses(
                "history-bi-trend__point",
                activeKey === point.key && "is-active",
                activeKey && activeKey !== point.key && "is-dimmed"
              )}
              onMouseEnter={(event) => handlePointHover(event, point)}
            >
              <circle className="history-bi-trend__dot" cx={point.x} cy={point.y} r={activeKey === point.key ? 7 : 5.5} />
              <text className="history-bi-trend__axis history-bi-trend__axis--x" x={point.x} y={height - 18} textAnchor="middle">
                {point.axisLabel}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}

function PlantBreakdownTable({ data, emptyLabel, language, t }) {
  if (!data.length) {
    return <EmptyChart label={emptyLabel} />;
  }

  return (
    <div className="history-bi-plant-table">
      <div className="history-bi-plant-table__scroll">
        <div className="history-bi-plant-table__frame">
          <div className="history-bi-plant-table__head">
            <span className="history-bi-plant-table__cell history-bi-plant-table__cell--head">
              {t.plantName}
            </span>
            <span className="history-bi-plant-table__cell history-bi-plant-table__cell--head history-bi-plant-table__cell--count">
              {t.count}
            </span>
            <span className="history-bi-plant-table__cell history-bi-plant-table__cell--head">
              {t.percentage}
            </span>
          </div>

          <div className="history-bi-plant-table__body">
            {data.map((item, index) => (
              <div key={item.label} className="history-bi-plant-table__row">
                <div className="history-bi-plant-table__cell history-bi-plant-table__cell--plant">
                  <div className="history-bi-plant-table__plant">
                    <span className="history-bi-plant-table__rank">#{index + 1}</span>
                    <strong>{item.label}</strong>
                  </div>
                </div>

                <div className="history-bi-plant-table__cell history-bi-plant-table__cell--count">
                  <strong>{formatNumber(item.value, language)}</strong>
                </div>

                <div className="history-bi-plant-table__cell history-bi-plant-table__cell--percentage">
                  <div className="history-bi-plant-table__progress-wrap">
                    <span>{formatPercentage(item.percentage, language)}</span>
                    <div className="history-bi-plant-table__progress">
                      <span style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GroupedBarChart({ plants, diseases, total, emptyLabel, noVisibleLabel, language, t }) {
  const [hiddenDiseases, setHiddenDiseases] = useState([]);
  const [activeBarKey, setActiveBarKey] = useState("");
  const [activeDiseaseLabel, setActiveDiseaseLabel] = useState("");
  const [activePlantLabel, setActivePlantLabel] = useState("");
  const [selectedPlantLabel, setSelectedPlantLabel] = useState(HISTORY_ALL_FILTER_VALUE);
  const [selectedDiseaseLabel, setSelectedDiseaseLabel] = useState(HISTORY_ALL_FILTER_VALUE);
  const [tooltip, setTooltip] = useState(null);
  const surfaceRef = useRef(null);
  const plotHeight = 248;
  const axisLabelSpace = 58;
  const groupGap = 8;
  const barGap = 0;

  useEffect(() => {
    setHiddenDiseases((currentHidden) => {
      const validLabels = new Set(diseases.map((item) => item.label));
      const nextHidden = currentHidden.filter((label) => validLabels.has(label));
      return nextHidden.length === currentHidden.length ? currentHidden : nextHidden;
    });
  }, [diseases]);

  useEffect(() => {
    if (
      selectedDiseaseLabel !== HISTORY_ALL_FILTER_VALUE &&
      (hiddenDiseases.includes(selectedDiseaseLabel) || !diseases.some((item) => item.label === selectedDiseaseLabel))
    ) {
      setSelectedDiseaseLabel(HISTORY_ALL_FILTER_VALUE);
    }
  }, [diseases, hiddenDiseases, selectedDiseaseLabel]);

  useEffect(() => {
    if (
      selectedPlantLabel !== HISTORY_ALL_FILTER_VALUE &&
      !plants.some((plant) => plant.label === selectedPlantLabel)
    ) {
      setSelectedPlantLabel(HISTORY_ALL_FILTER_VALUE);
    }
  }, [plants, selectedPlantLabel]);

  const filteredPlants = useMemo(
    () =>
      selectedPlantLabel === HISTORY_ALL_FILTER_VALUE
        ? plants
        : plants.filter((plant) => plant.label === selectedPlantLabel),
    [plants, selectedPlantLabel]
  );

  const visibleDiseases = useMemo(
    () =>
      diseases.filter((item) => {
        if (hiddenDiseases.includes(item.label)) {
          return false;
        }

        if (selectedDiseaseLabel !== HISTORY_ALL_FILTER_VALUE && item.label !== selectedDiseaseLabel) {
          return false;
        }

        return true;
      }),
    [diseases, hiddenDiseases, selectedDiseaseLabel]
  );

  const plantGroupWidth = useMemo(
    () => (barCount) => Math.max(52, barCount * 14),
    []
  );

  const maxValue = useMemo(() => {
    const values = filteredPlants.flatMap((plant) =>
      visibleDiseases
        .map((disease) => plant.values[disease.label] || 0)
        .filter((value) => value > 0)
    );

    return Math.max(...values, 1);
  }, [filteredPlants, visibleDiseases]);

  const barHeightStep = useMemo(
    () => (maxValue > 0 ? plotHeight / maxValue : 0),
    [maxValue, plotHeight]
  );

  const chartPlants = useMemo(
    () =>
      filteredPlants.map((plant) => ({
        ...plant,
        bars: visibleDiseases.reduce((allBars, disease) => {
          const value = plant.values[disease.label] || 0;

          if (value <= 0) {
            return allBars;
          }

          allBars.push({
            key: `${plant.label}::${disease.label}`,
            label: disease.label,
            color: disease.color,
            value,
            percentage: total ? (value / total) * 100 : 0,
            height: value * barHeightStep
          });

          return allBars;
        }, [])
      })),
    [filteredPlants, visibleDiseases, total, barHeightStep]
  );

  const visibleChartPlants = useMemo(
    () => {
      // Sort by total descending
      return chartPlants
        .filter((plant) => plant.bars.length > 0)
        .sort((a, b) => {
          const aTotal = a.bars.reduce((sum, bar) => sum + bar.value, 0);
          const bTotal = b.bars.reduce((sum, bar) => sum + bar.value, 0);
          return bTotal - aTotal;
        });
    },
    [chartPlants]
  );

  const diseaseTotals = useMemo(() => {
    const totals = new Map();

    visibleDiseases.forEach((disease) => {
      const count = filteredPlants.reduce(
        (sum, plant) => sum + (plant.values[disease.label] || 0),
        0
      );

      if (count > 0) {
        totals.set(disease.label, {
          label: disease.label,
          color: disease.color,
          count,
          percentage: total ? (count / total) * 100 : 0
        });
      }
    });

    return totals;
  }, [filteredPlants, visibleDiseases, total]);

  const chartWidth = useMemo(
    () =>
      Math.max(
        560,
        visibleChartPlants.reduce((totalWidth, plant, index) => {
          const nextWidth = totalWidth + plantGroupWidth(plant.bars.length);
          return index === 0 ? nextWidth : nextWidth + groupGap;
        }, 0)
      ),
    [visibleChartPlants, plantGroupWidth]
  );

  const ticks = useMemo(
    () => {
      const tickValues = [];

      if (maxValue <= 4) {
        for (let value = maxValue; value >= 0; value -= 1) {
          tickValues.push(value);
        }
      } else {
        const stepValue = Math.max(1, Math.ceil(maxValue / 4));

        for (let value = maxValue; value > 0; value -= stepValue) {
          tickValues.push(value);
        }

        tickValues.push(0);
      }

      return [...new Set(tickValues)]
        .sort((firstValue, secondValue) => secondValue - firstValue)
        .map((value) => ({
          value,
          bottom: axisLabelSpace + (value / maxValue) * plotHeight
        }));
    },
    [axisLabelSpace, maxValue, plotHeight]
  );

  if (!plants.length || !diseases.length || total <= 0) {
    return <EmptyChart label={emptyLabel} />;
  }

  const focusedDiseaseLabel =
    activeDiseaseLabel || (selectedDiseaseLabel !== HISTORY_ALL_FILTER_VALUE ? selectedDiseaseLabel : "");
  const focusedPlantLabel =
    activePlantLabel || (selectedPlantLabel !== HISTORY_ALL_FILTER_VALUE ? selectedPlantLabel : "");

  const clearInteractionState = () => {
    setActiveBarKey("");
    setActiveDiseaseLabel("");
    setActivePlantLabel("");
    setTooltip(null);
  };

  const clearAllFilters = () => {
    clearInteractionState();
    setSelectedPlantLabel(HISTORY_ALL_FILTER_VALUE);
    setSelectedDiseaseLabel(HISTORY_ALL_FILTER_VALUE);
  };

  const toggleDisease = (label) => {
    clearInteractionState();
    setHiddenDiseases((currentHidden) =>
      currentHidden.includes(label)
        ? currentHidden.filter((item) => item !== label)
        : [...currentHidden, label]
    );
  };

  const handlePlantFilterChange = (event) => {
    clearInteractionState();
    setSelectedPlantLabel(event.target.value);
  };

  const handleDiseaseFilterChange = (event) => {
    const nextLabel = event.target.value;

    clearInteractionState();
    setSelectedDiseaseLabel(nextLabel);

    if (nextLabel !== HISTORY_ALL_FILTER_VALUE) {
      setHiddenDiseases((currentHidden) => currentHidden.filter((label) => label !== nextLabel));
    }
  };

  const handleBarHover = (event, plantLabel, bar) => {
    const position = resolveTooltipPosition(event, surfaceRef.current);

    setActiveBarKey(bar.key);
    setActiveDiseaseLabel(bar.label);
    setActivePlantLabel(plantLabel);
    setTooltip({
      ...position,
      accent: bar.color,
      title: plantLabel,
      rows: [
        { label: t.diseaseName, value: bar.label },
        { label: t.count, value: formatNumber(bar.value, language) },
        { label: t.percentage, value: formatPercentage(bar.percentage, language) }
      ]
    });
  };

  const handleDiseaseHover = (event, disease) => {
    const diseaseSummary = diseaseTotals.get(disease.label);

    if (!diseaseSummary || hiddenDiseases.includes(disease.label)) {
      return;
    }

    const position = resolveTooltipPosition(event, surfaceRef.current);

    setActiveBarKey("");
    setActivePlantLabel("");
    setActiveDiseaseLabel(disease.label);
    setTooltip({
      ...position,
      accent: diseaseSummary.color,
      title: diseaseSummary.label,
      rows: [
        { label: t.count, value: formatNumber(diseaseSummary.count, language) },
        { label: t.percentage, value: formatPercentage(diseaseSummary.percentage, language) }
      ]
    });
  };

  const handlePlantHover = (event, plant) => {
    const plantCount = plant.bars.reduce((sum, bar) => sum + bar.value, 0);
    const position = resolveTooltipPosition(event, surfaceRef.current);

    setActiveBarKey("");
    setActiveDiseaseLabel("");
    setActivePlantLabel(plant.label);
    setTooltip({
      ...position,
      title: plant.label,
      rows: [
        { label: t.count, value: formatNumber(plantCount, language) },
        { label: t.percentage, value: formatPercentage(total ? (plantCount / total) * 100 : 0, language) }
      ]
    });
  };

  const clearHoverState = () => {
    clearInteractionState();
  };

  return (
    <div className="history-bi-chart-shell history-bi-matrix" ref={surfaceRef} onMouseLeave={clearHoverState}>
      <div className="history-bi-matrix__controls">
        <div className="history-bi-matrix__filters">
          <span className="history-bi-matrix__filters-label">{t.filtersLabel}</span>

          <label className="history-bi-matrix__filter">
            <span>{t.plantFilter}</span>
            <select
              className="history-bi-matrix__select"
              value={selectedPlantLabel}
              onChange={handlePlantFilterChange}
            >
              <option value={HISTORY_ALL_FILTER_VALUE}>{t.allPlants}</option>
              {plants.map((plant) => (
                <option key={plant.label} value={plant.label}>
                  {plant.label}
                </option>
              ))}
            </select>
          </label>

          <label className="history-bi-matrix__filter">
            <span>{t.diseaseFilter}</span>
            <select
              className="history-bi-matrix__select"
              value={selectedDiseaseLabel}
              onChange={handleDiseaseFilterChange}
            >
              <option value={HISTORY_ALL_FILTER_VALUE}>{t.allDiseases}</option>
              {diseases.map((disease) => (
                <option key={disease.label} value={disease.label}>
                  {disease.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {(selectedPlantLabel !== HISTORY_ALL_FILTER_VALUE ||
          selectedDiseaseLabel !== HISTORY_ALL_FILTER_VALUE) ? (
          <button type="button" className="history-bi-matrix__clear" onClick={clearAllFilters}>
            {t.clearFilters}
          </button>
        ) : null}
      </div>

      <div className="history-bi-matrix__legend">
        {diseases.map((disease) => {
          const isHidden = hiddenDiseases.includes(disease.label);
          const isActive = focusedDiseaseLabel === disease.label;
          const isDimmed = focusedDiseaseLabel && focusedDiseaseLabel !== disease.label;

          return (
            <button
              key={disease.label}
              type="button"
              className={joinClasses(
                "history-bi-matrix__legend-item",
                isHidden && "is-hidden",
                isActive && "is-active",
                isDimmed && "is-dimmed"
              )}
              onClick={() => toggleDisease(disease.label)}
              onMouseEnter={(event) => handleDiseaseHover(event, disease)}
            >
              <span className="history-bi-matrix__legend-dot" style={{ backgroundColor: disease.color }} />
              <span>{disease.label}</span>
            </button>
          );
        })}
      </div>

      {!visibleDiseases.length || !visibleChartPlants.length ? (
        <EmptyChart label={noVisibleLabel} />
      ) : (
        <div className="history-bi-matrix__frame">
          <div className="history-bi-matrix__yaxis">
            {ticks.map((tick) => (
              <span key={`${tick.value}-${tick.bottom}`} style={{ bottom: `${tick.bottom}px` }}>
                {formatNumber(tick.value, language)}
              </span>
            ))}
          </div>

          <div className="history-bi-matrix__scroll">
            <div className="history-bi-matrix__canvas" style={{ width: `${chartWidth}px` }}>
              <div className="history-bi-matrix__plot">
                {ticks.map((tick) => (
                  <div
                    key={`line-${tick.value}-${tick.bottom}`}
                    className="history-bi-matrix__grid-line"
                    style={{ bottom: `${tick.bottom}px` }}
                  />
                ))}

                <div className="history-bi-matrix__groups">
                  {visibleChartPlants.map((plant) => (
                    <div
                      key={plant.label}
                      className={joinClasses(
                        "history-bi-matrix__group",
                        focusedPlantLabel === plant.label && "is-active",
                        focusedPlantLabel && focusedPlantLabel !== plant.label && "is-dimmed"
                      )}
                      style={{ width: `${plantGroupWidth(plant.bars.length)}px` }}
                      onMouseEnter={(event) => handlePlantHover(event, plant)}
                    >
                      <div className="history-bi-matrix__group-stage">
                        <div
                          className="history-bi-matrix__bars"
                          style={{
                            "--matrix-bar-count": `${plant.bars.length}`,
                            "--matrix-bar-gap": `${barGap}px`
                          }}
                        >
                          {plant.bars.map((bar) => (
                            <button
                              key={bar.key}
                              type="button"
                              className={joinClasses(
                                "history-bi-matrix__bar-slot",
                                activeBarKey === bar.key && "is-active",
                                (activeBarKey
                                  ? activeBarKey !== bar.key
                                  : (
                                      (focusedPlantLabel && focusedPlantLabel !== plant.label) ||
                                      (focusedDiseaseLabel && focusedDiseaseLabel !== bar.label)
                                    )) && "is-dimmed"
                              )}
                              onMouseEnter={(event) => handleBarHover(event, plant.label, bar)}
                            >
                              <span
                                className="history-bi-matrix__bar-fill"
                                style={{
                                  height: `${bar.height}px`,
                                  backgroundColor: bar.color
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <span
                        className={joinClasses(
                          "history-bi-matrix__group-label",
                          focusedPlantLabel === plant.label && "is-active",
                          focusedPlantLabel && focusedPlantLabel !== plant.label && "is-dimmed"
                        )}
                        title={plant.label}
                      >
                        {plant.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}

function RecentAnalysesTable({ items, emptyLabel, language, t }) {
  if (!items.length) {
    return <EmptyChart label={emptyLabel} />;
  }

  return (
    <div className="history-bi-plant-table history-bi-recent-table">
      <div className="history-bi-plant-table__scroll">
        <div className="history-bi-plant-table__frame">
          <div className="history-bi-plant-table__head">
            <span className="history-bi-plant-table__cell history-bi-plant-table__cell--head" style={{textAlign:'center', minWidth: '120px'}}>{t.analyzedAt}</span>
            <span className="history-bi-plant-table__cell history-bi-plant-table__cell--head" style={{textAlign:'center', minWidth: '60px'}}>{t.leaves}</span>
            <span className="history-bi-plant-table__cell history-bi-plant-table__cell--head" style={{textAlign:'center', minWidth: '90px'}}>{t.status}</span>
            <span className="history-bi-plant-table__cell history-bi-plant-table__cell--head" style={{textAlign:'center', minWidth: '80px'}}>{t.healthPercentage}</span>
          </div>
          <div className="history-bi-plant-table__body">
            {items.map((item) => (
              <div key={item.id} className="history-bi-plant-table__row">
                <div className="history-bi-plant-table__cell" style={{textAlign:'center', minWidth: '120px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'2px'}}>
                  <strong>{item.date}</strong>
                  <span>{item.time}</span>
                </div>
                <div className="history-bi-plant-table__cell" style={{textAlign:'center', minWidth: '60px', justifyContent:'center'}}>
                  <strong>{formatNumber(item.totalLeaves, language)}</strong>
                </div>
                <div className="history-bi-plant-table__cell" style={{textAlign:'center', minWidth: '90px', justifyContent:'center'}}>
                  <span className={joinClasses("history-bi-recent__badge", item.hasDetectedDisease ? "is-diseased" : "is-healthy")}>{item.hasDetectedDisease ? t.diseased : t.healthy}</span>
                </div>
                <div className="history-bi-plant-table__cell" style={{textAlign:'center', minWidth: '80px', justifyContent:'center'}}>
                  <div className="history-bi-recent__health">
                    <strong>{formatPercentage(item.healthPercentage, language)}</strong>
                    <div className="history-bi-recent__health-bar">
                      <span style={{ width: `${item.healthPercentage}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// MAIN
export default function History() {
  const { language } = useLanguage();
  const t = text[language] || text.en;
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let unsubscribeHistory = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeHistory();

      if (!user?.uid) {
        setHistoryItems([]);
        setLoadError("");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError("");

      const historyQuery = query(
        collection(db, HISTORY_COLLECTION),
        where("ownerId", "==", user.uid)
      );

      unsubscribeHistory = onSnapshot(
        historyQuery,
        (snapshot) => {
          const items = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((firstItem, secondItem) => getHistoryTimeValue(secondItem) - getHistoryTimeValue(firstItem));

          setHistoryItems(items);
          setIsLoading(false);
        },
        (error) => {
          console.error("Failed to load plant analysis analytics:", error);
          setHistoryItems([]);
          setLoadError("load-failed");
          setIsLoading(false);
        }
      );
    });

    return () => {
      unsubscribeHistory();
      unsubscribeAuth();
    };
  }, []);

  const normalizedHistoryItems = useMemo(
    () =>
      historyItems.map((item) => {
        const entries = Array.isArray(item.entries)
          ? item.entries.map((entry, index) => {
              const diseasePercentage = Number.parseFloat(entry?.diseasePercentage ?? 0);

              return {
                leafId: entry?.leafId || index + 1,
                plantName:
                  typeof entry?.plantName === "string" && entry.plantName.trim()
                    ? entry.plantName.trim()
                    : HISTORY_FALLBACK_PLANT_NAME,
                diseaseName:
                  typeof entry?.diseaseName === "string" && entry.diseaseName.trim()
                    ? entry.diseaseName.trim()
                    : HISTORY_FALLBACK_DISEASE_NAME,
                localizedPlantNameAr:
                  typeof entry?.localizedPlantNameAr === "string" ? entry.localizedPlantNameAr.trim() : "",
                localizedDiseaseNameAr:
                  typeof entry?.localizedDiseaseNameAr === "string" ? entry.localizedDiseaseNameAr.trim() : "",
                hasDisease: Boolean(entry?.hasDisease),
                diseasePercentage: Number.isFinite(diseasePercentage) ? Number(diseasePercentage.toFixed(2)) : 0
              };
            })
          : [];

        const reportedLeaves = Number.parseInt(item?.totalLeavesDetected, 10);
        const totalLeaves =
          Number.isFinite(reportedLeaves) && reportedLeaves > 0
            ? Math.max(reportedLeaves, entries.length)
            : entries.length;
        const diseasedLeavesCount = entries.filter((entry) => entry.hasDisease).length;
        const healthPercentage = totalLeaves ? ((totalLeaves - diseasedLeavesCount) / totalLeaves) * 100 : 0;
        const ownerAccount = item.ownerDisplayName
          ? item.ownerEmail
            ? `${item.ownerDisplayName} • ${item.ownerEmail}`
            : item.ownerDisplayName
          : item.ownerEmail || item.ownerAccount || item.ownerId || t.notAvailable;

        return {
          ...item,
          analyzedDate: getHistoryDate(item),
          ownerAccount,
          entries,
          totalLeaves,
          healthPercentage,
          hasDetectedDisease: Boolean(item?.hasDetectedDisease) || entries.some((entry) => entry.hasDisease)
        };
      }),
    [historyItems, t.notAvailable]
  );

  const analytics = useMemo(() => {
    const diseaseCounts = new Map();
    const plantCounts = new Map();
    const plantDiseaseMatrix = new Map();
    const diseasedEvents = [];
    let totalPlantEntries = 0;
    let totalDiseasedLeaves = 0;

    normalizedHistoryItems.forEach((item) => {
      item.entries.forEach((entry) => {
        const validPlant = entry.plantName !== HISTORY_FALLBACK_PLANT_NAME;
        const validDisease = entry.diseaseName !== HISTORY_FALLBACK_DISEASE_NAME;
        const plantLabel = validPlant ? getDisplayPlantName(entry, language) : "";
        const diseaseLabel = validDisease ? getDisplayDiseaseName(entry, language) : "";

        if (validPlant) {
          totalPlantEntries += 1;
          plantCounts.set(plantLabel, (plantCounts.get(plantLabel) || 0) + 1);

          if (!plantDiseaseMatrix.has(plantLabel)) {
            plantDiseaseMatrix.set(plantLabel, new Map());
          }
        }

        if (entry.hasDisease && validDisease) {
          totalDiseasedLeaves += 1;
          diseaseCounts.set(diseaseLabel, (diseaseCounts.get(diseaseLabel) || 0) + 1);

          if (validPlant) {
            const diseaseMap = plantDiseaseMatrix.get(plantLabel) || new Map();
            diseaseMap.set(diseaseLabel, (diseaseMap.get(diseaseLabel) || 0) + 1);
            plantDiseaseMatrix.set(plantLabel, diseaseMap);
          }

          if (item.analyzedDate) {
            diseasedEvents.push({
              date: item.analyzedDate,
              plantLabel,
              diseaseLabel
            });
          }
        }

      });
    });

    const diseaseDistribution = Array.from(diseaseCounts.entries())
      .sort((firstItem, secondItem) => secondItem[1] - firstItem[1])
      .map(([label, value], index) => ({
        label,
        value,
        color: COLOR_PALETTE[index % COLOR_PALETTE.length],
        percentage: totalDiseasedLeaves ? (value / totalDiseasedLeaves) * 100 : 0
      }));

    const diseaseColorMap = new Map(diseaseDistribution.map((item) => [item.label, item.color]));

    const plantBreakdown = Array.from(plantCounts.entries())
      .sort((firstItem, secondItem) => secondItem[1] - firstItem[1])
      .map(([label, value]) => ({
        label,
        value,
        percentage: totalPlantEntries ? (value / totalPlantEntries) * 100 : 0
      }));

    const groupedPlants = plantBreakdown.map((plant) => ({
      label: plant.label,
      total: plant.value,
      values: diseaseDistribution.reduce((accumulator, disease) => {
        const diseaseMap = plantDiseaseMatrix.get(plant.label);
        accumulator[disease.label] = diseaseMap?.get(disease.label) || 0;
        return accumulator;
      }, {})
    }));

    const timeline = buildTimelineAnalytics(diseasedEvents, language, t);

    const recentAnalyses = normalizedHistoryItems.slice(0, 5).map((item) => {
      const formattedDate = formatAnalysisDateTime(item, language);

      return {
        id: item.id,
        date: formattedDate.date || t.notAvailable,
        time: formattedDate.time || t.notAvailable,
        totalLeaves: item.totalLeaves,
        healthPercentage: item.healthPercentage,
        hasDetectedDisease: item.hasDetectedDisease
      };
    });

    const metrics = [
      {
        label: t.totalAnalyses,
        value: normalizedHistoryItems.length
      },
      {
        label: t.diseasedDetections,
        value: totalDiseasedLeaves
      },
      {
        label: t.uniqueDiseases,
        value: diseaseDistribution.length
      },
      {
        label: t.trackedPlants,
        value: plantBreakdown.length
      }
    ];

    return {
      metrics,
      totalDiseasedLeaves,
      diseaseDistribution,
      timeline,
      plantBreakdown,
      groupedPlants,
      groupedDiseases: diseaseDistribution.map((item) => ({
        label: item.label,
        color: diseaseColorMap.get(item.label) || COLOR_PALETTE[0]
      })),
      recentAnalyses
    };
  }, [normalizedHistoryItems, language, t]);

  const hasData = normalizedHistoryItems.length > 0;

  return (
    <div className="history-bi" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="history-bi__shell">
        <header className="history-bi__hero">
          <div className="history-bi__hero-copy">
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <div className="history-bi__hero-metrics">
            {analytics.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} language={language} />
            ))}
          </div>
        </header>

        {isLoading ? (
          <div className="history-bi__state">{t.loading}</div>
        ) : loadError ? (
          <div className="history-bi__state history-bi__state--error">{t.loadError}</div>
        ) : !hasData ? (
          <div className="history-bi__state">{t.empty}</div>
        ) : (
          <section className="history-bi__grid">
            <DashboardCard
              title={t.donutTitle}
              subtitle={t.donutSubtitle}
              meta={`${formatNumber(analytics.totalDiseasedLeaves, language)} ${t.total}`}
            >
              <DonutChart
                data={analytics.diseaseDistribution}
                total={analytics.totalDiseasedLeaves}
                totalLabel={t.total}
                emptyLabel={t.noChartData}
                language={language}
                t={t}
              />
            </DashboardCard>

            <DashboardCard
              title={t.timelineTitle}
              subtitle={t.timelineSubtitle}
              meta={analytics.timeline.viewLabel}
            >
              <SmartTimelineChart
                data={analytics.timeline.series}
                unit={analytics.timeline.unit}
                emptyLabel={t.noChartData}
                language={language}
                t={t}
              />
            </DashboardCard>

            <DashboardCard
              title={t.plantTableTitle}
              subtitle={t.plantTableSubtitle}
              meta={`${formatNumber(analytics.plantBreakdown.length, language)} ${t.plantTypes}`}
            >
              <PlantBreakdownTable
                data={analytics.plantBreakdown}
                emptyLabel={t.noChartData}
                language={language}
                t={t}
              />
            </DashboardCard>

            <DashboardCard
              title={t.groupedTitle}
              subtitle={t.groupedSubtitle}
              meta={`${formatNumber(analytics.groupedDiseases.length, language)} ${t.diseaseName}`}
            >
              <GroupedBarChart
                plants={analytics.groupedPlants}
                diseases={analytics.groupedDiseases}
                total={analytics.totalDiseasedLeaves}
                emptyLabel={t.noChartData}
                noVisibleLabel={t.noVisibleDiseases}
                language={language}
                t={t}
              />
            </DashboardCard>

            <DashboardCard
              title={t.recentTitle}
              subtitle={t.recentSubtitle}
              meta={`${analytics.recentAnalyses.length}/5`}
              className="history-bi-card--wide"
            >
              <RecentAnalysesTable
                items={analytics.recentAnalyses}
                emptyLabel={t.noChartData}
                language={language}
                t={t}
              />
            </DashboardCard>
          </section>
        )}
      </div>
    </div>
  );
}
