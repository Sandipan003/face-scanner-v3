import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("API Key length:", apiKey ? apiKey.length : 0);
  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `Return a JSON object with {"status": "ok"}`;
    const result = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    console.log("Success!", result.text);
  } catch (err) {
    console.error("Gemini Error:", err);
  }
}

test();
