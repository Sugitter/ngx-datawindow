const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
console.log('Lines before:', lines.length);

// Fix 1: Add moveItemInArray to import
const oldImport = "import { DragDropModule } from '@angular/cdk/drag-drop';\nimport { CdkDragStart, CdkDragDrop } from '@angular/cdk/drag-drop';";
const newImport = "import { DragDropModule, CdkDragStart, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';";
if (content.includes(oldImport)) {
  content = content.replace(oldImport, newImport);
  console.log('Fixed import');
} else {
  console.log('Import pattern not found - already fixed or different format');
}

// Fix 2: Replace onColumnDropped method body
// Find the method start
const methodStartIdx = content.indexOf('onColumnDropped(event: CdkDragDrop): void {');
if (methodStartIdx === -1) {
  console.error('onColumnDropped method not found');
  process.exit(1);
}

// Find the closing brace of the method (balanced braces)
let braceCount = 1;
let i = methodStartIdx + 'onColumnDropped(event: CdkDragDrop): void {'.length;
while (braceCount > 0 && i < content.length) {
  if (content[i] === '{') braceCount++;
  else if (content[i] === '}') braceCount--;
  i++;
}

const oldMethod = content.substring(methodStartIdx, i);
console.log('Old method length:', oldMethod.length);

// New correct implementation
const newMethod = `onColumnDropped(event: CdkDragDrop): void {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this._columns, event.previousIndex, event.currentIndex);
    // Update order field for each column
    this._columns.forEach((col, idx) => col.order = idx);
  }`;

content = content.substring(0, methodStartIdx) + newMethod + content.substring(i);

const lines2 = content.split('\n');
console.log('Lines after:', lines2.length);

fs.writeFileSync(path, content);
console.log('Written to disk');

// Verify
const verify = fs.readFileSync(path, 'utf8');
console.log('Has moveItemInArray import:', verify.includes('moveItemInArray'));
console.log('Has CdkDragDrop import:', verify.includes('CdkDragDrop'));
console.log('Has onColumnDropped:', verify.includes('onColumnDropped'));
console.log('Has moveItemInArray(this._columns:', verify.includes('moveItemInArray(this._columns'));
console.log('Has config.set:', verify.includes('config.set'));
