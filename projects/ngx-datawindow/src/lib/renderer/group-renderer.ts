/**
 * GroupRenderer — Grouped display with collapsible sections
 *
 * Data rows are grouped by a specified field.
 * Group rows are inserted between data rows.
 * Collapsed groups hide their children.
 */
import {
  DataWindowRenderer, DisplayMode, DataWindowView, RendererState,
  ViewRow, ViewCell
} from './renderer';
import { GridRenderer } from './grid-renderer';

export class GroupRenderer implements DataWindowRenderer {
  readonly mode: DisplayMode = 'group';

  private _gridRenderer = new GridRenderer();
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

  onGroupToggle(groupKey: string): void {
    if (!this._state) return;
    const collapsed = new Set(this._state.collapsedGroups);
    if (collapsed.has(groupKey)) {
      collapsed.delete(groupKey);
    } else {
      collapsed.add(groupKey);
    }
    this._state = { ...this._state, collapsedGroups: collapsed };
    this._recompute();
  }

  onTreeToggle(_nodeId: string): void { /* no-op */ }

  // ── Private ──

  private _recompute(): void {
    const s = this._state;
    const groupBy = s.groupBy;
    if (!groupBy) {
      // Fallback to grid mode
      this._gridRenderer.update(s);
      this._view = this._gridRenderer.view;
      return;
    }

    // Group rows by field
    const grouped = this._groupRows(s.rows, groupBy.field);

    // Flatten: insert group rows, then children (if not collapsed)
    const flatRows: any[] = [];
    for (const [key, children] of grouped) {
      flatRows.push({ _id: `__group-${key}`, _isGroupRow: true, _groupKey: key, _groupCount: children.length });
      if (!s.collapsedGroups.has(key)) {
        flatRows.push(...children);
      }
    }

    // Now compute virtual scroll on the flattened list
    const rowHeight = s.rowHeight;
    const bufferSize = s.bufferSize;
    const firstVisible = Math.floor(s.scrollOffset / rowHeight);
    const visibleCount = Math.ceil(s.viewportHeight / rowHeight);
    const start = Math.max(0, firstVisible - bufferSize);
    const end = Math.min(flatRows.length, firstVisible + visibleCount + bufferSize);

    const bodyRows: ViewRow[] = [];
    for (let i = start; i < end; i++) {
      const row = flatRows[i];
      if (row._isGroupRow) {
        bodyRows.push(this._toGroupViewRow(row, s));
      } else {
        bodyRows.push(this._toDataViewRow(row, i, s));
      }
    }

    this._view = {
      headerRows: s.showHeader ? [this._buildHeaderRow(s)] : [],
      bodyRows,
      footerRows: [],
      totalScrollHeight: flatRows.length * rowHeight,
      scrollOffset: start * rowHeight,
      totalRows: flatRows.length,
      collapsedGroups: s.collapsedGroups,
      treeExpanded: s.treeExpanded,
    };
  }

  private _groupRows(rows: any[], field: string): Map<string, any[]> {
    const map = new Map<string, any[]>();
    for (const row of rows) {
      const key = String(row[field] ?? '');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return map;
  }

  private _toGroupViewRow(row: any, state: RendererState): ViewRow {
    const key = row._groupKey;
    const collapsed = state.collapsedGroups.has(key);
    const showCount = state.groupBy?.showCount !== false;

    const cells: ViewCell[] = [{
      field: '__group',
      value: key,
      formatted: showCount ? `${key} (${row._groupCount})` : key,
      editable: false,
      highlighted: false,
      colspan: state.columns.filter(c => c.visible !== false).length + 2, // +2 for select + actions
    }];

    return {
      id: row._id,
      type: 'group',
      cells,
      depth: 0,
      status: 'normal',
      raw: row,
      groupKey: key,
      groupCount: row._groupCount,
      expanded: !collapsed,
    };
  }

  private _toDataViewRow(row: any, _index: number, state: RendererState): ViewRow {
    // Reuse GridRenderer's logic via a temp state
    const tempState = { ...state, rows: [row], scrollOffset: 0, viewportHeight: state.rowHeight, bufferSize: 0 };
    this._gridRenderer.update(tempState);
    const gridView = this._gridRenderer.view;
    if (gridView.bodyRows.length > 0) {
      return { ...gridView.bodyRows[0], depth: 1 };
    }
    // Fallback
    return {
      id: row._id ?? String(_index),
      type: 'data',
      cells: [],
      depth: 1,
      status: 'normal',
      raw: row,
    };
  }

  private _buildHeaderRow(state: RendererState): ViewRow {
    const tempState = { ...state, rows: [], scrollOffset: 0, viewportHeight: 0, bufferSize: 0 };
    this._gridRenderer.update(tempState);
    return this._gridRenderer.view.headerRows[0] ?? {
      id: '__header', type: 'header', cells: [], depth: 0, status: 'normal', raw: null,
    };
  }

  private _emptyView(): DataWindowView {
    return {
      headerRows: [], bodyRows: [], footerRows: [],
      totalScrollHeight: 0, scrollOffset: 0, totalRows: 0,
      collapsedGroups: new Set(), treeExpanded: new Set(),
    };
  }
}
