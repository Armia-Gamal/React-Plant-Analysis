import { useState, useRef } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import bgImage from "../../../assets/images/OIP.jpg";
import uploadImg from "../../../assets/images/hoolding-leaf-svgrepo-com.svg";
import mobileUploadImg from "../../../assets/images/photo-camera-svgrepo-com.svg";
import detectImg from "../../../assets/images/Gemini_Generate.png";
import classImg from "../../../assets/images/Crop.jpg";
import segmentImg from "../../../assets/images/opacity-planet.jpg";
import "./PlantAnalysis.css";

// ─────────────────────────────────────────────
// iOS FIX 1: canvas.toBlob() fallback utility
// iOS Safari sometimes calls toBlob() with null.
// We detect that and manually convert toDataURL → Blob.
// ─────────────────────────────────────────────
const canvasToBlobSafe = (canvas, type = "image/jpeg", quality = 1.0) => {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback: toDataURL → manual Blob conversion
            const dataURL = canvas.toDataURL(type, quality);
            const arr = dataURL.split(",");
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            resolve(new Blob([u8arr], { type: mime }));
          }
        },
        type,
        quality
      );
    } catch {
      // Ultimate fallback if toBlob itself throws
      const dataURL = canvas.toDataURL(type, quality);
      const arr = dataURL.split(",");
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) u8arr[n] = bstr.charCodeAt(n);
      resolve(new Blob([u8arr], { type: mime }));
    }
  });
};

// ─────────────────────────────────────────────
// iOS FIX 2: Use FileReader instead of
// URL.createObjectURL() for image preview.
// createObjectURL can silently fail on some iOS
// versions / privacy modes.
// ─────────────────────────────────────────────
const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });

// ─────────────────────────────────────────────
// iOS FIX 3: Load an Image safely from a URL
// and wait for it, so canvas drawImage never
// races on iOS lazy-loading behaviour.
// ─────────────────────────────────────────────
const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed: " + src));
    // Required for canvas cross-origin safety on iOS
    img.crossOrigin = "anonymous";
    img.src = src;
  });

const text = {
  en: {
    dragDrop: "Drag and drop an image here",
    formats: "Supported formats: JPG, PNG. Max file size 5MB.",
    uploadImage: "Upload Image",
    mobileScanTitle: "Identify your plant \uD83C\uDF3F",
    mobileScanSubtitle: "Take a photo or upload from gallery",
    mobileScanMeta: "JPG, PNG \u2022 Max 5MB",
    done: "Done",
    objectDetection: "Object Detection",
    detectionSubtitle: "Object detection result with cropped plant regions",
    detectedLeaves: "Detected",
    leaves: "leaf(s)",
    classify: "Classify + Grad-CAM",
    classifySubtitle: "AI-based plant disease analysis",
    plantName: "Plant Name",
    diseaseName: "Disease Name",
    notDetectedYet: "Not Detected Yet",
    notClassifiedYet: "Not Classified Yet",
    confidence: "confidence",
    highConfidence: "High Confidence",
    awaitingAnalysis: "Awaiting Analysis",
    disease: "Disease",
    segmentation: "Segmentation",
    segmentationSubtitle: "Segmentation mask visualization",
    working: "Working",
    viewReport: "View Analysis Report",
    reportTitle: "Disease Analysis Report",
    health: "Health",
    detectedDiseases: "Detected Diseases",
    diseased: "diseased",
    healthy: "Healthy",
    plant: "Plant",
    infection: "Infection",
    severity: "Severity",
    diseaseNumber: "Disease",
    getSmartReport: "Get Smart Report",
    getFullSmartReport: "Get Full Smart Report (for all diseases)",
    noDiseasedLeaves: "No diseased leaves detected.",
    // Mobile picker translations
    choosePhoto: "Choose Photo",
    takePhoto: "Take Photo",
    chooseFromGallery: "Choose from Gallery",
    cancel: "Cancel",
  },
  ar: {
    dragDrop: "اسحب الصورة وأفلتها هنا",
    formats: "الصيغ المدعومة: JPG وPNG. الحد الأقصى 5MB.",
    uploadImage: "رفع صورة",
    mobileScanTitle: "تعرّف على نباتك 🌿",
    mobileScanSubtitle: "التقط صورة أو اختر من المعرض",
    mobileScanMeta: "JPG, PNG \u2022 \u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 5MB",
    done: "تم",
    objectDetection: "اكتشاف العناصر",
    detectionSubtitle: "نتيجة اكتشاف العناصر مع قص مناطق النبات",
    detectedLeaves: "تم اكتشاف",
    leaves: "ورقة",
    classify: "تصنيف + Grad-CAM",
    classifySubtitle: "تحليل أمراض النبات بالذكاء الاصطناعي",
    plantName: "اسم النبات",
    diseaseName: "اسم المرض",
    notDetectedYet: "لم يتم الاكتشاف بعد",
    notClassifiedYet: "لم يتم التصنيف بعد",
    confidence: "الثقة",
    highConfidence: "ثقة عالية",
    awaitingAnalysis: "بانتظار التحليل",
    disease: "المرض",
    segmentation: "التقسيم",
    segmentationSubtitle: "عرض قناع التقسيم",
    working: "جاري العمل",
    viewReport: "عرض تقرير التحليل",
    reportTitle: "تقرير تحليل الأمراض",
    health: "الصحة",
    detectedDiseases: "الأمراض المكتشفة",
    diseased: "مصابة",
    healthy: "سليمة",
    plant: "النبات",
    infection: "نسبة الإصابة",
    severity: "الحدة",
    diseaseNumber: "المرض",
    getSmartReport: "احصل على تقرير ذكي",
    getFullSmartReport: "احصل على تقرير ذكي كامل (لكل الأمراض)",
    noDiseasedLeaves: "لم يتم اكتشاف أوراق مصابة.",
    // Mobile picker translations
    choosePhoto: "اختيار صورة",
    takePhoto: "التقاط صورة",
    chooseFromGallery: "اختيار من المعرض",
    cancel: "إلغاء",
  },
};

const statusText = {
  en: {
    Waiting: "Waiting",
    Uploading: "Uploading",
    Processing: "Processing",
    Completed: "Completed",
  },
  ar: {
    Waiting: "انتظار",
    Uploading: "جاري الرفع",
    Processing: "جاري المعالجة",
    Completed: "مكتمل",
  },
};

const severityText = {
  en: {
    Low: "Low",
    Moderate: "Moderate",
    Severe: "Severe",
    Healthy: "Healthy",
    "Not Determined": "Not Determined",
    "Not Severity Yet": "Not Severity Yet",
  },
  ar: {
    Low: "منخفض",
    Moderate: "متوسط",
    Severe: "شديد",
    Healthy: "سليمة",
    "Not Determined": "غير محدد",
    "Not Severity Yet": "لم يتم تحديد الشدة بعد",
  },
};

const CLASS_MAPPING_AR_BY_EN = {
  "Apple - Apple Scab": "تفاح - جرب التفاح",
  "Apple - Black Rot": "تفاح - العفن الأسود",
  "Apple - Cedar Apple Rust": "تفاح - صدأ التفاح الأرزّي",
  "Apple - Alternaria Leaf Spot": "تفاح - تبقع أوراق ألترناريا",
  "Apple - Brown Spot": "تفاح - البقعة البنية",
  "Apple - Gray Spot": "تفاح - البقعة الرمادية",
  "Apple - Healthy": "تفاح - سليم",
  "Bitter Gourd - Downy Mildew": "القرع المر - البياض الزغبي",
  "Bitter Gourd - Fusarium Wilt": "القرع المر - ذبول الفيوزاريوم",
  "Bitter Gourd - Healthy": "القرع المر - سليم",
  "Bitter Gourd - Mosaic Virus": "القرع المر - فيروس الموزايك",
  "Blueberry - Healthy": "التوت الأزرق - سليم",
  "Bottle Gourd - Anthracnose": "القرع القاروري - الأنثراكنوز",
  "Bottle Gourd - Downy Mildew": "القرع القاروري - البياض الزغبي",
  "Bottle Gourd - Healthy": "القرع القاروري - سليم",
  "Cassava - Brown Streak Disease": "الكسافا - مرض الخط البني",
  "Cassava - Green Mottle": "الكسافا - التبقع الأخضر",
  "Cassava - Healthy": "الكسافا - سليم",
  "Cassava - Mosaic Disease": "الكسافا - مرض الموزايك",
  "Cauliflower - Black Rot": "القرنبيط - العفن الأسود",
  "Cauliflower - Downy Mildew": "القرنبيط - البياض الزغبي",
  "Cauliflower - Healthy": "القرنبيط - سليم",
  "Cherry (Including Sour) - Powdery Mildew": "الكرز - البياض الدقيقي",
  "Cherry (Including Sour) - Healthy": "الكرز - سليم",
  "Coffee - Healthy": "القهوة - سليم",
  "Coffee - Rust": "القهوة - صدأ القهوة",
  "Corn (Maize) - Cercospora Leaf Spot (Gray Leaf Spot)": "الذرة - تبقع أوراق سيركوسبورا (البقعة الرمادية)",
  "Corn (Maize) - Common Rust": "الذرة - الصدأ الشائع",
  "Corn (Maize) - Northern Leaf Blight": "الذرة - لفحة الأوراق الشمالية",
  "Corn (Maize) - Healthy": "الذرة - سليم",
  "Cotton - Diseased Leaf": "القطن - ورقة مصابة",
  "Cotton - Healthy Leaf": "القطن - ورقة سليمة",
  "Cucumber - Anthracnose": "الخيار - الأنثراكنوز",
  "Cucumber - Downy Mildew": "الخيار - البياض الزغبي",
  "Cucumber - Healthy": "الخيار - سليم",
  "Eggplant - Cercospora Leaf Spot": "الباذنجان - تبقع أوراق سيركوسبورا",
  "Eggplant - Hadda Beetles": "الباذنجان - خنفساء هادا",
  "Eggplant - Healthy": "الباذنجان - سليم",
  "Eggplant - Insect Pest Disease": "الباذنجان - مرض ناتج عن آفات حشرية",
  "Eggplant - Leaf Spot": "الباذنجان - تبقع الأوراق",
  "Eggplant - Mosaic Virus": "الباذنجان - فيروس الموزايك",
  "Eggplant - Phomopsis Blight": "الباذنجان - لفحة فوموبسيس",
  "Eggplant - Tobacco Caterpillar": "الباذنجان - دودة التبغ",
  "Eggplant - Wilt": "الباذنجان - الذبول",
  "Grape - Black Rot": "العنب - العفن الأسود",
  "Grape - Esca (Black Measles)": "العنب - إيسكا (الحصبة السوداء)",
  "Grape - Leaf Blight (Isariopsis Leaf Spot)": "العنب - لفحة الأوراق",
  "Grape - Healthy": "العنب - سليم",
  "Mango - Anthracnose": "المانجو - الأنثراكنوز",
  "Mango - Bacterial Canker": "المانجو - التقرح البكتيري",
  "Mango - Cutting Weevil": "المانجو - سوسة القطع",
  "Mango - Die Back": "المانجو - موت الأفرع",
  "Mango - Gall Midge": "المانجو - ذبابة المانجو",
  "Mango - Healthy": "المانجو - سليم",
  "Mango - Powdery Mildew": "المانجو - البياض الدقيقي",
  "Mango - Sooty Mould": "المانجو - العفن السخامي",
  "Orange - Huanglongbing (Citrus Greening)": "البرتقال - مرض اخضرار الحمضيات",
  "Peach - Bacterial Spot": "الخوخ - التبقع البكتيري",
  "Peach - Healthy": "الخوخ - سليم",
  "Pepper (Bell) - Bacterial Spot": "الفلفل الحلو - التبقع البكتيري",
  "Pepper (Bell) - Healthy": "الفلفل الحلو - سليم",
  "Potato - Early Blight": "البطاطس - اللفحة المبكرة",
  "Potato - Late Blight": "البطاطس - اللفحة المتأخرة",
  "Potato - Bacterial Wilt": "البطاطس - الذبول البكتيري",
  "Potato - Healthy": "البطاطس - سليم",
  "Potato - Leafroll Virus": "البطاطس - فيروس التفاف الأوراق",
  "Potato - Mosaic Virus": "البطاطس - فيروس الموزايك",
  "Potato - Pests": "البطاطس - آفات",
  "Potato - Phytophthora": "البطاطس - فيتوفثورا",
  "Raspberry - Healthy": "التوت الأحمر - سليم",
  "Rice - Bacterial Blight": "الأرز - اللفحة البكتيرية",
  "Rice - Blast": "الأرز - اللفحة",
  "Rice - Brown Spot": "الأرز - البقعة البنية",
  "Rice - Healthy": "الأرز - سليم",
  "Rice - Leaf Scald": "الأرز - لفحة الأوراق",
  "Rice - Leaf Smut": "الأرز - تفحم الأوراق",
  "Rice - Narrow Brown Leaf Spot": "الأرز - تبقع الأوراق البنية الضيقة",
  "Rice - Rice Hispa": "الأرز - حشرة الهيسبا",
  "Rice - Sheath Blight": "الأرز - لفحة الغمد",
  "Rice - Tungro": "الأرز - تونجرو",
  "Rose - Healthy": "الورد - سليم",
  "Rose - Rust": "الورد - الصدأ",
  "Rose - Slug Sawfly": "الورد - دودة الورد المنشارية",
  "Soybean - Healthy": "فول الصويا - سليم",
  "Squash - Powdery Mildew": "الكوسة - البياض الدقيقي",
  "Strawberry - Leaf Scorch": "الفراولة - احتراق الأوراق",
  "Strawberry - Healthy": "الفراولة - سليم",
  "Tomato - Bacterial Spot": "الطماطم - التبقع البكتيري",
  "Tomato - Early Blight": "الطماطم - اللفحة المبكرة",
  "Tomato - Late Blight": "الطماطم - اللفحة المتأخرة",
  "Tomato - Leaf Mold": "الطماطم - عفن الأوراق",
  "Tomato - Septoria Leaf Spot": "الطماطم - تبقع أوراق سيبتوريا",
  "Tomato - Spider Mites (Two-Spotted Spider Mite)": "الطماطم - العنكبوت الأحمر",
  "Tomato - Target Spot": "الطماطم - البقعة الهدفية",
  "Tomato - Tomato Yellow Leaf Curl Virus": "الطماطم - فيروس تجعد الأوراق الأصفر",
  "Tomato - Tomato Mosaic Virus": "الطماطم - فيروس موزايك الطماطم",
  "Tomato - Healthy": "الطماطم - سليم",
  "Tomato - Spotted Wilt": "الطماطم - الذبول المرقط",
  "Watermelon - Anthracnose": "البطيخ - الأنثراكنوز",
  "Watermelon - Downy Mildew": "البطيخ - البياض الزغبي",
  "Watermelon - Healthy": "البطيخ - سليم",
  "Watermelon - Mosaic Virus": "البطيخ - فيروس الموزايك",
};

const splitClassLabel = (label) => {
  const [plantName, ...diseaseParts] = (label || "").split(" - ");
  return {
    plantName: (plantName || "").trim(),
    diseaseName: diseaseParts.join(" - ").trim(),
  };
};

const PLANT_NAME_AR = {};
const DISEASE_NAME_AR = {};
Object.entries(CLASS_MAPPING_AR_BY_EN).forEach(([enLabel, arLabel]) => {
  const en = splitClassLabel(enLabel);
  const ar = splitClassLabel(arLabel);
  if (en.plantName && ar.plantName) PLANT_NAME_AR[en.plantName] = ar.plantName;
  if (en.diseaseName && ar.diseaseName) DISEASE_NAME_AR[en.diseaseName] = ar.diseaseName;
});

const localizePlantDisease = (plantName, diseaseName, language) => {
  if (language !== "ar") return { plantName, diseaseName };
  const safePlant = (plantName || "").trim();
  const safeDisease = (diseaseName || "").trim();
  const fullKey = `${safePlant} - ${safeDisease}`;
  const fullMatch = CLASS_MAPPING_AR_BY_EN[fullKey];
  if (fullMatch) return splitClassLabel(fullMatch);
  return {
    plantName: PLANT_NAME_AR[safePlant] || safePlant,
    diseaseName: DISEASE_NAME_AR[safeDisease] || safeDisease,
  };
};

const ANALYSIS_HISTORY_COLLECTION = "histroy";
const HISTORY_FALLBACK_PLANT_NAME = "Not Detected Yet";
const HISTORY_FALLBACK_DISEASE_NAME = "Not Classified Yet";
const HISTORY_FALLBACK_SEVERITY = "Not Determined";

// ─────────────────────────────────────────────
// Detect if we're on a mobile / touch device
// ─────────────────────────────────────────────
const isMobileDevice = () =>
  /iPhone|iPad|iPod|Android|Mobile/i.test(navigator.userAgent) ||
  ("ontouchstart" in window && navigator.maxTouchPoints > 0);

export default function PlantAnalysis({ setStep, setProgressValue, onSendReport }) {
  const { language } = useLanguage();
  const t = text[language] || text.en;

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [maskImage, setMaskImage] = useState(null);
  const [segInfo, setSegInfo] = useState({ image_width: 0, image_height: 0, leaf_pixel_count: 0 });
  const [cropImage, setCropImage] = useState(null);
  const [camImage, setCamImage] = useState(null);
  const [camResult, setCamResult] = useState(null);
  const [status, setStatus] = useState("Waiting");
  const [segStatus, setSegStatus] = useState("Waiting");
  const [progress, setProgress] = useState(0);
  const [totalBoxes, setTotalBoxes] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // ─────────────────────────────────────────────
  // iOS FIX 5: State for the custom mobile
  // photo-picker bottom sheet
  // ─────────────────────────────────────────────
  const [showMobilePicker, setShowMobilePicker] = useState(false);

  const defaultClassification = {
    image: classImg,
    disease: "",
    category: "",
    confidence: 0,
    diseasePercentage: 0,
    severity: "",
    maskImage: null,
    segInfo: { image_width: 0, image_height: 0, leaf_pixel_count: 0 },
    camImage: null,
  };

  const [classifications, setClassifications] = useState([defaultClassification]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [classificationStatus, setClassificationStatus] = useState("Waiting");

  const apiKey = import.meta.env.VITE_Detect_API_KEY;
  // Two separate file inputs — one with capture, one without
  const cameraInputRef = useRef();
  const galleryInputRef = useRef();
  const historySaveSignatureRef = useRef("");
  const activeAnalysisIdRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  const generateImageId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `IMG_${year}_${month}_${day}_${hours}${minutes}${seconds}`;
  };

  const formatReportData = () => {
    const imageId = generateImageId();
    const leaves = classifications
      .filter((c) => c.disease && c.disease !== "Awaiting Detection")
      .map((c, idx) => ({
        leaf_id: idx + 1,
        plant_name: c.disease || "Unknown",
        disease_name: c.category || "Not Classified",
        disease_percentage: parseFloat(c.diseasePercentage) || 0,
        severity: c.severity || "Unknown",
        image: c.image || null,
      }));
    return {
      image_id: imageId,
      total_leaves_detected: leaves.length,
      leaves,
    };
  };

  const generateAIPrompt = (leafData) => {
    const localizedLeaf = localizePlantDisease(leafData.plant_name, leafData.disease_name, language);
    const localizedSeverity =
      (severityText[language] && severityText[language][leafData.severity]) || leafData.severity;

    if (language === "ar") {
      return `
# 🌱 تقرير ذكي شامل لصحة النبات

أنت خبير محترف في أمراض النبات. فيما يلي طلب تحليل مرضي مبني على نتائج الذكاء الاصطناعي.

---

## 📋 رأس التقرير
| الحقل | القيمة |
|-------|--------|
| عدد الأمراض المكتشفة | 1 |
| تاريخ التحليل | ${new Date().toLocaleDateString()} |
| نوع التقرير | تحليل مرض واحد |

---

### 🌿 المرض رقم 1
- **اسم النبات:** ${localizedLeaf.plantName}
- **اسم المرض:** ${localizedLeaf.diseaseName}
- **نسبة الإصابة:** ${leafData.disease_percentage}%
- **مستوى الشدة:** ${localizedSeverity}

---

# 📊 هيكل التحليل المطلوب
## 1️⃣ نظرة عامة على المرض
## 2️⃣ الأسباب وعوامل الخطورة
## 3️⃣ تحليل نسبة الإصابة
## 4️⃣ تقييم مستوى الشدة
## 5️⃣ خطة علاج خطوة بخطوة
## 6️⃣ استراتيجية الوقاية طويلة المدى
## 7️⃣ علامات التحذير والتدهور

---

# 📈 الخلاصة والتوصيات النهائية
- **تقييم عام لصحة النبات**
- **أولويات التدخل**
- **المدة المتوقعة للتعافي**
- **أهم النقاط**

# ✅ قواعد التنسيق
- استخدم Markdown ونقاط واضحة، مع أسلوب علمي مبسط.
`;
    }

    return `
# 🌱 Comprehensive Plant Health Smart Report

You are a professional plant pathology expert.

---

## 📋 Report Header
| Field | Value |
|-------|-------|
| Total Diseases Detected | 1 |
| Analysis Date | ${new Date().toLocaleDateString()} |
| Report Type | Single Disease Analysis |

---

### 🌿 Disease #1
- **Plant Name:** ${localizedLeaf.plantName}
- **Disease Name:** ${localizedLeaf.diseaseName}
- **Infection Area:** ${leafData.disease_percentage}%
- **Severity Level:** ${localizedSeverity}

---

# 📊 Required Analysis Structure
## 1️⃣ Disease Overview
## 2️⃣ Causes & Risk Factors
## 3️⃣ Infection Percentage Analysis
## 4️⃣ Severity Level Assessment
## 5️⃣ Step-by-Step Treatment Plan
## 6️⃣ Long-Term Prevention Strategy
## 7️⃣ Warning Signs & Escalation

---

# 📈 Final Summary & Recommendations
- **Overall Plant Health Score**
- **Priority Actions**
- **Expected Recovery Timeline**
- **Key Takeaways**

# ✅ Formatting Rules
- Use Markdown, bullet points, keep it scientific yet clear.
`;
  };

  const generateAllDiseasesPrompt = () => {
    const diseasedLeaves = reportData.leaves.filter(
      (leaf) =>
        leaf.severity &&
        leaf.severity !== "Healthy" &&
        leaf.severity !== "Not Determined" &&
        leaf.severity !== "Not Severity Yet"
    );

    const localizedDiseasedLeaves = diseasedLeaves.map((leaf) => {
      const localizedLeaf = localizePlantDisease(leaf.plant_name, leaf.disease_name, language);
      const localizedSeverity =
        (severityText[language] && severityText[language][leaf.severity]) || leaf.severity;
      return { ...leaf, plant_name: localizedLeaf.plantName, disease_name: localizedLeaf.diseaseName, severity: localizedSeverity };
    });

    if (diseasedLeaves.length > 5) {
      const batches = [];
      for (let i = 0; i < diseasedLeaves.length; i += 3) {
        const batch = localizedDiseasedLeaves.slice(i, i + 3);
        const diseasesList = batch
          .map(
            (leaf, idx) => `### Disease #${i + idx + 1}\n- Plant: ${leaf.plant_name}\n- Disease: ${leaf.disease_name}\n- Infection: ${leaf.disease_percentage}%\n- Severity: ${leaf.severity}`
          )
          .join("\n\n");
        batches.push(`# Plant Health Smart Report\n\n${diseasesList}\n\nAnalyze each disease above with full structured sections.`);
      }
      return { isBatch: true, prompts: batches };
    }

    const diseasesList = localizedDiseasedLeaves
      .map(
        (leaf, idx) =>
          `### Disease #${idx + 1}\n- Plant: ${leaf.plant_name}\n- Disease: ${leaf.disease_name}\n- Infection: ${leaf.disease_percentage}%\n- Severity: ${leaf.severity}`
      )
      .join("\n\n");

    return `# 🌱 Comprehensive Plant Health Smart Report\n\nAnalyze ALL diseases below:\n\n${diseasesList}\n\nFor each disease provide: Overview, Causes, Infection Analysis, Severity, Treatment Plan, Prevention, Warning Signs.\n\nThen give a Final Summary with Overall Health Score, Priority Actions, and Key Takeaways.`;
  };

  const handleGenerateReport = () => {
    const data = formatReportData();
    setReportData(data);
    setShowReportModal(true);
  };

  const handleSendToAI = (leafData, isHidden = false) => {
    const prompt = leafData === "all" ? generateAllDiseasesPrompt() : generateAIPrompt(leafData);
    if (onSendReport) onSendReport(prompt, isHidden);
    else sessionStorage.setItem("plantAnalysisPrompt", prompt);
    setShowReportModal(false);
  };

  const buildHistoryEntries = (analysisEntries = []) => {
    const sourceEntries = Array.isArray(analysisEntries) && analysisEntries.length > 0 ? analysisEntries : [{}];
    return sourceEntries.map((entry, index) => {
      const rawPlantName =
        entry?.disease && entry.disease !== "Awaiting Detection"
          ? String(entry.disease).trim()
          : HISTORY_FALLBACK_PLANT_NAME;
      const rawDiseaseName = entry?.category ? String(entry.category).trim() : HISTORY_FALLBACK_DISEASE_NAME;
      const rawSeverity = entry?.severity ? String(entry.severity).trim() : HISTORY_FALLBACK_SEVERITY;
      const confidence = Number.parseFloat(entry?.confidence ?? 0);
      const diseasePercentage = Number.parseFloat(entry?.diseasePercentage ?? 0);
      const arabicNames = localizePlantDisease(rawPlantName, rawDiseaseName, "ar");
      const hasDisease =
        Number.isFinite(diseasePercentage) &&
        diseasePercentage > 0 &&
        rawSeverity !== "Healthy" &&
        rawSeverity !== "Not Severity Yet";
      return {
        leafId: index + 1,
        plantName: rawPlantName,
        diseaseName: rawDiseaseName,
        diseasePercentage: Number.isFinite(diseasePercentage) ? Number(diseasePercentage.toFixed(2)) : 0,
        confidence: Number.isFinite(confidence) ? Number(confidence.toFixed(2)) : 0,
        severity: rawSeverity,
        localizedPlantNameAr:
          rawPlantName === HISTORY_FALLBACK_PLANT_NAME ? text.ar.notDetectedYet : arabicNames.plantName,
        localizedDiseaseNameAr:
          rawDiseaseName === HISTORY_FALLBACK_DISEASE_NAME ? text.ar.notClassifiedYet : arabicNames.diseaseName,
        localizedSeverityAr: (severityText.ar && severityText.ar[rawSeverity]) || rawSeverity,
        hasDisease,
      };
    });
  };

  const saveAnalysisToHistory = async (analysisEntries = [], options = {}) => {
    const authUser = auth.currentUser;
    if (!authUser?.uid) return;
    const normalizedEntries = buildHistoryEntries(analysisEntries);
    const signature = JSON.stringify({
      fileName: options.fileName || "",
      totalLeavesDetected: options.totalLeavesDetected ?? normalizedEntries.length,
      entries: normalizedEntries.map((e) => ({
        plantName: e.plantName,
        diseaseName: e.diseaseName,
        diseasePercentage: e.diseasePercentage,
        severity: e.severity,
      })),
    });
    if (historySaveSignatureRef.current === signature) return;
    historySaveSignatureRef.current = signature;
    const now = new Date();
    const primaryEntry = normalizedEntries[0];
    const ownerAccount = authUser.email || authUser.displayName || authUser.uid;
    try {
      await addDoc(collection(db, ANALYSIS_HISTORY_COLLECTION), {
        ownerId: authUser.uid,
        ownerEmail: authUser.email || "",
        ownerDisplayName: authUser.displayName || "",
        ownerAccount,
        fileName: options.fileName || "",
        totalLeavesDetected: options.totalLeavesDetected ?? normalizedEntries.length,
        hasDetectedDisease: normalizedEntries.some((e) => e.hasDisease),
        primaryPlantName: primaryEntry?.plantName || HISTORY_FALLBACK_PLANT_NAME,
        primaryDiseaseName: primaryEntry?.diseaseName || HISTORY_FALLBACK_DISEASE_NAME,
        primaryDiseasePercentage: primaryEntry?.diseasePercentage || 0,
        primaryLocalizedPlantNameAr: primaryEntry?.localizedPlantNameAr || text.ar.notDetectedYet,
        primaryLocalizedDiseaseNameAr: primaryEntry?.localizedDiseaseNameAr || text.ar.notClassifiedYet,
        entries: normalizedEntries,
        analyzedAt: serverTimestamp(),
        analyzedAtIso: now.toISOString(),
        analyzedAtMs: now.getTime(),
        analysisDayName: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(now),
        analysisDate: new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(now),
        analysisTime: new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(now),
      });
    } catch (error) {
      historySaveSignatureRef.current = "";
      console.error("Failed to save plant analysis history:", error);
    }
  };

  // ─────────────────────────────────────────────
  // iOS FIX 2: Use FileReader for preview URL
  // instead of URL.createObjectURL()
  // ─────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    const nextAnalysisId = activeAnalysisIdRef.current + 1;
    activeAnalysisIdRef.current = nextAnalysisId;
    historySaveSignatureRef.current = "";

    // Use FileReader — safe on all iOS versions
    try {
      const dataUrl = await readFileAsDataURL(file);
      setSelectedFile(file);
      setPreviewUrl(dataUrl);
    } catch {
      console.error("Could not read file preview");
      setSelectedFile(file);
    }

    setStep(0);
    uploadAndDetect(file, nextAnalysisId);
  };

  const handleCancel = () => {
    activeAnalysisIdRef.current += 1;
    historySaveSignatureRef.current = "";
    setSelectedFile(null);
    setPreviewUrl(null);
    setFinalImage(null);
    setStatus("Waiting");
    setProgress(0);
    setTotalBoxes(0);
    setMaskImage(null);
    setSegInfo({ image_width: 0, image_height: 0, leaf_pixel_count: 0 });
    setClassifications([defaultClassification]);
    setCurrentIndex(0);
    setClassificationStatus("Waiting");
    setCamImage(null);
    setCamResult(null);
    setSegStatus("Waiting");
    setCropImage(null);
    setStep(0);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  // ─────────────────────────────────────────────
  // iOS FIX 5: Upload button click handler
  // On mobile → show custom bottom sheet picker
  // On desktop → open file picker directly
  // ─────────────────────────────────────────────
  const handleUploadBtnClick = () => {
    if (isMobileDevice()) {
      setShowMobilePicker(true);
    } else {
      galleryInputRef.current.click();
    }
  };

  // Called when user taps "Take Photo" in the bottom sheet
  const handlePickCamera = () => {
    setShowMobilePicker(false);
    cameraInputRef.current.click();
  };

  // Called when user taps "Choose from Gallery" in the bottom sheet
  const handlePickGallery = () => {
    setShowMobilePicker(false);
    galleryInputRef.current.click();
  };

  const uploadAndDetect = (file, analysisId) => {
    historySaveSignatureRef.current = "";
    setStatus("Uploading");
    setSegStatus("Waiting");
    setClassificationStatus("Waiting");
    setProgress(10);
    setProgressValue && setProgressValue(10);
    setStep(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://armia-gamal-plant-leaf-detection-api.hf.space/detect");
    xhr.setRequestHeader("Authorization", `Bearer ${apiKey}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
        setProgressValue && setProgressValue(percent);
      }
    };

    xhr.onload = async () => {
      if (activeAnalysisIdRef.current !== analysisId) return;

      if (xhr.status === 200) {
        setStatus("Processing");
        setStep(1);

        const res = JSON.parse(xhr.responseText);
        setTotalBoxes(res.total_boxes || 0);

        // ─────────────────────────────────────────────
        // iOS FIX 2+3: Load image via FileReader dataURL
        // then use loadImage() helper so drawImage is
        // guaranteed to work on iOS canvas.
        // ─────────────────────────────────────────────
        let fileDataUrl;
        try {
          fileDataUrl = await readFileAsDataURL(file);
        } catch {
          console.error("Could not read file for canvas processing");
          return;
        }

        let img;
        try {
          img = await loadImage(fileDataUrl);
        } catch {
          console.error("Image load failed for canvas");
          return;
        }

        if (activeAnalysisIdRef.current !== analysisId) return;

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        ctx.strokeStyle = "#22C55E";
        ctx.lineWidth = 6;
        res.boxes.forEach((box) => {
          ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
        });

        // iOS FIX: use toDataURL directly for detection overlay —
        // toDataURL is reliable on all iOS versions
        setFinalImage(canvas.toDataURL("image/jpeg", 0.92));

        // Generate crop preview from first box
        if (res.boxes && res.boxes.length > 0) {
          const box = res.boxes[0];
          const cw = box.x2 - box.x1;
          const ch = box.y2 - box.y1;
          const cropCanvas = document.createElement("canvas");
          cropCanvas.width = cw;
          cropCanvas.height = ch;
          const ctx2 = cropCanvas.getContext("2d");
          ctx2.drawImage(img, box.x1, box.y1, cw, ch, 0, 0, cw, ch);
          const cropUrl = cropCanvas.toDataURL("image/jpeg", 0.92);
          setCropImage(cropUrl);
          setClassifications([{ ...defaultClassification, image: cropUrl }]);
        }

        // Segmentation on first crop (or full image)
        let segBlob = null;
        try {
          if (res.boxes && res.boxes.length > 0) {
            const box = res.boxes[0];
            const cw = box.x2 - box.x1;
            const ch = box.y2 - box.y1;
            const cropCanvas = document.createElement("canvas");
            cropCanvas.width = cw;
            cropCanvas.height = ch;
            const ctx2 = cropCanvas.getContext("2d");
            ctx2.drawImage(img, box.x1, box.y1, cw, ch, 0, 0, cw, ch);
            // iOS FIX 1: use canvasToBlobSafe instead of toBlob()
            segBlob = await canvasToBlobSafe(cropCanvas, "image/jpeg", 1.0);
          }

          const segForm = new FormData();
          segForm.append("file", segBlob || file);
          const segRes = await fetch(
            "https://armia-gamal-plant-leaf-detection-api.hf.space/segment",
            { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: segForm }
          );
          if (segRes.ok) {
            const segData = await segRes.json();
            if (segData.mask_image_base64) {
              setMaskImage("data:image/jpeg;base64," + segData.mask_image_base64);
            }
            setSegInfo({
              image_width: segData.image_width || 0,
              image_height: segData.image_height || 0,
              leaf_pixel_count: segData.leaf_pixel_count || 0,
            });
          }
        } catch (e) {
          console.warn("Segmentation error", e);
        }

        if (activeAnalysisIdRef.current !== analysisId) return;

        setStatus("Completed");
        setProgress(100);
        setStep(2);

        if (res.boxes && res.boxes.length > 0) {
          try {
            await runClassification(img, res.boxes, analysisId, file);
          } catch (e) {
            console.warn("Classification error", e);
          }
        } else {
          setClassifications([defaultClassification]);
          setClassificationStatus("Completed");
          setStep(4);
          void saveAnalysisToHistory([], { fileName: file?.name || "", totalLeavesDetected: 0 });
        }
      }
    };

    xhr.send(formData);
  };

  // ─────────────────────────────────────────────
  // iOS FIX 1: All canvas.toBlob() replaced with
  // canvasToBlobSafe() throughout runClassification
  // ─────────────────────────────────────────────
  const runClassification = async (img, boxes, analysisId, file) => {
    if (activeAnalysisIdRef.current !== analysisId) return;

    setStep(3);
    setClassificationStatus("Processing");

    // Create all crop blobs first
    const cropData = await Promise.all(
      boxes.map(async (box) => {
        const width = box.x2 - box.x1;
        const height = box.y2 - box.y1;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, box.x1, box.y1, width, height, 0, 0, width, height);
        // iOS FIX 1: safe blob conversion
        const blob = await canvasToBlobSafe(canvas, "image/jpeg", 1.0);
        return { blob, canvas };
      })
    );

    const results = await Promise.all(
      cropData.map(async ({ blob, canvas }) => {
        const camPromise = (async () => {
          try {
            const form = new FormData();
            form.append("file", blob);
            const resp = await fetch(
              "https://armia-gamal-plant-leaf-detection-api.hf.space/classify-cam",
              { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form }
            );
            return resp.ok ? await resp.json() : null;
          } catch (e) {
            console.warn("cam error", e);
            return null;
          }
        })();

        const segPromise = (async () => {
          try {
            const form = new FormData();
            form.append("file", blob);
            const resp = await fetch(
              "https://armia-gamal-plant-leaf-detection-api.hf.space/segment",
              { method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: form }
            );
            return resp.ok ? await resp.json() : null;
          } catch (e) {
            console.warn("segment error", e);
            return null;
          }
        })();

        const [camData, sData] = await Promise.all([camPromise, segPromise]);

        const plantName = (camData && camData.plant_name) || "Awaiting Detection";
        const diseaseName = (camData && camData.disease_name) || "Not Classified Yet";
        const confidenceRaw = camData && typeof camData.confidence === "number" ? camData.confidence : 0;
        const diseasePercentRaw =
          camData && typeof camData.disease_percentage === "number" ? camData.disease_percentage : 0;
        const severityName = (camData && camData.severity) || "Not Determined";

        return {
          // iOS FIX: fallback to canvas.toDataURL for crop preview
          image: camData && camData.image_base64
            ? "data:image/jpeg;base64," + camData.image_base64
            : canvas.toDataURL("image/jpeg", 0.92),
          disease: plantName,
          category: diseaseName,
          confidence: confidenceRaw ? (confidenceRaw * 100).toFixed(2) : 0,
          diseasePercentage: diseasePercentRaw ? Number(diseasePercentRaw).toFixed(2) : 0,
          severity: severityName,
          camImage: camData && camData.image_base64
            ? "data:image/jpeg;base64," + camData.image_base64
            : null,
          maskImage: sData && sData.mask_image_base64
            ? "data:image/jpeg;base64," + sData.mask_image_base64
            : null,
          segInfo: {
            image_width: sData?.image_width || 0,
            image_height: sData?.image_height || 0,
            leaf_pixel_count: sData?.leaf_pixel_count || 0,
          },
        };
      })
    );

    if (activeAnalysisIdRef.current !== analysisId) return;

    setClassifications(results);
    setCurrentIndex(0);
    if (results.length > 0) {
      setCamImage(results[0].camImage || null);
      setCamResult(results[0]);
      setMaskImage(results[0].maskImage || null);
      setSegInfo(results[0].segInfo || { image_width: 0, image_height: 0, leaf_pixel_count: 0 });
    }

    setClassificationStatus("Completed");
    setStep(4);
    void saveAnalysisToHistory(results, { fileName: file?.name || "", totalLeavesDetected: boxes.length });
  };

  const handleChangeIndex = (newIndex) => {
    const idx = Math.max(0, Math.min(newIndex, classifications.length - 1));
    setCurrentIndex(idx);
    const entry = classifications[idx] || defaultClassification;
    setMaskImage(entry.maskImage || null);
    setSegInfo(entry.segInfo || { image_width: 0, image_height: 0, leaf_pixel_count: 0 });
    setCamImage(entry.camImage || null);
    setCamResult(entry);
  };

  const offset = circumference - (progress / 100) * circumference;
  const current = classifications[currentIndex] || defaultClassification;
  const localizeStatus = (value) => (statusText[language] && statusText[language][value]) || value;
  const localizeSeverity = (value) => (severityText[language] && severityText[language][value]) || value;
  const infoSource = camResult || current;
  const diseaseText = infoSource && infoSource.disease === "Awaiting Detection" ? "" : (infoSource && infoSource.disease) || "";
  const categoryText = (infoSource && infoSource.category) || "";
  const localizedCurrentNames = localizePlantDisease(diseaseText, categoryText, language);
  const displayPlantNameText = localizedCurrentNames.plantName;
  const displayDiseaseNameText = localizedCurrentNames.diseaseName;
  const confidenceText = (infoSource && infoSource.confidence) || 0;
  const displayDiseasePercent = infoSource && infoSource.diseasePercentage ? infoSource.diseasePercentage : 0;
  const displaySeverityText = (infoSource && infoSource.severity) || "";
  const displaySeverityLabel = localizeSeverity(displaySeverityText);
  const showDiseaseRow =
    displayDiseasePercent > 0 &&
    displaySeverityText !== "Healthy" &&
    displaySeverityText !== "Not Severity Yet";
  const displayImage =
    displaySeverityText === "Healthy"
      ? current.image || classImg
      : camImage || (current && current.image) || cropImage || classImg;
  const prevArrow = language === "ar" ? "▶" : "◀";
  const nextArrow = language === "ar" ? "◀" : "▶";
  const isClassifyScanActive = classificationStatus === "Processing" && !!cropImage;

  return (
    <div className="container">
      <div className="card large-card">
        <div className="inner-box">
          <div className="layer-3">
            <div
              className={`upload-content ${selectedFile ? "has-file" : "is-idle"} ${isDragging ? "drag-active" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="image-box">
                {/* iOS FIX 4: add display:block + explicit dimensions via className */}
                <img src={previewUrl || bgImage} alt="plant" className="preview-img" />
              </div>

              <div className={`upload-text ${selectedFile ? "no-margin" : ""}`}>
                {!selectedFile && (
                  <>
                    <div className="image-upload image-upload--desktop">
                      <img src={uploadImg} alt="upload" />
                    </div>
                    <div className="image-upload image-upload--mobile">
                      <img src={mobileUploadImg} alt="camera" />
                    </div>
                    <h2 className="upload-title upload-title--desktop">{t.dragDrop}</h2>
                    <h2 className="upload-title upload-title--mobile">{t.mobileScanTitle}</h2>
                    <p className="upload-copy upload-copy--desktop">{t.formats}</p>
                    <p className="upload-copy upload-copy--mobile">{t.mobileScanSubtitle}</p>
                    <p className="upload-copy upload-copy--mobile upload-copy--meta">{t.mobileScanMeta}</p>

                    <button className="upload-btn" onClick={handleUploadBtnClick}>
                      <span className="upload-btn-label upload-btn-label--desktop">Upload Image</span>
                      <span className="upload-btn-label upload-btn-label--mobile">
                        {language === "ar" ? "فحص النبات 🌿" : "Scan Your Plant 🌿"}
                      </span>
                    </button>
                  </>
                )}

                {selectedFile && (
                  <div className="progress-ring-wrapper">
                    <svg width="90" height="90">
                      <circle stroke="#E5E7EB" fill="transparent" strokeWidth="6" r={radius} cx="45" cy="45" />
                      <circle
                        stroke="#22C55E"
                        fill="transparent"
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        r={radius}
                        cx="45"
                        cy="45"
                      />
                    </svg>
                    <div className="progress-ring-text">
                      {status === "Completed" ? t.done : `${progress}%`}
                    </div>
                    <button className="cancel-btn" onClick={handleCancel}>✕</button>
                  </div>
                )}

                {/* ─────────────────────────────────────────────
                    iOS FIX 5: Two separate hidden file inputs.
                    - cameraInputRef: has capture="environment"
                      so iOS opens the camera directly.
                    - galleryInputRef: no capture, opens gallery.
                    Using two inputs avoids the race condition
                    of setting/removing 'capture' attr dynamically.
                ───────────────────────────────────────────── */}
                <input
                  type="file"
                  hidden
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                <input
                  type="file"
                  hidden
                  ref={galleryInputRef}
                  accept="image/*"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cards-row">
        {/* Detection */}
        <div className="card small-card detection-card">
          <div className="detection-header">
            <h2 className="detection-title">{t.objectDetection}</h2>
            <p className="detection-subtitle">
              {t.detectionSubtitle}
              {status === "Completed" && (
                <> — {t.detectedLeaves} {totalBoxes} {t.leaves}</>
              )}
            </p>
          </div>
          <div className="detection-image-box">
            <span className="completed-badge">{localizeStatus(status)}</span>
            <div className="detection-inner-layer">
              {/* iOS FIX 4: explicit block display + contain fit */}
              <img src={finalImage || detectImg} alt="Detection" className="result-img" />
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="card small-card classification-card">
          <div className="classification-header">
            <div>
              <h2 className="classification-title">{t.classify}</h2>
              <p className="classification-subtitle">{t.classifySubtitle}</p>
            </div>
            {classifications.length > 1 && (
              <div className={`arrow-controls ${language === "ar" ? "rtl" : "ltr"}`}>
                <button type="button" onClick={() => handleChangeIndex(currentIndex - 1)}>{prevArrow}</button>
                <span style={{ whiteSpace: "nowrap" }}>{currentIndex + 1} / {classifications.length}</span>
                <button type="button" onClick={() => handleChangeIndex(currentIndex + 1)}>{nextArrow}</button>
              </div>
            )}
            <span className="classifier-badge">{localizeStatus(classificationStatus)}</span>
          </div>

          <div className="classification-content">
            <div className={`classification-image-box ${isClassifyScanActive ? "scan-active" : ""}`}>
              <img
                src={displayImage}
                alt="Classified"
                className={`result-img ${displayImage === classImg ? "" : "uploaded-image"}`}
              />
            </div>
            <div className="classification-info">
              <div className="info-group">
                <p className="info-label">{t.plantName} :</p>
                <p className="info-value">{displayPlantNameText || t.notDetectedYet}</p>
              </div>
              <div className="info-group">
                <p className="info-label">{t.diseaseName} :</p>
                <p className="info-value">{displayDiseaseNameText || t.notClassifiedYet}</p>
              </div>
            </div>
          </div>

          <div className="confidence-section">
            <div className="confidence-row">
              <div className="confidence-item">
                <p className="confidence-text">
                  {t.confidence}:
                  <span className="confidence-value">
                    {confidenceText}%
                    <span className="confidence-sub-label">
                      {Number(confidenceText) > 0 ? `(${t.highConfidence})` : `(${t.awaitingAnalysis})`}
                    </span>
                  </span>
                </p>
                <div className="confidence-bar-bg">
                  <div className="confidence-bar-fill" style={{ width: `${confidenceText}%` }} />
                </div>
              </div>

              {showDiseaseRow && (
                <div className="confidence-item">
                  <p className="confidence-text">
                    {t.disease} :
                    <span className="confidence-value">
                      {displayDiseasePercent}%
                      <span className="confidence-sub-label">({displaySeverityLabel})</span>
                    </span>
                  </p>
                  <div className="confidence-bar-bg">
                    {displayDiseasePercent > 0 && (
                      <div className="confidence-bar-fill" style={{ width: `${displayDiseasePercent}%` }} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Segmentation */}
        <div className="card small-card segmentation-card">
          <div className="segmentation-header">
            <h2 className="segmentation-title">{t.segmentation}</h2>
            <p className="segmentation-subtitle">{t.segmentationSubtitle}</p>
          </div>
          <div className="segmentation-image-box">
            <span className="completed-badge">
              {maskImage
                ? localizeStatus("Completed")
                : segStatus === "Processing"
                ? t.working
                : localizeStatus(segStatus)}
            </span>
            <div className="segmentation-inner-layer">
              <img src={maskImage || segmentImg} alt="Segmentation" className="result-img" />
            </div>
          </div>
        </div>
      </div>

      {classificationStatus === "Completed" &&
        classifications.length > 0 &&
        classifications[0].disease !== "" && (
          <p className="report-link-text" onClick={handleGenerateReport}>
            {t.viewReport}
          </p>
        )}

      {/* Report Modal */}
      {showReportModal && reportData && (
        <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h2>{t.reportTitle}</h2>
              <button className="report-close-btn" onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <div className="report-modal-content">
              <div className="report-leaves-list">
                <h3>{t.detectedDiseases}</h3>
                {reportData.leaves.length > 0 &&
                  (() => {
                    const healthyCount = reportData.leaves.filter((l) => l.severity === "Healthy").length;
                    const diseasedCount = reportData.leaves.length - healthyCount;
                    const total = reportData.leaves.length;
                    const healthyPct = total ? Math.round((healthyCount / total) * 100) : 0;
                    const diseasedPct = total ? 100 - healthyPct : 0;
                    return (
                      <div className="donut-container">
                        <div
                          className="donut-chart"
                          onMouseLeave={() => setHoveredSegment(null)}
                          onMouseMove={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left - rect.width / 2;
                            const y = e.clientY - rect.top - rect.height / 2;
                            const angle = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
                            const threshold = (diseasedPct / 100) * 360;
                            setHoveredSegment(
                              angle < threshold
                                ? `${t.diseased} ${diseasedPct}%`
                                : `${t.healthy} ${healthyPct}%`
                            );
                          }}
                          style={{ "--pct": diseasedPct + "%" }}
                        >
                          <div className="donut-center">
                            {hoveredSegment || `${diseasedPct}% ${t.diseased}`}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {reportData.leaves.length > 0 ? (
                  <>
                    <div className="leaves-cards-with-images">
                      {reportData.leaves.map((leaf, idx) => {
                        const localizedLeaf = localizePlantDisease(leaf.plant_name, leaf.disease_name, language);
                        return (
                          <div key={idx} className="leaf-card-with-image">
                            <div className="leaf-image-col">
                              {leaf.image && (
                                <img src={leaf.image} alt={`Leaf ${leaf.leaf_id}`} className="leaf-report-image" />
                              )}
                            </div>
                            <div className="leaf-info-col">
                              <h4>{t.diseaseNumber} #{leaf.leaf_id}</h4>
                              <p><strong>{t.plant}:</strong> {localizedLeaf.plantName}</p>
                              <p><strong>{t.disease}:</strong> {localizedLeaf.diseaseName}</p>
                              <p><strong>{t.infection}:</strong> {leaf.disease_percentage}%</p>
                              <p><strong>{t.severity}:</strong> {localizeSeverity(leaf.severity)}</p>
                              {leaf.severity !== "Healthy" && (
                                <button className="send-to-ai-btn" onClick={() => handleSendToAI(leaf, true)}>
                                  {t.getSmartReport}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {reportData.leaves.length > 1 && (
                      <button className="send-all-btn" onClick={() => handleSendToAI("all", true)}>
                        {t.getFullSmartReport}
                      </button>
                    )}
                  </>
                ) : (
                  <p>{t.noDiseasedLeaves}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          iOS FIX 5: Custom mobile photo-picker
          bottom sheet. Shows when showMobilePicker
          is true. Two clear options: Camera / Gallery.
          Backdrop tap closes it.
      ───────────────────────────────────────────── */}
      {showMobilePicker && (
        <div className="mobile-picker-overlay" onClick={() => setShowMobilePicker(false)}>
          <div className="mobile-picker-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-picker-title">{t.choosePhoto}</div>

            <button className="mobile-picker-btn mobile-picker-btn--camera" onClick={handlePickCamera}>
              <span className="mobile-picker-icon">📷</span>
              {t.takePhoto}
            </button>

            <button className="mobile-picker-btn mobile-picker-btn--gallery" onClick={handlePickGallery}>
              <span className="mobile-picker-icon">🖼</span>
              {t.chooseFromGallery}
            </button>

            <button className="mobile-picker-btn mobile-picker-btn--cancel" onClick={() => setShowMobilePicker(false)}>
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}