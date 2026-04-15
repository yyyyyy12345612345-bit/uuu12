import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
  const rendersDir = path.resolve("public", "renders");
  if (!fs.existsSync(rendersDir)) fs.mkdirSync(rendersDir, { recursive: true });

  const jobId = Date.now();
  const configPath = path.resolve(rendersDir, `config-${jobId}.json`);

  try {
    const body = await req.json();
    const outputName = `video-${jobId}.mp4`;

    // Validate required fields
    if (!body.verses || body.verses.length === 0) {
      return NextResponse.json(
        { success: false, error: "لم يتم تحديد آيات للرندر" },
        { status: 400 }
      );
    }

    // Write config for the render script
    const renderConfig = {
      ...body,
      outputName,
    };
    fs.writeFileSync(configPath, JSON.stringify(renderConfig));

    const scriptPath = path.resolve("render.mjs");
    console.log(`>> API: Starting Render Job #${jobId}...`);
    const command = `node "${scriptPath}" "${configPath}"`;

    // Use spawn-like exec with proper timeout & buffer
    await new Promise<void>((resolve, reject) => {
      const child = exec(command, {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for logs
        timeout: 10 * 60 * 1000,     // 10 minutes max
        cwd: path.resolve("."),
      });

      let stderr = "";

      child.stdout?.on("data", (data) => {
        process.stdout.write(data);
      });

      child.stderr?.on("data", (data) => {
        stderr += data;
        process.stderr.write(data);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Render process exited with code ${code}.\n${stderr.slice(-2000)}`));
        }
      });

      child.on("error", (err) => {
        reject(new Error(`Failed to start render: ${err.message}`));
      });
    });

    // Verify output file exists
    const outputPath = path.resolve(rendersDir, outputName);
    if (!fs.existsSync(outputPath)) {
      throw new Error("الفيديو لم يتم إنشاؤه بنجاح");
    }

    console.log(`>> API: Job #${jobId} Complete ✓`);
    return NextResponse.json({
      success: true,
      url: `/renders/${outputName}`,
    });
  } catch (error: any) {
    console.error("CRITICAL API ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "فشل النظام في إنشاء الفيديو",
      },
      { status: 500 }
    );
  } finally {
    // Cleanup config file only (render.mjs cleans its own temp files)
    setTimeout(() => {
      try {
        if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
      } catch (e) {}
    }, 5000);
  }
}
