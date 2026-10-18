// Smoke / A-B test: node test/smoke.mjs  (يشغّل سيرفر محلي + سيرفر ملفات + يرندر فيديوهات حقيقية)
import http from "http"; import fs from "fs"; import path from "path"; import { spawn, execFileSync } from "child_process";
const ROOT = process.env.SERVER_DIR || path.resolve(".");
const PORT = process.env.TEST_PORT || "7861";
const ASSETS = process.env.ASSETS_DIR || "/tmp/assets";
const files = http.createServer((req, res) => {
  const f = path.join(ASSETS, path.basename(req.url.split("?")[0]));
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": f.endsWith(".mp3") ? "audio/mpeg" : "image/jpeg" }); fs.createReadStream(f).pipe(res);
}).listen(7870);
const srv = spawn("node", ["server.js"], { cwd: ROOT, env: { ...process.env, PORT, EXTRA_ALLOWED_DOMAINS: "127.0.0.1,localhost", RENDER_CONCURRENCY: "1", ENABLE_DEBUG: "" }, stdio: ["ignore", "pipe", "pipe"] });
let logs = ""; srv.stdout.on("data", d => logs += d); srv.stderr.on("data", d => logs += d);
const base = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(base + "/health")).ok) break; } catch {} await new Promise(r => setTimeout(r, 500)); }
await new Promise(r => setTimeout(r, 4000)); // let fonts prewarm

const verses = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا فَإِذَا فَرَغْتَ فَانصَبْ وَإِلَىٰ رَبِّكَ فَارْغَب", translation: "", audio: `http://127.0.0.1:7870/tone.mp3?i=${i}` }));
async function job(name, body) {
  const t0 = Date.now();
  const r = await (await fetch(base + "/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verses, surahName: "الشرح", reciterId: "basit", ...body }) })).json();
  if (!r.jobId) { console.log(name, "REJECTED", JSON.stringify(r)); return; }
  let st; for (;;) { st = await (await fetch(`${base}/status/${r.jobId}`)).json(); if (st.status === "completed" || st.status === "failed") break; await new Promise(r => setTimeout(r, 400)); }
  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  if (st.status === "failed") { console.log(name.padEnd(26), "FAILED", st.message, JSON.stringify(st.details || {}).slice(0, 300)); return; }
  const file = path.join(process.env.TMPDIR || "/tmp", "renders_output", `${r.jobId}.mp4`);
  let info = "";
  try { info = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,avg_frame_rate,width,height", "-show_entries", "format=duration,size", "-of", "csv=p=0", file]).toString().trim().replace(/\n/g, " | "); } catch (e) { info = "ffprobe failed"; }
  console.log(name.padEnd(26), `${sec}s`.padStart(7), info, `size=${(fs.statSync(file).size / 1024).toFixed(0)}KB`);
  return r.jobId;
}
const bg = "http://127.0.0.1:7870/bg.jpg";
await job("default+image bg", { videoTemplate: "default", backgroundUrl: bg });
await job("default+color bg", { videoTemplate: "default", backgroundUrl: "color:#0b3d2e", animation: "none" });
await job("minshawi_player", { videoTemplate: "minshawi_player" });
const id = await job("basit_player", { videoTemplate: "basit_player" });
if (process.env.CHECKS) {
  const get = async (p, o) => (await fetch(base + p, o)).status;
  console.log("--- checks ---");
  console.log("range request      :", await get(`/download/${id}.mp4`, { headers: { range: "bytes=0-99" } }), "(expect 206)");
  console.log("HEAD               :", await get(`/download/${id}.mp4`, { method: "HEAD" }), "(expect 200)");
  console.log("path traversal     :", await get(`/download/..%2f..%2fetc%2fpasswd`), "(expect 400)");
  console.log("/debug/last-errors :", await get(`/debug/last-errors`), "(expect 404)");
  console.log("/debug/network-test:", await get(`/debug/network-test`), "(expect 404)");
  console.log("bad json           :", await get(`/render`, { method: "POST", headers: { "content-type": "application/json" }, body: "{bad" }), "(expect 400)");
  console.log("bad domain audio   :", await get(`/render`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verses: [{ id: 1, text: "x", audio: "http://169.254.169.254/x.mp3" }] }) }), "(expect 400)");
}
srv.kill(); files.close(); process.exit(0);
