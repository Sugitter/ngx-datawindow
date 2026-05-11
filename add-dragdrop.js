const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Find the ScrollingModule import line
const idx = lines.findIndex(l => l.includes("import { ScrollingModule } from '@angular/cdk/scrolling'"));
console.log('Found ScrollingModule at line', idx + 1);

if (idx >= 0) {
  // Add DragDropModule import AFTER the ScrollingModule line
  lines.splice(idx + 1, 0, "import { DragDropModule } from '@angular/cdk/drag-drop';");
  fs.writeFileSync(path, lines.join('\n'));
  console.log('Done! New line count:', lines.length);
} else {
  console.log('ScrollingModule not found!');
}
