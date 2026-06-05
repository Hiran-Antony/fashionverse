const fs = require('fs');
const cssToAppend = `
/* =========================================================
   FIX — HERO VIDEO PANEL HARD EDGE REMOVAL
========================================================= */

.hero-video-panel {
  position: relative;
  overflow: hidden;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  -webkit-mask-image: 
    linear-gradient(
      to right,
      transparent 0%,
      black 12%,
      black 88%,
      transparent 100%
    ),
    linear-gradient(
      to bottom,
      transparent 0%,
      black 8%,
      black 92%,
      transparent 100%
    );
  -webkit-mask-composite: destination-in;
  mask-composite: intersect;
}

.hero-video-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: 
    linear-gradient(
      to right,
      rgba(18, 10, 6, 1) 0%,
      rgba(18, 10, 6, 0.7) 15%,
      rgba(18, 10, 6, 0.2) 35%,
      transparent 55%
    ),
    linear-gradient(
      to bottom,
      rgba(18, 10, 6, 0.9) 0%,
      transparent 25%
    ),
    linear-gradient(
      to left,
      rgba(18, 10, 6, 0.8) 0%,
      transparent 30%
    ),
    linear-gradient(
      to top,
      rgba(18, 10, 6, 0.9) 0%,
      transparent 30%
    );
  z-index: 2;
  pointer-events: none;
}

.hero-section {
  background-color: #120a06;
}

.hero-container {
  background: #120a06;
  overflow: hidden;
}
`;

fs.appendFileSync('src/index.css', cssToAppend);
console.log('Appended CSS to index.css');
