fetch('https://youssefosama--40af2a40698011f1b2fe1607ee4eb77e.web.val.run/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'مرحبا، كيف حالك؟' }],
    systemContext: 'أنت مساعد إسلامي مفيد اسمك يقين'
  })
})
.then(r => r.json())
.then(d => console.log(JSON.stringify(d, null, 2)))
.catch(e => console.error('Error:', e.message));
