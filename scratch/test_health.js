async function check() {
  try {
    const res = await fetch("https://yousef891238-render-server.hf.space/health");
    const data = await res.json();
    console.log("Status:", res.status, data);

    const errRes = await fetch("https://yousef891238-render-server.hf.space/debug/last-errors");
    const errData = await errRes.json();
    console.log("Last Errors Endpoint:", errRes.status, errData);
  } catch (err) {
    console.error("Check failed:", err.message);
  }
}
check();
