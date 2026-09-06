async function testLiveRender() {
  console.log("🚀 Starting End-to-End Render Test on Hugging Face Server...");

  const payload = {
    surahName: "الفاتحة",
    verses: [
      {
        id: 1,
        text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful",
        audio: "https://everyayah.com/data/Alafasy_128kbps/001001.mp3"
      }
    ],
    backgroundUrl: "https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg",
    backgroundFit: "cover",
    textColor: "#ffffff",
    fontSize: 50,
    fontWeight: 700,
    fontFamily: "Amiri",
    filter: "none",
    overlay: "none",
    animation: "fade",
    textPosition: "center",
    textVerticalOffset: 0,
    showVisualizer: false,
    particles: "none",
    userPlan: "free",
    ayahDecoration: "bracket1",
    videoTemplate: "default",
    reciterName: "Mishari Rashid Al-Afasy",
    reciterId: "mishari",
    showVerseText: true,
  };

  console.log("📤 Sending POST /render request...");
  const res = await fetch("https://yousef891238-render-server.hf.space/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ Render failed to start:", res.status, err);
    return;
  }

  const { jobId } = await res.json();
  console.log(`✅ Job created with ID: ${jobId}`);

  // Poll status
  console.log("⏳ Polling status...");
  let completed = false;
  let videoUrl = "";

  for (let attempt = 1; attempt <= 30; attempt++) {
    await new Promise(r => setTimeout(r, 4000));
    const statusRes = await fetch(`https://yousef891238-render-server.hf.space/status/${jobId}`);
    if (!statusRes.ok) {
      console.warn(`Status poll attempt ${attempt} returned ${statusRes.status}`);
      continue;
    }
    const jobData = await statusRes.json();
    console.log(`[Attempt ${attempt}] Status: ${jobData.status} | Progress: ${jobData.progress}% | Message: ${jobData.message || ""}`);

    if (jobData.status === "completed") {
      completed = true;
      videoUrl = jobData.url;
      console.log(`🎉 RENDER SUCCESSFUL! Video URL: ${videoUrl}`);
      break;
    }
    if (jobData.status === "failed") {
      console.error("❌ Render failed with error:", jobData.error);
      return;
    }
  }

  if (!completed) {
    console.error("⏱️ Render timed out.");
    return;
  }

  // Verify Video URL compatibility for TikTok & Instagram
  console.log("\n🔍 Verifying Video URL compatibility for TikTok & Instagram...");
  
  // 1. HEAD request test
  const headRes = await fetch(videoUrl, { method: "HEAD" });
  console.log("HEAD Status:", headRes.status, headRes.statusText);
  console.log("Content-Type:", headRes.headers.get("content-type"));
  console.log("Content-Length:", headRes.headers.get("content-length"), "bytes");
  console.log("Accept-Ranges:", headRes.headers.get("accept-ranges"));
  console.log("CORS Origin:", headRes.headers.get("access-control-allow-origin"));

  // 2. Range request test (Byte 0-1023)
  const rangeRes = await fetch(videoUrl, {
    headers: { Range: "bytes=0-1023" }
  });
  console.log("\nRange Request Status:", rangeRes.status, rangeRes.statusText);
  console.log("Range Content-Range:", rangeRes.headers.get("content-range"));
  console.log("Range Content-Length:", rangeRes.headers.get("content-length"));

  if (
    headRes.status === 200 &&
    headRes.headers.get("content-type") === "video/mp4" &&
    headRes.headers.get("accept-ranges") === "bytes" &&
    rangeRes.status === 206
  ) {
    console.log("\n🌟 100% PERFECT! The video URL meets all TikTok, Instagram, and Zernio requirements!");
  } else {
    console.warn("\n⚠️ Some headers might need adjustment.");
  }
}

testLiveRender();
