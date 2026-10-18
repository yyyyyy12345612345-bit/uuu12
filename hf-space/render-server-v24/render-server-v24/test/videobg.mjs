// قياس مسار خلفية الفيديو مع تفصيل الوقت لكل مرحلة
import http from "http"; import fs from "fs"; import path from "path"; import { spawn, execFileSync } from "child_process";
const ROOT = process.env.SERVER_DIR || path.resolve("."); const PORT = process.env.TEST_PORT || "7863";
const NV = parseInt(process.env.NVERSES || "12", 10);
const files = http.createServer((req, res) => { const f = path.join("/tmp/assets", path.basename(req.url.split("?")[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200); fs.createReadStream(f).pipe(res); }).listen(7871);
const srv = spawn("node", ["server.js"], { cwd: ROOT, env: { ...process.env, PORT, EXTRA_ALLOWED_DOMAINS: "127.0.0.1", RENDER_CONCURRENCY: "1" }, stdio: "ignore" });
const base = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(base + "/health")).ok) break; } catch {} await new Promise(r => setTimeout(r, 500)); }
await new Promise(r => setTimeout(r, 4000));
const verses = Array.from({ length: NV }, (_, i) => ({ id: i + 1, text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا فَإِذَا فَرَغْتَ فَانصَبْ وَإِلَىٰ رَبِّكَ فَارْغَب", translation: "", audio: `http://127.0.0.1:7871/tone.mp3?i=${i}` }));
async function job(name, body) {
  const t0 = Date.now(); const marks = {}; let last = "";
  const r = await (await fetch(base + "/render", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ verses, surahName: "الشرح", backgroundUrl: `http://127.0.0.1:7871/${process.env.BGFILE || "bgvid.mp4"}`, videoTemplate: "default", ...body }) })).json();
  let st; for (;;) { st = await (await fetch(`${base}/status/${r.jobId}`)).json(); const ph = st.phase || ""; if (ph !== last) { marks[ph] = ((Date.now() - t0) / 1000).toFixed(1); last = ph; } if (["completed", "failed"].includes(st.status)) break; await new Promise(r => setTimeout(r, 250)); }
  const total = ((Date.now() - t0) / 1000).toFixed(1);
  if (st.status === "failed") return console.log(name, "FAILED", st.message, JSON.stringify(st.details).slice(0, 300));
  const file = path.join("/tmp/renders_output", `${r.jobId}.mp4`);
  const info = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,avg_frame_rate:format=duration,size", "-of", "csv=p=0", file]).toString().trim().replace(/\n/g, " ");
  console.log(`${name.padEnd(22)} total=${total}s  phases(start s)=${JSON.stringify(marks)}  ${info}`);
}
if (process.env.ONLY === "wide") { await job("WIDE 16:9 video bg", { aspectRatio: "16:9" }); }
else {
await job("PORTRAIT video bg", {});
await job("PORTRAIT (cached bg)", {});          // نفس الخلفية تاني: بيختبر الكاش
await job("WIDE 16:9 video bg", { aspectRatio: "16:9" });
await job("WIDE (cached bg)", { aspectRatio: "16:9" });
}
srv.kill(); files.close(); process.exit(0);
