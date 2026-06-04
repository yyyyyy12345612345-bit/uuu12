const geminiKey = "AIzaSyB4zgYjKPmy_al4nH2zNqh1g9IbMHHk5Ew";
const model = "gemini-1.5-flash";

async function test() {
  const requestBody = {
    contents: [{ role: "user", parts: [{ text: "السلام عليكم" }] }]
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
