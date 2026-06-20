import re

file_path = "src/components/VirtualTryOn.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Page Wrapper
content = content.replace(
    '<div style={{\n        background: "linear-gradient(135deg, #0d0b07 0%, #1a1208 50%, #0d0b07 100%)",\n        minHeight: "100vh",\n        color: "#f5f0e8",\n        padding: "2rem"\n      }}>',
    '<div className="tryon-page">'
)

# 2. Header Section
content = content.replace(
    '<div style={{\n          textAlign: "center",\n          marginBottom: "3rem"\n        }}>',
    '<div className="tryon-header">'
)
content = content.replace(
    '<div style={{\n            fontSize: "11px",\n            letterSpacing: "0.2em",\n            color: "#c9a84c",\n            marginBottom: "0.5rem",\n            textTransform: "uppercase"\n          }}>',
    '<div className="tryon-powered-tag">'
)
content = content.replace(
    '<h1 style={{\n            fontSize: "clamp(2rem, 5vw, 3.5rem)",\n            background: "linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c)",\n            WebkitBackgroundClip: "text",\n            WebkitTextFillColor: "transparent",\n            backgroundClip: "text",\n            margin: "0 0 1rem 0"\n          }}>',
    '<h1 className="tryon-title" style={{ background: "linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>'
)
content = content.replace(
    '<p style={{\n            color: "#8a7a5a",\n            fontSize: "15px",\n            maxWidth: "480px",\n            margin: "0 auto 1.5rem"\n          }}>',
    '<p className="tryon-subtitle">'
)

content = content.replace(
    '<div style={{\n            display: "flex",\n            alignItems: "center",\n            justifyContent: "center",\n            gap: "0.5rem"\n          }}>',
    '<div className="tryon-steps" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>'
)

# 3. Main layout wrapper
content = content.replace(
    '<div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>',
    '<div className="tryon-page-content" style={{ display: "flex", flexDirection: "column", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>'
)

# 4. Top Row
content = content.replace(
    '<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", gap: "2rem" }}>',
    '<div className="tryon-panels-row">'
)

# 5. Panels
content = content.replace(
    '{/* Left Column - Capture Zone (Your Photo) */}\n            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "20px", padding: "2rem", backdropFilter: "blur(10px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>',
    '{/* Left Column - Capture Zone (Your Photo) */}\n            <div className="capture-zone-panel" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "20px", padding: "2rem", backdropFilter: "blur(10px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>'
)

content = content.replace(
    '{/* Right Column - Garments */}\n            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "20px", padding: "2rem", backdropFilter: "blur(10px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>',
    '{/* Right Column - Garments */}\n            <div className="garments-panel" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "20px", padding: "2rem", backdropFilter: "blur(10px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>'
)

# 6. Upload Area
content = content.replace(
    'position: "relative",\n                  overflow: "hidden"\n                }}',
    'position: "relative"\n                }}\n                className="photo-upload-area"'
)

# 7. Garments grid & picker cards
content = content.replace(
    '<div data-lenis-prevent="true" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", maxHeight: "280px", overflowY: "auto", padding: "4px", scrollbarWidth: "thin", scrollbarColor: "#c9a84c transparent" }}>',
    '<div className="garments-grid" data-lenis-prevent="true" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", padding: "4px", scrollbarWidth: "thin", scrollbarColor: "#c9a84c transparent" }}>'
)
content = content.replace(
    'className="tryon-filter-tabs" data-lenis-prevent="true" style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none", msOverflowStyle: "none", marginBottom: "10px" }}',
    'className="garments-tabs" data-lenis-prevent="true" style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", scrollbarWidth: "none", msOverflowStyle: "none", marginBottom: "10px" }}'
)
content = content.replace(
    '<div key={product.id} onClick={() => selectUpperProduct(isSelected ? null : product)} style={{',
    '<div key={product.id} className="picker-product-card" onClick={() => selectUpperProduct(isSelected ? null : product)} style={{'
)
content = content.replace(
    '<div key={product.id} onClick={() => selectLowerProduct(isSelected ? null : product)} style={{',
    '<div key={product.id} className="picker-product-card" onClick={() => selectLowerProduct(isSelected ? null : product)} style={{'
)

# 8. Try it on action section
content = content.replace(
    '{/* MIDDLE ROW: Try It On Button */}\n          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>\n            <div style={{ width: "100%", maxWidth: "400px" }}>\n            <button\n              onClick={handleTryOn}',
    '{/* MIDDLE ROW: Try It On Button */}\n          <div className="tryon-action-section">\n            <button\n              className="try-it-on-btn"\n              onClick={handleTryOn}'
)
content = content.replace(
    '{/* Privacy Note */}\n            <p style={{\n              display: "flex",\n              alignItems: "center",\n              justifyContent: "center",\n              gap: "0.5rem",\n              color: "#5a4f35",\n              fontSize: "12px",\n              marginTop: "1rem"\n            }}>',
    '{/* Privacy Note */}\n            <p className="tryon-privacy-note" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>'
)
# Close div correctly (action section was originally 2 nested divs)
content = content.replace(
    'Your images are private. Not stored or shared.\n            </p>\n            </div>\n          </div>',
    'Your images are private. Not stored or shared.\n            </p>\n          </div>'
)

# 9. AI Output section
content = content.replace(
    '{/* BOTTOM ROW: AI Output */}\n          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>\n            <div style={{ width: "100%", maxWidth: "800px" }}>\n              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "20px", padding: "2rem", backdropFilter: "blur(10px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)", minHeight: "400px", display: "flex", flexDirection: "column" }}>',
    '{/* BOTTOM ROW: AI Output */}\n          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>\n            <div style={{ width: "100%", maxWidth: "800px" }}>\n              <div className={`ai-output-section ${result ? "has-result" : ""}`} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "20px", backdropFilter: "blur(10px)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>'
)

# 10. AI Empty state
content = content.replace(
    '<div style={{\n                flex: 1,\n                display: "flex",\n                flexDirection: "column",\n                alignItems: "center",\n                justifyContent: "center",\n                textAlign: "center",\n                padding: "2rem"\n              }}>\n                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" style={{ animation: "float 3s ease-in-out infinite", marginBottom: "1.5rem" }}>',
    '<div className="ai-output-empty">\n                <svg className="ai-output-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: "float 3s ease-in-out infinite" }}>'
)

content = content.replace(
    '<p style={{ color: "#c9a84c", fontSize: "18px", fontWeight: "500", margin: "0 0 0.5rem 0" }}>\n                  Results will appear here\n                </p>\n                <p style={{ color: "#8a7a5a", fontSize: "14px", margin: "0 0 2rem 0" }}>\n                  Upload a photo and garment to get started\n                </p>',
    '<div className="ai-output-empty-text">\n                  <h3>Results will appear here</h3>\n                  <p>Upload a photo and garment to get started</p>\n                </div>'
)

content = content.replace(
    '<div style={{\n                  display: "flex",\n                  flexWrap: "wrap",\n                  gap: "0.75rem",\n                  justifyContent: "center"\n                }}>',
    '<div className="ai-feature-badges">'
)

content = content.replace(
    '<span key={feature} style={{\n                      border: "1px solid rgba(201,168,76,0.2)",\n                      borderRadius: "99px",\n                      padding: "6px 14px",\n                      fontSize: "12px",\n                      color: "#8a7a5a"\n                    }}>',
    '<span key={feature} className="ai-feature-badge">'
)

# Add tryon.css import
if "import '../styles/tryon.css';" not in content:
    content = "import '../styles/tryon.css';\n" + content

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied to VirtualTryOn.jsx")

css_content = """
.tryon-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: #f5f0e8;
}

/* Background image */
.tryon-page::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url('/photos/tryon.webp');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  /* Dark overlay so content readable */
  filter: brightness(0.35);
}

/* Dark gradient overlay on top */
.tryon-page::after {
  content: '';
  position: fixed;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(10,6,2,0.7) 0%,
    rgba(10,6,2,0.5) 40%,
    rgba(10,6,2,0.7) 100%
  );
  z-index: 0;
  pointer-events: none;
}

/* All content above background */
.tryon-page > * {
  position: relative;
  z-index: 1;
}

.tryon-header {
  padding: 24px 0 16px;
  text-align: center;
}

.tryon-powered-tag {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: rgba(201,151,58,0.6);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.tryon-title {
  font-size: clamp(28px, 4vw, 48px);
  margin-bottom: 8px;
  line-height: 1.1;
}

.tryon-subtitle {
  font-size: 13px;
  color: rgba(245,237,212,0.5);
  margin-bottom: 16px;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

/* Step indicators - keep compact */
.tryon-steps {
  margin-bottom: 16px;
}

.tryon-panels-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 0 24px;
  margin-bottom: 16px;
}

/* Both panels same fixed height */
.capture-zone-panel,
.garments-panel {
  height: 380px;
  overflow: hidden;
}

/* Photo upload area - more compact */
.photo-upload-area {
  height: 260px;
}

/* Garments panel - scrollable inside */
.garments-grid {
  max-height: 260px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Product cards in picker - smaller */
.picker-product-card img {
  aspect-ratio: 1/1;
  /* Square not tall portrait */
  object-fit: cover;
}

/* Category tabs - horizontal scroll */
.garments-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 10px;
  scrollbar-width: none;
}
.garments-tabs::-webkit-scrollbar {
  display: none;
}

.tryon-action-section {
  padding: 12px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.try-it-on-btn {
  width: 100%;
  max-width: 500px;
  padding: 14px;
  font-size: 15px;
  /* Keep existing gold gradient inside JSX style */
}

.tryon-privacy-note {
  font-size: 11px;
  color: rgba(245,237,212,0.35);
  margin: 0;
}

.ai-output-section {
  margin: 0 24px 24px;
  padding: 20px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Empty state - horizontal not vertical */
.ai-output-empty {
  display: flex;
  align-items: center;
  gap: 20px;
}

.ai-output-empty-icon {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  color: rgba(201,151,58,0.3);
}

.ai-output-empty-text h3 {
  font-size: 15px;
  color: rgba(245,237,212,0.6);
  margin-bottom: 4px;
  margin-top: 0;
}

.ai-output-empty-text p {
  font-size: 12px;
  color: rgba(245,237,212,0.3);
  margin: 0;
}

/* Feature badges - inline not separate row */
.ai-feature-badges {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
}

.ai-feature-badge {
  padding: 4px 12px;
  font-size: 10px;
  border-radius: 20px;
  background: rgba(201,151,58,0.06);
  border: 1px solid rgba(201,151,58,0.15);
  color: rgba(201,151,58,0.6);
  white-space: nowrap;
}

/* When result IS shown - expand fully */
.ai-output-section.has-result {
  min-height: 500px;
}

.ai-output-section.has-result .ai-output-result-image {
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  border: 1px solid rgba(201,151,58,0.2);
}

/* Page wrapper */
.tryon-page-content {
  padding-top: 0;
}
"""

with open("src/styles/tryon.css", "w", encoding="utf-8") as f:
    f.write(css_content)

print("Created src/styles/tryon.css")
