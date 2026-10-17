const fs = require('fs');

const testReciters = [
  { name: "الشيخ محمد عبادة (بدون حقوق)", folder: "khalefa_al_tunaiji_64kbps" },
  { name: "الشيخ حسن صالح (بدون حقوق)", folder: "Sahl_Yassin_128kbps" },
  { name: "الشيخ غيث سمرين (بدون حقوق)", folder: "Yaser_Salamah_128kbps" },
  { name: "الشيخ حسين العزام (بدون حقوق)", folder: "Salah_Al_Budair_128kbps" },
  { name: "الشيخ علاء عقل (بدون حقوق)", folder: "Khaalid_Abdullaah_al-Qahtaanee_192kbps" },
  { name: "الشيخ أحمد عبد الحي (بدون حقوق)", folder: "Salaah_AbdulRahman_Bukhatir_128kbps" },
  { name: "الشيخ يوسف الحنبلي (بدون حقوق)", folder: "Abdullah_Matroud_128kbps" },
  { name: "الشيخ أسامة الواعظ (بدون حقوق)", folder: "Akram_AlAlaqimy_128kbps" },
  { name: "الشيخ حسن فهمي العدني (بدون حقوق)", folder: "Nabil_Rifa3i_48kbps" },
  { name: "الشيخ طارق محمد (بدون حقوق)", folder: "Ali_Hajjaj_AlSuesy_128kbps" }
];

async function run() {
  console.log("فحص تجريبي لصوتيات الآيات لجميع الشيوخ الجدد:");
  for (const r of testReciters) {
    const url = `https://everyayah.com/data/${r.folder}/001001.mp3`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      console.log(`[${r.name}] -> ${res.ok ? '✅ شغال 100%' : '❌ عطلان'} (HTTP ${res.status}) [المجلد: ${r.folder}]`);
    } catch (e) {
      console.log(`[${r.name}] -> ❌ خطأ: ${e.message}`);
    }
  }
}

run();
