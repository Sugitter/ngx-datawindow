const fs = require('fs');
const c = fs.readFileSync('node_modules/@angular/cdk/drag-drop/index.d.ts', 'utf8');
const idx = c.indexOf('CdkDropList');
if (idx !== -1) console.log(c.slice(Math.max(0, idx - 5), idx + 200));
else console.log('Not found, checking CdkDragDrop...');
const idx2 = c.indexOf('CdkDragDrop');
if (idx2 !== -1) console.log(c.slice(Math.max(0, idx2 - 5), idx2 + 200));
// List all Cdk exports
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes('CdkDrop') || l.includes('CdkDrag') || l.includes('Dropped')) {
    console.log(i + 1, l.trim());
  }
});
