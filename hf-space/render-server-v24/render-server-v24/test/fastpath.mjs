// تحقق: المسار السريع (طبقات) لازم يطلّع نفس الفريمات بتاعة المسار الأصلي
import path from "path"; import fs from "fs"; import sharp from "sharp";
const { ensureFont } = await import("../lib/fonts.js");
const F = await import("../lib/frame.js"); const C = await import("../lib/cache.js");
const tmp = "/tmp/fp"; fs.mkdirSync(tmp, { recursive: true });
const f = await ensureFont("Amiri"); const fonts = { mainFont: f, amiriFont: f };
const verse = { id: 5, text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا فَإِذَا فَرَغْتَ فَانصَبْ", translation: "" };
await sharp({create:{width:2400,height:1600,channels:3,background:{r:30,g:90,b:70}}}).composite([{input:Buffer.from(`<svg width="2400" height="1600">${Array.from({length:200},(_,i)=>`<circle cx="${(i*97)%2400}" cy="${(i*53)%1600}" r="${30+(i%90)}" fill="hsl(${i*13%360},60%,${25+i%40}%)"/>`).join("")}</svg>`)}]).jpeg().toFile(path.join(tmp,"bg.jpg"));
const diff = async (a, b) => { const A = await sharp(a).ensureAlpha().raw().toBuffer(), B = await sharp(b).ensureAlpha().raw().toBuffer(); let s = 0, mx = 0; for (let i = 0; i < A.length; i++) { const d = Math.abs(A[i] - B[i]); s += d; if (d > mx) mx = d; } return `mean=${(s / A.length).toFixed(4)} max=${mx}`; };
const base = { fontSize:50,fontWeight:700,fontFamily:"Amiri",textColor:"#fff",textPosition:"center",textVerticalOffset:0,surahName:"الشرح",userPlan:"free",filter:"none",overlay:"none",ayahDecoration:"bracket1",reciterName:"x",backgroundFit:"cover",videoTemplate:"default",showVerseText:true, instaHandle:"abc" };
for (const wide of [false, true]) for (const videoBg of [true, false]) {
  const s = { ...base, isWide: wide };
  const W = wide ? 1920 : 720, H = wide ? 1080 : 1280;
  if (!videoBg) s.preparedBg = await C.prepareBackgroundRaw(path.join(tmp,"bg.jpg"), W, H, "cover");
  const ext = videoBg ? "png" : "jpg";
  console.log(`\n${wide ? "WIDE" : "PORTRAIT"} / ${videoBg ? "video bg (png)" : "image bg (jpg)"}  fast-path eligible: ${F.canUseLayerFastPath(s, videoBg)}`);
  const st = await F.renderStaticLayer(verse, s, videoBg, fonts);
  const tx = await F.renderTextLayer(verse, s, videoBg, fonts, 0, 10);
  for (const p of [0.2, 0.6, 1]) {
    const ref = path.join(tmp, `ref-${wide}-${videoBg}-${p}.${ext}`), fast = path.join(tmp, `fast-${wide}-${videoBg}-${p}.${ext}`);
    await F.generateVerseFrame(verse, ref, s, "", videoBg, fonts, { opacity: p, offsetY: 0, scale: 1, activeWordIndex: -1 }, 0, 10, "");
    await F.composeLayerFrame(fast, s, videoBg, st, tx, p);
    console.log(`  opacity=${p}:`, await diff(ref, fast));
  }
  // سرعة
  const N = 8; let t0 = Date.now();
  for (let i = 0; i < N; i++) await F.generateVerseFrame(verse, path.join(tmp, `t${i}.${ext}`), s, "", videoBg, fonts, { opacity: i / N, offsetY: 0, scale: 1, activeWordIndex: -1 }, 0, 10, "");
  const tRef = (Date.now() - t0) / N; t0 = Date.now();
  const tx2 = await F.renderTextLayer(verse, s, videoBg, fonts, 0, 10); const tTextLayer = Date.now() - t0; t0 = Date.now();
  for (let i = 0; i < N; i++) await F.composeLayerFrame(path.join(tmp, `u${i}.${ext}`), s, videoBg, st, tx2, i / N);
  console.log(`  per-frame: original=${tRef.toFixed(0)}ms   fast=${((Date.now() - t0) / N).toFixed(0)}ms (+ text layer once: ${tTextLayer}ms)`);
}
