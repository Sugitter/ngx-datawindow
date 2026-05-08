/**
 * GridRenderer — Virtual scroll calculation for Grid display mode
 *
 * Framework-free: computes which rows are visible, outputs ViewRow[].
 * Angular Adapter translates ViewRow[] → div elements in template.
 * CDK VirtualScrollViewport handles scroll events.
 */
import {
  DataWindowRenderer, DisplayMode, DataWindowView, RendererState,
  ViewRow, ViewCell, ColumnConfig
} from './renderer';

export class GridRenderer implements DataWindowRenderer {
  readonly mode: DisplayMode = 'grid';

  private _state!: RendererState;
  private _view: DataWindowView = this._emptyView();

  update(state: RendererState): void {
    this._state = state;
    this._recompute();
  }

  get view(): DataWindowView {
    return this._view;
  }

  onScroll(offset: number): void {
    if (!this._state) return;
    this._state = { ...this._state, scrollOffset: offset };
    this._recompute();
  }

  onGroupToggle(_groupKey: string): void { /* no-op for grid */ }
  onTreeToggle(_nodeId: string): void { /* no-op for grid */ }

  // ── Private ──

  private _recompute(): void {
    const s = this._state;
    const rows = s.rows;
    const rowHeight = s.rowHeight;
    const bufferSize = s.bufferSize;

    // Compute visible range + buffer
    const firstVisible = Math.floor(s.scrollOffset / rowHeight);
    const visibleCount = Math.ceil(s.viewportHeight / rowHeight);
    const start = Math.max(0, firstVisible - bufferSize);
    const end = Math.min(rows.length, firstVisible + visibleCount + bufferSize);

    // Slice visible rows and convert to ViewRow[]
    const bodyRows: ViewRow[] = [];
    for (let i = start; i < end; i++) {
      bodyRows.push(this._toViewRow(rows[i], i));
    }

    this._view = {
      headerRows: s.showHeader ? [this._buildHeaderRow(s.columns)] : [],
      bodyRows,
      footerRows: s.showFooter ? [this._buildFooterRow(s)] : [],
      totalScrollHeight: rows.length * rowHeight,
      scrollOffset: start * rowHeight,
      totalRows: rows.length,
      collapsedGroups: s.collapsedGroups,
      treeExpanded: s.treeExpanded,
    };
  }

  private _toViewRow(row: any, _index: number): ViewRow {
    const s = this._state;
    const id = row._id ?? row.id ?? String(_index);
    const status = this._getRowStatus(row);
    const now = Date.now();

    const cells: ViewCell[] = [];

    // Select cell (sticky-start) — only if selection mode is not 'none'
    // We always include it; the adapter decides whether to render
    cells.push({
      field: '__select',
      value: s.selectedRowIds.has(id),
      formatted: '',
      editable: false,
      sticky: 'start',
      highlighted: false,
      width: '48px',
      align: 'center',
    });

    // Data cells
    for (const col of s.columns) {
      if (col.visible === false) continue;
      const cellValue = row[col.field];
      const formatted = col.format ? col.format(cellValue, row)
        : cellValue != null ? String(cellValue) : '';
      const highlightKey = `${id}_${col.field}`;
      const isHighlighted = s.highlightCells.has(highlightKey)
        && (s.highlightCells.get(highlightKey)! > now);

      cells.push({
        field: col.field,
        value: cellValue,
        formatted,
        editable: col.editable ?? false,
        editType: col.editType,
        editOptions: col.editOptions,
        sticky: col.sticky ?? undefined,
        highlighted: isHighlighted,
        align: col.align,
        width: col.width,
      });
    }

    // Actions cell (sticky-end) — always include, adapter decides
    cells.push({
      field: '__actions',
      value: null,
      formatted: '',
      editable: false,
      sticky: 'end',
      highlighted: false,
      width: '96px',
      align: 'center',
    });

    return {
      id,
      type: 'data',
      cells,
      depth: 0,
      status,
      raw: row,
    };
  }

  private _buildHeaderRow(columns: ColumnConfig[]): ViewRow {
    const cells: ViewCell[] = [];

    // Select header
    cells.push({
      field: '__select',
      value: null,
      formatted: '',
      editable: false,
      sticky: 'start',
      highlighted: false,
      width: '48px',
      align: 'center',
    });

    // Column headers
    for (const col of columns) {
      if (col.visible === false) continue;
      cells.push({
        field: col.field,
        value: col.header,
        formatted: col.header,
        editable: false,
        sticky: col.sticky ?? undefined,
        highlighted: false,
        align: col.align,
        width: col.width,
      });
    }

    // Actions header
    cells.push({
      field: '__actions',
      value: null,
      formatted: '',
      editable: false,
      sticky: 'end',
      highlighted: false,
      width: '96px',
      align: 'center',
    });

    return {
      id: '__header',
      type: 'header',
      cells,
      depth: 0,
      status: 'normal',
      raw: null,
    };
  }

  private _buildFooterRow(state: RendererState): ViewRow {
    const cells: ViewCell[] = [];
    const rows = state.rows;

    // Select footer
    cells.push({
      field: '__select',
      value: null,
      formatted: '',
      editable: false,
      sticky: 'start',
      highlighted: false,
      width: '48px',
      align: 'center',
    });

    // Aggregate cells
    for (const col of state.columns) {
      if (col.visible === false) continue;
      let formatted = '';
      if (col.aggregate) {
        formatted = this._computeAggregate(rows, col);
      }
      cells.push({
        field: col.field,
        value: null,
        formatted,
        editable: false,
        sticky: col.sticky ?? undefined,
        highlighted: false,
        align: col.align,
        width: col.width,
      });
    }

    // Actions footer
    cells.push({
      field: '__actions',
      value: null,
      formatted: '',
      editable: false,
      sticky: 'end',
      highlighted: false,
      width: '96px',
      align: 'center',
    });

    return {
      id: '__footer',
      type: 'footer',
      cells,
      depth: 0,
      status: 'normal',
      raw: null,
    };
  }

  private _computeAggregate(rows: any[], col: ColumnConfig): string {
    const values = rows.map(r => r[col.field]).filter(v => v != null && typeof v === 'number');
    if (values.length === 0) return '';
    const agg = col.aggregate!;
    let result: number;
    switch (agg.type) {
      case 'sum': result = values.reduce((a, b) => a + b, 0); break;
      case 'avg': result = values.reduce((a, b) => a + b, 0) / values.length; break;
      case 'count': return String(values.length);
      case 'min': result = Math.min(...values); break;
      case 'max': result = Math.max(...values); break;
      default: return '';
    }
    return agg.precision != null ? result.toFixed(agg.precision) : String(result);
  }

  private _getRowStatus(row: any): 'normal' | 'new' | 'modified' | 'deleted' {
    if (row._status === 'new' || row._isNew) return 'new';
    if (row._status === 'modified' || row._isModified) return 'modified';
    if (row._status === 'deleted' || row._isDeleted) return 'deleted';
    return 'normal';
  }

  private _emptyView(): DataWindowView {
    return {
      headerRows: [],
      bodyRows: [],
      footerRows: [],
      totalScrollHeight: 0,
      scrollOffset: 0,
      totalRows: 0,
      collapsedGroups: new Set(),
      treeExpanded: new Set(),
    };
  }
}
