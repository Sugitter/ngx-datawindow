const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Debug: find @for with visibleColumns
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('@for') && lines[i].includes('visibleColumns')) {
    console.log('@for visibleColumns at line', i + 1, ':', lines[i].trim());
  }
  if (lines[i].includes('@for') && lines[i].includes('columns')) {
    console.log('@for columns at line', i + 1, ':', lines[i].trim());
  }
}

// Debug: find data columns header th
console.log('\nSearching for mat-header-cell *matHeaderCellDef:');
let found = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('mat-header-cell *matHeaderCellDef') && !lines[i].includes('</th>')) {
    console.log('Line', i + 1, ':', lines[i].trim());
    found++;
    if (found > 5) break;
  }
}