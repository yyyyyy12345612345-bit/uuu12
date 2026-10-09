async function run() {
  console.log("Checking /debug/network-test on HF Space...");
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch("https://yousef891238-render-server.hf.space/debug/network-test");
      if (res.ok) {
        const data = await res.json();
        console.log("Network Test Result:", JSON.stringify(data, null, 2));
        return;
      }
      console.log(`Status: ${res.status}, waiting...`);
    } catch (e) {
      console.log(`Waiting for server rebuild... (${e.message})`);
    }
    await new Promise(r => setTimeout(r, 4000));
  }
}
run();
