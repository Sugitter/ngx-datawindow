const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
let lines = content.split('\n');

console.log('Before: total lines =', lines.length);

// Step 1: Remove the wrongly placed DragDropModule at line 27 (0-indexed: 26)
if (lines[26].trim() === 'DragDropModule,') {
  const removed = lines.splice(26, 1);
  console.log('Removed wrongly placed line:', removed[0]);
} else {
  console.log('Line 27 is NOT DragDropModule - checking content around there:');
  for (let i = 24; i < 30; i++) {
    console.log('Line', i + 1, ':', lines[i]);
  }
}

// Step 2: Find the imports array in @Component - look for ScrollingModule line inside the array
// The line we want is like: "    MatTooltipModule, ScrollingModule, MatMenuModule, MatProgressSpinnerModule,"
const idx2 = lines.findIndex((l, i) => l.includes('ScrollingModule') && l.includes('MatTooltipModule'));
console.log('Found ScrollingModule in imports array at line', idx2 + 1, ':', lines[idx2].trim());

if (idx2 >= 0) {
  lines.splice(idx2 + 1, 0, '    DragDropModule,');
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Done! New line count:', lines.length);
} else {
  console.log('ScrollingModule in imports array not found!');
  fs.writeFileSync(path, lines.join('\n')); // save changes anyway
}
