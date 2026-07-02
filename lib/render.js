import fs from "fs";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { RENDERS_DIR, WIDTH, HEIGHT, HOST, getSheikhAsset } from "../config.js";
import { downloadFile } from "./security.js";
import { ensureFont, refreshFontCache } from "./fonts.js";
import { getDurationCached, getResizedBackground } from "./cache.js";
import { generateVerseFrame } from "./frame.js";
import { wrapText } from "./svgUtils.js";
import { setProgress, setCompleted, setFailed } from "./jobs.js";
import { logger } from "./logger.js";

const execAsync = promisify(exec);
if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });

const stripTashkeel = (s) => (s || "").replace(/[\u064B-\u065F\u0670]/g, "");
const sl = (s) => s.replace(/\\/g, "/");

export async function startRender(jobId, data) {
  const {
    verses, backgroundUrl, surahName, reciterName = "Sheikh Muhammad Siddiq Al-Minshawi",
    textColor = "#ffffff", fontSize = 50, fontWeight = 700, fontFamily = "Amiri",
    filter = "none", overlay = "none", animation = "fade", textPosition = "center",
    textVerticalOffset = 0, userPlan = "free", instaHandle = "", tiktokHandle = "",
    ayahDecoration = "bracket1", videoTemplate = "default",
  } = data;

  const tempDir = path.resolve(os.tmpdir(), jobId);
  fs.mkdirSync(tempDir, { recursive: true });
  const progress = (pct, msg) => setProgress(jobId, pct, msg);

  try {
    progress(5, "تحميل الخطوط والموارد...");
    const mainFont = await ensureFont(fontFamily);
    const amiriFont = await ensureFont("Amiri");

    const isMinshawiPlayer = videoTemplate === "minshawi_player";
    const isDossaryPlayer = videoTemplate === "dossary_player";
    const isBasitPlayer = videoTemplate === "basit_player";
    const isPlayerTemplate = isMinshawiPlayer || isDossaryPlayer || isBasitPlayer;

    let naskhFont = null;
    if (isDossaryPlayer || isBasitPlayer) {
      naskhFont = await ensureFont("Noto Naskh Arabic");
    }
    await refreshFontCache(); // نضمن إن fontconfig شاف كل الخطوط اللي هنستخدمها قبل أول رندرة

    const isVideoBg = backgroundUrl && (
      /\.(mp4|webm|mov|m4v)(\?.*|#.*)?$/i.test(backgroundUrl) ||
      /videos\.pexels\.com/i.test(backgroundUrl) ||
      /\/video\//i.test(backgroundUrl)
    );
    const bgPath = path.resolve(tempDir, isVideoBg ? "bg.mp4" : "bg.jpg");

    // تحميل الخلفية + صورة الشيخ (لو قالب مشغل) بالتوازي
    const photoPath = path.resolve(tempDir, "template_photo.jpg");
    const dossaryBgPath = path.resolve(tempDir, "dossary_bg.png");
    const parallelDownloads = [downloadFile(backgroundUrl, bgPath)];

    if (isPlayerTemplate) {
      const sheikh = getSheikhAsset(data.reciterId);
      parallelDownloads.push(
        downloadFile(sheikh.photoUrl, photoPath).catch(e => logger.warn("sheikh_photo_failed", { error: e.message }))
      );
      if (isDossaryPlayer) {
        parallelDownloads.push(
          downloadFile("https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782871516/12_gahaqi.png", dossaryBgPath)
            .catch(e => logger.warn("dossary_bg_failed", { error: e.message }))
        );
      }
    }
    await Promise.all(parallelDownloads);

    const templatePhotoBase64 = (isPlayerTemplate && fs.existsSync(photoPath)) ? fs.readFileSync(photoPath).toString("base64") : "";
    const dossaryBgBase64 = (isDossaryPlayer && fs.existsSync(dossaryBgPath)) ? fs.readFileSync(dossaryBgPath).toString("base64") : "";

    progress(20, "تحميل وتحليل الملفات الصوتية...");

    // تحميل كل الصوتيات وحساب مددها بالتوازي بدل التتابع
    const audioPaths = verses.map((_, i) => path.resolve(tempDir, `a-${i}.mp3`));
    await Promise.all(verses.map(async (v, i) => {
      await downloadFile(v.audio, audioPaths[i]);
    }));
    const verseDurations = await Promise.all(verses.map((v, i) => getDurationCached(v.audio, audioPaths[i])));

    const audioTotal = verseDurations.reduce((a, b) => a + b, 0);
    let currentElapsed = 0;

    progress(35, "توليد إطارات سطر بسطر مع الحركات وتتبع الكلمات...");

    const sf = Math.min(Math.max(fontSize * 1.6, 40), 110);
    const tw = Math.floor(WIDTH * 0.82);
    const frameEntries = [];
    const ext = isVideoBg ? "png" : "jpg";
    const renderPromises = [];
    const fonts = { mainFont, amiriFont, naskhFont };

    const processLineWithAnim = async (lineVerse, lineDur, fBaseName) => {
      const settings = { fontSize, fontWeight, fontFamily, textColor, textPosition, textVerticalOffset, surahName, userPlan, instaHandle, tiktokHandle, filter, overlay, ayahDecoration, videoTemplate, reciterName };
      const hasTransition = animation && animation !== "none" && animation !== "fade";
      let remainingDur = lineDur;

      if (hasTransition && remainingDur > 0.4) {
        const transitionFrames = 6;
        const frameDur = 0.2 / transitionFrames;
        for (let f = 0; f < transitionFrames; f++) {
          const p = f / (transitionFrames - 1);
          const animState = { opacity: 1, offsetY: 0, scale: 1, activeWordIndex: -1 };
          if (animation === "fade") animState.opacity = p;
          else if (animation === "slideUp") { animState.opacity = p; animState.offsetY = 30 * (1 - p); }
          else if (animation === "slideDown") { animState.opacity = p; animState.offsetY = -30 * (1 - p); }
          else if (animation === "zoomIn") { animState.opacity = p; animState.scale = 0.8 + (0.2 * p); }
          else animState.opacity = p;

          const fPath = path.resolve(tempDir, `${fBaseName}-anim-${f}.${ext}`);
          const frameElapsed = currentElapsed;
          renderPromises.push(generateVerseFrame(lineVerse, fPath, settings, bgPath, isVideoBg, fonts, animState, frameElapsed, audioTotal, templatePhotoBase64));
          frameEntries.push({ fPath, dur: frameDur });
          currentElapsed += frameDur;
          remainingDur -= frameDur;
        }
      }

      const words = lineVerse.text.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      if (wordCount > 0 && remainingDur > 0) {
        const durPerWord = remainingDur / wordCount;
        for (let w = 0; w < wordCount; w++) {
          const animState = { opacity: 1, offsetY: 0, scale: 1, activeWordIndex: w };
          const fPath = path.resolve(tempDir, `${fBaseName}-word-${w}.${ext}`);
          const frameElapsed = currentElapsed;
          renderPromises.push(generateVerseFrame(lineVerse, fPath, settings, bgPath, isVideoBg, fonts, animState, frameElapsed, audioTotal, templatePhotoBase64));
          frameEntries.push({ fPath, dur: durPerWord });
          currentElapsed += durPerWord;
        }
      }
    };

    const isPlayer = videoTemplate && videoTemplate.endsWith("_player");

    if (isPlayer) {
      progress(35, "توليد إطارات مشغل الشيخ المخصص...");
      const isMinshawi = videoTemplate === "minshawi_player";
      const interval = (isMinshawi || videoTemplate === "dossary_player") ? 1.0 : 0.5;
      let elapsed = 0;
      let frameIndex = 0;

      while (elapsed < audioTotal) {
        const remaining = audioTotal - elapsed;
        const dur = Math.min(interval, remaining);
        const fPath = path.resolve(tempDir, `frame-${frameIndex}.${ext}`);

        let activeVerseIndex = 0;
        let accum = 0;
        for (let i = 0; i < verses.length; i++) {
          if (elapsed >= accum && elapsed < accum + verseDurations[i]) { activeVerseIndex = i; break; }
          accum += verseDurations[i];
          if (i === verses.length - 1) activeVerseIndex = i;
        }
        const activeVerse = verses[activeVerseIndex] || { id: 1, text: "" };

        const ayahStartTime = verseDurations.slice(0, activeVerseIndex).reduce((a, b) => a + b, 0);
        const ayahDuration = verseDurations[activeVerseIndex] || 1;
        const ayahElapsed = elapsed - ayahStartTime;
        const ayahProgress = Math.min(1, Math.max(0, ayahElapsed / ayahDuration));

        const startAyah = verses[0]?.id ?? 1;
        const endAyah = verses[verses.length - 1]?.id ?? 1;
        const settings = { fontSize, fontWeight, fontFamily, textColor, textPosition, textVerticalOffset, surahName, userPlan, instaHandle, tiktokHandle, filter, overlay, ayahDecoration, videoTemplate, reciterName, reciterId: data.reciterId, startAyah, endAyah, dossaryBgBase64, ayahProgress };
        const animState = { opacity: 1, offsetY: 0, scale: 1, activeWordIndex: -1 };

        renderPromises.push(generateVerseFrame(activeVerse, fPath, settings, bgPath, isVideoBg, fonts, animState, elapsed, audioTotal, templatePhotoBase64));
        frameEntries.push({ fPath, dur });
        elapsed += dur;
        frameIndex++;
      }
    } else {
      for (let i = 0; i < verses.length; i++) {
        const v = verses[i];
        const dur = verseDurations[i];
        const lines = wrapText(v.text || "", sf, tw);
        const numLines = Math.max(1, lines.length);

        if (numLines === 1) {
          const lineVerse = { ...v, text: lines[0], translation: v.translation || "" };
          await processLineWithAnim(lineVerse, Math.max(dur, 0.5), `f-${i}-0`);
        } else {
          const charLengths = lines.map(l => Math.max(stripTashkeel(l).length, 1));
          const totalChars = charLengths.reduce((a, b) => a + b, 0);
          let remainingDur = dur;
          let remainingChars = totalChars;

          for (let j = 0; j < numLines; j++) {
            const lineVerse = { ...v, text: lines[j], translation: (j === numLines - 1) ? (v.translation || "") : "" };
            let lineDur;
            if (j === numLines - 1) {
              lineDur = Math.max(remainingDur + 0.1, 0.5);
            } else {
              const ratio = charLengths[j] / remainingChars;
              lineDur = Math.max(remainingDur * ratio * 1.05, 0.4);
              remainingDur -= lineDur;
              remainingChars -= charLengths[j];
            }
            await processLineWithAnim(lineVerse, lineDur, `f-${i}-${j}`);
          }
        }
      }
    }

    progress(45, "جاري معالجة ورسم نصوص الآيات...");
    await Promise.all(renderPromises);

    const frameTotal = frameEntries.reduce((a, f) => a + f.dur, 0);
    const diff = audioTotal - frameTotal;
    if (Math.abs(diff) > 0.01 && frameEntries.length > 0) {
      frameEntries[frameEntries.length - 1].dur = Math.max(0.3, frameEntries[frameEntries.length - 1].dur + diff);
    }

    const totalDuration = verseDurations.reduce((a, b) => a + b, 0);

    progress(55, "دمج الصوت بدون تقطيع...");
    const mergedAudioPath = path.resolve(tempDir, "merged-audio.aac");
    const audioInputs = audioPaths.map(p => `-i "${sl(p)}"`).join(" ");
    const filterParts = audioPaths.map((_, i) => `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`).join(";");
    const concatIn = audioPaths.map((_, i) => `[a${i}]`).join("");
    const concatFilter = `${filterParts};${concatIn}concat=n=${audioPaths.length}:v=0:a=1[aout]`;

    await execAsync(
      `ffmpeg -loglevel error ${audioInputs} -filter_complex "${concatFilter}" -map "[aout]" -c:a aac -b:a 192k -ar 44100 "${sl(mergedAudioPath)}" -y`,
      { timeout: 90000 }
    );

    progress(70, "جاري دمج المقاطع وإنتاج الفيديو...");
    const frameListPath = path.resolve(tempDir, "frames.txt");
    let frameContent = frameEntries.map(f => `file '${sl(f.fPath)}'\nduration ${f.dur.toFixed(6)}`).join("\n");
    frameContent += `\nfile '${sl(frameEntries[frameEntries.length - 1].fPath)}'`;
    fs.writeFileSync(frameListPath, frameContent);

    const outPath = path.resolve(RENDERS_DIR, `${jobId}.mp4`);
    let ffmpegCmd;

    if (isVideoBg) {
      progress(75, "جاري تهيئة فيديو الخلفية بمقاس الهاتف (كاش)...");
      // بنستخدم كاش الخلفيات: لو نفس رابط الخلفية اتعمل له resize قبل كده، بيترجع فورًا
      const bgResizedPath = await getResizedBackground(backgroundUrl, sl(bgPath));

      progress(85, "دمج الطبقات وإنتاج الفيديو النهائي...");
      ffmpegCmd = [
        `ffmpeg`, `-loglevel error`,
        `-stream_loop -1 -i "${sl(bgResizedPath)}"`,
        `-f concat -safe 0 -i "${sl(frameListPath)}"`,
        `-i "${sl(mergedAudioPath)}"`,
        `-filter_complex`, `"[0:v][1:v]overlay=0:0:shortest=1,format=yuv420p[vout]"`,
        `-map "[vout]" -map 2:a`,
        `-t ${totalDuration.toFixed(4)}`,
        `-c:v libx264 -preset ultrafast -crf 23`,
        `-c:a aac -b:a 192k -ar 44100`,
        `-movflags +faststart`,
        `-y "${sl(outPath)}"`,
      ].join(" ");
    } else {
      ffmpegCmd = `ffmpeg -loglevel error -f concat -safe 0 -i "${sl(frameListPath)}" -i "${sl(mergedAudioPath)}" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p -c:a copy -t ${totalDuration.toFixed(4)} -movflags +faststart -y "${sl(outPath)}"`;
    }

    await execAsync(ffmpegCmd, { timeout: 180000 });

    setCompleted(jobId, `https://${HOST}/download/${jobId}.mp4`);
    logger.info("render_completed", { jobId, durationSec: totalDuration.toFixed(2) });
  } catch (e) {
    setFailed(jobId, e);
  } finally {
    setTimeout(() => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }, 60000);
  }
}
