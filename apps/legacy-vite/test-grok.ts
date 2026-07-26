import * as dotenv from 'dotenv';
dotenv.config();

async function testGrok() {
  const grokApiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (!grokApiKey) {
    console.error("No Grok API key found in .env");
    return;
  }

  console.log("Found Grok API Key (length):", grokApiKey.length);

  const prompt = "Please respond with a simple JSON object: { \"test\": \"success\" }";

  try {
    const grokResponse = await fetch("https://api.x.ai/v1/models", {
      headers: {
        "Authorization": `Bearer ${grokApiKey}`
      }
    });

    if (!grokResponse.ok) {
      console.error("HTTP Error:", grokResponse.status, await grokResponse.text());
      return;
    }

    const data = await grokResponse.json();
    console.log("Success! Response:");
    console.log(JSON.stringify(data, null, 2));

  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

testGrok();
