const https = require('https');
const http = require('http');

const recitersToCheck = [
  { id: "mohamed_obada", name: "محمد عبادة", url: "https://archive.org/download/alnser_gmail_20240223_1736/001.mp3" },
  { id: "hassan_saleh", name: "حسن صالح", url: "https://cdn.mp3quran.net/audio/hassan-saleh/r1/001.mp3" },
  { id: "ghaith_semreen", name: "غيث سمرين", url: "https://archive.org/download/ghaith_semreen_quran/001.mp3" },
  { id: "hussein_azzami", name: "حسين العزام", url: "https://archive.org/download/hussein_azzami_quran/001.mp3" },
  { id: "alaa_aql", name: "علاء عقل", url: "https://archive.org/download/alaa_aql_quran/001.mp3" },
  { id: "ahmed_abdelhay", name: "أحمد عبد الحي", url: "https://archive.org/download/ahmed_abdelhay_quran/001.mp3" },
  { id: "youssef_hanbali", name: "يوسف الحنبلي", url: "https://archive.org/download/youssef_hanbali_quran/001.mp3" },
  { id: "osama_waaedh", name: "أسامة الواعظ", url: "https://archive.org/download/osama_waaedh_quran/001.mp3" },
  { id: "hassan_fahmi", name: "حسن فهمي العدني", url: "https://archive.org/download/hassan_fahmi_aladani/001.mp3" },
  { id: "tariq_mohammed", name: "طارق محمد", url: "https://archive.org/download/tariq_mohammed_quran/001.mp3" }
];

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return { ok: res.ok, status: res.status, finalUrl: res.url };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function run() {
  console.log("جاري فحص روابط صوتيات القراء...");
  for (const r of recitersToCheck) {
    const res = await checkUrl(r.url);
    console.log(`[${r.name}] (${r.id}): ${res.ok ? '✅ شغال' : '❌ عطلان'} - Code: ${res.status || res.error}`);
  }
}

run();
