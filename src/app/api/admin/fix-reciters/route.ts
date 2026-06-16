import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "reciters.ts");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `File not found at ${filePath}` }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, "utf8");

    // Extract the array using match
    const arrayMatch = content.match(/export const RECITERS: Reciter\[\] = (\[[\s\S]*?\]);/);
    if (!arrayMatch) {
      return NextResponse.json({ error: "Could not find RECITERS array in file" }, { status: 400 });
    }

    const arrayStr = arrayMatch[1];
    // Safely evaluate or parse the array using JSON.parse instead of unsafe-eval/new Function
    let reciters: any[];
    try {
      reciters = JSON.parse(arrayStr);
    } catch (e) {
      try {
        const cleanedStr = arrayStr
          .replace(/\/\/.*$/gm, "") // remove comments
          .replace(/,(\s*[\]}])/g, "$1"); // remove trailing commas
        reciters = JSON.parse(cleanedStr);
      } catch (err: any) {
        return NextResponse.json({ error: `Failed to parse array: ${err.message}` }, { status: 400 });
      }
    }

    console.log(`[FIX RECITERS] Loaded ${reciters.length} reciters.`);

    // 1. We will rebuild the list of reciters, fixing mismatches and adding Murattal/Mujawwad versions
    const updatedReciters: any[] = [];
    const seenIds = new Set<string>();

    // We will define standard templates for the main reciters to ensure they are 100% correct
    const mainReciters = [
      {
        id: "basit_murattal",
        name: "عبدالباسط عبدالصمد (مرتل)",
        folder: "basit",
        mp3quranServer: "server7.mp3quran.net/basit",
        everyAyahFolder: "Abdul_Basit_Murattal_192kbps"
      },
      {
        id: "basit_mujawwad",
        name: "عبدالباسط عبدالصمد (مجود)",
        folder: "basit_mjwd",
        mp3quranServer: "server13.mp3quran.net/basit_mjwd",
        everyAyahFolder: "Abdul_Basit_Mujawwad_128kbps"
      },
      {
        id: "minsh_murattal",
        name: "محمد صديق المنشاوي (مرتل)",
        folder: "minsh",
        mp3quranServer: "server10.mp3quran.net/minsh",
        everyAyahFolder: "Minshawy_Murattal_128kbps"
      },
      {
        id: "minsh_mujawwad",
        name: "محمد صديق المنشاوي (مجود)",
        folder: "minsh_mjwd",
        mp3quranServer: "server11.mp3quran.net/minsh_mjwd",
        everyAyahFolder: "Minshawy_Mujawwad_192kbps"
      },
      {
        id: "husr_murattal",
        name: "محمود خليل الحصري (مرتل)",
        folder: "husr",
        mp3quranServer: "server13.mp3quran.net/husr",
        everyAyahFolder: "Husary_128kbps"
      },
      {
        id: "husr_mujawwad",
        name: "محمود خليل الحصري (مجود)",
        folder: "husr_mjwd",
        mp3quranServer: "server9.mp3quran.net/husr_mjwd",
        everyAyahFolder: "Husary_Mujawwad_64kbps"
      },
      {
        id: "hani_rifai",
        name: "هاني الرفاعي",
        folder: "hani",
        mp3quranServer: "server8.mp3quran.net/hani",
        everyAyahFolder: "Hani_Rifai_192kbps"
      },
      {
        id: "juhani",
        name: "عبدالله عواد الجهني",
        folder: "jhn",
        mp3quranServer: "server13.mp3quran.net/jhn",
        everyAyahFolder: "Abdullaah_3awwaad_Al-Juhaynee_128kbps"
      }
    ];

    // Add main reciters first so they have priority and clean IDs
    for (const r of mainReciters) {
      updatedReciters.push(r);
      seenIds.add(r.id);
    }

    // Now process all other reciters in the list
    for (let r of reciters) {
      // Skip the old basit, minsh, husr, juhani, hani entries to avoid duplicates of the main ones we just added
      const oldSkipIds = ["basit", "minsh", "husr", "juhani", "hani_rifai", "basit_murattal", "basit_mujawwad", "minsh_murattal", "minsh_mujawwad", "husr_murattal", "husr_mujawwad"];
      if (oldSkipIds.includes(r.id)) continue;
      
      // Skip if the name matches the main ones we manually added
      const mainNames = [
        "عبدالباسط عبدالصمد", "محمد صديق المنشاوي", "محمود خليل الحصري", 
        "هاني الرفاعي", "عبدالله عواد الجهني"
      ];
      if (mainNames.some(name => r.name.includes(name))) continue;

      let id = r.id;
      let name = r.name;
      let folder = r.folder;
      let mp3quranServer = r.mp3quranServer;
      let everyAyahFolder = r.everyAyahFolder;

      // Fix known ID-Name mismatches from original list
      if (id === "mohammad_rifaat" && name === "حمد الدغريري") {
        id = "hamad_daghriri";
      } else if (id === "sayed_nakashibandi" && name === "صلاح الهاشم") {
        id = "salah_hashim";
      } else if (id === "abdurrahman_musaab" && name === "أحمد نعينع") {
        id = "ahmed_naina";
      } else if (id === "ahmed_kasab" && name === "عبدالعزيز الأحمد") {
        id = "abdulaziz_alahmed";
      } else if (id === "kamel_yousef_albahtimi" && name === "يوسف الشويعي") {
        id = "yousef_shohaee";
      } else if (id === "taha_alfashny" && name === "أحمد الحواشي") {
        id = "ahmed_hawashi";
      } else if (id === "abu_alaneen_shaishaa" && name === "أحمد الطرابلسي") {
        id = "ahmed_trabulsi";
      } else if (id === "adel_kalbani" && name === "عبدالولي الأركاني") {
        id = "abdulwali_arkani";
      } else if (id === "abdullah_almatrouk" && name === "عبدالله الكندري") {
        id = "abdullah_kandari";
      } else if (id === "mohammed_ismail" && name === "خالد الغامدي") {
        id = "khalid_ghamdi";
      } else if (id === "saleh_alorman" && name === "سلمان العتيبي") {
        id = "salman_alotaibi";
      } else if (id === "fadhel_alqahtani" && name === "مصطفى اللاهوني") {
        id = "mustafa_lahoni";
      } else if (id === "mohammed_alzaidi" && name === "داود حمزة") {
        id = "dawood_hamza";
      } else if (id === "fahd_alqadi" && name === "الزين محمد أحمد") {
        id = "alzain_mohammad";
      } else if (id === "mohammed_alsharif" && name === "عبدالمحسن الحارثي") {
        id = "abdulmohsen_harthi";
      } else if (id === "ahmed_alhameidi" && name === "وليد الدليمي") {
        id = "waleed_dulyami";
      } else if (id === "ahmad_alsaeed" && name === "عبدالرحمن الماجد") {
        id = "abdurrahman_majed";
      } else if (id === "majid_alqadi" && name === "محمد خليل القارئ") {
        id = "mohammad_khalil_qari";
      } else if (id === "mohammad_albanna" && name === "خالد المهنا") {
        id = "khalid_mohna";
      } else if (id === "akram_alraisi" && name === "أكرم الرايسي") {
        id = "akram_raisi";
      } else if (id === "omar_alnasser" && name === "العشري عمران") {
        id = "alashri_omran";
      } else if (id === "mohammed_alqarny" && name === "صالح الهبدان") {
        id = "saleh_habdan";
      } else if (id === "mohamed_alsaeed" && name === "محمد السعيد") {
        id = "mohammed_alsaeed";
      }

      // If ID is a duplicate, rename it based on folder name to ensure uniqueness
      if (seenIds.has(id) || id === "Rewayat-Hafs-A-n-Assem" || !id) {
        // Clean folder name to make a nice ID
        const cleanFolder = folder.replace(/[^a-zA-Z0-9_]/g, "");
        let newId = cleanFolder || "reciter";
        
        // Resolve collissions
        let counter = 1;
        let finalId = newId;
        while (seenIds.has(finalId)) {
          finalId = `${newId}_${counter}`;
          counter++;
        }
        id = finalId;
      }

      // Auto-populate everyAyahFolder for supported sheikhs on everyayah.com if not already set
      if (!everyAyahFolder) {
        const lowerName = name.toLowerCase();
        const lowerId = id.toLowerCase();
        
        if (lowerId === "maher" || lowerName.includes("المعيقلي")) {
          everyAyahFolder = "Maher_AlMuaiqly_64kbps";
        } else if (lowerId === "sds" || lowerName.includes("السديس")) {
          everyAyahFolder = "Abdurrahmaan_As-Sudais_192kbps";
        } else if (lowerId === "shur" || lowerName.includes("الشريم")) {
          everyAyahFolder = "Saood_ash-Shuraym_128kbps";
        } else if (lowerId === "afasy" || lowerName.includes("العفاسي")) {
          everyAyahFolder = "Alafasy_128kbps";
        } else if (lowerId === "qtm" || lowerName.includes("القطامي")) {
          everyAyahFolder = "Nasser_Alqatami_128kbps";
        } else if (lowerId === "s_gmd" || lowerName.includes("سعد الغامدي")) {
          everyAyahFolder = "Ghamadi_40kbps";
        } else if (lowerId === "yasser" || lowerName.includes("ياسر الدوسري")) {
          everyAyahFolder = "Yasser_Ad-Dussary_128kbps";
        } else if (lowerId === "shatree" || lowerName.includes("الشاطري")) {
          everyAyahFolder = "Abu_Bakr_Ash-Shaatree_128kbps";
        } else if (lowerId === "ayyub" || lowerName.includes("محمد أيوب")) {
          everyAyahFolder = "Muhammad_Ayyoub_128kbps";
        } else if (lowerId === "jbrl" || lowerName.includes("محمد جبريل")) {
          everyAyahFolder = "Muhammad_Jibreel_128kbps";
        } else if (lowerId === "basfar" || lowerName.includes("بصفر")) {
          everyAyahFolder = "Abdullah_Basfar_64kbps";
        } else if (lowerId === "frs_a" || lowerId === "fares" || lowerName.includes("فارس عباد")) {
          everyAyahFolder = "Fares_Abbad_64kbps";
        } else if (lowerId === "hthfi" || lowerName.includes("الحذيفي")) {
          everyAyahFolder = "Hudhaify_128kbps";
        } else if (lowerId === "ali_jbr" || lowerId === "a_jbr" || lowerName.includes("علي جابر")) {
          everyAyahFolder = "Ali_Jaber_64kbps";
        } else if (lowerId === "bna" || lowerId === "albana" || lowerName.includes("البنا")) {
          everyAyahFolder = "mahmoud_ali_al_banna_32kbps";
        } else if (lowerId === "mustafa" || lowerId === "mustafa_ismail" || lowerName.includes("مصطفى إسماعيل")) {
          everyAyahFolder = "Mustafa_Ismail_48kbps";
        } else if (lowerId === "nabil" || lowerId === "nabil_rafat" || lowerName.includes("نبيل الرفاعي")) {
          everyAyahFolder = "Nabil_Rifa3i_48kbps";
        } else if (lowerId === "s_bud" || lowerId === "salah_albudair" || lowerName.includes("البدير")) {
          everyAyahFolder = "Salah_Al_Budair_128kbps";
        } else if (lowerId === "ahmad_nu" || lowerId === "ahmed_naina" || lowerName.includes("نعينع")) {
          everyAyahFolder = "Ahmed_Neana_128kbps";
        } else if (lowerId === "qht" || lowerId === "khalid_alqahtani" || lowerName.includes("القحطاني")) {
          everyAyahFolder = "Khaalid_Abdullaah_al-Qahtaanee_192kbps";
        } else if (lowerId === "tnjy" || lowerName.includes("خليفة الطنيجي") || lowerName.includes("خليفه الطنيجي")) {
          everyAyahFolder = "khalefa_al_tunaiji_64kbps";
        } else if (lowerId === "ayman_sowaid" || lowerName.includes("أيمن سويد")) {
          everyAyahFolder = "Ayman_Sowaid_64kbps";
        } else if (lowerId === "karim_mansoori" || lowerName.includes("كريم منصوري")) {
          everyAyahFolder = "Karim_Mansoori_40kbps";
        } else if (lowerId === "parhizgar" || lowerName.includes("برهيزكار")) {
          everyAyahFolder = "Parhizgar_48kbps";
        } else if (lowerId === "aziz_alili" || lowerName.includes("عزيز عليلي")) {
          everyAyahFolder = "aziz_alili_128kbps";
        } else if (lowerId === "ajm" || lowerName.includes("العجمي")) {
          everyAyahFolder = "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net";
        } else if (lowerId === "akdr" || lowerName.includes("الأخضر") || lowerName.includes("الاخضر")) {
          everyAyahFolder = "Ibrahim_Akhdar_64kbps";
        } else if (lowerId === "tblawi" || lowerName.includes("الطبلاوي")) {
          everyAyahFolder = "Mohammad_al_Tablaway_128kbps";
        } else if (lowerId === "m_krm" || lowerName.includes("عبدالكريم")) {
          everyAyahFolder = "Muhammad_AbdulKareem_128kbps";
        } else if (lowerId === "shl" || lowerName.includes("سهل ياسين")) {
          everyAyahFolder = "Sahl_Yassin_128kbps";
        } else if (lowerId === "bu_khtr" || lowerName.includes("بو خاطر") || lowerName.includes("بوخاطر")) {
          everyAyahFolder = "Salaah_AbdulRahman_Bukhatir_128kbps";
        } else if (lowerId === "mtrod" || lowerName.includes("المطرود")) {
          everyAyahFolder = "Abdullah_Matroud_128kbps";
        } else if (lowerId === "hajjaj" || lowerName.includes("السويسي")) {
          everyAyahFolder = "Ali_Hajjaj_AlSuesy_128kbps";
        } else if (lowerId === "salamah" || lowerId === "yaser_salamah" || lowerName.includes("ياسر سلامة") || lowerName.includes("ياسر سلامه")) {
          everyAyahFolder = "Yaser_Salamah_128kbps";
        } else if (lowerId === "akrm" || lowerName.includes("العلاقمي")) {
          everyAyahFolder = "Akram_AlAlaqimy_128kbps";
        }
      }

      seenIds.add(id);
      updatedReciters.push({
        id,
        name,
        folder,
        mp3quranServer,
        ...(everyAyahFolder ? { everyAyahFolder } : {})
      });
    }

    // Add new reciters if they don't already exist in the list
    const extraReciters = [
      {
        id: "ayman_sowaid",
        name: "أيمن سويد",
        folder: "ayman_sowaid",
        mp3quranServer: "server8.mp3quran.net/sowaid",
        everyAyahFolder: "Ayman_Sowaid_64kbps"
      },
      {
        id: "karim_mansoori",
        name: "كريم منصوري",
        folder: "mansoori",
        mp3quranServer: "server8.mp3quran.net/mansoori",
        everyAyahFolder: "Karim_Mansoori_40kbps"
      },
      {
        id: "parhizgar",
        name: "شهريار برهيزكار",
        folder: "parhizgar",
        mp3quranServer: "server8.mp3quran.net/parhizgar",
        everyAyahFolder: "Parhizgar_48kbps"
      },
      {
        id: "aziz_alili",
        name: "عزيز عليلي",
        folder: "alili",
        mp3quranServer: "server8.mp3quran.net/alili",
        everyAyahFolder: "aziz_alili_128kbps"
      }
    ];

    for (const er of extraReciters) {
      if (!seenIds.has(er.id)) {
        updatedReciters.push(er);
        seenIds.add(er.id);
      }
    }

    // Construct the file content
    const newContent = `export interface Reciter {
  id: string;
  name: string;
  folder: string;
  mp3quranServer: string;
  everyAyahFolder?: string; // Standard EveryAyah folder name
}

export const RECITERS: Reciter[] = ${JSON.stringify(updatedReciters, null, 2)};
`;

    // Write file back
    let readOnly = false;
    try {
      fs.writeFileSync(filePath, newContent, "utf8");
      console.log(`[FIX RECITERS] Successfully wrote ${updatedReciters.length} reciters to ${filePath}.`);
    } catch (writeError: any) {
      console.warn("[FIX RECITERS] Read-only filesystem detected, skipping write:", writeError.message);
      readOnly = true;
    }

    return NextResponse.json({
      success: true,
      readOnly,
      originalCount: reciters.length,
      fixedCount: updatedReciters.length,
      message: readOnly 
        ? "بيئة التشغيل للقراءة فقط (مثل Vercel). تم معالجة البيانات بنجاح في الذاكرة ولكن لم يتم كتابتها على القرص. يرجى تشغيل هذه الأداة محلياً (Localhost) وتحديث الملف ثم رفعه إلى GitHub."
        : "Successfully fixed duplicate IDs, mismatched names, and added Minshawi/Abdul Basit/Husary Murattal and Mujawwad versions!"
    });

  } catch (error: any) {
    console.error("[FIX RECITERS] Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
