async function testLiveServer() {
  console.log("🔍 1. Testing /health endpoint...");
  try {
    const healthRes = await fetch("https://yousef891238-render-server.hf.space/health");
    console.log("Health Status:", healthRes.status);
    const healthData = await healthRes.json();
    console.log("Health Data:", JSON.stringify(healthData, null, 2));
  } catch (err) {
    console.error("Health Check Error:", err.message);
  }

  console.log("\n🔍 2. Testing Root / endpoint...");
  try {
    const rootRes = await fetch("https://yousef891238-render-server.hf.space/");
    console.log("Root Status:", rootRes.status);
    const rootData = await rootRes.json();
    console.log("Root Data:", JSON.stringify(rootData, null, 2));
  } catch (err) {
    console.error("Root Check Error:", err.message);
  }

  console.log("\n🔍 3. Testing HEAD /download endpoint...");
  try {
    const headRes = await fetch("https://yousef891238-render-server.hf.space/download/test-probe.mp4", {
      method: "HEAD"
    });
    console.log("HEAD Status:", headRes.status);
    console.log("HEAD Headers:", {
      acceptRanges: headRes.headers.get("accept-ranges"),
      contentType: headRes.headers.get("content-type"),
      accessControl: headRes.headers.get("access-control-allow-origin")
    });
  } catch (err) {
    console.error("HEAD Check Error:", err.message);
  }
}

testLiveServer();
