async function test() {
  try {
    const url = 'https://yaqeenalquran.online/api/background/BAACAgQAAyEFAAMBBBDDBAAD_2rI9_vbhBSp0OVpodGUjA3-RIt3AAIRHgACqfgAAVJl67G8_663PT0E.mp4?direct=true';
    console.log('Fetching:', url);
    const res = await fetch(url, { redirect: 'manual' });
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Body:', text.substring(0, 500));

    if (res.headers.get('location')) {
      const loc = res.headers.get('location');
      console.log('\nFollowing redirect to:', loc);
      const res2 = await fetch(loc, { redirect: 'manual' });
      console.log('Redirect Status:', res2.status);
      console.log('Redirect Headers:', Object.fromEntries(res2.headers.entries()));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
