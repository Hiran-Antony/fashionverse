const fs = require('fs');

const cssToAppend = `
/* =========================================================
   FIX 2 — PROFILE DROPDOWN MENU
========================================================= */

.profile-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 240px;
  background: rgba(22, 14, 6, 0.97);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(201, 151, 58, 0.25);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(201, 151, 58, 0.1),
    inset 0 1px 0 rgba(201, 151, 58, 0.15);
  z-index: 1000;
  animation: dropdownFadeIn 0.2s ease;
}

@keyframes dropdownFadeIn {
  from { 
    opacity: 0; 
    transform: translateY(-8px) scale(0.97); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

.profile-dropdown-header {
  padding: 16px 18px 14px;
  border-bottom: 1px solid rgba(201, 151, 58, 0.12);
  background: rgba(201, 151, 58, 0.05);
}

.profile-dropdown-name {
  font-size: 15px;
  font-weight: 600;
  color: #F5EDD4;
  margin-bottom: 3px;
}

.profile-dropdown-email {
  font-size: 12px;
  color: rgba(212, 169, 53, 0.6);
  letter-spacing: 0.02em;
}

.profile-dropdown-menu {
  padding: 8px;
}

.profile-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s ease;
  text-decoration: none;
  color: rgba(245, 237, 212, 0.75);
  font-size: 14px;
  font-weight: 400;
}

.profile-dropdown-item:hover {
  background: rgba(201, 151, 58, 0.1);
  color: #E8B84B;
  padding-left: 16px;
}

.profile-dropdown-item svg,
.profile-dropdown-item .icon {
  width: 16px;
  height: 16px;
  color: rgba(201, 151, 58, 0.6);
  flex-shrink: 0;
  transition: color 0.18s ease;
}

.profile-dropdown-item:hover svg,
.profile-dropdown-item:hover .icon {
  color: #E8B84B;
}

.profile-dropdown-divider {
  height: 1px;
  background: rgba(201, 151, 58, 0.1);
  margin: 4px 8px;
}

.profile-dropdown-signout {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  margin: 4px 8px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s ease;
  color: rgba(220, 80, 60, 0.7);
  font-size: 14px;
  font-weight: 400;
}

.profile-dropdown-signout:hover {
  background: rgba(220, 80, 60, 0.08);
  color: #ff6b55;
  padding-left: 16px;
}

.profile-dropdown-signout svg,
.profile-dropdown-signout .icon {
  color: inherit;
  width: 16px;
  height: 16px;
}

.profile-admin-badge {
  display: inline-block;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #120a06;
  background: linear-gradient(135deg, #C9973A, #E8B84B);
  padding: 2px 8px;
  border-radius: 20px;
  margin-top: 5px;
}

/* =========================================================
   FIX 3 — SEARCH BAR PLACEHOLDER & STYLING
========================================================= */

.search-overlay {
  background: rgba(10, 6, 2, 0.96);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
}

.search-input-wrapper {
  background: rgba(26, 15, 8, 0.9);
  border: 1px solid rgba(201, 151, 58, 0.3);
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  transition: all 0.2s ease;
}

.search-input-wrapper:focus-within {
  border-color: rgba(201, 151, 58, 0.65);
  box-shadow: 
    0 0 0 3px rgba(201, 151, 58, 0.1),
    0 0 32px rgba(201, 151, 58, 0.15);
  background: rgba(30, 18, 9, 0.95);
}

.search-input-icon {
  color: rgba(201, 151, 58, 0.6);
  flex-shrink: 0;
  width: 18px;
  height: 18px;
}

.search-input {
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
  padding: 18px 0;
  font-size: 15px;
  color: #F5EDD4;
  font-family: var(--font-sans);
  letter-spacing: 0.02em;
}

.search-input::placeholder {
  color: rgba(201, 151, 58, 0.45);
  font-style: italic;
  letter-spacing: 0.04em;
}

.search-close-btn {
  color: rgba(201, 151, 58, 0.5);
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}
.search-close-btn:hover {
  color: #E8B84B;
}

.search-recent-label {
  color: rgba(201, 151, 58, 0.5);
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.search-chip {
  background: rgba(201, 151, 58, 0.08);
  border: 1px solid rgba(201, 151, 58, 0.18);
  color: rgba(245, 237, 212, 0.7);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s ease;
}
.search-chip:hover {
  background: rgba(201, 151, 58, 0.15);
  border-color: rgba(201, 151, 58, 0.4);
  color: #E8B84B;
}
`;

fs.appendFileSync('src/index.css', cssToAppend);
console.log('Appended Fix 2 and Fix 3 CSS to index.css');
