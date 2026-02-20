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

  const apiKey = import.meta.env.VITE_Detect_API_KEY;

  const fileInputRef = useRef();

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
    setStep(0);
  };

  const uploadAndDetect = (file) => {

    setStatus("Uploading");
    setProgress(10);
    setProgressValue && setProgressValue(10);
    setStep(0);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      "https://armia-gamal-plant-leaf-detection-api.hf.space/detect"
    );
    xhr.setRequestHeader("Authorization", `Bearer ${apiKey}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
        setProgressValue && setProgressValue(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {

        setStatus("Processing");
        setStep(1);

        const res = JSON.parse(xhr.responseText);
        setTotalBoxes(res.total_boxes || 0);

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {

          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);

          ctx.strokeStyle = "#22C55E";
          ctx.lineWidth = 8;

          res.boxes.forEach(box => {
            ctx.strokeRect(
              box.x1,
              box.y1,
              box.width,
              box.height
            );
          });

          const newImage = canvas.toDataURL();
          setFinalImage(newImage);

          setStatus("Completed");
          setProgress(100);
          setProgressValue && setProgressValue(100);

          setStep(2);

          setTimeout(() => {
            setStep(3);
          }, 800);
        };
      } else {
        setStatus("Error");
      }
    };

    xhr.send(formData);
  };

  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="container">

      {/* Upload Card */}
      <div className="card large-card">
        <div className="inner-box">
          <div className="layer-3">
            <div className="upload-content">

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
                      <circle
                        stroke="#E5E7EB"
                        fill="transparent"
                        strokeWidth="6"
                        r={radius}
                        cx="45"
                        cy="45"
                      />
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
                      {status === "Completed" ? "Done" : `${progress}%`}
                    </div>

                    {/* ✅ زرار X */}
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

      {/* Detection Card */}
      <div className="cards-row">
        <div className="card small-card detection-card">
          <div className="detection-header">
            <h2 className="detection-title">Object Detection</h2>
            <p className="detection-subtitle">
              Object detection result with cropped plant regions
              {status === "Completed" && (
                <> — Detected {totalBoxes} leaf(s)</>
              )}
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
            <span className="classifier-badge">CNN-based classifier</span>
          </div>

          <div className="classification-content">
            <div className="classification-image-box">
              <img src={classImg} alt="Classified" />
            </div>

            <div className="classification-info">
              <div className="info-group">
                <p className="info-label">Predicted disease :</p>
                <p className="info-value">Apple Scab</p>
              </div>

              <div className="info-group">
                <p className="info-label">Disease category :</p>
                <p className="info-value">Fungal Disease</p>
              </div>
            </div>
          </div>

          <div className="confidence-section">
            <p className="confidence-text">
              Model confidence:
              <span className="confidence-value">
                90.09% (High Confidence)
              </span>
            </p>
            <div className="confidence-bar-bg">
              <div
                className="confidence-bar-fill"
                style={{ width: "90%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Segmentation */}
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