<div align="center">
  <img width="800" src="https://images.unsplash.com/photo-1618944847023-38aa001235f0?q=80&w=2069&auto=format&fit=crop" alt="Magical Atmosphere" style="border-radius: 20px; box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);" />
</div>

<h1 align="center">⚡ Ministry of Magic: Identity & Vitality Division ⚡</h1>

<div align="center">
  <i>"It is our choices, Harry, that show what we truly are, far more than our abilities." — Albus Dumbledore</i>
</div>

<br />

Welcome, witch or wizard, to the **Ministry of Magic: Identity & Vitality Division**. Beneath its enchanted veneer lies a production-grade personal health and identity hub. We harness the power of the **Presage SmartSpectra Node SDK** (ancient magic) for contactless vital sign divination, and **Groq & Google Gemini** (powerful Oracles) for intelligent medical parsing and consultations. 

---

## 🏰 Magical Departments (Features)

*   **The Great Hall (Dashboard):** Step into the Great Hall to view an overview of your magical essence, recent biometric scans, and historical health prophecies.
*   **🔮 Prophecy Orb (Biometric Scanner):** Gaze into the Prophecy Orb. Using the cutting-edge SmartSpectra SDK, it securely extracts your vital signs (Heart Rate, Respiratory Rate, HRV) via real-time optical facial scanning. Your magical essence is processed securely through a local Node.js WebSocket bridge, ensuring it never falls into the wrong hands.
*   **📜 Ancient Scrolls (Medical OCR):** Bring your standard Muggle medical reports. Our Gemini-powered Oracle will decipher the ancient texts and translate them into understandable wizarding terms.
*   **🖼️ Portrait Healer (AI Chat):** Need medical advice? Consult with the AI-powered Portrait Healer, who has memorized every medical text in the Hogwarts Library and reviews your recent health history.
*   **🩺 Healer's Prep (Clinical Brief):** Before visiting St Mungo's Hospital for Magical Maladies and Injuries, use this tool to automatically compile a clinical prophecy brief of your health timeline.
*   **🏆 House Points:** A magical gamification layer! Earn 50 House Points for your Hogwarts House every time you successfully complete a divination scan with the Prophecy Orb.

---

## 📜 The Spellbook (Technical Stack)

To build such powerful enchantments, our Ministry artificers used the following spells and artifacts:

*   **Frontend Magic:** React, Tailwind CSS, Lucide Icons, Recharts, Vite (for lightning-fast casting)
*   **Backend Sorcery:** Express, Node.js, WebSockets (`ws`)
*   **Divination Core:** Presage SmartSpectra Node SDK (C++ core, N-API bindings)
*   **The Vault (Database):** MongoDB Atlas (via Mongoose)
*   **The Oracles (AI):** Groq API (for rapid report generation) & Google Gemini API (for chat and OCR)

---

## 🪄 Wand Preparation (Setup Instructions)

**Prerequisites:** You must possess a wand core of **Node.js (v18+)**.

### 1. Gather the Ingredients
Install the necessary potion ingredients (dependencies):
```bash
npm install
```

### 2. Brew the Polyjuice Potion (Environment Variables)
Create a `.env` scroll in the root directory (you can trace from `.env.example`).
```env
# The Vault (MongoDB Connection String)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster...

# The Sorting Hat's Secret (JWT Secret)
JWT_SECRET=your_super_secret_string

# The Seer's Eye (Presage API Key for Face Scanning)
PRESAGE_API_KEY=your_presage_api_key

# The Rapid Oracle (Groq API Key for fast health reports)
VITE_GROQ_API_KEY=your_groq_api_key

# The Deep Oracle (Gemini API Key for OCR and AI Chat)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Cast the Incantation
Awaken the spirits of the application (Frontend + Express API + WebSocket):
```bash
npm run dev
```

### 4. Enter the Floo Network
The magical portal will open at `http://localhost:3000`. 
- First, register a new witch or wizard in the UI.
- Navigate to the **Prophecy Orb** tab to run a biometric scan and earn House Points.
- View your saved history directly in **The Great Hall**!

---

## 🚂 The Hogwarts Express (Production Build)
When you are ready to send your magic into the wider wizarding world:
```bash
npm run build
npm run start
```

<div align="center">
  <i>Mischief Managed! 👣</i>
</div>
