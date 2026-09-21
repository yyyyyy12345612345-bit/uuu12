const token = "8831057960:AAFaDRBVdOYScPQ7lMQVcSHb7os8D8QRezY";

async function testSingleUpdate() {
  const url = `https://api.telegram.org/bot${token}/getUpdates?limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.result || data.result.length === 0) {
    console.log("No updates found.");
    return;
  }
  const update = data.result[0];
  console.log("Testing with update:", update.update_id);
  
  const webhookUrl = "https://yaqeenalquran.online/api/telegram-webhook/";
  const postRes = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  console.log("Webhook HTTP Status:", postRes.status);
  const result = await postRes.json();
  console.log("Webhook Response:", result);
}

testSingleUpdate();
