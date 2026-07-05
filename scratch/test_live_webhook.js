async function testLive() {
  const url = "https://yaqeenalquran.online/api/telegram-webhook/";
  console.log("Requesting live webhook GET...");
  try {
    const res = await fetch(url);
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
}

testLive();
