async function test() {
  try {
    const url = 'https://yousef891238-render-server.hf.space/telegram-proxy/BAACAgQAAyEFAAMBBBDDBAACAQABasj3-2HC3GmliAUInscAAapa_NvSAAITHgACqfgAAVJVJth0VCYBVD0E';
    console.log('Fetching:', url);
    const res = await fetch(url);
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Body:', text.substring(0, 500));
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
