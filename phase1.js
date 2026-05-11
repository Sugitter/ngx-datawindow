const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Inspect
const scImportIdx = lines.findIndex(l => l.includes("@angular/cdk/scrolling"));
const arrIdx = lines.findIndex(l => l.includes('MatTooltipModule') && l.includes('ScrollingModule'));
const thCloseIdx = lines.findIndex(l => l.includes('[disabled]="col.sortable === false"') && l.trim().endsWith('>'));
const rhIdx = lines.findIndex(l => l.includes('class="dt-resize-handle"'));
const sortIdx = lines.findIndex(l => l.includes('onSortChange') && l.includes(': void'));

console.log('scImportIdx:', scImportIdx, 'arrIdx:', arrIdx, 'thCloseIdx:', thCloseIdx, 'rhIdx:', rhIdx, 'sortIdx:', sortIdx);

// Define all modifications in the order they should be applied
// Each modification: { afterLine: number, content: string[] }
// We'll insert AFTER the specified line index (0-indexed)
// Apply in REVERSE order so earlier insertions don't shift later ones

const mods = [
  // 1. Insert type imports after the DragDropModule import line
  { afterLine: scImportIdx + 1, content: ["import { CdkDragStart, CdkDropListDropped } from '@angular/cdk/drag-drop';"] },
  // 2. Insert event handler methods after onSortChange method (sortIdx + 2 = closing brace)
  { afterLine: sortIdx + 2, content: [
    '',
    '  // ── 列拖拽重排序 (CDK Drag-Drop) ─────────────────────────────────────────',
    '  onColumnDragStarted(event: CdkDragStart, field: string): void {}',
    '',
    '  onColumnDropped(event: CdkDropListDropped): void {',
    '    if (!event.isPointerOverContainer) return;',
    '    const fromIndex = event.previousIndex;',
    '    const toIndex = event.currentIndex;',
    '    if (fromIndex === toIndex) return;',
    '',
    '    const cols = [...this.visibleColumns()];',
    '    const [moved] = cols.splice(fromIndex, 1);',
    '    cols.splice(toIndex, 0, moved);',
    '',
    '    const ordered = cols.map((c, i) => ({ ...c, order: i }));',
    '    const cfg = this._config();',
    '    if (cfg.columns) {',
    '      const map = new Map(ordered.map(c => [c.field, c]));',
    '      const updated = cfg.columns.map(col => map.get(col.field) ?? col);',
    '      this._config.set({ ...cfg, columns: updated });',
    '    }',
    '  }',
  ]},
];

// Apply modifications in REVERSE order
for (let i = mods.length - 1; i >= 0; i--) {
  const mod = mods[i];
  lines.splice(mod.afterLine + 1, 0, ...mod.content);
  console.log('Inserted', mod.content.length, 'lines after line', mod.afterLine + 1);
}

// Now do the template modifications separately
// Find the current positions (they've shifted by now)
// After 20 insertions (2 lines + 19 lines), offset = 21
const offset = 2 + 20;
const thCloseIdxAdj = thCloseIdx + offset;
const rhIdxAdj = rhIdx + offset;

console.log('thCloseIdxAdj:', thCloseIdxAdj, 'rhIdxAdj:', rhIdxAdj);
console.log('thCloseIdx line:', JSON.stringify(lines[thCloseIdxAdj]));
console.log('rhIdx line:', JSON.stringify(lines[rhIdxAdj]));

// 3. Modify <th> closing line
lines[thCloseIdxAdj] = lines[thCloseIdxAdj].replace(
  '[disabled]="col.sortable === false">',
  '[disabled]="col.sortable === false" cdkDrag cdkDragStarted="onColumnDragStarted($event, col.field)" cdkDropListDropped="onColumnDropped($event)">'
);

// 4. Modify resize handle
lines[rhIdxAdj] = lines[rhIdxAdj].replace('class="dt-resize-handle"', 'class="dt-resize-handle" cdkDragHandle');

fs.writeFileSync(path, lines.join('\n'));
console.log('\nFinal total lines:', lines.length);

// Verify
const c2 = fs.readFileSync(path, 'utf8');
console.log('DragDropModule import:', c2.includes("@angular/cdk/drag-drop"));
console.log('CdkDragStart:', c2.includes('CdkDragStart'));
console.log('onColumnDragStarted:', c2.includes('onColumnDragStarted'));
console.log('onColumnDropped:', c2.includes('onColumnDropped'));
console.log('cdkDragHandle:', c2.includes('cdkDragHandle'));
console.log('cdkDragStarted:', c2.includes('cdkDragStarted'));
console.log('DragDropModule in array:', c2.includes('DragDropModule,'));
console.log('DragDropModule (type) import count:', (c2.match(/@angular\/cdk\/drag-drop/g) || []).length);