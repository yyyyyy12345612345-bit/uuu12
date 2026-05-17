const fetch = require("node:fetch"); // or use global fetch since Node 18+

async function test() {
  const geminiKey = "AIzaSyB4zgYjKPmy_al4nH2zNqh1g9IbMHHk5Ew";
  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "مرحبا" }] }]
      })
    });
    
    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

test();
