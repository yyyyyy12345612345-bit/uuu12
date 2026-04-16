import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export const maxDuration = 300; 

export async function POST(req: Request) {
  // Use Turbopack ignore to prevent tracing the whole public folder
  const rendersDir = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "renders");
  if (!fs.existsSync(rendersDir)) fs.mkdirSync(rendersDir, { recursive: true });

  const jobId = Date.now();
  const configPath = path.join(rendersDir, `config-${jobId}.json`);

  try {
    const body = await req.json();
    const outputName = `video-${jobId}.mp4`;

    const renderConfig = { ...body, outputName };
    fs.writeFileSync(configPath, JSON.stringify(renderConfig));

    // Also use ignore comment for the script path
    const scriptPath = path.join(/* turbopackIgnore: true */ process.cwd(), "render.mjs");
    const command = `node "${scriptPath}" "${configPath}"`;

    await new Promise<void>((resolve, reject) => {
      const child = exec(command, {
        maxBuffer: 50 * 1024 * 1024,
        timeout: 250 * 1000, 
        cwd: process.cwd(),
      });

      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Render process failed with code ${code}`));
      });

      child.on("error", (err) => reject(new Error(`Failed to start render: ${err.message}`)));
    });

    const outputPath = path.join(rendersDir, outputName);
    if (!fs.existsSync(outputPath)) throw new Error("Video file not found after render");

    return NextResponse.json({ success: true, url: `/renders/${outputName}` });
  } catch (error: any) {
    console.error("Render Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    try { if (fs.existsSync(configPath)) fs.unlinkSync(configPath); } catch (e) {}
  }
}
