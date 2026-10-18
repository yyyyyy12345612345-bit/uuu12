import fs from "fs";
import os from "os";
import sharp from "sharp";
import path from "path";
import { RENDERS_DIR, WIDTH, HEIGHT } from "../config.js";
import { downloadFile } from "./security.js";
import { getDurationCached, getResizedBackground, isVideoBackgroundUrl, scaleFilterFor, probeVideo } from "./cache.js";
import { ffmpeg, ffprobe } from "./ffmpeg.js";
import { mergeAudio } from "./audioMerge.js";
import { publishResult } from "./finalize.js";
import { setProgress, setFailed } from "./jobs.js";
import { RENDER_PHASES, RenderError } from "./errors.js";
import { logger } from "./logger.js";

const sl = (s) => s.replace(/\\/g, "/");

/**
 * ⚡ وضع "خلفية فقط" (backgroundOnly: true)
 * فيديو الخلفية + الصوت بس، بدون أي نص أو تدرج أو علامات. مفيش رسم فريمات ولا خطوط.
 *  - خلفية فيديو: الفيديو بيتنسخ (stream copy) من غير فك ولا تشفير. اللي بيتعالج الصوت بس.
 *  - عدة خلفيات: بتتجهّز وتتوصل بالنسخ.
 *  - صورة / لون: فيديو ثابت بتشفير خفيف جداً (-tune stillimage).
 * لو كل الآيات ليها نفس رابط الصوت (ملف سورة كاملة) بنستخدم الملف كله بدون تقسيم.
 */
export async function startBackgroundOnlyRender(jobId, data) {
  const { verses, surahName, reciterName, backgroundFit = "cover" } = data;
  const isWide = data.orientation === "landscape" || data.aspectRatio === "16:9";
  const frameW = isWide ? 1920 : WIDTH;
  const frameH = isWide ? 1080 : HEIGHT;

  const tempDir = path.resolve(os.tmpdir(), jobId);
  fs.mkdirSync(tempDir, { recursive: true });
  const progress = (pct, msg, phase = null) => setProgress(jobId, pct, msg, phase);
  let succeeded = false;

  try {
    // ── 1) نوع الخلفية ───────────────────────────────────────────────
    const isNet = (u) => typeof u === "string" && u.trim() && !u.startsWith("color:") && !u.startsWith("gradient:");
    const multiUrls = Array.isArray(data.backgroundUrls) ? data.backgroundUrls.filter(isNet) : [];
    const bgUrl = (data.backgroundUrl || "").trim();
    const kind = multiUrls.length > 0 ? "multi" : (isNet(bgUrl) ? (isVideoBackgroundUrl(bgUrl) ? "video" : "image") : "color");
    const bgPath = path.resolve(tempDir, kind === "image" ? "bg.jpg" : "bg.mp4");

    // ── 2) تحميل الخلفية والصوت بالتوازي ─────────────────────────────
    progress(8, "تحميل الخلفية والصوت...", RENDER_PHASES.BACKGROUND_DOWNLOAD);
    const isSingleSurahAudio = verses.length > 0 && verses.every(v => v.audio === verses[0].audio);
    const audioUrls = isSingleSurahAudio ? [verses[0].audio] : verses.map(v => v.audio).filter((u, i, a) => i === 0 || u !== a[i - 1]);
    const audioPaths = isSingleSurahAudio ? verses.map((_, i) => path.resolve(tempDir, `a-${i}.mp3`)) : audioUrls.map((_, i) => path.resolve(tempDir, `a-${i}.mp3`));
    const multiPaths = multiUrls.map((_, i) => path.resolve(tempDir, `multi_bg_${i}.mp4`));

    const bgDownloads = [];
    if (kind === "video" || kind === "image") {
      bgDownloads.push(downloadFile(bgUrl, bgPath, { timeoutMs: 180000 }).catch(err => {
        throw new RenderError(RENDER_PHASES.BACKGROUND_DOWNLOAD, "فشل تحميل الخلفية", { url: bgUrl, error: err.message }, err);
      }));
    } else if (kind === "multi") {
      multiUrls.forEach((u, i) => bgDownloads.push(downloadFile(u, multiPaths[i], { timeoutMs: 180000 }).catch(err => {
        logger.warn("multi_bg_download_failed", { index: i + 1, url: u, error: err.message });
        return null;
      })));
    }

    const audioDownload = (async () => {
      if (isSingleSurahAudio) {
        const fullSurahPath = path.resolve(tempDir, "full_surah.mp3");
        await downloadFile(verses[0].audio, fullSurahPath, { timeoutMs: 180000 });
        const totalSurahDuration = await getDurationCached(verses[0].audio, fullSurahPath);
        const verseWordCounts = verses.map(v => (v.text || "").trim().split(/\s+/).filter(Boolean).length || 5);
        const totalWords = verseWordCounts.reduce((a, b) => a + b, 0) || 1;

        let cursor = 0;
        for (let i = 0; i < verses.length; i++) {
          const segDur = (verseWordCounts[i] / totalWords) * Math.min(totalSurahDuration, Math.max(15, totalWords * 1.8));
          await ffmpeg(["-ss", cursor.toFixed(3), "-t", segDur.toFixed(3), "-i", sl(fullSurahPath), "-c", "copy", "-y", sl(audioPaths[i])]);
          cursor += segDur;
        }
      } else {
        const BATCH = 10;
        for (let b = 0; b < audioUrls.length; b += BATCH) {
          await Promise.all(audioUrls.slice(b, b + BATCH).map(async (u, k) => {
            const i = b + k;
            try {
              await downloadFile(u, audioPaths[i], { timeoutMs: 180000 });
            } catch (e) {
              throw new RenderError(RENDER_PHASES.AUDIO_DOWNLOAD, `فشل تحميل الصوت رقم ${i + 1}`, { audioUrl: u, error: e.message }, e);
            }
          }));
        }
      }
    })();
    await Promise.all([...bgDownloads, audioDownload]);

    // ── 3) دمج الصوت (نفس فلتر v23) ──────────────────────────────────
    progress(30, "تجهيز الصوت...", RENDER_PHASES.AUDIO_PROBE);
    const rawDurations = await Promise.all(audioPaths.map((p, i) => getDurationCached(verses[i]?.audio || p, p)));
    const rawTotal = rawDurations.reduce((a, b) => a + b, 0);

    progress(40, "دمج الصوت...", RENDER_PHASES.AUDIO_MERGE);
    const mergedAudio = path.resolve(tempDir, "merged-audio.aac");
    await mergeAudio({
      audioPaths, workDir: tempDir, outPath: mergedAudio, totalSeconds: rawTotal,
      antiCopyright: data.antiCopyright !== false,
    });
    // مدة الصوت النهائية الفعلية (بعد الفلتر) هي اللي بتحدد طول الفيديو
    const dur = parseFloat((await ffprobe(["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", sl(mergedAudio)], { timeout: 20000 })).stdout) || rawTotal;

    // ── 4) تجهيز الخلفية + التجميع النهائي ────────────────────────────
    progress(70, "تجهيز الخلفية...", RENDER_PHASES.BACKGROUND_PROCESS);
    const outPath = path.resolve(RENDERS_DIR, `${jobId}.mp4`);
    const common = ["-map", "0:v:0", "-map", "1:a:0", "-t", dur.toFixed(3), "-movflags", "+faststart", "-y", sl(outPath)];
    let args, timeout = 600000;

    if (kind === "video") {
      const clip = await getResizedBackground(bgUrl, sl(bgPath), backgroundFit, isWide, dur, { copyIfCompliant: true });
      // الفيديو بيتنسخ زي ما هو ويتكرر (stream_loop) لحد طول الصوت
      args = ["-stream_loop", "-1", "-i", sl(clip), "-i", sl(mergedAudio), ...common.slice(0, -2), "-c", "copy", ...common.slice(-2)];
    } else if (kind === "multi") {
      const clips = [];
      for (let i = 0; i < multiUrls.length; i++) {
        if (!fs.existsSync(multiPaths[i])) continue;
        // كلهم بيتشفّروا بنفس الإعدادات عشان التوصيل بالنسخ يبقى سليم
        const c = await getResizedBackground(multiUrls[i], sl(multiPaths[i]), backgroundFit, isWide, dur);
        const info = await probeVideo(c);
        clips.push({ file: c, dur: info?.duration || 5 });
      }
      if (clips.length === 0) throw new RenderError(RENDER_PHASES.BACKGROUND_PROCESS, "مفيش خلفية صالحة للاستخدام", {});
      const listFile = path.resolve(tempDir, "bg_list.txt");
      let acc = 0, lines = [], guard = 0;
      while (acc < dur + 1 && guard++ < 20000) { for (const c of clips) { lines.push(`file '${sl(c.file)}'`); acc += c.dur; if (acc >= dur + 1) break; } }
      fs.writeFileSync(listFile, lines.join("\n"));
      args = ["-f", "concat", "-safe", "0", "-i", sl(listFile), "-i", sl(mergedAudio), ...common.slice(0, -2), "-c", "copy", ...common.slice(-2)];
    } else {
      // صورة أو لون: بنشفّر مقطع ثابت قصير (حوالي 10 ثواني) مرة واحدة، وبعدين نكرره بالنسخ لطول الصوت.
      // وقت التشفير ثابت بغض النظر عن طول الفيديو (ساعة = نفس تكلفة 10 ثواني).
      const clipDur = Math.max(2, Math.min(10, Math.ceil(dur) + 1));
      const stillPath = path.resolve(tempDir, "still.mp4");
      const enc = ["-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage", "-crf", "23", "-pix_fmt", "yuv420p",
                   "-g", "250", "-keyint_min", "250", "-sc_threshold", "0", "-r", "25", "-an"];
      let inArgs;
      if (kind === "image") {
        // تصغير الصورة مرة واحدة (ffmpeg كان بيصغّرها في كل فريم: 38 ثانية لفيديو 30 ثانية)
        const effectiveFit = isWide ? "cover" : (backgroundFit === "cover" ? "cover" : "contain");
        const scaled = path.resolve(tempDir, "bg_scaled.jpg");
        await sharp(bgPath).resize(frameW, frameH, { fit: effectiveFit, background: { r: 0, g: 0, b: 0 } }).jpeg({ quality: 93 }).toFile(scaled);
        inArgs = ["-loop", "1", "-framerate", "25", "-i", sl(scaled)];
      } else {
        const m = /^color:#?([0-9a-fA-F]{6})$/.exec(bgUrl);
        inArgs = ["-f", "lavfi", "-i", `color=c=0x${m ? m[1] : "0a0a0a"}:s=${frameW}x${frameH}:r=25`];
      }
      try {
        await ffmpeg([...inArgs, "-t", String(clipDur), ...enc, "-y", sl(stillPath)], { timeout: 120000 });
      } catch (e) {
        throw new RenderError(RENDER_PHASES.BACKGROUND_PROCESS, "فشل تجهيز الخلفية الثابتة",
          { kind, stderr: (e.stderr || e.message || "").substring(0, 500) }, e);
      }
      args = ["-stream_loop", "-1", "-i", sl(stillPath), "-i", sl(mergedAudio), ...common.slice(0, -2), "-c", "copy", ...common.slice(-2)];
    }

    progress(85, "إنتاج الفيديو النهائي...", RENDER_PHASES.FFMPEG_RENDER);
    try {
      await ffmpeg(args, { timeout, maxBuffer: 100 * 1024 * 1024 });
    } catch (e) {
      throw new RenderError(RENDER_PHASES.FFMPEG_RENDER, "فشل إنتاج الفيديو (وضع خلفية فقط)",
        { kind, isWide, dur, stderr: (e.stderr || e.message || "").substring(0, 800), exitCode: e.code }, e);
    }

    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    succeeded = true;
    progress(95, "جاري الرفع...");
    await publishResult({ jobId, outPath, surahName, reciterName, durationSec: dur });
  } catch (e) {
    setFailed(jobId, e);
  } finally {
    if (!succeeded) {
      setTimeout(() => { try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {} }, 10 * 60 * 1000).unref();
    }
  }
}
