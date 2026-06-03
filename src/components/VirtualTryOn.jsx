import { useState, useCallback, useEffect, useRef } from "react";
import { fullTryOnFlow } from "../lib/segmind";

export default function VirtualTryOn() {
  const [modelFile, setModelFile] = useState(null);
  const [garmentFile, setGarmentFile] = useState(null);
  const [modelPreview, setModelPreview] = useState(null);
  const [garmentPreview, setGarmentPreview] = useState(null);
  const [clothDesc, setClothDesc] = useState("");
  const [garmentCategory, setGarmentCategory] = useState("upperwear"); // "upperwear" or "bottomwear"
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const modelInputRef = useRef(null);
  const garmentInputRef = useRef(null);

  const loadingSteps = [
    "Analyzing your body silhouette...",
    "Mapping garment dimensions...",
    "Compositing fabric textures...",
    "Finalizing your look..."
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const handleFile = useCallback((file, type) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a JPG or PNG image.");
      return;
    }
    const preview = URL.createObjectURL(file);
    if (type === "model") {
      setModelFile(file);
      setModelPreview(preview);
      setStep(2);
    } else {
      setGarmentFile(file);
      setGarmentPreview(preview);
    }
    setError("");
  }, []);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, type);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleTryOn = async () => {
    if (!modelFile || !garmentFile) {
      setError("Please upload both your photo and a garment image.");
      return;
    }
    if (!clothDesc.trim()) {
      setError("Please describe the garment for best results.");
      return;
    }

    setLoading(true);
    setStep(3);
    setError("");

    try {
      // Prepend category to description for better API results
      const enhancedDesc = `${garmentCategory === "upperwear" ? "Upperwear" : "Bottomwear"}: ${clothDesc}`;
      const { resultUrl } = await fullTryOnFlow(modelFile, garmentFile, enhancedDesc);
      if (resultUrl) {
        setResult(resultUrl);
      } else {
        throw new Error("No result image returned from API.");
      }
    } catch (err) {
      setError(err.message || "AI processing failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setModelFile(null);
    setGarmentFile(null);
    setModelPreview(null);
    setGarmentPreview(null);
    setClothDesc("");
    setGarmentCategory("upperwear");
    setResult(null);
    setLoading(false);
    setError("");
    setStep(1);
    setShowComparison(false);
    setLoadingStepIndex(0);
  };

  const downloadResult = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = "fashionverse-tryon-result.png";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = () => {
    alert("Sharing coming soon!");
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes goldShimmer { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progressFill { from { width: 0%; } to { width: 90%; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      
      <div style={{
        background: "linear-gradient(135deg, #0d0b07 0%, #1a1208 50%, #0d0b07 100%)",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        color: "#f5f0e8",
        padding: "2rem"
      }}>
        {/* Header Section */}
        <div style={{
          textAlign: "center",
          marginBottom: "3rem"
        }}>
          <div style={{
            fontSize: "11px",
            letterSpacing: "0.2em",
            color: "#c9a84c",
            marginBottom: "0.5rem",
            textTransform: "uppercase"
          }}>
            Powered by AI
          </div>
          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontFamily: "serif",
            background: "linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: "0 0 1rem 0"
          }}>
            Virtual Try-On
          </h1>
          <p style={{
            color: "#8a7a5a",
            fontSize: "15px",
            maxWidth: "480px",
            margin: "0 auto 1.5rem"
          }}>
            Upload your photo and a garment — our AI will dress you instantly
          </p>
          
          {/* Step Indicators */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  fontWeight: "600",
                  background: step >= s ? "linear-gradient(135deg, #c9a84c, #f0d080)" : "transparent",
                  border: step >= s ? "none" : "2px solid rgba(201,168,76,0.3)",
                  color: step >= s ? "#1a1208" : "#5a4f35"
                }}>
                  {s}
                </div>
                {s < 3 && (
                  <div style={{
                    width: "40px",
                    height: "2px",
                    background: step > s ? "#c9a84c" : "rgba(201,168,76,0.2)",
                    margin: "0 0.5rem"
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Two Column Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "2rem",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {/* Left Column - Capture Zone */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "20px",
            padding: "2rem",
            backdropFilter: "blur(10px)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }}>
            {/* Card Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span style={{
                fontSize: "12px",
                letterSpacing: "0.15em",
                color: "#c9a84c",
                fontWeight: "600"
              }}>
                CAPTURE ZONE
              </span>
            </div>

            {/* Upload Zone 1 - User Photo */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem"
              }}>
                <label style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#f5f0e8"
                }}>
                  Your Photo
                </label>
                <span style={{
                  fontSize: "11px",
                  color: "#8a7a5a",
                  marginLeft: "auto"
                }}>
                  Stand straight, good lighting, plain background works best
                </span>
              </div>
              
              <input
                ref={modelInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleFile(file, "model");
                }}
              />
              
              <div
                onClick={() => modelInputRef.current?.click()}
                onDrop={(e) => handleDrop(e, "model")}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  border: dragOver ? "2px dashed rgba(201,168,76,0.8)" : "2px dashed rgba(201,168,76,0.3)",
                  borderRadius: "16px",
                  minHeight: "200px",
                  background: dragOver ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.03)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  if (!modelPreview) {
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)";
                    e.currentTarget.style.background = "rgba(201,168,76,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!modelPreview) {
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                    e.currentTarget.style.background = "rgba(201,168,76,0.03)";
                  }
                }}
              >
                {modelPreview ? (
                  <>
                    <img
                      src={modelPreview}
                      alt="Your photo"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "12px"
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        modelInputRef.current?.click();
                      }}
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "8px 16px",
                        background: "rgba(0,0,0,0.7)",
                        border: "1px solid rgba(201,168,76,0.5)",
                        borderRadius: "8px",
                        color: "#f5f0e8",
                        fontSize: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(201,168,76,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                      }}
                    >
                      Change Photo
                    </button>
                  </>
                ) : (
                  <>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" style={{ marginBottom: "1rem" }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17,8 12,3 7,8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p style={{ color: "#c9a84c", fontSize: "15px", fontWeight: "500", margin: "0 0 0.25rem 0" }}>
                      Drop your photo here
                    </p>
                    <p style={{ color: "#8a7a5a", fontSize: "13px", margin: "0" }}>
                      or click to browse
                    </p>
                    <p style={{ color: "#5a4f35", fontSize: "11px", marginTop: "0.75rem" }}>
                      JPG, PNG up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Garment Category Selector */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#f5f0e8",
                marginBottom: "0.75rem",
                display: "block"
              }}>
                Garment Category
              </label>
              <div style={{
                display: "flex",
                gap: "0.75rem"
              }}>
                <button
                  type="button"
                  onClick={() => setGarmentCategory("upperwear")}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: garmentCategory === "upperwear" 
                      ? "linear-gradient(135deg, #c9a84c, #f0d080)" 
                      : "rgba(255,255,255,0.05)",
                    border: garmentCategory === "upperwear" 
                      ? "none" 
                      : "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "12px",
                    color: garmentCategory === "upperwear" ? "#1a1208" : "#f5f0e8",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  👕 Upperwear
                </button>
                <button
                  type="button"
                  onClick={() => setGarmentCategory("bottomwear")}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: garmentCategory === "bottomwear" 
                      ? "linear-gradient(135deg, #c9a84c, #f0d080)" 
                      : "rgba(255,255,255,0.05)",
                    border: garmentCategory === "bottomwear" 
                      ? "none" 
                      : "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "12px",
                    color: garmentCategory === "bottomwear" ? "#1a1208" : "#f5f0e8",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  👖 Bottomwear
                </button>
              </div>
            </div>

            {/* Upload Zone 2 - Garment Image */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem"
              }}>
                <label style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#f5f0e8"
                }}>
                  {garmentCategory === "upperwear" ? "Upperwear Image" : "Bottomwear Image"}
                </label>
                <span style={{
                  fontSize: "11px",
                  color: "#8a7a5a",
                  marginLeft: "auto"
                }}>
                  Flat-lay or mannequin photo on white background works best
                </span>
              </div>
              
              <input
                ref={garmentInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleFile(file, "garment");
                }}
              />
              
              <div
                onClick={() => garmentInputRef.current?.click()}
                onDrop={(e) => handleDrop(e, "garment")}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  border: dragOver ? "2px dashed rgba(201,168,76,0.8)" : "2px dashed rgba(201,168,76,0.3)",
                  borderRadius: "16px",
                  minHeight: "200px",
                  background: dragOver ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.03)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseEnter={(e) => {
                  if (!garmentPreview) {
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)";
                    e.currentTarget.style.background = "rgba(201,168,76,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!garmentPreview) {
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                    e.currentTarget.style.background = "rgba(201,168,76,0.03)";
                  }
                }}
              >
                {garmentPreview ? (
                  <>
                    <img
                      src={garmentPreview}
                      alt="Garment"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "12px"
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        garmentInputRef.current?.click();
                      }}
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        padding: "8px 16px",
                        background: "rgba(0,0,0,0.7)",
                        border: "1px solid rgba(201,168,76,0.5)",
                        borderRadius: "8px",
                        color: "#f5f0e8",
                        fontSize: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(201,168,76,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(0,0,0,0.7)";
                      }}
                    >
                      Change
                    </button>
                  </>
                ) : (
                  <>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" style={{ marginBottom: "1rem" }}>
                      <path d="M20.38 3.4a2 2 0 0 0-2-2h-12.76a2 2 0 0 0-2 2l-.62 6.6h18z" />
                      <path d="M12 10v11" />
                      <path d="M8 14h8" />
                    </svg>
                    <p style={{ color: "#c9a84c", fontSize: "15px", fontWeight: "500", margin: "0 0 0.25rem 0" }}>
                      Drop garment here
                    </p>
                    <p style={{ color: "#8a7a5a", fontSize: "13px", margin: "0" }}>
                      or click to browse
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Garment Description Input */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem"
              }}>
                <label style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#f5f0e8"
                }}>
                  Describe the {garmentCategory === "upperwear" ? "Upperwear" : "Bottomwear"}
                </label>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a7a5a" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              
              <input
                type="text"
                value={clothDesc}
                onChange={(e) => setClothDesc(e.target.value)}
                placeholder={garmentCategory === "upperwear" 
                  ? 'e.g. "slim-fit navy blue blazer with gold buttons"' 
                  : 'e.g. "straight-leg black denim jeans with high waist"'}
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "12px",
                  color: "#f5f0e8",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.2s ease"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.8)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <p style={{
                color: "#5a4f35",
                fontSize: "12px",
                marginTop: "0.5rem"
              }}>
                Be specific about color, fit, fabric and style for best results
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: "rgba(255,80,80,0.1)",
                border: "1px solid rgba(255,80,80,0.3)",
                borderRadius: "10px",
                padding: "12px 16px",
                color: "#ff8080",
                fontSize: "13px",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {error}
              </div>
            )}

            {/* Try It On Button */}
            <button
              onClick={handleTryOn}
              disabled={loading}
              style={{
                width: "100%",
                padding: "18px",
                background: loading 
                  ? "#333" 
                  : "linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c)",
                backgroundSize: "200% 200%",
                animation: loading ? "none" : "goldShimmer 3s ease infinite",
                border: "none",
                borderRadius: "14px",
                color: loading ? "#666" : "#1a1208",
                fontSize: "16px",
                fontWeight: "700",
                letterSpacing: "0.05em",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(201,168,76,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
              onMouseDown={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Try It On
                </>
              )}
            </button>

            {/* Privacy Note */}
            <p style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              color: "#5a4f35",
              fontSize: "12px",
              marginTop: "1rem"
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Your images are private. Not stored or shared.
            </p>
          </div>

          {/* Right Column - AI Output */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "20px",
            padding: "2rem",
            backdropFilter: "blur(10px)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column"
          }}>
            {/* Card Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.5rem"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              <span style={{
                fontSize: "12px",
                letterSpacing: "0.15em",
                color: "#c9a84c",
                fontWeight: "600"
              }}>
                AI OUTPUT
              </span>
            </div>

            {/* STATE 1 - Empty */}
            {!result && !loading && (
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "2rem"
              }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" style={{ animation: "float 3s ease-in-out infinite", marginBottom: "1.5rem" }}>
                  <path d="M20.38 3.4a2 2 0 0 0-2-2h-12.76a2 2 0 0 0-2 2l-.62 6.6h18z" />
                  <path d="M12 10v11" />
                  <path d="M8 14h8" />
                </svg>
                <p style={{ color: "#c9a84c", fontSize: "18px", fontWeight: "500", margin: "0 0 0.5rem 0" }}>
                  Results will appear here
                </p>
                <p style={{ color: "#8a7a5a", fontSize: "14px", margin: "0 0 2rem 0" }}>
                  Upload a photo and garment to get started
                </p>
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  justifyContent: "center"
                }}>
                  {["✦ Realistic Draping", "✦ Preserves Your Look", "✦ Instant Results"].map((feature) => (
                    <span key={feature} style={{
                      border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: "99px",
                      padding: "6px 14px",
                      fontSize: "12px",
                      color: "#8a7a5a"
                    }}>
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* STATE 2 - Loading */}
            {loading && (
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "2rem"
              }}>
                <div style={{
                  width: "80px",
                  height: "80px",
                  border: "3px solid rgba(201,168,76,0.15)",
                  borderTop: "3px solid #c9a84c",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  marginBottom: "1.5rem"
                }} />
                <p style={{ color: "#c9a84c", fontSize: "18px", fontWeight: "600", margin: "0 0 1rem 0" }}>
                  AI is generating your look...
                </p>
                <p style={{ 
                  color: "#8a7a5a", 
                  fontSize: "14px", 
                  margin: "0 0 1.5rem 0",
                  minHeight: "20px",
                  animation: "pulse 2s ease-in-out infinite"
                }}>
                  {loadingSteps[loadingStepIndex]}
                </p>
                <div style={{
                  width: "100%",
                  maxWidth: "300px",
                  height: "4px",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "99px",
                  overflow: "hidden",
                  marginBottom: "1rem"
                }}>
                  <div style={{
                    width: "90%",
                    height: "100%",
                    background: "linear-gradient(90deg, #c9a84c, #f0d080)",
                    animation: "progressFill 25s ease-out forwards"
                  }} />
                </div>
                <p style={{ color: "#5a4f35", fontSize: "12px" }}>
                  This takes 15–30 seconds
                </p>
              </div>
            )}

            {/* STATE 3 - Result */}
            {result && !loading && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Success Badge */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                  alignSelf: "flex-start"
                }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#4ade80"
                  }} />
                  <span style={{
                    color: "#4ade80",
                    fontSize: "13px",
                    fontWeight: "500",
                    border: "1px solid #4ade80",
                    borderRadius: "99px",
                    padding: "4px 12px"
                  }}>
                    Try-On Complete
                  </span>
                </div>

                {/* Comparison Toggle */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "1rem"
                }}>
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#8a7a5a"
                  }}>
                    <input
                      type="checkbox"
                      checked={showComparison}
                      onChange={(e) => setShowComparison(e.target.checked)}
                      style={{
                        width: "16px",
                        height: "16px",
                        accentColor: "#c9a84c",
                        cursor: "pointer"
                      }}
                    />
                    Compare Before / After
                  </label>
                </div>

                {/* Result Image or Comparison View */}
                {showComparison && modelPreview ? (
                  <div style={{
                    display: "flex",
                    gap: "0",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "2px solid rgba(201,168,76,0.4)",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                    marginBottom: "1.5rem",
                    animation: "fadeSlideIn 0.6s ease"
                  }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <img
                        src={modelPreview}
                        alt="Before"
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block"
                        }}
                      />
                      <div style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "8px",
                        background: "rgba(0,0,0,0.7)",
                        color: "#f5f0e8",
                        fontSize: "11px",
                        padding: "4px 8px",
                        borderRadius: "4px"
                      }}>
                        Before
                      </div>
                    </div>
                    <div style={{
                      width: "2px",
                      background: "rgba(201,168,76,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                        <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, position: "relative" }}>
                      <img
                        src={result}
                        alt="After"
                        style={{
                          width: "100%",
                          height: "auto",
                          display: "block"
                        }}
                      />
                      <div style={{
                        position: "absolute",
                        bottom: "8px",
                        right: "8px",
                        background: "rgba(0,0,0,0.7)",
                        color: "#f5f0e8",
                        fontSize: "11px",
                        padding: "4px 8px",
                        borderRadius: "4px"
                      }}>
                        After
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={result}
                    alt="Try-on result"
                    style={{
                      width: "100%",
                      borderRadius: "16px",
                      border: "2px solid rgba(201,168,76,0.4)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                      marginBottom: "1.5rem",
                      animation: "fadeSlideIn 0.6s ease"
                    }}
                  />
                )}

                {/* Action Buttons */}
                <div style={{
                  display: "flex",
                  gap: "0.75rem",
                  marginBottom: "1rem"
                }}>
                  <button
                    onClick={downloadResult}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: "linear-gradient(135deg, #c9a84c, #f0d080)",
                      border: "none",
                      borderRadius: "12px",
                      color: "#1a1208",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 20px rgba(201,168,76,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7,10 12,15 17,10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </button>
                  
                  <button
                    onClick={handleShare}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: "transparent",
                      border: "1px solid rgba(201,168,76,0.5)",
                      borderRadius: "12px",
                      color: "#c9a84c",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(201,168,76,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    Share
                  </button>
                  
                  <button
                    onClick={handleReset}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: "transparent",
                      border: "1px solid rgba(201,168,76,0.3)",
                      borderRadius: "12px",
                      color: "#8a7a5a",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)";
                      e.currentTarget.style.color = "#c9a84c";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                      e.currentTarget.style.color = "#8a7a5a";
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23,4 23,10 17,10" />
                      <polyline points="1,20 1,14 7,14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    Try Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
