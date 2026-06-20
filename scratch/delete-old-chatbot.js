const fs = require('fs');
const path = require('path');

const base = path.resolve(process.argv[2] || '.');
const src = path.join(base, 'src');

const files = [
  path.join(src, 'lib', 'ml-model.ts')
];

files.forEach(function(f) {
  try { fs.unlinkSync(f); console.log('DELETED:', f); }
  catch(e) { console.log('SKIP:', f, e.message); }
});

console.log('DONE deleting ML model');
