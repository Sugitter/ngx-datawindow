/**
 * TreeRenderer — Hierarchical tree display with expand/collapse
 *
 * Rows with children are rendered as tree nodes.
 * Indentation depth indicates hierarchy level.
 */
import {
  DataWindowRenderer, DisplayMode, DataWindowView, RendererState,
  ViewRow, ViewCell
} from './renderer';
import { GridRenderer } from './grid-renderer';

interface TreeNode {
  row: any;
  children: TreeNode[];
  depth: number;
}

export class TreeRenderer implements DataWindowRenderer {
  readonly mode: DisplayMode = 'tree';

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

  onGroupToggle(_groupKey: string): void { /* no-op */ }

  onTreeToggle(nodeId: string): void {
    if (!this._state) return;
    const expanded = new Set(this._state.treeExpanded);
    if (expanded.has(nodeId)) {
      expanded.delete(nodeId);
    } else {
      expanded.add(nodeId);
    }
    this._state = { ...this._state, treeExpanded: expanded };
    this._recompute();
  }

  // ── Private ──

  private _recompute(): void {
    const s = this._state;
    const treeField = s.treeField;
    if (!treeField) {
      this._gridRenderer.update(s);
      this._view = this._gridRenderer.view;
      return;
    }

    // Build tree structure
    const tree = this._buildTree(s.rows, treeField.childrenField);

    // Flatten with depth tracking
    const flatRows: any[] = [];
    const traverse = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        flatRows.push({
          ...node.row,
          _treeDepth: node.depth,
          _hasChildren: node.children.length > 0,
          _treeExpanded: s.treeExpanded.has(node.row._id ?? node.row.id),
        });
        if (node.children.length > 0 && s.treeExpanded.has(node.row._id ?? node.row.id)) {
          traverse(node.children);
        }
      }
    };
    traverse(tree);

    // Virtual scroll on flattened list
    const rowHeight = s.rowHeight;
    const bufferSize = s.bufferSize;
    const firstVisible = Math.floor(s.scrollOffset / rowHeight);
    const visibleCount = Math.ceil(s.viewportHeight / rowHeight);
    const start = Math.max(0, firstVisible - bufferSize);
    const end = Math.min(flatRows.length, firstVisible + visibleCount + bufferSize);

    const bodyRows: ViewRow[] = [];
    for (let i = start; i < end; i++) {
      bodyRows.push(this._toTreeViewRow(flatRows[i], s));
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

  private _buildTree(rows: any[], childrenField: string): TreeNode[] {
    // Assume flat list with parent-child references or nested children
    // If rows already have children array, use it directly
    const roots: TreeNode[] = [];

    for (const row of rows) {
      const children = row[childrenField];
      if (Array.isArray(children) && children.length > 0) {
        roots.push({
          row,
          children: this._buildTree(children, childrenField),
          depth: 0,
        });
      } else {
        roots.push({ row, children: [], depth: 0 });
      }
    }

    // Assign depth recursively
    const assignDepth = (nodes: TreeNode[], depth: number) => {
      for (const node of nodes) {
        node.depth = depth;
        assignDepth(node.children, depth + 1);
      }
    };
    assignDepth(roots, 0);

    return roots;
  }

  private _toTreeViewRow(row: any, state: RendererState): ViewRow {
    const id = row._id ?? row.id;
    const depth = row._treeDepth ?? 0;
    const hasChildren = row._hasChildren ?? false;
    const expanded = row._treeExpanded ?? false;
    const indentWidth = state.treeField?.indentWidth ?? 24;

    const cells: ViewCell[] = [];

    // Select cell
    cells.push({
      field: '__select',
      value: state.selectedRowIds.has(id),
      formatted: '',
      editable: false,
      sticky: 'start',
      highlighted: false,
      width: '48px',
      align: 'center',
    });

    // Data cells — first visible cell gets tree indent
    let isFirstDataCell = true;
    for (const col of state.columns) {
      if (col.visible === false) continue;
      const cellValue = row[col.field];
      const formatted = col.format ? col.format(cellValue, row)
        : cellValue != null ? String(cellValue) : '';

      cells.push({
        field: col.field,
        value: cellValue,
        formatted,
        editable: col.editable ?? false,
        editType: col.editType,
        editOptions: col.editOptions,
        sticky: col.sticky ?? undefined,
        highlighted: false,
        align: col.align,
        width: isFirstDataCell ? undefined : col.width, // first cell auto-width for indent
      });
      isFirstDataCell = false;
    }

    // Actions cell
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
      type: hasChildren ? 'tree' : 'data',
      cells,
      depth,
      status: this._getRowStatus(row),
      raw: row,
      hasChildren,
      expanded,
    };
  }

  private _buildHeaderRow(state: RendererState): ViewRow {
    const tempState = { ...state, rows: [], scrollOffset: 0, viewportHeight: 0, bufferSize: 0 };
    this._gridRenderer.update(tempState);
    return this._gridRenderer.view.headerRows[0] ?? {
      id: '__header', type: 'header', cells: [], depth: 0, status: 'normal', raw: null,
    };
  }

  private _getRowStatus(row: any): 'normal' | 'new' | 'modified' | 'deleted' {
    if (row._status === 'new' || row._isNew) return 'new';
    if (row._status === 'modified' || row._isModified) return 'modified';
    if (row._status === 'deleted' || row._isDeleted) return 'deleted';
    return 'normal';
  }

  private _emptyView(): DataWindowView {
    return {
      headerRows: [], bodyRows: [], footerRows: [],
      totalScrollHeight: 0, scrollOffset: 0, totalRows: 0,
      collapsedGroups: new Set(), treeExpanded: new Set(),
    };
  }
}
