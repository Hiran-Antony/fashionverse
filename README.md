# FashionVerse - Next-Gen Web3 E-Commerce

🔗 **Live Website:** [https://fashionverseonline.vercel.app](https://fashionverseonline.vercel.app)

FashionVerse is an advanced, AI-powered decentralized e-commerce platform that blends traditional fashion retail with the future of Web3. It is a full-stack, highly secure, and feature-rich application designed to revolutionize the online shopping experience.

## Project Team / Developers

This project was developed by:

* **Hiran Antony R** - [rhiranantony15@gmail.com](mailto:rhiranantony15@gmail.com)
* **Visal A** - [vijayvisal2710@gmail.com](mailto:vijayvisal2710@gmail.com)
* **Sakthi Sundaram R** - [sakthisundaram.rajeshkannan@gmail.com](mailto:sakthisundaram.rajeshkannan@gmail.com)

---

## Comprehensive Feature List

### 🛍️ Core Customer Experience
- **Complete E-Commerce Flow:** Fully functional Shopping Cart, Wishlist, and secure multi-step Checkout system.
- **Invoice & Billing:** Automated PDF invoice generation and seamless WhatsApp bill sharing integration for easy record-keeping.
- **Customer Dashboard:** Dedicated 'My Account' portal for users to manage profiles, track active orders, and view order history.
- **Virtual Try-On:** Cutting-edge augmented reality integrations allowing users to visualize garments on themselves before purchasing.
- **FashionVerse AI Consultant:** An integrated AI styling engine powered by Google Gemini that provides personalized style advice, color analysis, fabric scanning, and curated outfit recommendations.
- **Google OAuth Login:** Seamless one-click authentication using Google accounts.
- **OTP Login & Resend:** Secure phone/email login with One-Time Passwords (OTP) and an intelligent resend mechanism.

### ⛓️ Web3 & Blockchain Integration
- **FashionVerse Tokens (FVT):** Connect your crypto wallet (MetaMask) and earn Web3 tokens as loyalty rewards for your purchases.
- **Smart Contracts:** Secure transactions and reward distributions governed by Ethereum/Solidity smart contracts via ethers.js.

### 🛡️ Enterprise-Grade Admin Dashboard
Our admin panel is a fortress, protected by **8 Distinct Security Layers**:
1. **Secret Key Authentication:** A master secret key is required to even access the admin login portal.
2. **Role-Based Access Control (RBAC):** Strict permissions separating Super Admins from regular Staff.
3. **Multi-Factor Authentication (MFA):** Requires OTP verification for critical administrative actions.
4. **Session Management:** Secure JWT token tracking with automatic timeout for inactive admin sessions.
5. **Database Row-Level Security (RLS):** Supabase policies ensuring that even if the frontend is bypassed, the database rejects unauthorized queries.
6. **Encrypted Payloads:** Sensitive data is hashed and encrypted before traversing the network.
7. **Audit Logging:** Continuous tracking of all admin and staff actions for complete accountability.
8. **Frontend Tamper Protection:** Disabled Right-Click and Developer Tools on critical administrative pages to prevent client-side inspection and code tampering.

**Admin Capabilities:**
- **Liquid Glass UI:** A stunning, immersive dashboard interface featuring advanced glassmorphism, micro-animations, and modern aesthetics for seamless management.
- **Product Management:** Full CRUD operations for adding, editing, and managing inventory.
- **Order Management:** Track, update, and manage customer orders from placement to fulfillment.
- **Staff Management:** Add, remove, and manage permissions for platform employees.
- **Dynamic Coupon Codes:** Generate and distribute promotional discount codes.
- **Interactive Analytics Graphs:** Real-time visual data representation of sales, revenue, and user growth.

### 🚚 Delivery Driver PWA Dashboard
- **Installable Progressive Web App (PWA):** Drivers can install the dashboard directly to their mobile home screens without needing an App Store.
- **Live Map Tracking:** Integrated mapping to show real-time routes and delivery destinations.
- **OTP-Based Delivery PIN:** Secure delivery handoffs requiring the customer to provide a unique OTP PIN to the driver to complete the order.

---

## Technologies Used

- **Frontend & UI:** React, TypeScript, Vite, Tailwind CSS, Framer Motion, GSAP (Advanced Animations), Swiper.js
- **State Management & Data Fetching:** Zustand, React Query (@tanstack/react-query)
- **Forms & Validation:** React Hook Form, Zod
- **Physics & Scrolling:** Matter.js (2D Physics), Lenis (Smooth Scrolling)
- **Search:** Fuse.js (Fuzzy Search)
- **Backend & Database:** Supabase (PostgreSQL, Authentication, Storage)
- **Payment Gateway:** Razorpay
- **Email Services:** Resend API
- **Asset Management:** Cloudinary
- **Web3 & Blockchain:** ethers.js, Solidity Smart Contracts
- **Virtual Try-On & 3D:** Three.js, React Three Fiber, Drei
- **Maps & Routing:** Leaflet, React Leaflet (Live Delivery Tracking)
- **Data Visualization:** Recharts (Admin Analytics)
- **AI Integration:** Google Gemini API
- **PWA:** Vite PWA Plugin (Installable Mobile Dashboard)
