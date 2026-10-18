import fs from 'fs';

// Let's test EveryAyah duration for Alafasy Surah 1 (7 verses)
const surahId = 1;
const folder = "Alafasy_128kbps";
const pad = (n) => n.toString().padStart(3, '0');

async function test() {
  console.log("Checking Alafasy Surah 1 verses:");
  let totalHeadLen = 0;
  for (let ayah = 1; ayah <= 7; ayah++) {
    const url = `https://everyayah.com/data/${folder}/${pad(surahId)}${pad(ayah)}.mp3`;
    const res = await fetch(url, { method: 'HEAD' });
    const len = Number(res.headers.get('content-length'));
    const estSec = len / (128 * 1000 / 8);
    totalHeadLen += estSec;
    console.log(`Ayah ${ayah}: len=${len} bytes, estSec=${estSec.toFixed(2)}s`);
  }
  console.log(`Total estimated by Content-Length: ${totalHeadLen.toFixed(2)}s`);
}

test();
