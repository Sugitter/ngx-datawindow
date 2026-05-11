const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Step 1: Add DragDropModule import
const importIdx = lines.findIndex(l => l.includes("@angular/cdk/scrolling"));
console.log('ScrollingModule import at line', importIdx + 1);
lines.splice(importIdx + 1, 0, "import { DragDropModule } from '@angular/cdk/drag-drop';");
console.log('Added DragDropModule import');

// Step 2: Add to imports array
const importsArrayIdx = lines.findIndex(l => l.includes('ScrollingModule') && l.includes('MatTooltipModule'));
console.log('Imports array ScrollingModule at line', importsArrayIdx + 1);
lines.splice(importsArrayIdx + 1, 0, '    DragDropModule,');
console.log('Added to imports array');

// Step 3: Add cdkDrag to data column <th> (line 354, 0-indexed: 353)
const thIdx = lines.findIndex((l, i) => l.includes('mat-header-cell *matHeaderCellDef') && i > 340);
console.log('Data column <th> at line', thIdx + 1);
lines[thIdx] = lines[thIdx].replace(
  '<th mat-header-cell *matHeaderCellDef>',
  '<th mat-header-cell *matHeaderCellDef cdkDrag cdkDragStarted="onColumnDragStarted($event, col.field)" cdkDropListDropped="onColumnDropped($event)">'
);
console.log('Modified to:', lines[thIdx].trim());

// Step 4: Add cdkDragHandle to resize handle
const rhIdx = lines.findIndex(l => l.includes('class="dt-resize-handle"'));
console.log('Resize handle at line', rhIdx + 1);
lines[rhIdx] = lines[rhIdx].replace('class="dt-resize-handle"', 'class="dt-resize-handle" cdkDragHandle');
console.log('Modified to:', lines[rhIdx].trim());

fs.writeFileSync(path, lines.join('\n'));
console.log('\nDone! Total lines:', lines.length);

// Verify
const c2 = fs.readFileSync(path, 'utf8');
const l2 = c2.split('\n');
console.log('Verification - cdkDrag:', l2.some(l => l.includes('cdkDrag')));
console.log('Verification - cdkDragHandle:', l2.some(l => l.includes('cdkDragHandle')));
console.log('Verification - onColumnDragStarted:', l2.some(l => l.includes('onColumnDragStarted')));
console.log('Verification - DragDropModule in imports:', l2.some(l => l.includes('DragDropModule,')));
console.log('Verification - DragDropModule import:', l2.some(l => l.includes("@angular/cdk/drag-drop")));