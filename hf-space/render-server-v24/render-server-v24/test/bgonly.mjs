// قياس وضع "خلفية فقط": node test/bgonly.mjs   (BGFILE, NVERSES, SAME_AUDIO=1 اختيارية)
import http from "http"; import fs from "fs"; import path from "path"; import { spawn, execFileSync } from "child_process";
const ROOT = process.env.SERVER_DIR || path.resolve("."); const PORT = process.env.TEST_PORT || "7880";
const files = http.createServer((req, res) => { const f = path.join("/tmp/assets", path.basename(req.url.split("?")[0])); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); } res.writeHead(200); fs.createReadStream(f).pipe(res); }).listen(7881);
const srv = spawn("node", ["server.js"], { cwd: ROOT, env: { ...process.env, PORT, EXTRA_ALLOWED_DOMAINS: "127.0.0.1" }, stdio: ["ignore", fs.openSync("/tmp/srv_bgonly.log","w"), fs.openSync("/tmp/srv_bgonly.log","a")] });
const base = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 60; i++) { try { if ((await fetch(base + "/health")).ok) break; } catch {} await new Promise(r => setTimeout(r, 500)); }
const audioUrl = process.env.AUDIO || "tone.mp3";
const NV = parseInt(process.env.NVERSES || "6", 10);
const verses = Array.from({ length: NV }, (_, i) => ({ id: i + 1, text: "", audio: `http://127.0.0.1:7881/${audioUrl}?i=${process.env.SAME_AUDIO ? 0 : i}` }));
async function job(name, body) {
  const t0 = Date.now();
  const r = await (await fetch(base + "/render", { method: "POST", headers: { "content-type": "application/json", connection: "close" }, body: JSON.stringify({ verses, backgroundOnly: true, ...body }) })).json();
  if (!r.jobId) return console.log(name, "REJECTED", JSON.stringify(r));
  let st; for (;;) { st = await (await fetch(`${base}/status/${r.jobId}`, { headers: { connection: "close" } })).json(); if (["completed", "failed"].includes(st.status)) break; await new Promise(r => setTimeout(r, 200)); }
  const sec = ((Date.now() - t0) / 1000).toFixed(1);
  if (st.status === "failed") return console.log(name.padEnd(30), "FAILED", st.message, JSON.stringify(st.details || {}).slice(0, 300));
  const file = path.join("/tmp/renders_output", `${r.jobId}.mp4`);
  const info = execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name,width,height,avg_frame_rate:format=duration,size", "-of", "csv=p=0", file]).toString().trim().replace(/\n/g, " | ");
  let decodeErr = ""; try { execFileSync("ffmpeg", ["-v", "error", "-i", file, "-f", "null", "-"], { stdio: ["ignore", "ignore", "pipe"] }); } catch (e) { decodeErr = " DECODE-ERRORS"; }
  const errs = execFileSync("sh", ["-c", `ffmpeg -v error -i ${file} -f null - 2>&1 | wc -l`]).toString().trim();
  console.log(`${name.padEnd(30)} total=${sec}s  ${info}  decodeErrLines=${errs}${decodeErr}`);
  return r.jobId;
}
const L = (u) => `http://127.0.0.1:7881/${u}`;
const CASES = (process.env.CASES || "video,video_cached,portrait,image,color,multi").split(",");
const run = {
  video: () => job("VIDEO bg 16:9 (copy)", { backgroundUrl: L(process.env.BGFILE || "bgvid.mp4"), aspectRatio: "16:9" }),
  video_cached: () => job("VIDEO bg 16:9 (cached)", { backgroundUrl: L(process.env.BGFILE || "bgvid.mp4"), aspectRatio: "16:9" }),
  portrait: () => job("VIDEO bg portrait", { backgroundUrl: L(process.env.BGFILE || "bgvid.mp4") }),
  image: () => job("IMAGE bg 16:9", { backgroundUrl: L("bg.jpg"), aspectRatio: "16:9" }),
  color: () => job("COLOR bg 16:9", { backgroundUrl: "color:#0b3d2e", aspectRatio: "16:9" }),
  multi: () => job("MULTI bg 16:9", { backgroundUrls: [L("bgvid.mp4"), L("bglong.mp4")], aspectRatio: "16:9" }),
};
for (const c of CASES) await run[c]();
srv.kill(); files.close(); process.exit(0);
