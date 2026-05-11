const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Step 1: Add cdkDrag to the <th> element for column headers
// Find: '              <th mat-header-cell *matHeaderCellDef'
// Replace with: '              <th mat-header-cell *matHeaderCellDef cdkDrag'
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('mat-header-cell *matHeaderCellDef') && 
      l.includes('</th>') === false && 
      l.trim().startsWith('<th mat-header-cell *matHeaderCellDef')) {
    const old = lines[i];
    lines[i] = l.replace('<th mat-header-cell *matHeaderCellDef', '<th mat-header-cell *matHeaderCellDef cdkDrag');
    console.log('Step1 - Added cdkDrag to <th>:');
    console.log('  Before:', old.trim());
    console.log('  After: ', lines[i].trim());
    break;
  }
}

// Step 2: Add cdkDragHandle to the resize handle div
// Find: '<div class="dt-resize-handle"'
// Replace with: '<div class="dt-resize-handle" cdkDragHandle'
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('class="dt-resize-handle"')) {
    const old = lines[i];
    lines[i] = l.replace('class="dt-resize-handle"', 'class="dt-resize-handle" cdkDragHandle');
    console.log('Step2 - Added cdkDragHandle to resize handle:');
    console.log('  Before:', old.trim());
    console.log('  After: ', lines[i].trim());
    break;
  }
}

fs.writeFileSync(path, lines.join('\n'));
console.log('\nDone! New line count:', lines.length);
