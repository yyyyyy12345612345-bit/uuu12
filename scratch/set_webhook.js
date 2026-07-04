const token = "8831057960:AAFaDRBVdOYScPQ7lMQVcSHb7os8D8QRezY";
const webhookUrl = "https://yaqeenalquran.online/api/telegram-webhook";

async function setWebhook() {
  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
  console.log("Setting Telegram Webhook...");
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Telegram API Response:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error setting webhook:", e);
  }
}

setWebhook();
