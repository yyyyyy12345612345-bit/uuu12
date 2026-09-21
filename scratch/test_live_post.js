async function test() {
  const res = await fetch('https://yaqeenalquran.online/api/telegram-webhook/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ test: 1 })
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", data);
}

test();
