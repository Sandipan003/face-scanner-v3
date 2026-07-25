<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Face Scanner v3 (GuardianOS AI)

GuardianOS AI is an advanced, mobile-friendly personal health hub. It utilizes optical face scanning via the PresageTech API to estimate vitals, stores daily health reports securely in MongoDB Atlas, and provides an AI-powered consultation brief using Google Gemini models.

## Features
- **Authentication**: JWT-based secure email and password registration.
- **Persistent Database**: MongoDB Atlas integration via Mongoose to save historical reports and user profiles.
- **Contactless Scanner**: Integrates with PresageTech API to track Heart Rate, Stress, Fatigue, and more.
- **Medical OCR**: Analyze medical reports and documents using Google Gemini.
- **PWA Ready**: Mobile-optimized UI that can be installed on iOS/Android home screens.

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

3. Run the development server (Frontend + Express API):
   ```bash
   npm run dev
   ```

4. The application will run on `http://localhost:3000`. 
   - First, register a new user in the UI.
   - Navigate to the Scanner tab to run a biometric scan.
   - View your saved history directly on the dashboard!

## Production Build
```bash
npm run build
npm run start
```
