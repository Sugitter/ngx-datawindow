const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
let content = fs.readFileSync(path, 'utf8');

console.log('=== Phase 1: Import modifications ===');
console.log('Original length:', content.split('\n').length);

// P1.1: Add DragDropModule import after the ScrollingModule import line
const scImportLine = "import { ScrollingModule } from '@angular/cdk/scrolling';";
if (!content.includes(scImportLine)) { console.error('ERROR: ScrollingModule import not found!'); process.exit(1); }
if (content.includes("import { DragDropModule } from '@angular/cdk/drag-drop';")) {
  console.log('DragDropModule import already exists, skipping P1.1');
} else {
  content = content.replace(scImportLine, scImportLine + '\nimport { DragDropModule } from \'@angular/cdk/drag-drop\';');
  console.log('P1.1 done: Added DragDropModule import');
}

// P1.2: Add DragDropModule to imports array (after ScrollingModule in the array)
const arrLine = 'MatTooltipModule, ScrollingModule, MatMenuModule, MatProgressSpinnerModule,';
if (content.includes(arrLine)) {
  if (!content.includes('DragDropModule,')) {
    content = content.replace(arrLine, arrLine + '\n    DragDropModule,');
    console.log('P1.2 done: Added DragDropModule to imports array');
  } else {
    console.log('DragDropModule in imports array already exists, skipping P1.2');
  }
} else {
  console.error('ERROR: Imports array line not found!');
}

// P1.3: Add CDK type imports after DragDropModule import
const ddImportLine = "import { DragDropModule } from '@angular/cdk/drag-drop';";
if (content.includes(ddImportLine)) {
  const typeImportLine = "import { CdkDragStart, CdkDropListDropped } from '@angular/cdk/drag-drop';";
  if (!content.includes(typeImportLine)) {
    content = content.replace(ddImportLine, ddImportLine + '\nimport { CdkDragStart, CdkDropListDropped } from \'@angular/cdk/drag-drop\';');
    console.log('P1.3 done: Added type imports');
  } else {
    console.log('Type imports already exist, skipping P1.3');
  }
}

fs.writeFileSync(path, content);
console.log('\nPhase 1 done. Lines:', content.split('\n').length);