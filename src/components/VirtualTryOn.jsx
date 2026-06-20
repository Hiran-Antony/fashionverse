import '../styles/tryon.css';
// Force Vite HMR Cache Invalidation
import { useState, useCallback, useEffect, useRef } from "react";
import { fullTryOnFlow } from "../lib/segmind";
import { useTryOnStore } from "../store/tryOnStore";
import { supabase } from "../lib/supabase";
import FashionAITools from "./FashionAITools";

export default function VirtualTryOn() {
                  
          const {
    modelFile, upperwearFile, bottomwearFile,
    modelPreview, upperwearPreview, bottomwearPreview,
    upperwearDesc, bottomwearDesc,
    result, loading, error, step, showComparison, loadingStepIndex,
    setModelFile, setUpperwearFile, setBottomwearFile,
    setUpperwearDesc, setBottomwearDesc,
    setShowComparison, setLoadingStepIndex, setError,
    handleTryOn, cancelTryOn, reset: handleReset
  } = useTryOnStore();

  const [dragOverModel, setDragOverModel] = useState(false);
  const modelInputRef = useRef(null);

  // ── Product Picker State ──────────────────────────────────────
  const [upperProducts, setUpperProducts] = useState([]);
  const [lowerProducts, setLowerProducts] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [selectedUpperProduct, setSelectedUpperProduct] = useState(null);
  const [selectedLowerProduct, setSelectedLowerProduct] = useState(null);

  const [upperTab, setUpperTab] = useState("All");
  const [lowerTab, setLowerTab] = useState("All");

  const UPPER_TYPES = ["T-Shirts", "Casual Shirts", "Formal Shirts", "Sweatshirts", "Jackets", "Blazers"];
  const LOWER_TYPES = ["Jeans", "Trousers", "Cargo", "Shorts", "Track Pants"];
  const UPPER_FILTER_TABS = ["All", "Shirts", "T-Shirts", "Jackets", "Wishlist"];
  const LOWER_FILTER_TABS = ["All", "Jeans", "Trousers", "Cargo", "Wishlist"];

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

  // ── Fetch products from Supabase ─────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      const [upperRes, lowerRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, brand, price, product_type, product_colors(image_url, color_name)")
          .in("product_type", ["T-Shirts", "Casual Shirts", "Formal Shirts", "Sweatshirts", "Jackets", "Blazers"])
          .eq("is_active", true)
          .limit(30),
        supabase
          .from("products")
          .select("id, name, brand, price, product_type, product_colors(image_url, color_name)")
          .in("product_type", ["Jeans", "Trousers", "Cargo", "Shorts", "Track Pants"])
          .eq("is_active", true)
          .limit(30),
      ]);
      const mapProduct = (p) => ({
        id: p.id, name: p.name, brand: p.brand || "FashionVerse",
        price: p.price, product_type: p.product_type,
        image: p.product_colors?.[0]?.image_url || "",
      });
      setUpperProducts((upperRes.data || []).map(mapProduct));
      setLowerProducts((lowerRes.data || []).map(mapProduct));
      setLoadingProducts(false);
    };
    fetchProducts();
  }, []);

  // ── Fetch wishlist ────────────────────────────────────────────
  useEffect(() => {
    const fetchWishlist = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("wishlists")
        .select("product_id, products(id, name, brand, price, product_type, product_colors(image_url))")
        .eq("user_id", user.id);
      if (data) {
        setWishlistItems(data.map((w) => ({
          id: w.products.id, name: w.products.name, brand: w.products.brand || "FashionVerse",
          price: w.products.price, product_type: w.products.product_type,
          image: w.products.product_colors?.[0]?.image_url || "",
        })));
      }
    };
    fetchWishlist();
  }, []);

  // ── Select a product from picker ─────────────────────────────
  const selectUpperProduct = (product) => {
    setSelectedUpperProduct(product);
    if (product?.image) {
      fetch(product.image)
        .then(r => r.blob())
        .then(blob => {
          const file = new File([blob], "upperwear.jpg", { type: blob.type || "image/jpeg" });
          setUpperwearFile(file, product.image);
        })
        .catch(() => {});
    }
  };

  const selectLowerProduct = (product) => {
    setSelectedLowerProduct(product);
    if (product?.image) {
      fetch(product.image)
        .then(r => r.blob())
        .then(blob => {
          const file = new File([blob], "bottomwear.jpg", { type: blob.type || "image/jpeg" });
          setBottomwearFile(file, product.image);
        })
        .catch(() => {});
    }
  };

  const handleFile = useCallback((file, type) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a JPG or PNG image.");
      return;
    }
    const preview = URL.createObjectURL(file);
    if (type === "model") setModelFile(file, preview);
  }, [setModelFile, setError]);

  const handleDrop = useCallback((e, type) => {
    e.preventDefault();
    if (type === "model") setDragOverModel(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, type);
  }, [handleFile]);

  const handleDragOver = useCallback((e, type) => {
    e.preventDefault();
    if (type === "model") setDragOverModel(true);
    if (type === "upperwear") setDragOverUpper(true);
    if (type === "bottomwear") setDragOverBottom(true);
  }, []);

  const handleDragLeave = useCallback((e, type) => {
    e.preventDefault();
    if (type === "model") setDragOverModel(false);
    if (type === "upperwear") setDragOverUpper(false);
    if (type === "bottomwear") setDragOverBottom(false);
  }, []);

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

  const handleShare = async () => {
    if (!result) return;
    try {
      const response = await fetch(result);
      const blob = await response.blob();
      const file = new File([blob], 'fashionverse-tryon.png', { type: blob.type || 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My FashionVerse Try-On',
          text: 'Check out my new look generated by FashionVerse AI!',
          files: [file]
        });
        return;
      }
      
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ [blob.type || 'image/png']: blob });
        await navigator.clipboard.write([item]);
        alert("Image copied to clipboard! You can now paste it anywhere.");
      } else {
        alert("Sharing is not fully supported on this browser. Please use the Download button.");
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Error sharing:", err);
        alert("Failed to share the image. You can use the download button instead.");
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes goldShimmer { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progressFill { from { width: 0%; } to { width: 90%; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      
      <div className="tryon-page">
        {/* Header Section */}
        <div className="tryon-header">
          <div className="tryon-powered-tag">
            Powered by AI
          </div>
          <h1 className="tryon-title" style={{ background: "linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Virtual Try-On
          </h1>
          <p className="tryon-subtitle">
            Upload your photo and a garment — our AI will dress you instantly
          </p>
          
          {/* Step Indicators */}
          <div className="tryon-steps" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
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

        {/* Main Layout - Top/Bottom Split */}
        <div className="tryon-page-content" style={{ display: "flex", flexDirection: "column", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
          
          {/* TOP ROW: Photo & Garments */}
          <div className="tryon-panels-row">
            
            {/* Left Column - Capture Zone (Your Photo) */}
            <div className="capture-zone-panel" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "20px", padding: "2rem", backdropFilter: "blur(10px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
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
                onDragOver={(e) => handleDragOver(e, "model")}
                onDragLeave={(e) => handleDragLeave(e, "model")}
                style={{
                  border: dragOverModel ? "2px dashed rgba(201,168,76,0.8)" : (modelPreview ? "1px solid rgba(201,168,76,0.2)" : "2px dashed rgba(201,168,76,0.3)"),
                  borderRadius: "16px",
                  aspectRatio: "3/4",
                  maxWidth: "280px",
                  margin: "0 auto",
                  background: dragOverModel ? "rgba(201,168,76,0.08)" : (modelPreview ? "#120a06" : "rgba(201,168,76,0.02)"),
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative"
                }}
                className="photo-upload-area"
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

            </div>

            {/* Right Column - Garments */}
            <div className="garments-panel" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "20px", padding: "2rem", backdropFilter: "blur(10px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                  <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                  <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
                </svg>
                <span style={{ fontSize: "12px", letterSpacing: "0.15em", color: "#c9a84c", fontWeight: "600" }}>UPPERWEAR</span>
              </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* ── UPPERWEAR PICKER ── */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#f5f0e8", display: "block", marginBottom: "10px" }}>
                  👕 Upperwear
                </label>

                {/* Filter Tabs */}
                <div className="garments-tabs" data-lenis-prevent="true" style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none", msOverflowStyle: "none", marginBottom: "10px" }}>
                  <style>{`.tryon-filter-tabs::-webkit-scrollbar { display: none; }`}</style>
                  {UPPER_FILTER_TABS.map((tab) => (
                    <button key={tab} onClick={() => setUpperTab(tab)} style={{
                      padding: "4px 10px", fontSize: "10px", borderRadius: "6px", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                      border: upperTab === tab ? "1px solid rgba(201,151,58,0.35)" : "1px solid rgba(201,151,58,0.15)",
                      background: upperTab === tab ? "rgba(201,151,58,0.12)" : "transparent",
                      color: upperTab === tab ? "#E8B84B" : "rgba(245,237,212,0.5)",
                      transition: "all 0.15s ease", }}>
                      {tab === "Wishlist" ? "♡ Wishlist" : tab}
                    </button>
                  ))}
                </div>

                {/* Product Grid */}
                {loadingProducts ? (
                  <div style={{ textAlign: "center", padding: "24px", color: "rgba(245,237,212,0.3)", fontSize: "12px" }}>Loading products…</div>
                ) : (() => {
                  const isWishlist = upperTab === "Wishlist";
                  const items = isWishlist
                    ? wishlistItems.filter(p => ["T-Shirts","Casual Shirts","Formal Shirts","Sweatshirts","Jackets","Blazers"].includes(p.product_type))
                    : upperTab === "All" ? upperProducts
                    : upperTab === "Shirts" ? upperProducts.filter(p => p.product_type?.includes("Shirt"))
                    : upperProducts.filter(p => p.product_type === upperTab || p.product_type?.includes(upperTab));

                  return items.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 16px", color: "rgba(245,237,212,0.3)", fontSize: "12px" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(201,151,58,0.4)" strokeWidth="1.5" style={{ display: "block", margin: "0 auto 8px" }}>
                        <path d="M20.38 3.4a2 2 0 0 0-2-2h-12.76a2 2 0 0 0-2 2l-.62 6.6h18z" /><path d="M12 10v11" /><path d="M8 14h8" />
                      </svg>
                      <div>No products available yet</div>
                      <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.6 }}>Check back soon</div>
                    </div>
                  ) : (
                    <div className="garments-grid" data-lenis-prevent="true" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", padding: "4px", scrollbarWidth: "thin", scrollbarColor: "#c9a84c transparent" }}>
                      {items.map((product) => {
                        const isSelected = selectedUpperProduct?.id === product.id;
                        return (
                          <div key={product.id} className="picker-product-card" onClick={() => selectUpperProduct(isSelected ? null : product)} style={{
                            background: "rgba(26,15,8,0.8)", border: isSelected ? "2px solid #C9973A" : "1px solid rgba(201,151,58,0.15)",
                            borderRadius: "10px", overflow: "hidden", cursor: "pointer",
                            transition: "all 0.2s ease", position: "relative",
                            boxShadow: isSelected ? "0 0 12px rgba(201,151,58,0.3)" : "none",
                            transform: isSelected ? "scale(1.03)" : "scale(1)",
                          }}
                          onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(201,151,58,0.4)"; e.currentTarget.style.transform = "scale(1.03)"; } }}
                          onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(201,151,58,0.15)"; e.currentTarget.style.transform = "scale(1)"; } }}
                          >
                            {product.image ? (
                              <img src={product.image} alt={product.name} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                            ) : (
                              <div style={{ width: "100%", aspectRatio: "3/4", background: "#120a06", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(201,151,58,0.3)" strokeWidth="1.5"><path d="M20.38 3.4a2 2 0 0 0-2-2h-12.76a2 2 0 0 0-2 2l-.62 6.6h18z" /></svg>
                              </div>
                            )}
                            <div style={{ fontSize: "9px", color: "rgba(245,237,212,0.6)", padding: "4px 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {product.name}
                            </div>
                            {isSelected && (
                              <div style={{ position: "absolute", top: "4px", right: "4px", width: "18px", height: "18px", background: "#C9973A", color: "#120a06", borderRadius: "50%", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Selected Preview */}
                {(selectedUpperProduct || upperwearPreview) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "rgba(201,151,58,0.06)", border: "1px solid rgba(201,151,58,0.2)", borderRadius: "10px", marginTop: "8px" }}>
                    <img src={selectedUpperProduct?.image || upperwearPreview} alt={selectedUpperProduct?.name || "Selected Upperwear"} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", color: "#F5EDD4", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedUpperProduct?.name || "Selected Upperwear"}</div>
                      <div style={{ fontSize: "10px", color: "#C9973A" }}>{selectedUpperProduct?.brand || "Custom"}</div>
                    </div>
                    <button onClick={() => { setSelectedUpperProduct(null); setUpperwearFile(null, null); }} style={{ background: "none", border: "none", color: "rgba(245,237,212,0.4)", cursor: "pointer", fontSize: "12px", padding: "4px", flexShrink: 0 }}>✕ Remove</button>
                  </div>
                )}

                {/* Description Input */}
                <input type="text" value={upperwearDesc} onChange={(e) => setUpperwearDesc(e.target.value)} placeholder='e.g. "blue shirt"' style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "10px", color: "#f5f0e8", fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "all 0.2s ease", marginTop: "10px" }} onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.8)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; }} />
              </div>
            </div>
          </div>

            {/* Right Column - Bottomwear */}
            <div className="garments-panel" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "20px", padding: "2rem", backdropFilter: "blur(10px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2">
                  <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"></path>
                  <polygon points="18 2 22 6 12 16 8 16 8 12 18 2"></polygon>
                </svg>
                <span style={{ fontSize: "12px", letterSpacing: "0.15em", color: "#c9a84c", fontWeight: "600" }}>BOTTOMWEAR</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* ── BOTTOMWEAR PICKER ── */}
              <div>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#f5f0e8", display: "block", marginBottom: "10px" }}>
                  👖 Bottomwear
                </label>

                {/* Filter Tabs */}
                <div className="garments-tabs" data-lenis-prevent="true" style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none", msOverflowStyle: "none", marginBottom: "10px" }}>
                  {LOWER_FILTER_TABS.map((tab) => (
                    <button key={tab} onClick={() => setLowerTab(tab)} style={{
                      padding: "4px 10px", fontSize: "10px", borderRadius: "6px", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                      border: lowerTab === tab ? "1px solid rgba(201,151,58,0.35)" : "1px solid rgba(201,151,58,0.15)",
                      background: lowerTab === tab ? "rgba(201,151,58,0.12)" : "transparent",
                      color: lowerTab === tab ? "#E8B84B" : "rgba(245,237,212,0.5)",
                      transition: "all 0.15s ease", }}>
                      {tab === "Wishlist" ? "♡ Wishlist" : tab}
                    </button>
                  ))}
                </div>

                {/* Product Grid */}
                {loadingProducts ? (
                  <div style={{ textAlign: "center", padding: "24px", color: "rgba(245,237,212,0.3)", fontSize: "12px" }}>Loading products…</div>
                ) : (() => {
                  const isWishlist = lowerTab === "Wishlist";
                  const items = isWishlist
                    ? wishlistItems.filter(p => ["Jeans","Trousers","Cargo","Shorts","Track Pants"].includes(p.product_type))
                    : lowerTab === "All" ? lowerProducts
                    : lowerProducts.filter(p => p.product_type === lowerTab || p.product_type?.includes(lowerTab));

                  return items.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 16px", color: "rgba(245,237,212,0.3)", fontSize: "12px" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(201,151,58,0.4)" strokeWidth="1.5" style={{ display: "block", margin: "0 auto 8px" }}>
                        <path d="M20.38 3.4a2 2 0 0 0-2-2h-12.76a2 2 0 0 0-2 2l-.62 6.6h18z" /><path d="M12 10v11" /><path d="M8 14h8" />
                      </svg>
                      <div>No products available yet</div>
                      <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.6 }}>Check back soon</div>
                    </div>
                  ) : (
                    <div className="garments-grid" data-lenis-prevent="true" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", padding: "4px", scrollbarWidth: "thin", scrollbarColor: "#c9a84c transparent" }}>
                      {items.map((product) => {
                        const isSelected = selectedLowerProduct?.id === product.id;
                        return (
                          <div key={product.id} className="picker-product-card" onClick={() => selectLowerProduct(isSelected ? null : product)} style={{
                            background: "rgba(26,15,8,0.8)", border: isSelected ? "2px solid #C9973A" : "1px solid rgba(201,151,58,0.15)",
                            borderRadius: "10px", overflow: "hidden", cursor: "pointer",
                            transition: "all 0.2s ease", position: "relative",
                            boxShadow: isSelected ? "0 0 12px rgba(201,151,58,0.3)" : "none",
                            transform: isSelected ? "scale(1.03)" : "scale(1)",
                          }}
                          onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(201,151,58,0.4)"; e.currentTarget.style.transform = "scale(1.03)"; } }}
                          onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = "rgba(201,151,58,0.15)"; e.currentTarget.style.transform = "scale(1)"; } }}
                          >
                            {product.image ? (
                              <img src={product.image} alt={product.name} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                            ) : (
                              <div style={{ width: "100%", aspectRatio: "3/4", background: "#120a06", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(201,151,58,0.3)" strokeWidth="1.5"><path d="M20.38 3.4a2 2 0 0 0-2-2h-12.76a2 2 0 0 0-2 2l-.62 6.6h18z" /></svg>
                              </div>
                            )}
                            <div style={{ fontSize: "9px", color: "rgba(245,237,212,0.6)", padding: "4px 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {product.name}
                            </div>
                            {isSelected && (
                              <div style={{ position: "absolute", top: "4px", right: "4px", width: "18px", height: "18px", background: "#C9973A", color: "#120a06", borderRadius: "50%", fontSize: "10px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Selected Preview */}
                {(selectedLowerProduct || bottomwearPreview) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "rgba(201,151,58,0.06)", border: "1px solid rgba(201,151,58,0.2)", borderRadius: "10px", marginTop: "8px" }}>
                    <img src={selectedLowerProduct?.image || bottomwearPreview} alt={selectedLowerProduct?.name || "Selected Bottomwear"} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", color: "#F5EDD4", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedLowerProduct?.name || "Selected Bottomwear"}</div>
                      <div style={{ fontSize: "10px", color: "#C9973A" }}>{selectedLowerProduct?.brand || "Custom"}</div>
                    </div>
                    <button onClick={() => { setSelectedLowerProduct(null); setBottomwearFile(null, null); }} style={{ background: "none", border: "none", color: "rgba(245,237,212,0.4)", cursor: "pointer", fontSize: "12px", padding: "4px", flexShrink: 0 }}>✕ Remove</button>
                  </div>
                )}

                {/* Description Input */}
                <input type="text" value={bottomwearDesc} onChange={(e) => setBottomwearDesc(e.target.value)} placeholder='e.g. "black jeans"' style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "10px", color: "#f5f0e8", fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "all 0.2s ease", marginTop: "10px" }} onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.8)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; }} />
              </div>

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

            </div>
          </div>

          {/* MIDDLE ROW: Try It On Button */}
          <div className="tryon-action-section">
            <button
              className="try-it-on-btn"
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
            <p className="tryon-privacy-note" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Your images are private. Not stored or shared.
            </p>
          </div>

          {/* BOTTOM ROW: AI Output */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <div style={{ width: "100%", maxWidth: "800px" }}>
              <div className={`ai-output-section ${result ? "has-result" : ""}`} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "20px", backdropFilter: "blur(10px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
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
              <div className="ai-output-empty">
                <svg className="ai-output-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: "float 3s ease-in-out infinite" }}>
                  <path d="M20.38 3.4a2 2 0 0 0-2-2h-12.76a2 2 0 0 0-2 2l-.62 6.6h18z" />
                  <path d="M12 10v11" />
                  <path d="M8 14h8" />
                </svg>
                <div className="ai-output-empty-text">
                  <h3>Results will appear here</h3>
                  <p>Upload a photo and garment to get started</p>
                </div>
                <div className="ai-feature-badges">
                  {["✨ Realistic Draping", "✨ Preserves Your Look", "✨ Instant Results"].map((feature) => (
                    <span key={feature} className="ai-feature-badge">
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
                <p style={{ color: "#5a4f35", fontSize: "12px", marginBottom: "1.5rem" }}>
                  This takes 15–30 seconds
                </p>
                <button
                  onClick={cancelTryOn}
                  style={{
                    padding: "8px 24px",
                    background: "transparent",
                    border: "1px solid rgba(201,168,76,0.5)",
                    borderRadius: "8px",
                    color: "#c9a84c",
                    fontSize: "13px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(201,168,76,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Cancel
                </button>
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
                    border: "1px solid rgba(56,189,248,0.4)",
                    boxShadow: "0 8px 40px rgba(56,189,248,0.15)",
                    marginBottom: "1.5rem",
                    maxWidth: "360px",
                    margin: "0 auto 1.5rem",
                    animation: "fadeSlideIn 0.6s ease"
                  }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <img
                        src={modelPreview}
                        alt="Before"
                        style={{
                          width: "100%",
                          aspectRatio: "3/4",
                          objectFit: "cover",
                          objectPosition: "center",
                          display: "block",
                          backgroundColor: "#120a06"
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
                          aspectRatio: "3/4",
                          objectFit: "cover",
                          objectPosition: "center",
                          display: "block",
                          backgroundColor: "#120a06"
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
                      maxWidth: "180px",
                      margin: "0 auto 1.5rem",
                      aspectRatio: "3/4",
                      objectFit: "cover",
                      objectPosition: "center",
                      backgroundColor: "#120a06",
                      borderRadius: "16px",
                      border: "1px solid rgba(56,189,248,0.4)",
                      boxShadow: "0 8px 40px rgba(56,189,248,0.15)",
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

          {/* ── FASHION AI TOOLS SECTION ── */}
          {result && (
            <div style={{ maxWidth: "1200px", margin: "2rem auto 0", width: "100%" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "20px", padding: "2rem", backdropFilter: "blur(10px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
                <FashionAITools modelFile={modelFile} resultUrl={result} />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}


