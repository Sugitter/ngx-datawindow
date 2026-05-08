/**
 * AngularDataStoreAdapter
 *
 * Bridges DataStore Engine's Observer protocol to Angular Signals.
 * DataStore emits events → Adapter updates Signals → Angular CD picks up changes.
 *
 * This is the ONLY place where DataStore events touch Angular reactivity.
 * All other Angular code reads from the adapter's signals.
 */
import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { DataRow, DataStoreImpl, DataStoreConfig } from './datastore';
import {
  ColumnConfig, TableConfig, TableState, DataFeedConfig, HighlightCell
} from './models';
import {
  DataWindowRenderer, DataWindowView, RendererState,
  ViewRow, createRenderer
} from './renderer';

// ── Observer Protocol (mirrors DataStore events) ──

export interface DataStoreChangeEvent {
  type: 'rows' | 'row-status' | 'filter' | 'sort' | 'aggregation' | 'undo-stack' | 'validation';
  data?: any;
}

// ── Adapter ──

export class AngularDataStoreAdapter {
  // Angular Signals — the single source of truth for Angular layer
  readonly rows: WritableSignal<DataRow[]> = signal<DataRow[]>([]);
  readonly totalRows = signal(0);
  readonly loading = signal(false);
  readonly selectedRowIds = signal(new Set<string>());
  readonly collapsedGroups = signal(new Set<string>());
  readonly treeExpanded = signal(new Set<string>());
  readonly highlightCells = signal(new Map<string, number>());
  readonly editCell = signal<{ rowId: string; field: string } | undefined>(undefined);

  // Renderer — framework-free view computation
  private _renderer: DataWindowRenderer;

  // View output — computed from Renderer
  readonly view: Signal<DataWindowView>;

  // Config
  private _columns: ColumnConfig[] = [];
  private _config: TableConfig | null = null;
  private _viewportHeight = 600;
  private _rowHeight = 36;
  private _bufferSize = 10;

  constructor(displayMode: string = 'grid') {
    this._renderer = createRenderer(displayMode as any);

    // Computed: feed current state into renderer, get view back
    this.view = computed(() => {
      const state: RendererState = {
        rows: this.rows(),
        totalUnfiltered: this.totalRows(),
        columns: this._columns,
        rowHeight: this._rowHeight,
        bufferSize: this._bufferSize,
        viewportHeight: this._viewportHeight,
        scrollOffset: 0, // updated via onScroll()
        selectedRowIds: this.selectedRowIds(),
        collapsedGroups: this.collapsedGroups(),
        treeExpanded: this.treeExpanded(),
        editCell: this.editCell(),
        highlightCells: this.highlightCells(),
        groupBy: this._config?.groupBy,
        treeField: this._config?.treeField as any,
        showHeader: true,
        showFooter: this._config?.showPaginator !== false,
      };
      this._renderer.update(state);
      return this._renderer.view;
    });
  }

  // ── Config ──

  setColumns(columns: ColumnConfig[]): void {
    this._columns = columns;
  }

  setConfig(config: TableConfig): void {
    this._config = config;
    if (config.virtualScroll) {
      this._rowHeight = config.virtualScroll.rowHeight ?? 36;
    }
  }

  setViewportHeight(height: number): void {
    this._viewportHeight = height;
  }

  setBufferSize(size: number): void {
    this._bufferSize = size;
  }

  // ── DataStore Event Handlers ──

  /** Called when DataStore rows change (filter, sort, CRUD) */
  onRowsChanged(rows: DataRow[], total: number): void {
    this.rows.set(rows);
    this.totalRows.set(total);
  }

  /** Called when row status changes */
  onRowStatusChanged(rowId: string, _status: string): void {
    // Force re-computation by creating new array reference
    const current = this.rows();
    this.rows.set([...current]);
  }

  /** Called when selection changes */
  onSelectionChanged(selectedIds: Set<string>): void {
    this.selectedRowIds.set(new Set(selectedIds));
  }

  /** Called when highlight cells change */
  onHighlightChanged(cells: Map<string, number>): void {
    this.highlightCells.set(new Map(cells));
  }

  // ── Scroll Handling ──

  onScroll(offset: number): void {
    this._renderer.onScroll(offset);
    // Trigger recomputation by mutating a signal
    const current = this.rows();
    this.rows.set([...current]);
  }

  // ── Group/Tree Toggle ──

  toggleGroup(groupKey: string): void {
    const collapsed = new Set(this.collapsedGroups());
    if (collapsed.has(groupKey)) {
      collapsed.delete(groupKey);
    } else {
      collapsed.add(groupKey);
    }
    this.collapsedGroups.set(collapsed);
    this._renderer.onGroupToggle(groupKey);
  }

  toggleTreeNode(nodeId: string): void {
    const expanded = new Set(this.treeExpanded());
    if (expanded.has(nodeId)) {
      expanded.delete(nodeId);
    } else {
      expanded.add(nodeId);
    }
    this.treeExpanded.set(expanded);
    this._renderer.onTreeToggle(nodeId);
  }

  // ── Edit Cell ──

  startEdit(rowId: string, field: string): void {
    this.editCell.set({ rowId, field });
  }

  cancelEdit(): void {
    this.editCell.set(undefined);
  }

  // ── Display Mode Switch ──

  setDisplayMode(mode: string): void {
    this._renderer = createRenderer(mode as any);
  }

  // ── Renderer Access ──

  getRenderer(): DataWindowRenderer {
    return this._renderer;
  }
}
