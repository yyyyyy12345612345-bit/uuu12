const key = process.env.GEMINI_API_KEY || "AIzaSyB4zgYjKPmy_al4nH2zNqh1g9IbMHHk5Ew";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${key}`;

const SYSTEM_PROMPT = "You are a helpful assistant.";
const geminiContents = [
  { role: "user", parts: [{ text: "ازيك" }] }
];

fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: geminiContents,
  })
}).then(res => res.text().then(text => console.log(res.status, text))).catch(console.error);
