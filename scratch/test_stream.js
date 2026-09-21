const token = "8831057960:AAFaDRBVdOYScPQ7lMQVcSHb7os8D8QRezY";

async function testStream() {
  const url = `https://api.telegram.org/bot${token}/getUpdates?limit=1`;
  const res = await fetch(url);
  const data = await res.json();
  const fileId = data.result[0].channel_post.video.file_id;
  console.log("File ID:", fileId);
  
  const streamUrl = `https://yaqeenalquran.online/api/background/${fileId}.mp4?json=true`;
  console.log("Calling stream json:", streamUrl);
  const streamRes = await fetch(streamUrl);
  console.log("Status:", streamRes.status);
  const result = await streamRes.json();
  console.log("Direct URL response:", result);
}

testStream();
