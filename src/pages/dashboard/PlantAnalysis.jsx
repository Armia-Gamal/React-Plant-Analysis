import { useState, useRef } from "react";
import bgImage from "../../assets/images/OIP.jpg";
import uploadImg from "../../assets/images/hoolding-leaf-svgrepo-com.svg";
import detectImg from "../../assets/images/Gemini_Generate.png";
import classImg from "../../assets/images/Crop.jpg";
import segmentImg from "../../assets/images/opacity-planet.jpg";
import "./PlantAnalysis.css";

export default function PlantAnalysis({ setStep, setProgressValue, onSendReport }) {

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [maskImage, setMaskImage] = useState(null);
  const [segInfo, setSegInfo] = useState({ image_width:0, image_height:0, leaf_pixel_count:0 });
  const [cropImage, setCropImage] = useState(null);
  const [camImage, setCamImage] = useState(null);
  const [camResult, setCamResult] = useState(null); // store results from Grad-CAM endpoint
  const [status, setStatus] = useState("Waiting"); // detection status
  const [segStatus, setSegStatus] = useState("Waiting"); // segmentation status
  const [progress, setProgress] = useState(0);
  const [totalBoxes, setTotalBoxes] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const defaultClassification = {
    image: classImg,
    disease: "",
    category: "",
    confidence: 0,
    diseasePercentage: 0,
    severity: ""
    ,maskImage: null,
    segInfo: { image_width:0, image_height:0, leaf_pixel_count:0 },
    camImage: null
  };

  const [classifications, setClassifications] = useState([defaultClassification]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [classificationStatus, setClassificationStatus] = useState("Waiting");

  const apiKey = import.meta.env.VITE_Detect_API_KEY;
  const fileInputRef = useRef();
  const [isDragging, setIsDragging] = useState(false);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  // Generate timestamp for image ID
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

  // Format classifications into report JSON structure
  const formatReportData = () => {
    const imageId = generateImageId();
    const leaves = classifications
      .filter(c => c.disease && c.disease !== "Awaiting Detection")
      .map((c, idx) => ({
        leaf_id: idx + 1,
        plant_name: c.disease || "Unknown",
        disease_name: c.category || "Not Classified",
        disease_percentage: parseFloat(c.diseasePercentage) || 0,
        severity: c.severity || "Unknown",
        image: c.image || null
      }));

    return {
      image_id: imageId,
      total_leaves_detected: leaves.length,
      leaves: leaves
    };
  };

  // Generate AI prompt for single disease (Markdown format)
  const generateAIPrompt = (leafData) => {
    return `
# 🌿 AI Plant Disease Smart Report

You are a professional plant pathology expert specialized in diagnosing and treating crop and fruit tree diseases.

---

## 📌 Case Information

- **Plant Name:** ${leafData.plant_name}
- **Health Status:** Diseased
- **Disease Name:** ${leafData.disease_name}
- **Infection Area:** ${leafData.disease_percentage}%
- **Severity Level:** ${leafData.severity}

---

## 1️⃣ Disease Overview

Provide a clear explanation of:

- What is **${leafData.disease_name}** in ${leafData.plant_name}?
- What type of pathogen causes it? (Fungus, Bacteria, Virus, etc.)
- How does it biologically affect the plant tissues?

---

## 2️⃣ Causes of the Disease

Explain the possible causes including:

- 🌦 Environmental factors (humidity, temperature, rainfall, poor ventilation)
- 🌱 Soil-related issues
- 💧 Irrigation mistakes
- 🌿 Fertilization imbalance
- 🛡 Plant immunity weakness
- 🔄 Infection spread mechanisms

---

## 3️⃣ Infection Percentage Analysis (${leafData.disease_percentage}%)

- Is this infection level considered low, moderate, or high?
- What does ${leafData.disease_percentage}% infection practically mean?
- Can the disease still be controlled at this stage?
- Expected progression if untreated

---

## 4️⃣ Severity Level Assessment (${leafData.severity})

- What does "${leafData.severity}" severity indicate?
- Biological impact at this stage
- Risk level if no intervention is applied

---

## 5️⃣ Step-by-Step Treatment Plan

Provide a structured treatment plan including:

### 🚑 Immediate Actions
- First emergency steps

### ✂️ Pruning Strategy
- How to safely remove infected parts

### 🧪 Treatment Recommendations
- Recommended active ingredients (not only brand names)
- Fungicides / bactericides if applicable

### 📅 Application Schedule
- Spray intervals
- Duration of treatment

### 🛡 Post-Treatment Protection
- Prevent reinfection

---

## 6️⃣ Long-Term Prevention Strategy

- 🌬 Improve air circulation
- 📏 Proper plant spacing
- 💦 Optimized irrigation practices
- 🌾 Balanced fertilization program
- 🧼 Tool sterilization procedures
- 🧑‍🌾 Seasonal monitoring plan

---

## 7️⃣ Warning Signs & Escalation

- Symptoms indicating disease worsening
- When immediate professional agricultural consultation is required

---

# ✅ Response Instructions

- Use clear headings and bullet points.
- Keep the explanation scientifically accurate.
- Make it understandable for farmers and non-experts.
- Avoid overly complex academic terminology.
- Keep the structure clean and organized in Markdown format.
`;
  };

  const generateAllDiseasesPrompt = () => {
    const diseasedLeaves = reportData.leaves.filter(
      leaf =>
        leaf.severity &&
        leaf.severity !== "Healthy" &&
        leaf.severity !== "Not Determined" &&
        leaf.severity !== "Not Severity Yet"
    );

    const diseasesList = diseasedLeaves
      .map(
        (leaf, idx) => `
  ### 🌿 Disease #${idx + 1}

  - **Plant Name:** ${leaf.plant_name}
  - **Disease Name:** ${leaf.disease_name}
  - **Infection Area:** ${leaf.disease_percentage}%
  - **Severity Level:** ${leaf.severity}
  `
      )
      .join("\n---\n");

    return `
  # 🌱 Comprehensive Plant Health Smart Report

  You are a professional plant pathology expert specialized in diagnosing and treating crop and fruit diseases.

  Below is a multi-disease analysis request based on AI-detected plant conditions.

  ---

  ${diseasesList}

  ---

  # 📊 Required Analysis Structure

  For **each disease listed above**, provide a fully structured scientific report using the following sections:

  ---

  ## 1️⃣ Disease Overview

  - What is the disease?
  - What pathogen type causes it? (Fungus, Bacteria, Virus, etc.)
  - How does it biologically impact the plant?

  ---

  ## 2️⃣ Causes & Risk Factors

  Explain possible causes including:

  - 🌦 Environmental conditions (humidity, temperature, rainfall, airflow)
  - 🌱 Soil-related problems
  - 💧 Irrigation mismanagement
  - 🌿 Fertilization imbalance
  - 🛡 Weak plant immunity
  - 🔄 Disease transmission mechanisms

  ---

  ## 3️⃣ Infection Percentage Analysis

  - Is the infection percentage considered mild, moderate, or severe?
  - What does this percentage practically mean for crop productivity?
  - Can the condition still be controlled at this stage?

  ---

  ## 4️⃣ Severity Level Assessment

  - What does the severity classification indicate?
  - Biological and economic risk level
  - What happens if no treatment is applied?

  ---

  ## 5️⃣ Step-by-Step Treatment Plan

  Provide a clear structured treatment protocol including:

  ### 🚑 Immediate Actions
  ### ✂️ Pruning & Isolation
  ### 🧪 Recommended Active Ingredients
  ### 📅 Spray Frequency & Duration
  ### 🛡 Post-Treatment Protection

  ---

  ## 6️⃣ Long-Term Prevention Strategy

  - 🌬 Improve ventilation
  - 📏 Optimal plant spacing
  - 💦 Irrigation best practices
  - 🌾 Balanced fertilization
  - 🧼 Tool sanitation
  - 📆 Seasonal monitoring

  ---

  ## 7️⃣ Farm-Level Summary

  At the end, provide:

  - 📈 Overall farm health assessment
  - ⚠ Most critical disease among the listed cases
  - 🧠 Recommended priority order of treatment

  ---

  # ✅ Formatting Rules

  - Use clear Markdown headings.
  - Separate each disease with horizontal lines.
  - Use bullet points.
  - Keep explanations scientifically accurate but farmer-friendly.
  - Avoid overly complex academic terminology.
  - Keep formatting clean and structured.
  `;
  };

  const handleGenerateReport = () => {
    const data = formatReportData();
    setReportData(data);
    setShowReportModal(true);
  };

  const handleSendToAI = (leafData, isHidden = false) => {
    let prompt;
    if (leafData === "all") {
      prompt = generateAllDiseasesPrompt();
    } else {
      prompt = generateAIPrompt(leafData);
    }
    
    if (onSendReport) {
      onSendReport(prompt, isHidden);
    } else {
      sessionStorage.setItem("plantAnalysisPrompt", prompt);
    }
    setShowReportModal(false);
  };

  const handleFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setStep(0);
    uploadAndDetect(file);
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFinalImage(null);
    setStatus("Waiting");
    setProgress(0);
    setTotalBoxes(0);
    setMaskImage(null);
    setSegInfo({ image_width:0, image_height:0, leaf_pixel_count:0 });
    setClassifications([defaultClassification]);
    setCurrentIndex(0);
    setClassificationStatus("Waiting");
    setCamImage(null);
    setCamResult(null);
    setSegStatus("Waiting");
    setCropImage(null);
    setStep(0);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFile(file);
    }
  };

  const uploadAndDetect = (file) => {

    setStatus("Uploading");
    setSegStatus("Waiting");
    setClassificationStatus("Waiting");
    setProgress(10);
    setProgressValue && setProgressValue(10);
    setStep(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST","https://armia-gamal-plant-leaf-detection-api.hf.space/detect");
    xhr.setRequestHeader("Authorization", `Bearer ${apiKey}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
        setProgressValue && setProgressValue(percent);
      }
    };
    xhr.onload = async () => {
      if (xhr.status === 200) {

        setStatus("Processing");
        setStep(1);

        const res = JSON.parse(xhr.responseText);
        setTotalBoxes(res.total_boxes || 0);

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = async () => {

          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          ctx.strokeStyle = "#22C55E";
          ctx.lineWidth = 6;

          // ✅ رسم البوكس صح
          res.boxes.forEach(box => {
            const width = box.x2 - box.x1;
            const height = box.y2 - box.y1;
            ctx.strokeRect(box.x1, box.y1, width, height);
          });

          setFinalImage(canvas.toDataURL());
          // generate crop preview from first box (used while classification pending)
          if (res.boxes && res.boxes.length > 0) {
            const box = res.boxes[0];
            const cw = box.x2 - box.x1;
            const ch = box.y2 - box.y1;
            const cropCanvas = document.createElement("canvas");
            cropCanvas.width = cw;
            cropCanvas.height = ch;
            const ctx2 = cropCanvas.getContext("2d");
            ctx2.drawImage(
              img,
              box.x1,
              box.y1,
              cw,
              ch,
              0,
              0,
              cw,
              ch
            );
            const cropUrl = cropCanvas.toDataURL();
            setCropImage(cropUrl);
            setClassifications([{ ...defaultClassification, image: cropUrl }]);
          }

          // prepare a cropped blob (if boxes present) and reuse it for
          // segmentation and for the Grad-CAM endpoint so both receive
          // the same cropped image copy
          let segBlob = null;
          try {
            if (res.boxes && res.boxes.length > 0) {
              const box = res.boxes[0];
              const cropCanvas = document.createElement("canvas");
              const cw = box.x2 - box.x1;
              const ch = box.y2 - box.y1;
              cropCanvas.width = cw;
              cropCanvas.height = ch;
              const ctx2 = cropCanvas.getContext("2d");
              ctx2.drawImage(
                img,
                box.x1,
                box.y1,
                cw,
                ch,
                0,
                0,
                cw,
                ch
              );
              segBlob = await new Promise((resolve) =>
                cropCanvas.toBlob(resolve, "image/jpeg", 1.0)
              );
            }

            const segForm = new FormData();
            segForm.append("file", segBlob || file);
            const segRes = await fetch(
              "https://armia-gamal-plant-leaf-detection-api.hf.space/segment",
              {
                method: "POST",
                headers: { Authorization: `Bearer ${apiKey}` },
                body: segForm,
              }
            );
            if (segRes.ok) {
              const segData = await segRes.json();
              if (segData.mask_image_base64) {
                setMaskImage("data:image/jpeg;base64," + segData.mask_image_base64);
              }
              // capture additional info
              setSegInfo({
                image_width: segData.image_width || 0,
                image_height: segData.image_height || 0,
                leaf_pixel_count: segData.leaf_pixel_count || 0,
              });
            }
          } catch (e) {
            console.warn("Segmentation error", e);
          }

          setStatus("Completed");
          setProgress(100);
          setStep(2);

          // classification + CAM + segmentation for every crop box
          if (res.boxes && res.boxes.length > 0) {
            try {
              await runClassification(file, res.boxes);
            } catch (e) {
              console.warn("Classification error", e);
            }
          } else {
            // no boxes, reset to default state
            setClassifications([defaultClassification]);
            setClassificationStatus("Completed");
            // still advance to finished classification even when no boxes
            setStep(4);
          }
        };
      }
    };

    xhr.send(formData);
  };

  const runClassification = async (file, boxes) => {
    // mark classification active in progress bar
    setStep(3);
    // update status so UI knows we're working on the crops
    setClassificationStatus("Processing");
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(resolve => img.onload = resolve);

    const results = [];

    // process each box: build crop blob then call classify, classify-cam and segment
    for (let box of boxes) {
      const width = box.x2 - box.x1;
      const height = box.y2 - box.y1;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        box.x1,
        box.y1,
        width,
        height,
        0,
        0,
        width,
        height
      );

      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, "image/jpeg", 1.0)
      );

      // prepare requests in parallel for speed
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

      // use CAM results as the primary source
      const plantName = (camData && camData.plant_name) || "Awaiting Detection";
      const diseaseName = (camData && camData.disease_name) || "Not Classified Yet";
      const confidenceRaw = (camData && typeof camData.confidence === 'number') ? camData.confidence : 0;
      const diseasePercentRaw = (camData && typeof camData.disease_percentage === 'number') ? camData.disease_percentage : 0;
      const severityName = (camData && camData.severity) || "Not Determined";

      const entry = {
        image: camData && camData.image_base64 ? "data:image/jpeg;base64," + camData.image_base64 : canvas.toDataURL(),
        disease: plantName,
        category: diseaseName,
        confidence: confidenceRaw ? (confidenceRaw * 100).toFixed(2) : 0,
        // API already returns disease percentage in percent units — don't multiply by 100
        diseasePercentage: diseasePercentRaw ? Number(diseasePercentRaw).toFixed(2) : 0,
        severity: severityName,
        camImage: camData && camData.image_base64 ? "data:image/jpeg;base64," + camData.image_base64 : null,
        maskImage: sData && sData.mask_image_base64 ? "data:image/jpeg;base64," + sData.mask_image_base64 : null,
        segInfo: {
          image_width: sData && sData.image_width ? sData.image_width : 0,
          image_height: sData && sData.image_height ? sData.image_height : 0,
          leaf_pixel_count: sData && sData.leaf_pixel_count ? sData.leaf_pixel_count : 0,
        }
      };

      results.push(entry);
    }

    setClassifications(results);
    setCurrentIndex(0);
    // set initial display values from first result
    if (results.length > 0) {
      setCamImage(results[0].camImage || null);
      setCamResult(results[0]);
      setMaskImage(results[0].maskImage || null);
      setSegInfo(results[0].segInfo || { image_width:0, image_height:0, leaf_pixel_count:0 });
    }

    setClassificationStatus("Completed");
    // classification finished — mark progress bar done
    setStep(4);
  };

  const handleChangeIndex = (newIndex) => {
    const idx = Math.max(0, Math.min(newIndex, classifications.length - 1));
    setCurrentIndex(idx);
    const entry = classifications[idx] || defaultClassification;
    setMaskImage(entry.maskImage || null);
    setSegInfo(entry.segInfo || { image_width:0, image_height:0, leaf_pixel_count:0 });
    setCamImage(entry.camImage || null);
    setCamResult(entry);
  };

  const offset = circumference - (progress / 100) * circumference;
  const current = classifications[currentIndex] || defaultClassification;
  // determine display source (prefer camResult which is set when clicking arrows)
  const infoSource = camResult || current;
  const diseaseText = infoSource && infoSource.disease === "Awaiting Detection" ? "" : (infoSource && infoSource.disease) || "";
  const categoryText = (infoSource && infoSource.category) || "";
  const confidenceText = (infoSource && infoSource.confidence) || 0;
  const displayDiseasePercent = infoSource && infoSource.diseasePercentage ? infoSource.diseasePercentage : 0;
  const displaySeverityText = (infoSource && infoSource.severity) || "";
  const showDiseaseRow = displayDiseasePercent > 0 && displaySeverityText !== "Healthy" && displaySeverityText !== "Not Severity Yet";
  const displayImage = displaySeverityText === "Healthy"
    ? (current.image || classImg)
    : (camImage || (current && current.image) || cropImage || classImg);

  return (
    <div className="container">
    <div className="card large-card">
        <div className="inner-box">
          <div className="layer-3">
            <div
                className={`upload-content ${isDragging ? "drag-active" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >

              <div className="image-box">
                <img src={previewUrl || bgImage} alt="plant" />
              </div>

              <div className={`upload-text ${selectedFile ? "no-margin" : ""}`}>

                {!selectedFile && (
                  <>
                    <div className="image-upload">
                      <img src={uploadImg} alt="upload" />
                    </div>
                    <h2>Drag and drop an image here</h2>
                    <p>Supported formats: JPG, PNG. Max file size 5MB.</p>
                    <button
                      className="upload-btn"
                      onClick={() => fileInputRef.current.click()}
                    >
                      Upload Image
                    </button>
                  </>
                )}

                {selectedFile && (
                  <div className="progress-ring-wrapper">
                    <svg width="90" height="90">
                      <circle stroke="#E5E7EB" fill="transparent"
                        strokeWidth="6" r={radius} cx="45" cy="45" />
                      <circle stroke="#22C55E" fill="transparent"
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        r={radius} cx="45" cy="45" />
                    </svg>

                    <div className="progress-ring-text">
                      {status === "Completed" ? "Done" : `${progress}%`}
                    </div>

                    <button className="cancel-btn" onClick={handleCancel}>
                      ✕
                    </button>
                  </div>
                )}

                <input
                  type="file"
                  hidden
                  ref={fileInputRef}
                  accept="image/png, image/jpeg"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cards-row">

        <div className="card small-card detection-card">
          <div className="detection-header">
            <h2 className="detection-title">Object Detection</h2>
            <p className="detection-subtitle">
              Object detection result with cropped plant regions
              {status === "Completed" && <> — Detected {totalBoxes} leaf(s)</>}
            </p>
          </div>

          <div className="detection-image-box">
            <span className="completed-badge">{status}</span>
            <div className="detection-inner-layer">
              <img src={finalImage || detectImg} alt="Detection" />
            </div>
          </div>
        </div>

        {/* Classification */}
        <div className="card small-card classification-card">

          <div className="classification-header">
            <div>
              <h2 className="classification-title">Classify + Grad-CAM</h2>
              <p className="classification-subtitle">
                AI-based plant disease analysis
              </p>
            </div>
            {classifications.length > 1 && (
              <div className="arrow-controls">
                <button onClick={() => handleChangeIndex(currentIndex - 1)}>◀</button>
                <span style={{ whiteSpace: "nowrap" }}>{currentIndex + 1} / {classifications.length}</span>
                <button onClick={() => handleChangeIndex(currentIndex + 1)}>▶</button>
              </div>
            )}
            <span className="classifier-badge">{classificationStatus}</span>
          </div>

          <div className="classification-content">
            
            <div className="classification-image-box">
              <img
                src={displayImage}
                alt="Classified"
                className={displayImage === classImg ? "" : "uploaded-image"}
              />
            </div>

            <div className="classification-info">
              <div className="info-group">
                <p className="info-label">Plant Name :</p>
                <p className="info-value">{diseaseText || "Not Detected Yet"}</p>
              </div>
              <div className="info-group">
                <p className="info-label">Disease Name :</p>
                <p className="info-value">{categoryText || "Not Classified Yet"}</p>
              </div>
            </div>
          </div>

          <div className="confidence-section">
            <div className="confidence-row">
              <div className="confidence-item">
                <p className="confidence-text">
                  confidence:
                  <span className="confidence-value">
                    {confidenceText}% {Number(confidenceText) > 0 ? "(High Confidence)" : "(Awaiting Analysis)"}
                  </span>
                </p>
                <div className="confidence-bar-bg">
                    <div
                      className="confidence-bar-fill"
                      style={{ width: `${confidenceText}%` }}
                    ></div>
                </div>
              </div>

              {showDiseaseRow && (
                <div className="confidence-item">
                  <p className="confidence-text">
                    Disease :
                    <span className="confidence-value">
                      {displayDiseasePercent}% ({displaySeverityText})
                    </span>
                  </p>
                  <div className="confidence-bar-bg">
                    {displayDiseasePercent > 0 && (
                      <div
                        className="confidence-bar-fill"
                        style={{ width: `${displayDiseasePercent}%` }}
                      ></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>


        {/* Segmentation (dynamic mask) */}

        {/* Segmentation (dynamic mask) */}
        <div className="card small-card segmentation-card">
          <div className="segmentation-header">
            <h2 className="segmentation-title">Segmentation</h2>
            <p className="segmentation-subtitle">
              Segmentation mask visualization
            </p>
          </div>

          <div className="segmentation-image-box">
            <span className="completed-badge">
              {maskImage ? "Completed" : segStatus === "Processing" ? "Working" : segStatus}
            </span>
            <div className="segmentation-inner-layer">
              <img src={maskImage || segmentImg} alt="Segmentation" />
            </div>
          </div>
        </div>

      </div>

      {classificationStatus === "Completed" && classifications.length > 0 && classifications[0].disease !== "" && (
        <p className="report-link-text" onClick={handleGenerateReport}>
          View Analysis Report
        </p>
      )}

      {showReportModal && reportData && (
        <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h2>Disease Analysis Report</h2>
              <button 
                className="report-close-btn"
                onClick={() => setShowReportModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="report-modal-content">
              <div className="report-leaves-list">
                <h3>Detected Diseases</h3>

                {/* donut stats */}
                {reportData.leaves.length > 0 && (() => {
                  const healthyCount = reportData.leaves.filter(l => l.severity === "Healthy").length;
                  const diseasedCount = reportData.leaves.length - healthyCount;
                  const total = reportData.leaves.length;
                  const healthyPct = total ? Math.round((healthyCount/total)*100) : 0;
                  const diseasedPct = total ? 100 - healthyPct : 0;
                  return (
                    <div className="donut-container">
                      <div
                        className="donut-chart"
                        onMouseLeave={() => setHoveredSegment(null)}
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left - rect.width/2;
                          const y = e.clientY - rect.top - rect.height/2;
                          const angle = Math.atan2(y, x) * (180/Math.PI) + 180; // 0-360
                          const threshold = (diseasedPct/100) * 360;
                          if (angle <= threshold) {
                            setHoveredSegment(`Diseased ${diseasedPct}%`);
                          } else {
                            setHoveredSegment(`Healthy ${healthyPct}%`);
                          }
                        }}
                        style={{"--pct": diseasedPct + "%"}}
                      >
                        <div className="donut-center">
                          {hoveredSegment || `${diseasedPct}% diseased`}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {reportData.leaves.length > 0 ? (
                  <>
                    <div className="leaves-cards-with-images">
                      {reportData.leaves.map((leaf, idx) => (
                        <div key={idx} className="leaf-card-with-image">
                          <div className="leaf-image-col">
                            {leaf.image && (
                              <img src={leaf.image} alt={`Leaf ${leaf.leaf_id}`} className="leaf-report-image" />
                            )}
                          </div>
                          <div className="leaf-info-col">
                            <h4>Disease #{leaf.leaf_id}</h4>
                            <p><strong>Plant:</strong> {leaf.plant_name}</p>
                            <p><strong>Disease:</strong> {leaf.disease_name}</p>
                            <p><strong>Infection:</strong> {leaf.disease_percentage}%</p>
                            <p><strong>Severity:</strong> {leaf.severity}</p>
                          {leaf.severity !== "Healthy" && (
                            <button
                              className="send-to-ai-btn"
                              onClick={() => handleSendToAI(leaf, true)}
                            >
                              Get Smart Report
                            </button>
                          )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {reportData.leaves.length > 1 && (
                      <button
                        className="send-all-btn"
                        onClick={() => handleSendToAI("all", true)}
                      >
                        Get Full Smart Report (for all diseases)
                      </button>
                    )}
                  </>
                ) : (
                  <p>No diseased leaves detected.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}