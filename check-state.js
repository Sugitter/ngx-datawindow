const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// First: check what's currently in the file (might be from previous run)
console.log('Current state:');
console.log('  Lines:', lines.length);
console.log('  DragDropModule in imports:', lines.some(l => l.trim() === 'DragDropModule,'));
console.log('  cdkDragHandle:', lines.some(l => l.includes('cdkDragHandle')));
console.log('  cdkDrag:', lines.some(l => l.includes('cdkDrag ')));

// Check the imports array area
console.log('\nImports array area (lines 49-56):');
for (let i = 48; i < 57; i++) console.log(i + 1, lines[i]);

// Check if <th> has cdkDrag
console.log('\n<th> closing lines (searching for disabled col.sortable):');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('[disabled]') && lines[i].includes('col.sortable')) {
    console.log('Line', i + 1, ':', JSON.stringify(lines[i]));
  }
}

// Check resize handle
console.log('\nResize handle:');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('dt-resize-handle')) {
    console.log('Line', i + 1, ':', JSON.stringify(lines[i]));
    break;
  }
}