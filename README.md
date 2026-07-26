# Ministry of Magic: Identity Division (VitalScan)

Welcome to the **Ministry of Magic: Identity Division**, a highly advanced, magical health and identity verification application. Beneath its magical veneer lies a production-grade personal health hub powered by the **Presage SmartSpectra Node SDK** for contactless vital sign analysis and **Google Gemini** for intelligent medical document parsing and consultation.

## Magical Departments (Features)

- 🏰 **The Great Hall (Dashboard):** An overview of your magical essence and historical health reports.
- 🔮 **Prophecy Orb (Contactless Scanner):** Uses the cutting-edge **SmartSpectra SDK** to securely extract vital signs (Heart Rate, Respiratory Rate, HRV) via real-time optical facial scanning. All data is processed securely through a local Node.js WebSocket bridge, ensuring your "magical essence" never falls into the wrong hands.
- 📜 **Ancient Scrolls (Medical OCR):** Analyze standard Muggle medical reports using Google Gemini.
- 🖼️ **Portrait Healer (AI Chat):** Have a consultation with an AI-powered portrait healer based on your recent health history.
- 🩺 **Healer's Prep:** Automatically generate a clinical brief for St Mungo's Hospital based on your health timeline.
- 🏆 **House Points System:** A gamification layer that awards you 50 House Points every time you successfully complete a divination scan with the Prophecy Orb!

## Technical Stack

- **Frontend:** React, Tailwind CSS, Lucide Icons, Recharts, Vite
- **Backend:** Express, Node.js, WebSockets (`ws`)
- **SDK Integration:** Presage SmartSpectra Node SDK (C++ core, N-API bindings)
- **Database:** MongoDB Atlas (via Mongoose)
- **AI Integration:** Google Gemini API

## Setup Instructions

**Prerequisites:** Node.js (v18+)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Configuration:
   Create a `.env` file in the root directory (you can copy `.env.example`).
   ```env
   # MongoDB Connection String
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster...

   # NextAuth / JWT Secret
   JWT_SECRET=your_super_secret_string

   # Presage API Key for Face Scanning
   PRESAGE_API_KEY=your_presage_api_key

   # Gemini API Key (Optional: needed for report OCR and AI Chat)
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. Run the development server (Frontend + Express API + WebSocket):
   ```bash
   npm run dev
   ```

4. The application will run on `http://localhost:3000`. 
   - First, register a new witch or wizard in the UI.
   - Navigate to the **Prophecy Orb** tab to run a biometric scan and earn House Points.
   - View your saved history directly in **The Great Hall**!

## Production Build
```bash
npm run build
npm run start
```
