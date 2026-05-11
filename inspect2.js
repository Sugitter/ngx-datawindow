const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Search for col.sortable
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('col.sortable')) {
    console.log('Line', i + 1, ':', JSON.stringify(lines[i]));
  }
}

// Search for dt-resize-handle
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('dt-resize-handle')) {
    console.log('Line', i + 1, ':', JSON.stringify(lines[i]));
  }
}

// Search for onSortChange
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onSortChange') && lines[i].includes(': void')) {
    console.log('Line', i + 1, ':', JSON.stringify(lines[i]));
  }
}

// Search for ScrollingModule in imports array
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('ScrollingModule') && lines[i].includes('MatTooltipModule')) {
    console.log('Line', i + 1, ':', JSON.stringify(lines[i]));
  }
}

// Search for ScrollingModule import
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("@angular/cdk/scrolling")) {
    console.log('Line', i + 1, ':', JSON.stringify(lines[i]));
  }
}