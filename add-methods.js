const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Step 1: Add CDK drag-drop type imports
const dragDropImportIdx = lines.findIndex(l => l.includes("@angular/cdk/drag-drop"));
console.log('DragDropModule import at line', dragDropImportIdx + 1);
lines.splice(dragDropImportIdx + 1, 0, "import { CdkDragStart, CdkDropListDropped } from '@angular/cdk/drag-drop';");
console.log('Added type imports');

// Step 2: Find onSortChange and add methods after it
let insertLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onSortChange') && lines[i].includes(': void')) {
    insertLine = i;
    break;
  }
}
console.log('Insert methods after line', insertLine + 1, ':', lines[insertLine].trim());

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

lines.splice(insertLine + 1, 0, methodBlock);
fs.writeFileSync(path, lines.join('\n'));
console.log('Added methods. Total lines:', lines.length);

// Build test
console.log('\nRunning build...');
const { execSync } = require('child_process');
try {
  execSync('ng.cmd build ngx-datawindow', { cwd: 'D:\\workspace\\ngx-datawindow', stdio: 'pipe', encoding: 'utf8', timeout: 120000 });
  console.log('Build: SUCCESS');
} catch (e) {
  const out = e.stdout?.toString() || e.message;
  const lines2 = out.split('\n');
  console.log('Build FAILED - last 20 lines:');
  lines2.slice(-20).forEach(l => console.log(l));
}