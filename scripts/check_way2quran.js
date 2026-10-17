async function checkWay2Quran() {
  const res = await fetch('https://www.way2quran.com/reciters/mohamed-obada', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const matches = html.match(/https?:\/\/[^\s"'<>]+\.mp3/gi) || [];
  console.log("Matches:", matches.slice(0, 5));
}
checkWay2Quran().catch(console.error);
