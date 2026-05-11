const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Step 1: Fix the WRONG modification on line 336 (selection column)
// It currently has event handlers added - we need to REMOVE them
// The line looks like: '<th mat-header-cell *matHeaderCellDef cdkDrag cdkDragStarted="..." cdkDropListDropped="...">'
// Should be: '<th mat-header-cell *matHeaderCellDef cdkDrag>'
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('cdkDrag cdkDragStarted="onColumnDragStarted')) {
    const old = l;
    lines[i] = l.replace(/ cdkDragStarted="[^"]*" cdkDropListDropped="[^"]*"/g, '');
    console.log('Step1 - Removed wrong handlers from line', i + 1);
    console.log('  Before:', old.trim());
    console.log('  After: ', lines[i].trim());
  }
}

// Step 2: Add event handlers to the DATA column <th> (inside @for loop, line 356)
// The <th> opening tag spans multiple lines (356-362), ending with '>'
// Find the line: '<th mat-header-cell *matHeaderCellDef cdkDrag'
// and add event handlers before the line break
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // Find the data column th - it's inside @for, has cdkDrag but NOT cdkDragStarted
  if (l.includes('cdkDrag') && 
      !l.includes('cdkDragStarted') && 
      l.includes('mat-header-cell *matHeaderCellDef')) {
    const old = l;
    lines[i] = l.replace(
      'cdkDrag',
      'cdkDrag cdkDragStarted="onColumnDragStarted($event, col.field)"'
    );
    console.log('Step2 - Added cdkDragStarted to data column th at line', i + 1);
    console.log('  Before:', old.trim());
    console.log('  After: ', lines[i].trim());
  }
}

// Step 3: Add cdkDropListDropped to the same <th> - but the > is on a later line
// We need to add cdkDropListDropped to the line where the <th> tag closes with '>'
// The line: '                [disabled]="col.sortable === false">'
// Should become: '                [disabled]="col.sortable === false" cdkDropListDropped="onColumnDropped($event)">'
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (l.includes('[disabled]="col.sortable === false"') && l.trim().startsWith('[disabled]="col.sortable === false">') === false) {
    const old = l;
    lines[i] = l.replace(
      '[disabled]="col.sortable === false">',
      '[disabled]="col.sortable === false" cdkDropListDropped="onColumnDropped($event)">'
    );
    console.log('Step3 - Added cdkDropListDropped to closing line', i + 1);
    console.log('  Before:', old.trim());
    console.log('  After: ', lines[i].trim());
  }
}

fs.writeFileSync(path, lines.join('\n'));
console.log('\nDone! New line count:', lines.length);
