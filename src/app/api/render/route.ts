import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";

export const maxDuration = 300; 

export async function POST(req: Request) {
  // Use /tmp for all operations because Vercel/Lambda is read-only
  const tempBaseDir = os.tmpdir();
  const jobId = Date.now();
  const configPath = path.join(tempBaseDir, `config-${jobId}.json`);
  const outputName = `video-${jobId}.mp4`;
  const outputPath = path.join(tempBaseDir, outputName);

  try {
    const body = await req.json();
    const renderConfig = { ...body, outputName };
    fs.writeFileSync(configPath, JSON.stringify(renderConfig));

    const scriptPath = path.join(process.cwd(), "render.mjs");
    
    // We need to tell the script to use /tmp too
    // The render.mjs should use absolute paths from config
    const command = `node "${scriptPath}" "${configPath}" "${tempBaseDir}"`;

    let logs = "";
    await new Promise<void>((resolve, reject) => {
      const child = exec(command, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 250 * 1000, 
        cwd: process.cwd(),
      });

      child.stdout?.on("data", (data) => {
        const text = data.toString();
        // console.log(`[Render Engine]: ${text}`);
        logs += text + "\n";
      });
      child.stderr?.on("data", (data) => {
        const text = data.toString();
        // console.error(`[Render Engine Error]: ${text}`);
        logs += `[ERROR] ` + text + "\n";
      });

      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Render process failed with code ${code}. Logs:\n${logs}`));
      });

      child.on("error", (err) => reject(new Error(`Failed to start render: ${err.message}\nLogs:\n${logs}`)));
    });

    if (!fs.existsSync(outputPath)) throw new Error("Video file not found after render");

    const fileBuffer = fs.readFileSync(outputPath);
    
    // Clean up
    try { fs.unlinkSync(configPath); fs.unlinkSync(outputPath); } catch (e) {}

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${outputName}"`,
      },
    });

  } catch (error: any) {
    console.error("Render Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
