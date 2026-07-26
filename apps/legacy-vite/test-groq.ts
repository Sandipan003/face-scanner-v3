import * as dotenv from 'dotenv';
dotenv.config();

async function testGroq() {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    console.error("No Groq API key found in .env");
    return;
  }

  console.log("Found Groq API Key (length):", groqApiKey.length);

  const prompt = "Please respond with a simple JSON object: { \"test\": \"success\" }";

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "qwen/qwen3.6-27b", // Use Qwen3.6 for vision
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt }
            ]
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (!groqResponse.ok) {
      console.error("HTTP Error:", groqResponse.status, await groqResponse.text());
      return;
    }

    const data = await groqResponse.json();
    console.log("Success! Response:");
    console.log(JSON.stringify(data, null, 2));

  } catch (e) {
    console.error("Fetch failed:", e);
  }
}

testGroq();
