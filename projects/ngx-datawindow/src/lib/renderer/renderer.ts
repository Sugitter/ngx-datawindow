/**
 * DataWindow Renderer Interface
 * Framework-free — pure TypeScript, zero UI dependency
 *
 * Renderer receives DataWindowState, outputs DataWindowView.
 * Adapter translates DataWindowView to framework-specific DOM.
 */

export type DisplayMode = 'grid' | 'form' | 'group' | 'tree' | 'report'
  | 'card' | 'master-detail' | 'tree-grid' | 'export' | 'pivot' | 'gantt';

export type RowStatus = 'normal' | 'new' | 'modified' | 'deleted';

export type RowType = 'data' | 'group' | 'tree' | 'header' | 'footer';

// ── View Model (Renderer output → Adapter renders) ──

export interface ViewRow {
  /** Unique row ID */
  id: string;
  /** Row type determines rendering template */
  type: RowType;
  /** Cells in this row */
  cells: ViewCell[];
  /** Indentation depth (for tree/group) */
  depth: number;
  /** Row modification status */
  status: RowStatus;
  /** Reference to raw data (for event handlers) */
  raw: any;
  /** Group key (type === 'group') */
  groupKey?: string;
  /** Group item count */
  groupCount?: number;
  /** Has child nodes (type === 'tree') */
  hasChildren?: boolean;
  /** Expanded state (type === 'tree' | 'group') */
  expanded?: boolean;
}

export interface ViewCell {
  field: string;
  value: any;
  /** Formatted display text */
  formatted: string;
  /** Can this cell be edited? */
  editable: boolean;
  editType?: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'textarea';
  editOptions?: { value: unknown; label: string }[];
  sticky?: 'start' | 'end';
  /** Is this cell highlighted (real-time data change)? */
  highlighted: boolean;
  colspan?: number;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataWindowView {
  headerRows: ViewRow[];
  bodyRows: ViewRow[];
  footerRows: ViewRow[];
  /** Total scrollable height (for virtual scroll spacer) */
  totalScrollHeight: number;
  /** Pixel offset of first rendered row (for virtual scroll translateY) */
  scrollOffset: number;
  /** Total row count (for pagination info) */
  totalRows: number;
  /** Currently collapsed groups */
  collapsedGroups: Set<string>;
  /** Currently expanded tree nodes */
  treeExpanded: Set<string>;
}

// ── Renderer State (input to Renderer) ──

export interface RendererState {
  /** All rows after filter+sort (what the user sees) */
  rows: any[];
  /** Total unfiltered row count */
  totalUnfiltered: number;
  /** Column configs */
  columns: ColumnConfig[];
  /** Row height in pixels */
  rowHeight: number;
  /** Virtual scroll buffer size (rows above/below viewport) */
  bufferSize: number;
  /** Viewport height in pixels */
  viewportHeight: number;
  /** Current scroll offset in pixels */
  scrollOffset: number;
  /** Selected row IDs */
  selectedRowIds: Set<string>;
  /** Collapsed group keys */
  collapsedGroups: Set<string>;
  /** Expanded tree node IDs */
  treeExpanded: Set<string>;
  /** Currently editing cell */
  editCell?: { rowId: string; field: string };
  /** Highlighted cells: key = "rowId_field", value = expire timestamp */
  highlightCells: Map<string, number>;
  /** Group-by config */
  groupBy?: { field: string; showCount?: boolean; collapsible?: boolean; defaultCollapsed?: boolean };
  /** Tree config */
  treeField?: { childrenField: string; indentWidth?: number; defaultExpanded?: boolean };
  /** Show header row? */
  showHeader: boolean;
  /** Show footer (aggregation) row? */
  showFooter: boolean;
}

// Minimal ColumnConfig — framework-free subset for Renderer
export interface ColumnConfig {
  field: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sticky?: 'start' | 'end' | null;
  editable?: boolean;
  editType?: 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'textarea';
  editOptions?: { value: unknown; label: string }[];
  format?: (value: any, row: any) => string;
  aggregate?: { type: 'sum' | 'avg' | 'count' | 'min' | 'max'; precision?: number };
  cellRenderer?: (value: any, row: any) => string;
  visible?: boolean;
}

// ── Renderer Interface ──

export interface DataWindowRenderer {
  readonly mode: DisplayMode;
  update(state: RendererState): void;
  readonly view: DataWindowView;
  onScroll(offset: number): void;
  onGroupToggle(groupKey: string): void;
  onTreeToggle(nodeId: string): void;
}
