import fs from "fs";
import os from "os";
import path from "path";
import { RENDERS_DIR, WIDTH, HEIGHT, getSheikhAsset, FRAME_BATCH, X264_PRESET, X264_CRF, OUTPUT_FPS } from "../config.js";
import { downloadFile } from "./security.js";
import { ensureFont, refreshFontCache, normalizeFontFamily } from "./fonts.js";
import { getDurationCached, getResizedBackground, prepareBackgroundRaw, downscaleToBase64 } from "./cache.js";
import { generateVerseFrame, canUseLayerFastPath, renderStaticLayer, renderTextLayer, composeLayerFrame } from "./frame.js";
import { wrapText } from "./svgUtils.js";
import { setProgress, setFailed } from "./jobs.js";
import { logger } from "./logger.js";
import { mergeAudio } from "./audioMerge.js";
import { publishResult } from "./finalize.js";
import { startBackgroundOnlyRender } from "./renderBgOnly.js";
import { RENDER_PHASES, RenderError } from "./errors.js";
import { ffmpeg, threadArgs } from "./ffmpeg.js";

if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });

const stripTashkeel = (s) => (s || "").replace(/[\u064B-\u065F\u0670]/g, "");
const sl = (s) => s.replace(/\\/g, "/");

// معدل الفريمات في الفيديو الناتج (0 = متغير زي v23)
const fpsArgs = () => (OUTPUT_FPS > 0 ? ["-r", String(OUTPUT_FPS)] : []);

export async function startRender(jobId, data) {
  // وضع "خلفية فقط": فيديو + صوت بدون أي نص (أسرع بكتير). شوف renderBgOnly.js
  if (data.backgroundOnly === true) return startBackgroundOnlyRender(jobId, data);

  const {
    verses, backgroundUrl, backgroundFit = "cover", surahName, reciterName = "Sheikh Muhammad Siddiq Al-Minshawi",
    textColor = "#ffffff", fontSize = 50, fontWeight = 700,
    filter = "none", overlay = "none", animation = "fade", textPosition = "center",
    textVerticalOffset = 0, userPlan = "free", instaHandle = "", tiktokHandle = "",
    ayahDecoration = "bracket1", videoTemplate = "default",
  } = data;
  // اسم الخط لازم يكون من القايمة المعروفة وإلا Amiri
  const fontFamily = normalizeFontFamily(data.fontFamily || "Amiri");

  const isWide = data.orientation === "landscape" || data.aspectRatio === "16:9";
  const frameW = isWide ? 1920 : WIDTH;
  const frameH = isWide ? 1080 : HEIGHT;

  const tempDir = path.resolve(os.tmpdir(), jobId);
  fs.mkdirSync(tempDir, { recursive: true });
  const progress = (pct, msg, phase = null) => setProgress(jobId, pct, msg, phase);
  let succeeded = false;

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
      if (isDossaryPlayer || isBasitPlayer) naskhFont = await ensureFont("Noto Naskh Arabic");
      if (isDetox) {
        rubikFont = await ensureFont("Rubik");
        montserratFont = await ensureFont("Montserrat-Black");
      }
      await refreshFontCache();
    } catch (fontErr2) {
      logger.warn("extra_fonts_failed", { error: fontErr2.message });
    }

    // قوالب المشغل مبنية بالكامل بتصميم خاص ولا تستخدم أي فيديو خلفية
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
    const multiBgUrls = Array.isArray(data.backgroundUrls) && data.backgroundUrls.length > 0 ? data.backgroundUrls : [];
    const multiBgPaths = [];

    if (multiBgUrls.length > 0) {
      multiBgUrls.forEach((u, i) => {
        const mPath = path.resolve(tempDir, `multi_bg_${i}.mp4`);
        multiBgPaths.push(mPath);
        parallelDownloads.push(
          downloadFile(u, mPath, { timeoutMs: 120000 }).catch(err => {
            logger.warn("multi_bg_download_fail", { error: err.message, url: u, index: i });
          })
        );
      });
    } else if (hasNetworkBg) {
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

    // ⚡ v24: الصور بتتصغّر مرة واحدة قبل ما تدخل في SVG كل فريم (أكبر مكسب في سرعة القوالب)
    let templatePhotoBase64 = "";
    let dossaryBgBase64 = "";
    if (isPlayerTemplate && fs.existsSync(photoPath)) {
      try { templatePhotoBase64 = await downscaleToBase64(photoPath, 640); }
      catch (e) { logger.warn("photo_downscale_failed", { error: e.message }); templatePhotoBase64 = fs.readFileSync(photoPath).toString("base64"); }
    }
    if (isDossaryPlayer && fs.existsSync(dossaryBgPath)) {
      try { dossaryBgBase64 = await downscaleToBase64(dossaryBgPath, isWide ? 1920 : 1200, { png: true }); }
      catch (e) { logger.warn("dossary_bg_downscale_failed", { error: e.message }); dossaryBgBase64 = fs.readFileSync(dossaryBgPath).toString("base64"); }
    }

    // ⚡ v24: خلفية الصورة (القالب الافتراضي) بتتجهّز مرة واحدة raw بمقاس الفريم
    let preparedBg = null;
    if (!isPlayerTemplate && !isVideoBg && multiBgPaths.length === 0 && fs.existsSync(bgPath)) {
      try {
        preparedBg = await prepareBackgroundRaw(bgPath, frameW, frameH, isWide ? "cover" : (backgroundFit || "cover"));
      } catch (e) {
        logger.warn("bg_prepare_failed_fallback_per_frame", { error: e.message });
      }
    }

    progress(25, "تحميل وتحليل الملفات الصوتية للآيات...", RENDER_PHASES.AUDIO_DOWNLOAD);

    // فحص ما إذا كان الصوت هو سورة كاملة موحدة لجميع الآيات
    const isSingleSurahAudio = verses.length > 0 && verses.every(v => v.audio === verses[0].audio);
    let verseDurations = [];
    const audioPaths = verses.map((_, i) => path.resolve(tempDir, `a-${i}.mp3`));

    if (isSingleSurahAudio) {
      const fullSurahPath = path.resolve(tempDir, "full_surah.mp3");
      await downloadFile(verses[0].audio, fullSurahPath, { timeoutMs: 120000 });
      const totalSurahDuration = await getDurationCached(verses[0].audio, fullSurahPath);

      const verseWordCounts = verses.map(v => (v.text || "").trim().split(/\s+/).filter(Boolean).length || 5);
      const totalWords = verseWordCounts.reduce((a, b) => a + b, 0) || 1;

      let cursor = 0;
      for (let i = 0; i < verses.length; i++) {
        const segDur = (verseWordCounts[i] / totalWords) * Math.min(totalSurahDuration, Math.max(15, totalWords * 1.6));
        verseDurations.push(segDur);
        await ffmpeg(["-ss", cursor.toFixed(3), "-t", segDur.toFixed(3), "-i", sl(fullSurahPath), "-c", "copy", "-y", sl(audioPaths[i])]);
        cursor += segDur;
      }
    } else {
      // تحميل الصوتيات في مجموعات (10 بالتوازي)
      const AUDIO_BATCH = 10;
      for (let b = 0; b < verses.length; b += AUDIO_BATCH) {
        const batch = verses.slice(b, b + AUDIO_BATCH);
        await Promise.all(batch.map(async (v, idx) => {
          const i = b + idx;
          try {
            await downloadFile(v.audio, audioPaths[i], { timeoutMs: 60000 });
          } catch (audioErr) {
            throw new RenderError(
              RENDER_PHASES.AUDIO_DOWNLOAD,
              `فشل تحميل صوت الآية رقم ${i + 1} (${v.id || ""})`,
              { verseIndex: i, verseId: v.id, audioUrl: v.audio, error: audioErr.message },
              audioErr
            );
          }
        }));
      }

      progress(30, "حساب مدد التلاوة بدقة...", RENDER_PHASES.AUDIO_PROBE);
      verseDurations = await Promise.all(verses.map((v, i) => getDurationCached(v.audio, audioPaths[i])));
    }

    const audioTotal = verseDurations.reduce((a, b) => a + b, 0);
    let currentElapsed = 0;

    // ⚡ v24: تجهيز الصوت وفيديو الخلفية بيشتغلوا بالتوازي مع رسم الفريمات (قبل كده كانوا بالتتابع).
    // على سيرفر فيه أكتر من CPU ده بيخفي وقت التجهيز جوه وقت الرسم.
    const mergedAudioPath0 = path.resolve(tempDir, "merged-audio.aac");
    const startAudioMerge = () => mergeAudio({
      audioPaths, workDir: tempDir, outPath: mergedAudioPath0, totalSeconds: audioTotal,
      antiCopyright: data.antiCopyright !== false,
    });

    const needsVideoBg = isVideoBg || multiBgPaths.length > 0;
    const startBgPrep = async () => {
      if (multiBgPaths.length > 0) {
        const validMultiBgs = multiBgPaths.filter(p => fs.existsSync(p));
        if (validMultiBgs.length === 0) validMultiBgs.push(bgPath);

        const resizedMultiPaths = [];
        for (let idx = 0; idx < validMultiBgs.length; idx++) {
          const vPath = validMultiBgs[idx];
          const vUrl = multiBgUrls[idx] || backgroundUrl;
          resizedMultiPaths.push(await getResizedBackground(vUrl, sl(vPath), backgroundFit, isWide, audioTotal));
        }

        const multiListFile = path.resolve(tempDir, "multi_bgs.txt");
        let listContent = "";
        const repeatCount = Math.max(1, Math.ceil(audioTotal / (resizedMultiPaths.length * 5)));
        for (let r = 0; r < repeatCount; r++) {
          resizedMultiPaths.forEach(p => { listContent += `file '${sl(p)}'\n`; });
        }
        fs.writeFileSync(multiListFile, listContent);

        const concatenatedBg = path.resolve(tempDir, "concatenated_bg.mp4");
        await ffmpeg(["-f", "concat", "-safe", "0", "-i", sl(multiListFile), "-c", "copy", "-y", sl(concatenatedBg)]);
        return concatenatedBg;
      }
      // لو فشل تحميل الفيديو ننشئ فيديو بديل داكن بدل ما FFmpeg ينهار
      if (!fs.existsSync(bgPath)) {
        logger.warn("bg_video_missing_creating_fallback", { bgPath, isWide });
        const dur = Math.max(1, Math.ceil(audioTotal || 60));
        await ffmpeg(["-f", "lavfi", "-i", `color=c=0x0a0a0a:s=${frameW}x${frameH}:r=30:d=${dur}`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", sl(bgPath)]);
      }
      return getResizedBackground(backgroundUrl, sl(bgPath), backgroundFit, isWide, audioTotal);
    };

    const audioMergeP = startAudioMerge();
    const bgPrepP = needsVideoBg ? startBgPrep() : null;
    // نمنع unhandledRejection لو أحدهم فشل قبل ما نوصل لنقطة الانتظار — الخطأ بيتعالج عند await
    audioMergeP.catch(() => {});
    bgPrepP?.catch(() => {});

    progress(35, "توليد إطارات سطر بسطر مع الحركات وتتبع الكلمات...");

    const sf = isWide ? Math.min(Math.max(fontSize * 1.3, 36), 90) : Math.min(Math.max(fontSize * 1.6, 40), 110);
    const tw = Math.floor(frameW * (isWide ? 0.75 : 0.82));
    const frameEntries = [];
    const ext = isVideoBg ? "png" : "jpg";
    const renderTasks = [];
    const fonts = { mainFont, amiriFont, naskhFont, rubikFont, montserratFont };

    // ⚡ المسار السريع (طبقات) لانتقال الـ fade في القالب الافتراضي — شوف frame.js
    // الحركات اللي بتغيّر مكان/حجم النص (slide/zoom/bounce...) بتفضل على المسار الأصلي.
    const MOTION_ANIMS = ["slideUp", "slide", "slideDown", "zoomIn", "zoom", "scale", "bounce", "flip", "blur", "wave"];
    const opacityOnlyAnim = !MOTION_ANIMS.includes(animation);
    let staticLayerP = null;
    const getStaticLayer = (verse0, settings0) => (staticLayerP ??= renderStaticLayer(verse0, settings0, isVideoBg, fonts));

    const processLineWithAnim = async (lineVerse, lineDur, fBaseName) => {
      const settings = {
        fontSize, fontWeight, fontFamily, textColor, textPosition, textVerticalOffset,
        surahName, userPlan, instaHandle, tiktokHandle, filter, overlay, ayahDecoration,
        videoTemplate, reciterName, backgroundFit,
        isWide,
        preparedBg,
        showVerseText: data.showVerseText !== false,
        showDetoxTitle: data.showDetoxTitle,
        detoxTitleText: data.detoxTitleText,
        showDetoxTimer: data.showDetoxTimer,
        showDetoxProgressBar: data.showDetoxProgressBar
      };
      const hasTransition = animation && animation !== "none";
      let remainingDur = lineDur;

      const useFast = opacityOnlyAnim && !isDetox && canUseLayerFastPath(settings, isVideoBg);
      const lineCtl = { remaining: 0, text: null };
      const pushFrame = (fPath, animState, frameElapsed) => {
        const slow = () => generateVerseFrame(lineVerse, fPath, settings, bgPath, isVideoBg, fonts, animState, frameElapsed, audioTotal, templatePhotoBase64);
        if (!useFast) { renderTasks.push(slow); return; }
        lineCtl.remaining++;
        renderTasks.push(async () => {
          try {
            lineCtl.text ??= renderTextLayer(lineVerse, settings, isVideoBg, fonts, 0, audioTotal);
            const [st, tx] = await Promise.all([getStaticLayer(lineVerse, settings), lineCtl.text]);
            await composeLayerFrame(fPath, settings, isVideoBg, st, tx, animState.opacity);
          } catch (e) {
            logger.warn("layer_fastpath_fallback", { error: e.message });
            await slow(); // أي مشكلة → نرجع للمسار الأصلي (نفس النتيجة)
          } finally {
            if (--lineCtl.remaining === 0) lineCtl.text = null; // نحرر ذاكرة طبقة السطر
          }
        });
      };

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
          pushFrame(fPath, animState, frameElapsed);
          frameEntries.push({ fPath, dur: frameDur });
          currentElapsed += frameDur;
          remainingDur -= frameDur;
        }
      }

      const words = lineVerse.text.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      if (wordCount > 0 && remainingDur > 0 && !isDetox) {
        // ⚡ v24: في القالب الافتراضي activeWordIndex مش بيأثر على الرسم أصلاً، فكل فريمات
        // الكلمات كانت صور متطابقة بالضبط (v23 كان بيرسم نفس الصورة عدد كلماتها مرة).
        // دلوقتي فريم واحد للسطر بكل مدته. النتيجة النهائية متطابقة والرندرة أسرع بكتير.
        const animState = { opacity: 1, offsetY: 0, scale: 1, activeWordIndex: -1 };
        const fPath = path.resolve(tempDir, `${fBaseName}-hold.${ext}`);
        const frameElapsed = currentElapsed;
        pushFrame(fPath, animState, frameElapsed);
        frameEntries.push({ fPath, dur: remainingDur });
        currentElapsed += remainingDur;
      } else if (wordCount > 0 && remainingDur > 0) {
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
        // أول 1.2 ثانية في تصميم الدوسري بـ 25 فريم/ثانية لنعومة حركة الدخول
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

        const frameElapsedNow = elapsed;
        renderTasks.push(() => generateVerseFrame(activeVerse, fPath, settings, bgPath, isVideoBg, fonts, animState, frameElapsedNow, audioTotal, templatePhotoBase64));
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

    progress(45, "جاري رسم إطارات الآيات...", RENDER_PHASES.FRAME_RENDER);
    // ⚡ v24: حجم الدفعة بيتحدد من عدد الـ CPU (FRAME_BATCH) بدل رقم ثابت 4
    for (let b = 0; b < renderTasks.length; b += FRAME_BATCH) {
      const batch = renderTasks.slice(b, b + FRAME_BATCH);
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
      // تقدّم أدق + تحديث كل دفعة فقط (مش كل فريم)
      const pct = 45 + Math.round((Math.min(b + FRAME_BATCH, renderTasks.length) / Math.max(1, renderTasks.length)) * 10);
      progress(pct, `معالجة الإطارات (${Math.min(b + FRAME_BATCH, renderTasks.length)}/${renderTasks.length})...`, RENDER_PHASES.FRAME_RENDER);
    }

    const frameTotal = frameEntries.reduce((a, f) => a + f.dur, 0);
    const diff = audioTotal - frameTotal;
    if (Math.abs(diff) > 0.01 && frameEntries.length > 0) {
      frameEntries[frameEntries.length - 1].dur = Math.max(0.3, frameEntries[frameEntries.length - 1].dur + diff);
    }

    const totalDuration = verseDurations.reduce((a, b) => a + b, 0);

    // الصوت والخلفية اتبدأوا بالتوازي مع رسم الفريمات (فوق). هنا بس بنستنى نتيجتهم.
    progress(55, "دمج هندسة الصوت بدون تقطيع...", RENDER_PHASES.AUDIO_MERGE);
    await audioMergeP;
    const mergedAudioPath = path.resolve(tempDir, "merged-audio.aac");

    progress(70, "جاري دمج المقاطع وإنتاج الفيديو...");
    const frameListPath = path.resolve(tempDir, "frames.txt");
    let frameContent = frameEntries.map(f => `file '${sl(f.fPath)}'\nduration ${f.dur.toFixed(6)}`).join("\n");
    frameContent += `\nfile '${sl(frameEntries[frameEntries.length - 1].fPath)}'`;
    fs.writeFileSync(frameListPath, frameContent);

    const outPath = path.resolve(RENDERS_DIR, `${jobId}.mp4`);
    let ffmpegArgs;

    if (isVideoBg || (multiBgPaths && multiBgPaths.length > 0)) {
      progress(75, "انتظار تجهيز فيديو الخلفية...", RENDER_PHASES.BACKGROUND_PROCESS);
      const bgResizedPath = await bgPrepP;

      progress(85, "دمج الطبقات وإنتاج الفيديو النهائي...", RENDER_PHASES.FFMPEG_RENDER);
      ffmpegArgs = [
        "-stream_loop", "-1", "-i", sl(bgResizedPath),
        "-f", "concat", "-safe", "0", "-i", sl(frameListPath),
        "-i", sl(mergedAudioPath),
        "-filter_complex", "[0:v][1:v]overlay=0:0:shortest=1,format=yuv420p[vout]",
        "-map", "[vout]", "-map", "2:a",
        "-t", totalDuration.toFixed(4),
        ...threadArgs(),
        "-c:v", "libx264", "-preset", X264_PRESET, "-crf", X264_CRF, ...fpsArgs(),
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
        "-movflags", "+faststart",
        "-y", sl(outPath),
      ];
    } else {
      // ⚡ إطارات ثابتة (النص بس هو اللي بيتغير): -tune stillimage بيصغّر الملف جداً بنفس الجودة
      progress(85, "إنتاج الفيديو النهائي...", RENDER_PHASES.FFMPEG_RENDER);
      ffmpegArgs = [
        "-f", "concat", "-safe", "0", "-i", sl(frameListPath),
        "-i", sl(mergedAudioPath),
        ...threadArgs(),
        "-c:v", "libx264", "-preset", X264_PRESET, "-tune", "stillimage", "-crf", X264_CRF,
        "-pix_fmt", "yuv420p", ...fpsArgs(),
        "-c:a", "copy",
        "-t", totalDuration.toFixed(4),
        "-movflags", "+faststart",
        "-y", sl(outPath),
      ];
    }

    const ffmpegTimeout = Math.max(900000, Math.ceil(totalDuration * 3000));
    try {
      await ffmpeg(ffmpegArgs, { timeout: ffmpegTimeout, maxBuffer: 100 * 1024 * 1024 });
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

    // الفيديو جاهز. الصور المؤقتة ملهاش لازمة دلوقتي — نمسحها فوراً (v23 كان بيسيبها 30 دقيقة).
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    succeeded = true;

    progress(95, "جاري رفع نسخة سحابية على تليجرام...");
    await publishResult({ jobId, outPath, surahName, reciterName, durationSec: totalDuration });
  } catch (e) {
    setFailed(jobId, e);
  } finally {
    if (!succeeded) {
      // عند الفشل نسيب الملفات 10 دقايق للتشخيص ثم نمسحها
      setTimeout(() => {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      }, 10 * 60 * 1000).unref();
    }
  }
}
