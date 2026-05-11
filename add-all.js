const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// === 1. Add DragDropModule import after ScrollingModule (line 27, 0-indexed) ===
const scImportIdx = lines.findIndex(l => l.includes("@angular/cdk/scrolling"));
console.log('ScrollingModule import at line', scImportIdx + 1);
lines.splice(scImportIdx + 1, 0, "import { DragDropModule } from '@angular/cdk/drag-drop';");
console.log('Added DragDropModule import');

// === 2. Add to imports array (line 51 -> now 52 due to +1 offset) ===
const arrIdx = lines.findIndex(l => l.includes('MatTooltipModule') && l.includes('ScrollingModule'));
console.log('ScrollingModule in imports at line', arrIdx + 1);
lines.splice(arrIdx + 1, 0, '    DragDropModule,');
console.log('Added DragDropModule to imports array');

// === 3. Add CDK type imports ===
const ddIdx = lines.findIndex(l => l.includes("@angular/cdk/drag-drop"));
lines.splice(ddIdx + 1, 0, "import { CdkDragStart, CdkDropListDropped } from '@angular/cdk/drag-drop';");
console.log('Added type imports');

// === 4. Add cdkDrag attributes to data column <th> closing line ===
// Line 360 (0-indexed: 359) has '[disabled]="col.sortable === false">'
// After 3 insertions, this shifts to 359 + 3 = 362 (0-indexed)
const thCloseIdx = lines.findIndex(l => l.includes('[disabled]="col.sortable === false"') && l.trim().endsWith('>'));
console.log('<th> closing at line', thCloseIdx + 1, ':', JSON.stringify(lines[thCloseIdx]));
lines[thCloseIdx] = lines[thCloseIdx].replace(
  '[disabled]="col.sortable === false">',
  '[disabled]="col.sortable === false" cdkDrag cdkDragStarted="onColumnDragStarted($event, col.field)" cdkDropListDropped="onColumnDropped($event)">'
);
console.log('Modified:', JSON.stringify(lines[thCloseIdx]));

// === 5. Add cdkDragHandle to resize handle ===
// Line 243 -> after 4 insertions shifts by 4
const rhIdx = lines.findIndex(l => l.includes('class="dt-resize-handle"'));
console.log('Resize handle at line', rhIdx + 1, ':', JSON.stringify(lines[rhIdx]));
lines[rhIdx] = lines[rhIdx].replace('class="dt-resize-handle"', 'class="dt-resize-handle" cdkDragHandle');
console.log('Modified:', JSON.stringify(lines[rhIdx]));

// === 6. Add event handler methods after onSortChange ===
// Line 1739 -> after 5 insertions shifts by 5
const sortIdx = lines.findIndex(l => l.includes('onSortChange') && l.includes(': void'));
console.log('onSortChange at line', sortIdx + 1, ':', lines[sortIdx].trim());

const methodBlock = `
  // ── 列拖拽重排序 (CDK Drag-Drop) ─────────────────────────────────────────
  onColumnDragStarted(event: CdkDragStart, field: string): void {}

  onColumnDropped(event: CdkDropListDropped): void {
    if (!event.isPointerOverContainer) return;
    const fromIndex = event.previousIndex;
    const toIndex = event.currentIndex;
    if (fromIndex === toIndex) return;

    const cols = [...this.visibleColumns()];
    const [moved] = cols.splice(fromIndex, 1);
    cols.splice(toIndex, 0, moved);

    const ordered = cols.map((c, i) => ({ ...c, order: i }));
    const cfg = this._config();
    if (cfg.columns) {
      const map = new Map(ordered.map(c => [c.field, c]));
      const updated = cfg.columns.map(col => map.get(col.field) ?? col);
      this._config.set({ ...cfg, columns: updated });
    }
  }
`;

lines.splice(sortIdx + 1, 0, methodBlock);
console.log('Added methods');

fs.writeFileSync(path, lines.join('\n'));
console.log('\nFinal total lines:', lines.length);

// Verify
const c2 = fs.readFileSync(path, 'utf8');
console.log('DragDropModule import:', c2.includes("@angular/cdk/drag-drop"));
console.log('CdkDragStart:', c2.includes('CdkDragStart'));
console.log('CdkDropListDropped:', c2.includes('CdkDropListDropped'));
console.log('onColumnDragStarted:', c2.includes('onColumnDragStarted'));
console.log('onColumnDropped:', c2.includes('onColumnDropped'));
console.log('cdkDragHandle:', c2.includes('cdkDragHandle'));
console.log('cdkDragStarted:', c2.includes('cdkDragStarted'));
console.log('cdkDropListDropped:', c2.includes('cdkDropListDropped'));
console.log('DragDropModule in array:', c2.includes('DragDropModule,'));