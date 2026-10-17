async function test() {
  const r = await fetch('https://mp3quran.net/api/v3/reciters?reciter=286');
  const d = await r.json();
  console.log(JSON.stringify(d, null, 2));
}
test();
