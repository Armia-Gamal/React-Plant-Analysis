import { useState, useRef } from "react";
import bgImage from "../../assets/images/OIP.jpg";
import uploadImg from "../../assets/images/hoolding-leaf-svgrepo-com.svg";
import detectImg from "../../assets/images/Gemini_Generate.png";
import classImg from "../../assets/images/Crop.jpg";
import segmentImg from "../../assets/images/opacity-planet.jpg";
import "./PlantAnalysis.css";

export default function PlantAnalysis({ setStep, setProgressValue }) {

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [status, setStatus] = useState("Waiting");
  const [progress, setProgress] = useState(0);
  const [totalBoxes, setTotalBoxes] = useState(0);

  const defaultClassification = {
    image: classImg,
    disease: "Not Detected Yet",
    category: "Not Classified Yet",
    confidence: 0
  };

  const [classifications, setClassifications] = useState([defaultClassification]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [classificationStatus, setClassificationStatus] = useState("Waiting");

  const apiKey = import.meta.env.VITE_Detect_API_KEY;
  const fileInputRef = useRef();
  const [isDragging, setIsDragging] = useState(false);

  const radius = 36;
  const circumference = 2 * Math.PI * radius;

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
    setClassifications([defaultClassification]);
    setCurrentIndex(0);
    setClassificationStatus("Waiting");
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

          setStatus("Completed");
          setProgress(100);
          setStep(2);

          if (res.boxes && res.boxes.length > 0) {
            setClassificationStatus("Processing");
            await runClassification(file, res.boxes);
            setClassificationStatus("Completed");
          }

          setTimeout(() => setStep(3), 800);
        };
      }
    };

    xhr.send(formData);
  };

  const runClassification = async (file, boxes) => {

    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise(resolve => img.onload = resolve);

    const results = [];

    for (let box of boxes) {

      const width = box.x2 - box.x1;
      const height = box.y2 - box.y1;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");

      // ✅ كروب صح
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
        canvas.toBlob(resolve, "image/jpeg", 1.0) // أعلى جودة
      );

      const formData = new FormData();
      formData.append("file", blob);

      const response = await fetch(
        "https://armia-gamal-plant-leaf-detection-api.hf.space/classify",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: formData
        }
      );

      const data = await response.json();

      results.push({
        image: canvas.toDataURL(),
        disease: data.plant_name || "Awaiting Detection",
        category: data.disease_name || "Not Classified Yet",
        confidence: data.model_confidence
          ? (data.model_confidence * 100).toFixed(2)
          : 0
      });
    }

    setClassifications(results);
    setCurrentIndex(0);
  };

  const offset = circumference - (progress / 100) * circumference;
  const current = classifications[currentIndex];

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

        {/* Detection Card (زي ما هو) */}
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
              <h2 className="classification-title">Classification</h2>
              <p className="classification-subtitle">
                Plant disease classification result
              </p>
            </div>
            {classifications.length > 1 && (
              <div className="arrow-controls">
                <button onClick={() => setCurrentIndex((prev)=> prev > 0 ? prev - 1 : prev)}>◀</button>
                <span style={{ whiteSpace: "nowrap" }}>{currentIndex + 1} / {classifications.length}</span>
                <button onClick={() => setCurrentIndex((prev)=> prev < classifications.length - 1 ? prev + 1 : prev)}>▶</button>
              </div>
            )}
            <span className="classifier-badge">{classificationStatus}</span>
          </div>

          <div className="classification-content">

            <div className="classification-image-box">
              <img src={current.image} alt="Classified" />
            </div>

            <div className="classification-info">

              <div className="info-group">
                  <p className="info-label">Plant Name :</p>
                  <p className="info-value">{current.disease}</p>
              </div>

              <div className="info-group">
                  <p className="info-label">Disease Name :</p>
                  <p className="info-value">{current.category}</p>
              </div>

            </div>
          </div>

          <div className="confidence-section">
            <p className="confidence-text">
              Model confidence:
              <span className="confidence-value">
                {current.confidence}% {current.confidence > 0 ? "(High Confidence)" : "(Awaiting Analysis)"}
              </span>
            </p>

            {/* الخط الصغير */}
            <div className="confidence-divider"></div>

            <div className="confidence-bar-bg">
              <div
                className="confidence-bar-fill"
                style={{ width: `${current.confidence}%` }}
              ></div>
            </div>
          </div>

        </div>

        {/* Segmentation (زي ما هو) */}
        <div className="card small-card segmentation-card">
          <div className="segmentation-header">
            <h2 className="segmentation-title">Segmentation</h2>
            <p className="segmentation-subtitle">
              Segmentation mask visualization
            </p>
          </div>

          <div className="segmentation-image-box">
            <span className="completed-badge">Completed</span>
            <div className="segmentation-inner-layer">
              <img src={segmentImg} alt="Segmentation" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}