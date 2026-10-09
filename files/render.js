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
import { uploadVideoToTelegram } from "./telegram.js";
import { RENDER_PHASES, RenderError } from "./errors.js";

const execAsync = promisify(exec);
if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });

const stripTashkeel = (s) => (s || "").replace(/[\u064B-\u065F\u0670]/g, "");
const sl = (s) => s.replace(/\\/g, "/");

export async function startRender(jobId, data) {
  const {
    verses, backgroundUrl, backgroundFit = "cover", surahName, reciterName = "Sheikh Muhammad Siddiq Al-Minshawi",
    textColor = "#ffffff", fontSize = 50, fontWeight = 700, fontFamily = "Amiri",
    filter = "none", overlay = "none", animation = "fade", textPosition = "center",
    textVerticalOffset = 0, userPlan = "free", instaHandle = "", tiktokHandle = "",
    ayahDecoration = "bracket1", videoTemplate = "default",
    showVerseText = true,
  } = data;

  const isWide = data.orientation === "landscape" || data.aspectRatio === "16:9";
  const frameW = isWide ? 1920 : WIDTH;
  const frameH = isWide ? 1080 : HEIGHT;

  const tempDir = path.resolve(os.tmpdir(), jobId);
  fs.mkdirSync(tempDir, { recursive: true });
  const progress = (pct, msg, phase = null) => setProgress(jobId, pct, msg, phase);

  try {
    progress(5, "تحميل الخطوط والموارد...", RENDER_PHASES.FONTS);
    let mainFont, amiriFont;
    try {
      mainFont = await ensureFont(fontFamily);
      amiriFont = await ensureFont("Amiri");
    } catch (fontErr) {
      throw new RenderError(
        RENDER_PHASES.FONTS,
        `فشل تحميل الخط المطلوب (${fontFamily})`,
        { fontFamily, error: fontErr.message },
        fontErr
      );
    }

    const isMinshawiPlayer = videoTemplate === "minshawi_player";
    const isDossaryPlayer = videoTemplate === "dossary_player";
    const isBasitPlayer = videoTemplate === "basit_player";
    const isDetox = videoTemplate === "brainrot_detox";
    const isPlayerTemplate = videoTemplate && (videoTemplate.endsWith("_player") || isMinshawiPlayer || isDossaryPlayer || isBasitPlayer);

    let naskhFont = null;
    let rubikFont = null;
    let montserratFont = null;

    try {
      if (isDossaryPlayer || isBasitPlayer) {
        naskhFont = await ensureFont("Noto Naskh Arabic");
      }
      if (isDetox) {
        rubikFont = await ensureFont("Rubik");
        montserratFont = await ensureFont("Montserrat-Black");
      }
      await refreshFontCache();
    } catch (fontErr2) {
      logger.warn("extra_fonts_failed", { error: fontErr2.message });
    }

    // قوالب المشغل (المنشاوي، الدوسري، الباسط... إلخ) مبنية بالكامل بتصميم خاص ولا تستخدم أي فيديو خلفية
    const effectiveBgUrl = isPlayerTemplate ? "" : (backgroundUrl || "");
    const isVideoBg = !isPlayerTemplate && effectiveBgUrl && (
      /\.(mp4|webm|mov|m4v)(\?.*|#.*)?$/i.test(effectiveBgUrl) ||
      /videos\.pexels\.com/i.test(effectiveBgUrl) ||
      /\/video\//i.test(effectiveBgUrl)
    );
    const bgPath = path.resolve(tempDir, isVideoBg ? "bg.mp4" : "bg.jpg");

    // تحميل الخلفية + صورة الشيخ (لو قالب مشغل) بالتوازي
    progress(15, "تحميل فيديو أو صورة الخلفية...", RENDER_PHASES.BACKGROUND_DOWNLOAD);
    const photoPath = path.resolve(tempDir, "template_photo.jpg");
    const dossaryBgPath = path.resolve(tempDir, "dossary_bg.png");
    const hasNetworkBg = !isPlayerTemplate && effectiveBgUrl && 
      !effectiveBgUrl.startsWith("color:") && 
      !effectiveBgUrl.startsWith("gradient:") &&
      effectiveBgUrl.trim().length > 0;

    const parallelDownloads = [];
    if (hasNetworkBg) {
      parallelDownloads.push(
        downloadFile(effectiveBgUrl, bgPath, { timeoutMs: 120000 }).catch(err => {
          logger.warn("bg_download_fallback", { error: err.message, url: effectiveBgUrl });
        })
      );
    }

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

    progress(25, "تحميل وتحليل الملفات الصوتية للآيات...", RENDER_PHASES.AUDIO_DOWNLOAD);

    // تحميل كل الصوتيات وحساب مددها بالتوازي بدل التتابع
    const audioPaths = verses.map((_, i) => path.resolve(tempDir, `a-${i}.mp3`));
    await Promise.all(verses.map(async (v, i) => {
      try {
        await downloadFile(v.audio, audioPaths[i], { timeoutMs: 60000 });
      } catch (audioErr) {
        throw new RenderError(
          RENDER_PHASES.AUDIO_DOWNLOAD,
          `فشل تحميل صوت الآية رقم ${i + 1} (${v.id || ""})`,
          {
            verseIndex: i,
            verseId: v.id,
            audioUrl: v.audio,
            error: audioErr.message,
          },
          audioErr
        );
      }
    }));

    progress(30, "حساب مدد التلاوة بدقة...", RENDER_PHASES.AUDIO_PROBE);
    const verseDurations = await Promise.all(verses.map((v, i) => getDurationCached(v.audio, audioPaths[i])));

    const audioTotal = verseDurations.reduce((a, b) => a + b, 0);
    let currentElapsed = 0;

    progress(35, "توليد إطارات سطر بسطر مع الحركات وتتبع الكلمات...");

    const sf = isWide ? Math.min(Math.max(fontSize * 1.3, 36), 90) : Math.min(Math.max(fontSize * 1.6, 40), 110);
    const tw = Math.floor(frameW * (isWide ? 0.75 : 0.82));
    const frameEntries = [];
    const ext = isVideoBg ? "png" : "jpg";
    const renderTasks = [];
    const fonts = { mainFont, amiriFont, naskhFont, rubikFont, montserratFont };

    const processLineWithAnim = async (lineVerse, lineDur, fBaseName) => {
      const settings = { 
        fontSize, fontWeight, fontFamily, textColor, textPosition, textVerticalOffset, 
        surahName, userPlan, instaHandle, tiktokHandle, filter, overlay, ayahDecoration, 
        videoTemplate, reciterName, backgroundFit,
        isWide,
        showVerseText: data.showVerseText !== false,
        showDetoxTitle: data.showDetoxTitle,
        detoxTitleText: data.detoxTitleText,
        showDetoxTimer: data.showDetoxTimer,
        showDetoxProgressBar: data.showDetoxProgressBar
      };
      const hasTransition = animation && animation !== "none";
      let remainingDur = lineDur;

      if (hasTransition && remainingDur > 0.4) {
        const transitionFrames = 6;
        const frameDur = 0.2 / transitionFrames;
        for (let f = 0; f < transitionFrames; f++) {
          const p = f / (transitionFrames - 1);
          const animState = { opacity: 1, offsetY: 0, scale: 1, activeWordIndex: -1 };
          if (animation === "fade") {
            animState.opacity = p;
          } else if (animation === "slideUp" || animation === "slide") {
            animState.opacity = p;
            animState.offsetY = 30 * (1 - p);
          } else if (animation === "slideDown") {
            animState.opacity = p;
            animState.offsetY = -30 * (1 - p);
          } else if (animation === "zoomIn" || animation === "zoom" || animation === "scale") {
            animState.opacity = p;
            animState.scale = 0.8 + (0.2 * p);
          } else if (animation === "bounce") {
            animState.opacity = p;
            animState.scale = 0.7 + (0.35 * Math.sin(p * Math.PI));
            animState.offsetY = 20 * (1 - p);
          } else if (animation === "flip") {
            animState.opacity = p;
            animState.scale = p;
            animState.offsetY = -15 * (1 - p);
          } else if (animation === "blur" || animation === "wave") {
            animState.opacity = p * p;
            animState.offsetY = 10 * (1 - p);
          } else {
            animState.opacity = p;
          }

          const fPath = path.resolve(tempDir, `${fBaseName}-anim-${f}.${ext}`);
          const frameElapsed = currentElapsed;
          renderTasks.push(() => generateVerseFrame(lineVerse, fPath, settings, bgPath, isVideoBg, fonts, animState, frameElapsed, audioTotal, templatePhotoBase64));
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
          renderTasks.push(() => generateVerseFrame(lineVerse, fPath, settings, bgPath, isVideoBg, fonts, animState, frameElapsed, audioTotal, templatePhotoBase64));
          frameEntries.push({ fPath, dur: durPerWord });
          currentElapsed += durPerWord;
        }
      }
    };

    const isPlayer = videoTemplate && videoTemplate.endsWith("_player");

    if (isPlayer) {
      progress(35, "توليد إطارات مشغل الشيخ المخصص...");
      const isMinshawi = videoTemplate === "minshawi_player";
      const isDossary = videoTemplate === "dossary_player";
      let elapsed = 0;
      let frameIndex = 0;

      while (elapsed < audioTotal) {
        // إذا كنا في أول 1.2 ثانية لتصميم الدوسري، نزيد الـ FPS لـ 25 (فريم كل 0.04 ثانية) لنعومة الحركة
        const isIntro = isDossary && (elapsed < 1.2);
        const interval = isIntro ? 0.04 : ((isMinshawi || isDossary) ? 1.0 : 0.5);

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
        const settings = { fontSize, fontWeight, fontFamily, textColor, textPosition, textVerticalOffset, surahName, userPlan, instaHandle, tiktokHandle, filter, overlay, ayahDecoration, videoTemplate, reciterName, reciterId: data.reciterId, startAyah, endAyah, dossaryBgBase64, ayahProgress, backgroundFit, isWide, showVerseText: data.showVerseText !== false };
        const animState = { opacity: 1, offsetY: 0, scale: 1, activeWordIndex: -1 };

        renderTasks.push(() => generateVerseFrame(activeVerse, fPath, settings, bgPath, isVideoBg, fonts, animState, elapsed, audioTotal, templatePhotoBase64));
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

    progress(45, "جاري معالجة ورسم نصوص الآيات بدقة وبدون استهلاك ذاكرة...", RENDER_PHASES.FRAME_RENDER);
    const BATCH_SIZE = 4;
    for (let b = 0; b < renderTasks.length; b += BATCH_SIZE) {
      const batch = renderTasks.slice(b, b + BATCH_SIZE);
      try {
        await Promise.all(batch.map(fn => fn()));
      } catch (frameErr) {
        throw new RenderError(
          RENDER_PHASES.FRAME_RENDER,
          "فشل رسم وتوليد إطارات الآيات (Canvas)",
          { batchIndex: b, error: frameErr.message },
          frameErr
        );
      }
      const pct = 45 + Math.round((b / Math.max(1, renderTasks.length)) * 10);
      progress(pct, `معالجة الإطارات (${Math.min(b + BATCH_SIZE, renderTasks.length)}/${renderTasks.length})...`, RENDER_PHASES.FRAME_RENDER);
    }

    const frameTotal = frameEntries.reduce((a, f) => a + f.dur, 0);
    const diff = audioTotal - frameTotal;
    if (Math.abs(diff) > 0.01 && frameEntries.length > 0) {
      frameEntries[frameEntries.length - 1].dur = Math.max(0.3, frameEntries[frameEntries.length - 1].dur + diff);
    }

    const totalDuration = verseDurations.reduce((a, b) => a + b, 0);

    progress(55, "دمج هندسة الصوت بدون تقطيع...", RENDER_PHASES.AUDIO_MERGE);
    const mergedAudioPath = path.resolve(tempDir, "merged-audio.aac");
    const audioInputs = audioPaths.map(p => `-i "${sl(p)}"`).join(" ");
    const filterParts = audioPaths.map((_, i) => `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`).join(";");
    const concatIn = audioPaths.map((_, i) => `[a${i}]`).join("");

    // 🛡️ درع كسر البصمة الرقمية لحقوق الملكية (YouTube & Social Anti-Copyright Stealth Filter)
    const isAntiCopyright = data.antiCopyright !== false;
    const stealthChain = isAntiCopyright
      ? `;[raw_aout]asetrate=44629,atempo=0.988142,aresample=44100,equalizer=f=120:t=q:w=1.5:g=1.4,equalizer=f=3200:t=q:w=1.2:g=1.2,aecho=0.88:0.88:32|48:0.14|0.08,alimiter=limit=0.96[aout]`
      : ``;
    const outTag = isAntiCopyright ? `[raw_aout]` : `[aout]`;
    const concatFilter = `${filterParts};${concatIn}concat=n=${audioPaths.length}:v=0:a=1${outTag}${stealthChain}`;

    const audioTimeout = Math.max(300000, Math.ceil(totalDuration * 500));
    try {
      await execAsync(
        `ffmpeg -loglevel error ${audioInputs} -filter_complex "${concatFilter}" -map "[aout]" -c:a aac -b:a 192k -ar 44100 "${sl(mergedAudioPath)}" -y`,
        { timeout: audioTimeout, maxBuffer: 50 * 1024 * 1024 }
      );
    } catch (audioMergeErr) {
      throw new RenderError(
        RENDER_PHASES.AUDIO_MERGE,
        "فشل دمج وتجهيز مسارات الصوتيات عبر FFmpeg",
        {
          audioCount: audioPaths.length,
          stderr: (audioMergeErr.stderr || audioMergeErr.message || "").substring(0, 600),
          exitCode: audioMergeErr.code,
        },
        audioMergeErr
      );
    }

    progress(70, "جاري دمج المقاطع وإنتاج الفيديو...");
    const frameListPath = path.resolve(tempDir, "frames.txt");
    let frameContent = frameEntries.map(f => `file '${sl(f.fPath)}'\nduration ${f.dur.toFixed(6)}`).join("\n");
    frameContent += `\nfile '${sl(frameEntries[frameEntries.length - 1].fPath)}'`;
    fs.writeFileSync(frameListPath, frameContent);

    const outPath = path.resolve(RENDERS_DIR, `${jobId}.mp4`);
    let ffmpegCmd;

    if (isVideoBg) {
      progress(75, isWide ? "تهيئة فيديو الخلفية بمقاس يوتيوب العريض (1920x1080)..." : "تهيئة فيديو الخلفية بمقاس الهاتف...", RENDER_PHASES.BACKGROUND_PROCESS);
      // حماية استباقية: لو فشل تحميل ملف الفيديو أو كان الرابط معطلاً، ننشئ فيديو بديل داكن أنيق لمنع انهيار FFmpeg
      if (!fs.existsSync(bgPath)) {
        logger.warn("bg_video_missing_creating_fallback", { bgPath, isWide });
        const targetW = isWide ? 1920 : WIDTH;
        const targetH = isWide ? 1080 : HEIGHT;
        const dur = Math.max(1, Math.ceil(totalDuration || 60));
        await execAsync(`ffmpeg -loglevel error -f lavfi -i color=c=0x0a0a0a:s=${targetW}x${targetH}:r=30:d=${dur} -c:v libx264 -pix_fmt yuv420p "${sl(bgPath)}" -y`);
      }
      // بنستخدم كاش الخلفيات: لو نفس رابط الخلفية اتعمل له resize قبل كده، بيترجع فورًا
      const bgResizedPath = await getResizedBackground(backgroundUrl, sl(bgPath), backgroundFit, isWide);

      progress(85, "دمج الطبقات وإنتاج الفيديو النهائي...", RENDER_PHASES.FFMPEG_RENDER);
      const filterComplex = `"[0:v][1:v]overlay=0:0:shortest=1,format=yuv420p[vout]"`;

      ffmpegCmd = [
        `ffmpeg`, `-loglevel error`,
        `-stream_loop -1 -i "${sl(bgResizedPath)}"`,
        `-f concat -safe 0 -i "${sl(frameListPath)}"`,
        `-i "${sl(mergedAudioPath)}"`,
        `-filter_complex`, filterComplex,
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

    // مهلة ديناميكية تتناسب مع طول الفيديو حتى لو كان فيديو يوتيوب طويل (ساعة أو أكثر)
    const ffmpegTimeout = Math.max(900000, Math.ceil(totalDuration * 3000));
    try {
      await execAsync(ffmpegCmd, { timeout: ffmpegTimeout, maxBuffer: 100 * 1024 * 1024 });
    } catch (ffmpegErr) {
      throw new RenderError(
        RENDER_PHASES.FFMPEG_RENDER,
        "فشل إنتاج وتصدير الفيديو النهائي عبر محرك FFmpeg",
        {
          isWide,
          isVideoBg,
          totalDuration,
          stderr: (ffmpegErr.stderr || ffmpegErr.message || "").substring(0, 800),
          exitCode: ffmpegErr.code,
        },
        ffmpegErr
      );
    }

    progress(95, "جاري رفع الفيديو سحابياً إلى تليجرام وحذف النسخة المؤقتة...");

    const finalVideoUrl = `https://${HOST}/download/${jobId}.mp4`;
    const caption = `📖 ${surahName || "تلاوة قرآنية"} | بصوت ${reciterName || "قارئ"}`;

    try {
      const tgResult = await uploadVideoToTelegram(outPath, caption);
      if (tgResult && tgResult.fileId) {
        logger.info("render_uploaded_to_telegram", { jobId, fileId: tgResult.fileId });
      }
    } catch (uploadErr) {
      logger.warn("telegram_upload_skip", { error: uploadErr.message });
    }

    setCompleted(jobId, finalVideoUrl);
    logger.info("render_completed", { jobId, durationSec: totalDuration.toFixed(2), finalVideoUrl });
  } catch (e) {
    setFailed(jobId, e);
  } finally {
    setTimeout(() => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }, 30 * 60 * 1000); // 30 دقيقة
  }
}
