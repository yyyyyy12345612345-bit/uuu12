/**
 * 🎬 CLI Video Renderer (render.mjs)
 * Used by Next.js API route (/api/render) & standalone rendering
 */

import { renderMedia, getCompositions } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import path from "path";
import fs from "fs";
import os from "os";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`);
    return parseFloat(stdout.trim()) || 5;
  } catch {
    return 5;
  }
}

async function main() {
  const configFile = process.argv[2];
  const outputDir = process.argv[3] || os.tmpdir();

  if (!configFile || !fs.existsSync(configFile)) {
    console.error("Config file not provided or not found");
    process.exit(1);
  }

  const rawConfig = fs.readFileSync(configFile, "utf-8");
  const config = JSON.parse(rawConfig);
  const outputName = config.outputName || `render-${Date.now()}.mp4`;
  const finalOutputPath = path.join(outputDir, outputName);

  const tempWorkDir = path.join(outputDir, `work-render-${Date.now()}`);
  if (!fs.existsSync(tempWorkDir)) fs.mkdirSync(tempWorkDir, { recursive: true });

  try {
    console.log(`🎬 Starting render job for: ${config.surahName || "Quran Video"}`);

    // 1. Download or copy Background
    const bgUrl = config.backgroundUrl || "";
    const isVideoBg = /\.(mp4|webm|mov|ogg|m4v|3gp|flv|avi)(\?.*|#.*)?$/i.test(bgUrl) || 
                      bgUrl.includes("video") || 
                      bgUrl.includes("pexels.com/video") || 
                      bgUrl.includes("videos.pexels.com");
    const bgPath = path.join(tempWorkDir, isVideoBg ? "bg.mp4" : "bg.jpg");

    if (bgUrl) {
      if (bgUrl.startsWith("http://") || bgUrl.startsWith("https://")) {
        try {
          await downloadFile(bgUrl, bgPath);
        } catch (err) {
          console.warn(`[render.mjs] Warning: Failed to download background: ${err.message}`);
        }
      } else {
        const localPath = path.join(process.cwd(), "public", bgUrl.replace(/^\//, ""));
        if (fs.existsSync(localPath)) {
          fs.copyFileSync(localPath, bgPath);
        }
      }
    }

    // 2. Download Verse Audios
    const verses = config.verses || [];
    const audioPaths = [];
    const audioResults = await Promise.all(verses.map(async (v, i) => {
      const aPath = path.join(tempWorkDir, `audio-${i}.mp3`);
      if (v.audio && (v.audio.startsWith("http://") || v.audio.startsWith("https://"))) {
        await downloadFile(v.audio, aPath);
        audioPaths.push(aPath);
        return { v, aPath, duration: await getAudioDuration(aPath) };
      }
      return { v, aPath: "", duration: 4 };
    }));

    // 3. Audio Merge (Gapless)
    const validAudioPaths = audioPaths.filter(p => fs.existsSync(p));
    let mergedAudioPath = "";
    let mergedDuration = 5;

    if (validAudioPaths.length > 0) {
      mergedAudioPath = path.join(tempWorkDir, "merged-audio.aac");
      const audioInputs = validAudioPaths.map(p => `-i "${p.replace(/\\/g, "/")}"`).join(" ");
      const filterParts = validAudioPaths.map((_, i) => 
        `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`
      ).join(";");
      const concatInputs = validAudioPaths.map((_, i) => `[a${i}]`).join("");
      const concatFilter = `${filterParts};${concatInputs}concat=n=${validAudioPaths.length}:v=0:a=1[aout]`;
      
      await execAsync(
        `ffmpeg ${audioInputs} -filter_complex "${concatFilter}" -map "[aout]" -c:a aac -b:a 192k -ar 44100 "${mergedAudioPath}" -y`,
        { maxBuffer: 50 * 1024 * 1024 }
      );
      mergedDuration = await getAudioDuration(mergedAudioPath);
    }

    // 4. Calculate frames
    const FPS = 30;
    let cumulativeFrames = 0;
    const processedVerses = audioResults.map(({ v, aPath, duration }) => {
      const durFrames = Math.ceil((duration || 4) * FPS) + 1;
      const res = {
        ...v,
        audio: aPath ? `file://${aPath}` : v.audio,
        durationInFrames: durFrames,
        startFrame: cumulativeFrames
      };
      cumulativeFrames += durFrames;
      return res;
    });

    const totalFrames = Math.max(Math.ceil(mergedDuration * FPS), cumulativeFrames || 300);

    // 5. Bundle & Render Remotion
    console.log("📦 Bundling Remotion Root...");
    const entry = path.resolve("src/remotion/Root.tsx");
    const bundleLocation = await bundle({ entryPoint: entry, sourceMaps: false });

    const comps = await getCompositions(bundleLocation, {
      inputProps: {
        ...config,
        verses: processedVerses,
        backgroundUrl: "",
        totalFrames
      }
    });

    const composition = comps.find(c => c.id === "QuranVideo") || comps[0];
    composition.width = 720;
    composition.height = 1280;
    composition.fps = FPS;
    composition.durationInFrames = totalFrames;

    const overlayVideoPath = path.join(tempWorkDir, "overlay.mp4");

    console.log(`🖥️ Rendering frames (total: ${totalFrames})...`);
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation: overlayVideoPath,
      inputProps: {
        ...config,
        verses: processedVerses,
        backgroundUrl: "",
        totalFrames
      },
      codec: "h264",
      concurrency: 1,
      chromiumOptions: {
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
      }
    });

    // 6. FFmpeg Final Composition
    if (fs.existsSync(bgPath) && fs.existsSync(mergedAudioPath)) {
      const bgInputArg = isVideoBg
        ? `-stream_loop -1 -i "${bgPath}"`
        : `-loop 1 -i "${bgPath}"`;

      const filterParts = [
        `[0:v]scale=720:1280:force_original_aspect_ratio=increase:force_divisible_by=2,crop=720:1280,setsar=1[bg]`,
        `[1:v]scale=720:1280[txt]`,
        `[bg][txt]blend=all_mode=screen:all_opacity=1,format=yuv420p[out]`
      ];
      const filterComplex = filterParts.join(";");

      const ffmpegCmd = `ffmpeg ${bgInputArg} -i "${overlayVideoPath}" -i "${mergedAudioPath}" -filter_complex "${filterComplex}" -map "[out]" -map 2:a -c:v libx264 -preset medium -crf 20 -shortest -movflags +faststart "${finalOutputPath}" -y`;
      await execAsync(ffmpegCmd, { maxBuffer: 50 * 1024 * 1024 });
    } else if (fs.existsSync(mergedAudioPath)) {
      await execAsync(`ffmpeg -i "${overlayVideoPath}" -i "${mergedAudioPath}" -c:v copy -c:a aac -shortest "${finalOutputPath}" -y`);
    } else {
      fs.copyFileSync(overlayVideoPath, finalOutputPath);
    }

    console.log(`✅ Render completed successfully: ${finalOutputPath}`);
  } finally {
    try { fs.rmSync(tempWorkDir, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch(err => {
  console.error("Render CLI Error:", err);
  process.exit(1);
});
