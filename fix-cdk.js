const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('=== Adding DragDropModule import ===');
const importIdx = lines.findIndex(l => l.includes("@angular/cdk/scrolling"));
console.log('ScrollingModule import at line', importIdx + 1);
lines.splice(importIdx + 1, 0, "import { DragDropModule } from '@angular/cdk/drag-drop';");
console.log('Added DragDropModule import');

console.log('\n=== Adding DragDropModule to imports array ===');
// After the import insertion, the imports array line shifts by 1
const importsArrayIdx = lines.findIndex(l => l.includes('ScrollingModule') && l.includes('MatTooltipModule'));
console.log('Imports array ScrollingModule at line', importsArrayIdx + 1);
lines.splice(importsArrayIdx + 1, 0, '    DragDropModule,');
console.log('Added to imports array');

console.log('\n=== Adding cdkDrag to <th> closing line ===');
// Find the [disabled]="col.sortable === false"> line after @for (col of visibleColumns())
let closingIdx = -1;
let foundFor = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('@for (col of visibleColumns')) {
    foundFor = true;
  }
  if (foundFor && lines[i].includes('[disabled]="col.sortable === false"') && lines[i].trim().endsWith('>')) {
    closingIdx = i;
    break;
  }
}
console.log('<th> closing tag at line', closingIdx + 1, ':', JSON.stringify(lines[closingIdx]));
if (closingIdx >= 0) {
  lines[closingIdx] = lines[closingIdx].replace(
    '[disabled]="col.sortable === false">',
    '[disabled]="col.sortable === false" cdkDrag cdkDragStarted="onColumnDragStarted($event, col.field)" cdkDropListDropped="onColumnDropped($event)">'
  );
  console.log('Modified to:', JSON.stringify(lines[closingIdx]));
}

console.log('\n=== Adding cdkDragHandle to resize handle ===');
// Find dt-resize-handle after the @for for visibleColumns (data column area)
let rhIdx = -1;
foundFor = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('@for (col of visibleColumns')) {
    foundFor = true;
  }
  if (foundFor && lines[i].includes('class="dt-resize-handle"')) {
    rhIdx = i;
    break;
  }
}
console.log('Resize handle at line', rhIdx + 1, ':', JSON.stringify(lines[rhIdx]));
if (rhIdx >= 0) {
  lines[rhIdx] = lines[rhIdx].replace('class="dt-resize-handle"', 'class="dt-resize-handle" cdkDragHandle');
  console.log('Modified to:', JSON.stringify(lines[rhIdx]));
}

fs.writeFileSync(path, lines.join('\n'));
console.log('\n=== Done! Total lines:', lines.length);

const c2 = fs.readFileSync(path, 'utf8');
console.log('onColumnDragStarted:', c2.includes('onColumnDragStarted'));
console.log('onColumnDropped:', c2.includes('onColumnDropped'));
console.log('cdkDragHandle:', c2.includes('cdkDragHandle'));
console.log('DragDropModule import:', c2.includes("@angular/cdk/drag-drop"));
console.log('DragDropModule in array:', c2.includes('DragDropModule,'));