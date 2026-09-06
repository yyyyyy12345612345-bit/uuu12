import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

export const maxDuration = 300;

/**
 * Wide Video Render Route — 1920x1080 (16:9 Landscape) for YouTube
 * Mirrors /api/render but passes width/height override to the render script
 */
export async function POST(req: Request) {
  const tempBaseDir = os.tmpdir();
  const jobId = Date.now();
  const configPath = path.join(tempBaseDir, `config-wide-${jobId}.json`);
  const outputName = `wide-video-${jobId}.mp4`;
  const outputPath = path.join(tempBaseDir, outputName);

  try {
    const body = await req.json();

    // Force landscape dimensions for YouTube
    const renderConfig = {
      ...body,
      outputName,
      width: 1920,
      height: 1080,
      orientation: "landscape",
    };

    fs.writeFileSync(configPath, JSON.stringify(renderConfig));

    const scriptPath = path.join(process.cwd(), "render.mjs");
    const command = `node "${scriptPath}" "${configPath}" "${tempBaseDir}"`;

    let logs = "";
    await new Promise<void>((resolve, reject) => {
      const child = exec(command, {
        maxBuffer: 100 * 1024 * 1024, // 100MB for large landscape video
        timeout: 280 * 1000,
        cwd: process.cwd(),
      });

      child.stdout?.on("data", (data) => {
        logs += data.toString() + "\n";
      });
      child.stderr?.on("data", (data) => {
        logs += `[ERROR] ` + data.toString() + "\n";
      });

      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Wide render process failed with code ${code}. Logs:\n${logs}`));
      });

      child.on("error", (err) =>
        reject(new Error(`Failed to start wide render: ${err.message}\nLogs:\n${logs}`))
      );
    });

    if (!fs.existsSync(outputPath)) throw new Error("Wide video file not found after render");

    const fileBuffer = fs.readFileSync(outputPath);

    try {
      fs.unlinkSync(configPath);
      fs.unlinkSync(outputPath);
    } catch (e) {}

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${outputName}"`,
        "X-Video-Orientation": "landscape",
        "X-Video-Width": "1920",
        "X-Video-Height": "1080",
      },
    });

  } catch (error: any) {
    console.error("Wide Render Error:", error);
    try {
      if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (e) {}
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
