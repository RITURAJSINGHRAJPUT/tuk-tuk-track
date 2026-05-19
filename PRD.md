# Product Requirements Document (PRD): TukTukTrack

## 1. Product Concept & Vision
**Product Name:** TukTukTrack  
**Vision:** A comprehensive, real-time logistics and fleet management platform designed to revolutionize how shipments are tracked, managed, and delivered for businesses handling sensitive and time-critical deliveries.  
**Core Value Proposition:** TukTukTrack brings administrators, drivers, and customers together into a single unified platform featuring real-time GPS tracking, IoT-powered cold chain monitoring, powerful analytics, and rigorous role-based access control.

---

## 2. Target Audience & User Personas

### 2.1 The Administrator (Admin)
* **Goal:** Monitor overall logistics operations, manage the fleet, coordinate personnel, and ensure high delivery success rates.
* **Needs:** A dashboard showing system-wide statistics; tools to manage drivers, typical users, and shipments; the ability to assign hardware tracking devices; and capabilities to review analytics and configure system alerts.

### 2.2 The Driver
* **Goal:** Fulfill deliveries efficiently while ensuring the integrity of sensitive packages.
* **Needs:** A specialized dashboard to view assigned shipments, update delivery statuses, monitor active hardware sensors (such as MPU-6050 and temperature/humidity modules), and easily contact dispatcher support.

### 2.3 The Customer (User)
* **Goal:** Send and track packages securely and reliably.
* **Needs:** A simple interface to request shipments, access real-time tracking links, view past shipment history, analyze real-time sensor charts, manage account details, and reach customer service via an AI Chatbot.

---

## 3. Core Features & Requirements

### 3.1 Real-time GPS Tracking
* **Live Monitoring:** Integration with Leaflet.js / Google Maps API to provide live GPS updates for all active shipment locations.
* **Route Visualization:** Showing estimated time of arrival (ETA) and optimal delivery routes.
* **Geofencing:** Delivery zone tracking with automated movement alerts.

### 3.2 Role-Based Access Control (RBAC) & Security
* **Authentication:** Firebase Authentication handling robust session management and data isolation (featuring a custom separate logic loop for Admin sessions via `admin-auth.js`).
* **Workflows:** Admin approval required for critical operations and new system registrations.
* **Guards:** Secure route guards ensuring unauthorized users cannot access privileged pages. Enforced Database rules (`firestore.rules` and `database.rules.json`).

### 3.3 Analytics & Reporting
* **Dashboards:** Performance metrics, operational costs, and key performance indicators (KPIs) available at a glance.
* **Reporting:** Capabilities to export detailed analytics data (PDF/CSV) covering delivery success rates and operational insights.

### 3.4 Cold Chain & IoT Monitoring
* **Environment Sensor Integration:** Real-time tracking of temperature and humidity (crucial for perishable goods like food and medical supplies).
* **Shock/Tilt Detection:** MPU-6050 sensor data tracking to ensure package handling compliance and track damage incidents.
* **Alerts Configuration:** Automated threshold-based notifications when sensors log values outside of safe limits.

### 3.5 AI-Powered Customer Support
* **Chatbot Integration:** An intelligent virtual assistant to parse quick questions and solve minor support inquiries efficiently.
* **Escalation Protocol:** Seamless transition from the bot to human customer support handlers utilizing Firebase for ticket administration.

### 3.6 Progressive Web App (PWA) Capabilities
* **Responsive Layout:** A mobile-first paradigm designed with Tailwind CSS v3.4 ensuring pixel-perfect operation on any device.
* **Installability:** App manifest support allowing the platform to be saved to a user's device for near-native responsiveness.

---

## 4. Technical Architecture

### 4.1 Frontend Infrastructure
* **Languages:** HTML5, CSS3, JavaScript (ES6+).
* **Styling:** Tailwind CSS v3.4 (compiled via PostCSS in watch mode) + Lucide Icons for vector-based graphics.
* **Mapping Engine:** Leaflet.js / Google Maps API integrations.

### 4.2 Backend & Cloud Infrastructure Framework
* **Auth:** Firebase Authentication (Handles Phone, Email, and Recaptcha processes).
* **Database (Primary):** Cloud Firestore (NoSQL document storage optimized for users, shipments, and roles).
* **Database (IoT Stream):** Firebase Realtime Database (Optimized for high-frequency low-latency updates emitted by GPS modules and environment sensors).
* **Storage:** Firebase Cloud Storage (Handling unstructured data such as user avatars and document images).

---

## 5. System Structure & Directory Breakdown

### Main Access Endpoints
* **Public Space:** `index.html` (Landing), `login.html`, `register.html`, `track.html`
* **Admin Space:** `admindashboard.html`, `admin-users.html`, `admin-drivers.html`, `admin-shipments.html`, `admin-tracking.html`, `admin-alerts.html`, `admin-assign-device.html`
* **Driver Space:** `driver-dashboard.html`, `driver-sensor-status.html`, `contact-service-driver.html`
* **User Space:** `dashboard.html`, `request.html`, `profile.html`, `alerts.html`, `sensor-status.html`, `contact-service-user.html`

### JavaScript Modular Ecosystem (`/js`)
* `auth.js` / `admin-auth.js` / `auth-ui.js`: Primary authentication, token handling, and UI state switches based on RBAC.
* `main.js`: Core shared application logic encompassing layout interactions.
* `chatbot.js`: Embedding AI conversational elements and support triggers.
* `sensor-status.js`: Reactive listeners querying the Firebase Realtime Database to manipulate front-end sensor dashboard UI states (charts/graphs).

---

## 6. Future Scope & Enhancements
* **Predictive AI Routing:** Applying Machine Learning models against historical traffic data to dynamically optimize routes.
* **Hardware API Extensions:** Deeper integration options supporting external ESP32/Arduino firmwares explicitly built for TukTukTrack payloads.
* **Third-Party Logistics (3PL) Adapters:** API bridges built to seamlessly hand off shipments to external couriers for last-mile delivery tracking.
# admin : [EMAIL_ADDRESS]
# password: Utsav@799020
# utsavsingh612
# password : 799020