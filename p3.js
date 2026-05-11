const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
let content = fs.readFileSync(path, 'utf8');

console.log('=== Phase 3: Add event handler methods ===');
console.log('Current length:', content.split('\n').length);

const oldSort = '  onSortChange(sort: Sort): void {\r\n    this._service!.setSort(sort.active, sort.direction);\r\n  }';

const newSort = `  onSortChange(sort: Sort): void {
    this._service!.setSort(sort.active, sort.direction);
  }

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
  }`;

if (content.includes(oldSort)) {
  content = content.replace(oldSort, newSort);
  console.log('P3 done: Added onColumnDragStarted and onColumnDropped');
} else {
  console.error('ERROR: onSortChange block not found (CRLF issue?)');
  console.log('Found:', content.includes('onSortChange(sort: Sort): void'));
}

fs.writeFileSync(path, content);
console.log('\nPhase 3 done. Lines:', content.split('\n').length);

// Verify
const c2 = fs.readFileSync(path, 'utf8');
console.log('onColumnDragStarted:', c2.includes('onColumnDragStarted'));
console.log('onColumnDropped:', c2.includes('onColumnDropped'));
console.log('DragDropModule:', c2.includes('DragDropModule'));
console.log('cdkDragHandle:', c2.includes('cdkDragHandle'));
