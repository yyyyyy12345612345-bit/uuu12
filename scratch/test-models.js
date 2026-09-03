// Test Gemini and Groq models via Val Town by simulating the updated Val Town code
const geminiKey = process.env.GEMINI_API_KEY;

async function testGemini() {
  const models = [
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash-001",
    "gemini-1.5-flash-8b",
    "gemini-pro"
  ];
  console.log("Testing Gemini models...");
  for (const m of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "قل كلمة واحدة: مرحب" }] }]
        })
      });
      const d = await res.json();
      console.log(`Gemini [${m}]:`, res.status, d.candidates ? d.candidates[0].content.parts[0].text.trim() : d.error?.message);
    } catch (e) {
      console.log(`Gemini [${m}] error:`, e.message);
    }
  }
}

testGemini();
