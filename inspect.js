const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// === INSPECTION ===
const scIdx = lines.findIndex(l => l.includes("@angular/cdk/scrolling"));
console.log('ScrollingModule import at line', scIdx + 1);

const arrIdx = lines.findIndex(l => l.includes('MatTooltipModule') && l.includes('ScrollingModule'));
console.log('ScrollingModule in imports array at line', arrIdx + 1);

// Find @for (col of visibleColumns()) - look for the one in table header area
let forLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('@for (col of visibleColumns') && !lines[i].includes('track')) {
    forLine = i;
    console.log('@for at line', i + 1, ':', lines[i].trim());
    // Find the <th> closing line after this
    for (let j = i + 1; j < lines.length && j < i + 15; j++) {
      if (lines[j].includes('[disabled]="col.sortable === false"') && lines[j].trim().endsWith('>')) {
        console.log('<th> closing at line', j + 1, ':', lines[j].trim());
        break;
      }
    }
    break;
  }
}

// Find resize handle
let resizeLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('class="dt-resize-handle"')) {
    resizeLine = i;
    console.log('Resize handle at line', i + 1, ':', lines[i].trim());
    break;
  }
}

// Find onSortChange
let sortLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onSortChange') && lines[i].includes(': void')) {
    sortLine = i;
    console.log('onSortChange at line', i + 1, ':', lines[i].trim());
    break;
  }
}

console.log('\nLines:', forLine, resizeLine, sortLine);