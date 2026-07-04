const token = "8831057960:AAFaDRBVdOYScPQ7lMQVcSHb7os8D8QRezY";

async function checkWebhookInfo() {
  const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;
  console.log("Checking Webhook Info...");
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Telegram API Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error checking webhook info:", e);
  }
}

checkWebhookInfo();
