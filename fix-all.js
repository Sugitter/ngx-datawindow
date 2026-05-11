const fs = require('fs');
const path = 'projects/ngx-datawindow/src/lib/datatable.component.ts';
let content = fs.readFileSync(path, 'utf8');

console.log('Current length:', content.split('\n').length);

// Find onColumnDropped method
const idx = content.indexOf('onColumnDropped(event: CdkDragDrop): void {');
console.log('onColumnDropped at char', idx);

if (idx === -1) {
  console.error('ERROR: method not found');
  process.exit(1);
}

// Find the end of the method (matching closing brace)
// Search for '  }' followed by a blank line or new method
const methodStart = idx + 'onColumnDropped(event: CdkDragDrop): void {'.length;
// Find closing brace at proper nesting level
let braceCount = 1;
let end = methodStart;
while (braceCount > 0 && end < content.length) {
  if (content[end] === '{') braceCount++;
  else if (content[end] === '}') braceCount--;
  end++;
}

console.log('Method spans chars', idx, 'to', end);

// Extract the method body
const oldMethodBody = content.substring(idx, end);
console.log('Old method length:', oldMethodBody.length);

// Build new method
const newMethod = `onColumnDropped(event: CdkDragDrop): void {
    if (!event.isPointerOverContainer) return;
    const fromIndex = event.previousIndex;
    const toIndex = event.currentIndex;
    if (fromIndex === toIndex) return;

    const cols = [...this.visibleColumns()];
    const [moved] = cols.splice(fromIndex, 1);
    cols.splice(toIndex, 0, moved);

    const ordered = cols.map((c, i) => ({ ...c, order: i }));
    const cfg = this.config();
    if (cfg?.columns) {
      const map = new Map(ordered.map(c => [c.field, c]));
      const updated = cfg.columns.map((col: any) => map.get(col.field) ?? col);
      // Update _columns directly since config is read-only
      const newCols = updated.map((col: any) => {
        const existing = this._columns.find(c => c.field === col.field);
        return existing ? { ...existing, order: col.order } : existing;
      }).filter(Boolean);
      // Reorder this._columns to match new order
      const reordered = updated.map(col => newCols.find(c => c.field === col.field)).filter(Boolean) as any[];
      this._columns = reordered;
    }
  }`;

content = content.substring(0, idx) + newMethod + content.substring(end);
console.log('New length:', content.split('\n').length);

fs.writeFileSync(path, content);
console.log('Done');

// Verify
const c2 = fs.readFileSync(path, 'utf8');
console.log('CdkDragDrop:', c2.includes('CdkDragDrop'));
console.log('onColumnDropped:', c2.includes('onColumnDropped'));
console.log('cfg?.columns:', c2.includes('cfg?.columns'));
console.log('this._columns =', c2.includes('this._columns ='));
