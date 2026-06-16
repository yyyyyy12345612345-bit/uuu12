import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, mp3quranServer, everyAyahFolder, customId } = body;

    if (!name || !mp3quranServer) {
      return NextResponse.json({ error: "يرجى ملء الاسم ورابط السيرفر" }, { status: 400 });
    }

    // Resolve Cwd and locate reciters.ts
    const filePath = path.join(process.cwd(), "src", "data", "reciters.ts");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "ملف القراء غير موجود في الكود" }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf8");
    const arrayMatch = content.match(/export const RECITERS: Reciter\[\] = (\[[\s\S]*?\]);/);
    if (!arrayMatch) {
      return NextResponse.json({ error: "فشل في قراءة مصفوفة القراء" }, { status: 400 });
    }

    let reciters: any[];
    try {
      reciters = new Function(`return ${arrayMatch[1]}`)();
    } catch (e: any) {
      return NextResponse.json({ error: `فشل معالجة البيانات: ${e.message}` }, { status: 400 });
    }

    // Extract folder name from server URL (e.g. server7.mp3quran.net/basit -> basit)
    let cleanedServer = mp3quranServer.replace("https://", "").replace("http://", "");
    let parts = cleanedServer.split("/");
    let folder = parts[parts.length - 1] || "reciter";
    if (folder === "Rewayat-Hafs-A-n-Assem" && parts.length > 2) {
      folder = parts[parts.length - 2];
    }
    folder = folder.split("?")[0].replace(/[^a-zA-Z0-9_]/g, "");

    // Generate unique ID
    let id = customId ? customId.trim().replace(/[^a-zA-Z0-9_]/g, "") : folder;
    if (!id) id = "reciter";
    
    const seenIds = new Set(reciters.map((r: any) => r.id));
    let finalId = id;
    let counter = 1;
    while (seenIds.has(finalId)) {
      finalId = `${id}_${counter}`;
      counter++;
    }

    const newReciter = {
      id: finalId,
      name: name.trim(),
      folder: folder,
      mp3quranServer: cleanedServer.trim().replace(/\/$/, ""),
      ...(everyAyahFolder ? { everyAyahFolder: everyAyahFolder.trim() } : {})
    };

    reciters.push(newReciter);

    const newContent = `export interface Reciter {
  id: string;
  name: string;
  folder: string;
  mp3quranServer: string;
  everyAyahFolder?: string; // Standard EveryAyah folder name
}

export const RECITERS: Reciter[] = ${JSON.stringify(reciters, null, 2)};
`;

    let readOnly = false;
    try {
      fs.writeFileSync(filePath, newContent, "utf8");
    } catch (writeError: any) {
      readOnly = true;
    }

    return NextResponse.json({
      success: true,
      readOnly,
      reciter: newReciter,
      message: readOnly 
        ? "بيئة قراءة فقط (Vercel). تم إضافة القارئ مؤقتاً في الذاكرة ولكن لم يتم الكتابة على القرص."
        : "تم إضافة القارئ بنجاح وتحديث الملف البرمجي!"
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
