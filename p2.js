const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
let content = fs.readFileSync(path, 'utf8');

console.log('=== Phase 2: Template modifications ===');
console.log('Current length:', content.split('\n').length);

// P2.1: Add cdkDrag attributes to the data column <th> closing line
// The line: '                [disabled]="col.sortable === false">'
// Target: '                [disabled]="col.sortable === false" cdkDrag cdkDragStarted="onColumnDragStarted($event, col.field)" cdkDropListDropped="onColumnDropped($event)">'
const oldThClose = '[disabled]="col.sortable === false">';
if (content.includes(oldThClose + '\n')) {
  // Count occurrences of this pattern followed by a newline (likely more specific)
  const matches = content.match(new RegExp(oldThClose.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n', 'g'));
  console.log('Found', matches?.length, 'occurrences of th close pattern');
}
const newThClose = '[disabled]="col.sortable === false" cdkDrag cdkDragStarted="onColumnDragStarted($event, col.field)" cdkDropListDropped="onColumnDropped($event)">';
if (content.includes(oldThClose)) {
  content = content.replace(oldThClose, newThClose);
  console.log('P2.1 done: Added cdkDrag to <th>');
} else {
  console.error('ERROR: th close pattern not found!');
}

// P2.2: Add cdkDragHandle to the resize handle
const oldRh = '<div class="dt-resize-handle"';
const newRh = '<div class="dt-resize-handle" cdkDragHandle';
if (content.includes(oldRh)) {
  content = content.replace(oldRh, newRh);
  console.log('P2.2 done: Added cdkDragHandle to resize handle');
} else {
  console.error('ERROR: resize handle not found!');
}

fs.writeFileSync(path, content);
console.log('\nPhase 2 done. Lines:', content.split('\n').length);

// Verify
const c2 = fs.readFileSync(path, 'utf8');
console.log('cdkDrag:', c2.includes('cdkDrag '));
console.log('cdkDragStarted:', c2.includes('cdkDragStarted'));
console.log('cdkDropListDropped:', c2.includes('cdkDropListDropped'));
console.log('cdkDragHandle:', c2.includes('cdkDragHandle'));
console.log('onColumnDragStarted:', c2.includes('onColumnDragStarted'));
console.log('onColumnDropped:', c2.includes('onColumnDropped'));