const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Add cdkDragStarted and cdkDropListDropped event handlers to data column <th> elements
// The line looks like: '<th mat-header-cell *matHeaderCellDef cdkDrag>'
// We want to change it to: '<th mat-header-cell *matHeaderCellDef cdkDrag cdkDragStarted="onColumnDragStarted($event, col.field)" cdkDropListDropped="onColumnDropped($event)"'

let count = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // Match data column th (inside @for loop, has 'track col.field', NOT the selection column)
  if (l.includes('mat-header-cell *matHeaderCellDef cdkDrag') && 
      !l.includes('</th>') &&
      l.trim().startsWith('<th mat-header-cell *matHeaderCellDef cdkDrag')) {
    const old = l;
    lines[i] = l.replace(
      'cdkDrag>',
      'cdkDrag cdkDragStarted="onColumnDragStarted($event, col.field)" cdkDropListDropped="onColumnDropped($event)">'
    );
    console.log('Modified line', i + 1, '- added event handlers');
    console.log('  Before:', old.trim());
    console.log('  After: ', lines[i].trim());
    count++;
    break; // Only modify the data column th, not the selection column
  }
}

fs.writeFileSync(path, lines.join('\n'));
console.log('\nModified', count, 'lines. Total:', lines.length);
