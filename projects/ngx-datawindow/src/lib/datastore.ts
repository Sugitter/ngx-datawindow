/**
 * DataStore 引擎 - TypeScript 实现
 * 对应 Rust 版本的完整移植，用于 Angular 前端
 * 
 * Phase 1 核心功能：
 * - 列级变更跟踪（精确到列的 oldValue/newValue）
 * - ItemChanged 拒绝机制（实时拦截无效输入）
 * - 撤销栈（Command Pattern）
 * - 完整事件链（生命周期事件）
 */

// ============================================================================
// 类型定义
// ============================================================================

export type RowId = number;
export type RowNumber = number;
export type FieldName = string;
export type RawValue = string | number | boolean | null | undefined;
export type ComputedValue = RawValue | RawValue[] | Record<string, unknown>;
export type BufferType = 'main' | 'filtered' | 'deleted';
export type RowStatus = 'new' | 'normal' | 'modified' | 'deleted';
export type UpdateType = 'new' | 'modified' | 'deleted';
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'isNull' | 'isNotNull';
export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct' | 'first' | 'last';

// ── 列级变更跟踪 ───────────────────────────────────────────────────────────

export interface FieldChange {
  oldValue: RawValue;
  newValue: RawValue;
  timestamp: number;
  /** 是否已撤销 */
  undone?: boolean;
}

export interface FieldChangeRecord {
  field: FieldName;
  change: FieldChange;
}

export interface RowChangeHistory {
  rowId: RowId;
  changes: FieldChangeRecord[];
  /** 最后修改时间 */
  lastModified: number;
}

// ── ItemChanged 拒绝机制 ────────────────────────────────────────────────────

export type ItemChangedAction = 'accept' | 'reject' | 'retry';

export interface ItemChangedReason {
  code: string;
  message: string;
}

export interface ItemChangedEvent {
  rowId: RowId;
  field: FieldName;
  oldValue: RawValue;
  newValue: RawValue;
  /** 拒绝原因（如果被拒绝） */
  rejectReason?: ItemChangedReason;
  /** 是否已处理 */
  handled: boolean;
  /** 处理结果 */
  action: ItemChangedAction;
}

export type ItemChangedHandler = (event: ItemChangedEvent) => ItemChangedAction | Promise<ItemChangedAction>;

// ── 撤销栈 ─────────────────────────────────────────────────────────────────

export type CommandType = 'addRow' | 'deleteRow' | 'updateField' | 'restoreRow' | 'permanentDelete' | 'batchUpdate';

export interface Command {
  id: string;
  type: CommandType;
  timestamp: number;
  description: string;
  /** 执行命令 */
  execute: () => void;
  /** 撤销命令 */
  undo: () => void;
  /** 是否可撤销 */
  canUndo: boolean;
  /** 是否可重做 */
  canRedo: boolean;
}

export interface UndoStack {
  /** 当前栈深度（可撤销次数） */
  undoCount: number;
  /** 重做栈深度（可重做次数） */
  redoCount: number;
  /** 是否可撤销 */
  canUndo: boolean;
  /** 是否可重做 */
  canRedo: boolean;
}

// ── 完整事件链 ─────────────────────────────────────────────────────────────

export type DataStoreEventType =
  // Phase 0: 基础事件
  | 'rowAdded'
  | 'rowUpdated'
  | 'rowRemoved'
  | 'rowMoved'
  | 'bufferChanged'
  | 'dataRefreshed'
  | 'reset'
  // Phase 1: 生命周期事件
  | 'retrieveStart'
  | 'retrieveEnd'
  | 'itemChanged'
  | 'itemChangedRejected'
  | 'itemFocusChanged'
  | 'saveStart'
  | 'saveEnd'
  | 'undoStackChanged'
  | 'rowStatusChanged';

export interface DataStoreEvent {
  type: DataStoreEventType;
  data?: unknown;
  timestamp: number;
  source: string;
}

export type EventListener = (event: DataStoreEvent) => void;

// ── 生命周期事件数据 ────────────────────────────────────────────────────────

export interface RetrieveStartEvent {
  storeName: string;
  filter?: FilterCondition;
  options?: QueryOptions;
}

export interface RetrieveEndEvent {
  storeName: string;
  rowCount: number;
  duration: number;
}

export interface ItemChangedEventData {
  rowId: RowId;
  field: FieldName;
  oldValue: RawValue;
  newValue: RawValue;
  action: ItemChangedAction;
  rejectReason?: ItemChangedReason;
  /** 变更是否成功应用 */
  accepted: boolean;
}

export interface ItemFocusChangedEvent {
  previousRowId: RowId | null;
  currentRowId: RowId | null;
}

export interface SaveStartEvent {
  updateCount: {
    new: number;
    modified: number;
    deleted: number;
  };
}

export interface SaveEndEvent {
  success: boolean;
  duration: number;
  error?: string;
}

export interface RowStatusChangedEvent {
  rowId: RowId;
  oldStatus: RowStatus;
  newStatus: RowStatus;
}

// ── 原有类型 ────────────────────────────────────────────────────────────────

export interface DataRow {
  id: RowId;
  rowNumber: RowNumber;
  bufferType: BufferType;
  status: RowStatus;
  raw: Record<FieldName, RawValue>;
  computed: Record<FieldName, ComputedValue>;
  changes: Record<FieldName, FieldChange>;
  /** 列级变更历史 */
  _changeHistory?: FieldChangeRecord[];
}

export interface UpdateData {
  updateType: UpdateType;
  rowId: RowId;
  data: Record<FieldName, RawValue>;
  changedFields?: FieldName[];
  timestamp: number;
}

export interface FilterCondition {
  field?: FieldName;
  operator?: FilterOperator;
  value?: RawValue | RawValue[];
  connector?: 'and' | 'or';
  children?: FilterCondition[];
  expression?: (row: DataRow) => boolean;
}

export interface SortRule {
  field: FieldName;
  direction: 'asc' | 'desc';
}

export interface GroupRule {
  field: FieldName;
}

export interface DuplicateRule {
  fields: FieldName[];
  ignoreCase?: boolean;
}

export interface AggregationFormula {
  id: string;
  name: string;
  type: AggregationType;
  field?: FieldName;
  filter?: FilterCondition;
  groupBy?: GroupRule;
  compute?: (rows: DataRow[]) => ComputedValue;
}

export interface AggregationResult {
  formulaId: string;
  value: ComputedValue;
  groups?: Record<string, ComputedValue>;
  timestamp: number;
}

export interface QueryOptions {
  filter?: FilterCondition;
  sort?: SortRule[];
  skip?: number;
  take?: number;
  includeFiltered?: boolean;
  includeDeleted?: boolean;
}

export interface QueryResult {
  rows: DataRow[];
  total: number;
  hasMore: boolean;
}

export interface BufferStats {
  count: number;
  newCount: number;
  modifiedCount: number;
}

export interface ValidationError {
  field: FieldName;
  rowId?: RowId;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface FieldDefinition {
  name: FieldName;
  type: 'string' | 'number' | 'boolean' | 'date' | 'virtual';
  required?: boolean;
  readonly?: boolean;
  virtual?: boolean;
  defaultValue?: RawValue;
  displayName?: string;
  formula?: (row: DataRow) => ComputedValue;
  validate?: (value: RawValue) => boolean | string;
  /** ItemChanged 校验函数，返回 true 表示接受，string 表示拒绝原因 */
  itemValidate?: (oldValue: RawValue, newValue: RawValue) => true | string;
}

export interface DataStoreConfig {
  name: string;
  fields: FieldDefinition[];
  /** 最大撤销栈深度 */
  maxUndoStackSize?: number;
  /** 是否启用变更历史记录 */
  enableChangeHistory?: boolean;
}

export interface MergeSource {
  storeName: string;
  fieldMapping?: Record<FieldName, FieldName>;
  filter?: FilterCondition;
}

export interface MergeOptions {
  sources: MergeSource[];
  strategy?: 'union' | 'intersection';
  dedupe?: DuplicateRule;
}

// ============================================================================
// 过滤求值器
// ============================================================================

export class FilterEvaluator {
  static evaluate(condition: FilterCondition, row: DataRow): boolean {
    if (condition.expression) {
      return condition.expression(row);
    }

    if (condition.children && condition.children.length > 0) {
      const connector = condition.connector ?? 'and';
      if (connector === 'and') {
        return condition.children.every(c => this.evaluate(c, row));
      } else {
        return condition.children.some(c => this.evaluate(c, row));
      }
    }

    if (!condition.field || !condition.operator) return true;

    const raw = row.raw[condition.field];
    const computed = row.computed[condition.field];
    const val = computed !== undefined ? computed : raw;

    return this.compare(val as RawValue, condition.operator, condition.value);
  }

  private static compare(val: RawValue, op: FilterOperator, target: RawValue | RawValue[] | undefined): boolean {
    switch (op) {
      case 'eq': return val === target;
      case 'ne': return val !== target;
      case 'gt': return (val as number) > (target as number);
      case 'gte': return (val as number) >= (target as number);
      case 'lt': return (val as number) < (target as number);
      case 'lte': return (val as number) <= (target as number);
      case 'in': return Array.isArray(target) && target.includes(val);
      case 'nin': return Array.isArray(target) && !target.includes(val);
      case 'contains':
        if (typeof val === 'string' && typeof target === 'string') {
          return val.toLowerCase().includes(target.toLowerCase());
        }
        return false;
      case 'startsWith':
        return typeof val === 'string' && typeof target === 'string' && val.toLowerCase().startsWith(target.toLowerCase());
      case 'endsWith':
        return typeof val === 'string' && typeof target === 'string' && val.toLowerCase().endsWith(target.toLowerCase());
      case 'regex':
        return typeof val === 'string' && typeof target === 'string' && new RegExp(target).test(val);
      case 'isNull': return val === null || val === undefined || val === '';
      case 'isNotNull': return val !== null && val !== undefined && val !== '';
      default: return true;
    }
  }
}

// ============================================================================
// 排序器
// ============================================================================

export class Sorter {
  static sort(rows: DataRow[], rules: SortRule[]): DataRow[] {
    return [...rows].sort((a, b) => {
      for (const rule of rules) {
        const av = (a.computed[rule.field] ?? a.raw[rule.field]) as RawValue;
        const bv = (b.computed[rule.field] ?? b.raw[rule.field]) as RawValue;
        const cmp = this.compareValues(av, bv);
        if (cmp !== 0) return rule.direction === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
  }

  private static compareValues(a: RawValue, b: RawValue): number {
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;
    if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return String(a).localeCompare(String(b));
  }
}

// ============================================================================
// 聚合器
// ============================================================================

export class AggregatorImpl {
  private formulas = new Map<string, AggregationFormula>();
  private cache = new Map<string, AggregationResult>();

  register(formula: AggregationFormula): void {
    this.formulas.set(formula.id, formula);
    this.cache.delete(formula.id);
  }

  clearCache(): void {
    this.cache.clear();
  }

  compute(formulaId: string, rows: DataRow[]): AggregationResult | undefined {
    if (this.cache.has(formulaId)) return this.cache.get(formulaId);
    const formula = this.formulas.get(formulaId);
    if (!formula) return undefined;

    let targetRows = rows;
    if (formula.filter) {
      targetRows = rows.filter(r => FilterEvaluator.evaluate(formula.filter!, r));
    }

    let result: AggregationResult;

    if (formula.groupBy) {
      const groups: Record<string, ComputedValue> = {};
      const grouped = new Map<string, DataRow[]>();
      for (const row of targetRows) {
        const key = String(row.raw[formula.groupBy!.field] ?? '');
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(row);
      }
      for (const [key, groupRows] of grouped) {
        groups[key] = this.computeValue(formula, groupRows);
      }
      result = { formulaId, value: null, groups, timestamp: Date.now() };
    } else {
      result = { formulaId, value: this.computeValue(formula, targetRows), timestamp: Date.now() };
    }

    this.cache.set(formulaId, result);
    return result;
  }

  computeAll(rows: DataRow[]): Record<string, AggregationResult> {
    const result: Record<string, AggregationResult> = {};
    for (const id of this.formulas.keys()) {
      const r = this.compute(id, rows);
      if (r) result[id] = r;
    }
    return result;
  }

  private computeValue(formula: AggregationFormula, rows: DataRow[]): ComputedValue {
    if (formula.compute) return formula.compute(rows);
    if (!formula.field) return rows.length;

    const nums = rows
      .map(r => r.computed[formula.field!] ?? r.raw[formula.field!])
      .filter(v => typeof v === 'number') as number[];

    switch (formula.type) {
      case 'sum': return nums.reduce((a, b) => a + b, 0);
      case 'avg': return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      case 'count': return rows.length;
      case 'min': return nums.length ? Math.min(...nums) : null;
      case 'max': return nums.length ? Math.max(...nums) : null;
      case 'distinct': {
        const vals = rows.map(r => r.raw[formula.field!]);
        return [...new Set(vals)].length;
      }
      case 'first': return rows[0]?.raw[formula.field!] ?? null;
      case 'last': return rows[rows.length - 1]?.raw[formula.field!] ?? null;
      default: return null;
    }
  }
}

// ============================================================================
// 撤销栈管理器
// ============================================================================

export class UndoStackManager {
  private _undoStack: Command[] = [];
  private _redoStack: Command[] = [];
  private _maxSize: number;
  private _listeners = new Set<(stack: UndoStack) => void>();

  constructor(maxSize: number = 100) {
    this._maxSize = maxSize;
  }

  get undoCount(): number { return this._undoStack.length; }
  get redoCount(): number { return this._redoStack.length; }
  get canUndo(): boolean { return this._undoStack.length > 0; }
  get canRedo(): boolean { return this._redoStack.length > 0; }

  getStackInfo(): UndoStack {
    return {
      undoCount: this.undoCount,
      redoCount: this.redoCount,
      canUndo: this.canUndo,
      canRedo: this.canRedo,
    };
  }

  push(command: Command): void {
    // 如果执行命令时重做栈不为空，清空重做栈（新的操作会打断重做链）
    this._redoStack = [];
    
    this._undoStack.push(command);
    
    // 限制栈大小
    if (this._undoStack.length > this._maxSize) {
      this._undoStack.shift();
    }
    
    this._notifyChange();
  }

  undo(): Command | undefined {
    const command = this._undoStack.pop();
    if (command && command.canUndo) {
      command.undo();
      this._redoStack.push(command);
      this._notifyChange();
    }
    return command;
  }

  redo(): Command | undefined {
    const command = this._redoStack.pop();
    if (command && command.canRedo) {
      command.execute();
      this._undoStack.push(command);
      this._notifyChange();
    }
    return command;
  }

  clear(): void {
    this._undoStack = [];
    this._redoStack = [];
    this._notifyChange();
  }

  /** 获取撤销历史 */
  getUndoHistory(): { id: string; type: CommandType; description: string; timestamp: number }[] {
    return this._undoStack.map(cmd => ({
      id: cmd.id,
      type: cmd.type,
      description: cmd.description,
      timestamp: cmd.timestamp,
    }));
  }

  /** 获取重做历史 */
  getRedoHistory(): { id: string; type: CommandType; description: string; timestamp: number }[] {
    return this._redoStack.map(cmd => ({
      id: cmd.id,
      type: cmd.type,
      description: cmd.description,
      timestamp: cmd.timestamp,
    }));
  }

  onChange(listener: (stack: UndoStack) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _notifyChange(): void {
    const stack = this.getStackInfo();
    this._listeners.forEach(l => l(stack));
  }
}

// ============================================================================
// DataStore 实现（Phase 1 增强版）
// ============================================================================

let globalRowId = 0;
let commandIdCounter = 0;

function generateCommandId(): string {
  return `cmd_${++commandIdCounter}_${Date.now()}`;
}

export class DataStoreImpl {
  private _config: DataStoreConfig;
  private _idCounter = 0;
  private _mainRows: DataRow[] = [];
  private _filteredRows: DataRow[] = [];
  private _deletedRows: DataRow[] = [];
  private _aggregator = new AggregatorImpl();
  private _listeners = new Map<DataStoreEventType, Set<EventListener>>();
  
  // Phase 1: 撤销栈
  private _undoStack: UndoStackManager;
  
  // Phase 1: ItemChanged 处理器
  private _itemChangedHandlers: ItemChangedHandler[] = [];
  
  // Phase 1: 当前焦点行
  private _focusedRowId: RowId | null = null;

  constructor(config: DataStoreConfig) {
    this._config = config;
    this._undoStack = new UndoStackManager(config.maxUndoStackSize ?? 100);
    
    // 监听撤销栈变化
    this._undoStack.onChange((stack) => {
      this._emit('undoStackChanged', stack);
    });
  }

  get name(): string { return this._config.name; }
  get config(): DataStoreConfig { return this._config; }
  get fields(): FieldDefinition[] { return this._config.fields; }
  get focusedRowId(): RowId | null { return this._focusedRowId; }

  // ── 撤销栈 API ──────────────────────────────────────────────────────────

  /** 获取撤销栈状态 */
  getUndoStack(): UndoStack {
    return this._undoStack.getStackInfo();
  }

  /** 撤销上一步操作 */
  undo(): boolean {
    const cmd = this._undoStack.undo();
    return !!cmd;
  }

  /** 重做上一步撤销 */
  redo(): boolean {
    const cmd = this._undoStack.redo();
    return !!cmd;
  }

  /** 是否可撤销 */
  canUndo(): boolean {
    return this._undoStack.canUndo;
  }

  /** 是否可重做 */
  canRedo(): boolean {
    return this._undoStack.canRedo;
  }

  /** 获取撤销历史 */
  getUndoHistory(): { id: string; type: CommandType; description: string; timestamp: number }[] {
    return this._undoStack.getUndoHistory();
  }

  /** 获取重做历史 */
  getRedoHistory(): { id: string; type: CommandType; description: string; timestamp: number }[] {
    return this._undoStack.getRedoHistory();
  }

  /** 清空撤销历史 */
  clearUndoHistory(): void {
    this._undoStack.clear();
  }

  // ── ItemChanged API ──────────────────────────────────────────────────────

  /** 注册 ItemChanged 处理器（优先级越高越先执行） */
  onItemChanged(handler: ItemChangedHandler): () => void {
    this._itemChangedHandlers.push(handler);
    return () => {
      const idx = this._itemChangedHandlers.indexOf(handler);
      if (idx !== -1) this._itemChangedHandlers.splice(idx, 1);
    };
  }

  /** 触发 ItemChanged 校验（同步） */
  async validateItemChange(rowId: RowId, field: FieldName, newValue: RawValue): Promise<ItemChangedEvent> {
    const row = this._findRowById(rowId);
    if (!row) {
      return {
        rowId, field, oldValue: null, newValue,
        rejectReason: { code: 'ROW_NOT_FOUND', message: '行不存在' },
        handled: true, action: 'reject',
      };
    }

    const fieldDef = this._config.fields.find(f => f.name === field);
    if (!fieldDef) {
      return {
        rowId, field, oldValue: row.raw[field], newValue,
        rejectReason: { code: 'FIELD_NOT_FOUND', message: `字段 ${field} 不存在` },
        handled: true, action: 'reject',
      };
    }

    if (fieldDef.readonly) {
      return {
        rowId, field, oldValue: row.raw[field], newValue,
        rejectReason: { code: 'FIELD_READONLY', message: `${fieldDef.displayName ?? field} 是只读字段` },
        handled: true, action: 'reject',
      };
    }

    const oldValue = row.raw[field];
    let event: ItemChangedEvent = {
      rowId, field, oldValue, newValue,
      handled: false, action: 'accept',
    };

    // 依次调用处理器
    for (const handler of this._itemChangedHandlers) {
      const result = await handler(event);
      event.action = result;
      if (result === 'reject') {
        event.handled = true;
        event.rejectReason = { code: 'HANDLER_REJECT', message: '处理器拒绝' };
        break;
      }
      if (result === 'retry') {
        event.handled = true;
        break;
      }
    }

    // 调用字段定义的 itemValidate
    if (fieldDef.itemValidate && event.action !== 'reject') {
      const validationResult = fieldDef.itemValidate(oldValue, newValue);
      if (validationResult !== true) {
        event.action = 'reject';
        event.handled = true;
        event.rejectReason = {
          code: 'FIELD_VALIDATION_FAILED',
          message: typeof validationResult === 'string' ? validationResult : '字段校验失败',
        };
      }
    }

    return event;
  }

  // ── 列级变更跟踪 API ─────────────────────────────────────────────────────

  /** 获取行的所有变更字段及其新旧值 */
  getRowFieldChanges(rowId: RowId): FieldChangeRecord[] {
    const row = this._findRowById(rowId);
    if (!row) return [];
    return Object.entries(row.changes)
      .filter(([, change]) => !change.undone)
      .map(([field, change]) => ({ field, change }));
  }

  /** 获取行的完整变更历史 */
  getRowChangeHistory(rowId: RowId): RowChangeHistory | null {
    const row = this._findRowById(rowId);
    if (!row) return null;
    
    const changes: FieldChangeRecord[] = [];
    if (row._changeHistory) {
      changes.push(...row._changeHistory);
    }
    // 也添加当前未撤销的 changes
    for (const [field, change] of Object.entries(row.changes)) {
      if (!change.undone) {
        changes.push({ field, change });
      }
    }
    
    if (changes.length === 0) return null;
    
    return {
      rowId,
      changes,
      lastModified: Math.max(...changes.map(c => c.change.timestamp)),
    };
  }

  /** 获取所有有变更的行 */
  getChangedRows(): { row: DataRow; changes: FieldChangeRecord[] }[] {
    const result: { row: DataRow; changes: FieldChangeRecord[] }[] = [];
    
    for (const row of [...this._mainRows, ...this._filteredRows]) {
      // 新增行也需要同步（没有字段变更也包含）
      if (row.status === 'new') {
        result.push({ row, changes: [] });
        continue;
      }
      const changes = this.getRowFieldChanges(row.id);
      if (changes.length > 0) {
        result.push({ row, changes });
      }
    }
    
    return result;
  }

  /** 获取单个字段的变更记录 */
  getFieldChange(rowId: RowId, field: FieldName): FieldChange | null {
    const row = this._findRowById(rowId);
    if (!row) return null;
    return row.changes[field] ?? null;
  }

  /** 获取字段的最后一次变更值 */
  getFieldOriginalValue(rowId: RowId, field: FieldName): RawValue | null {
    const change = this.getFieldChange(rowId, field);
    return change ? change.oldValue : null;
  }

  /** 撤销单个字段的变更 */
  undoFieldChange(rowId: RowId, field: FieldName): boolean {
    const row = this._findRowById(rowId);
    if (!row) return false;
    
    const change = row.changes[field];
    if (!change) return false;
    
    // 恢复旧值
    row.raw[field] = change.oldValue;
    change.undone = true;
    
    // 重新计算虚拟列
    this._computeVirtual(row);
    
    // 检查是否还有未撤销的变更
    const hasChanges = Object.values(row.changes).some(c => !c.undone);
    if (!hasChanges) {
      row.status = row.status === 'modified' ? 'normal' : row.status;
    }
    
    this._aggregator.clearCache();
    this._emit('rowUpdated', row);
    return true;
  }

  // ── 生命周期事件 API ─────────────────────────────────────────────────────

  /** 设置焦点行 */
  setFocusedRow(rowId: RowId | null): void {
    const prevId = this._focusedRowId;
    this._focusedRowId = rowId;
    
    this._emit('itemFocusChanged', {
      previousRowId: prevId,
      currentRowId: rowId,
    } as ItemFocusChangedEvent);
  }

  /** 获取焦点行 */
  getFocusedRow(): DataRow | null {
    return this._focusedRowId ? this._findRowById(this._focusedRowId) ?? null : null;
  }

  /** 开始保存前触发 */
  async beginSave(): Promise<SaveStartEvent> {
    const updates = this.generateDiffUpdates();
    const event: SaveStartEvent = {
      updateCount: {
        new: updates.filter(u => u.updateType === 'new').length,
        modified: updates.filter(u => u.updateType === 'modified').length,
        deleted: updates.filter(u => u.updateType === 'deleted').length,
      },
    };
    this._emit('saveStart', event);
    return event;
  }

  /** 完成保存后触发 */
  endSave(success: boolean, error?: string): void {
    this._emit('saveEnd', {
      success,
      duration: 0,
      error,
    } as SaveEndEvent);
  }

  // ── 数据设置 ──────────────────────────────────────────────────────────────

  setData(data: Record<FieldName, RawValue>[], options: { skipRetrieveEvents?: boolean } = {}): void {
    const startTime = Date.now();
    
    if (!options.skipRetrieveEvents) {
      this._emit('retrieveStart', { storeName: this._config.name } as RetrieveStartEvent);
    }
    
    this.reset({ skipEvents: true });
    for (const raw of data) this._addRowToBuffer(raw, 'main');
    
    if (!options.skipRetrieveEvents) {
      this._emit('retrieveEnd', {
        storeName: this._config.name,
        rowCount: this._mainRows.length,
        duration: Date.now() - startTime,
      } as RetrieveEndEvent);
    }
    
    this._emit('dataRefreshed');
  }

  reset(options: { skipEvents?: boolean } = {}): void {
    this._idCounter = 0;
    this._mainRows = [];
    this._filteredRows = [];
    this._deletedRows = [];
    this._focusedRowId = null;
    this._aggregator.clearCache();
    this._undoStack.clear();
    
    if (!options.skipEvents) {
      this._emit('reset');
    }
  }

  // ── 行操作 ────────────────────────────────────────────────────────────────

  addRow(raw: Record<FieldName, RawValue>, buffer: BufferType = 'main', options: { skipUndo?: boolean; skipEvents?: boolean } = {}): DataRow {
    const row = this._addRowToBuffer(raw, buffer);
    this._aggregator.clearCache();
    
    if (!options.skipUndo) {
      const cmd: Command = {
        id: generateCommandId(),
        type: 'addRow',
        timestamp: Date.now(),
        description: `新增行 #${row.rowNumber}`,
        execute: () => this._addRowToBuffer(raw, buffer),
        undo: () => this._removeRowFromBuffer(row.id),
        canUndo: true,
        canRedo: true,  // 支持重做
      };
      this._undoStack.push(cmd);
    }
    
    if (!options.skipEvents) {
      this._emit('rowAdded', row);
    }
    
    return row;
  }

  addRows(raws: Record<FieldName, RawValue>[], buffer: BufferType = 'main', options: { skipUndo?: boolean; skipEvents?: boolean } = {}): DataRow[] {
    const rows = raws.map(r => this._addRowToBuffer(r, buffer));
    this._aggregator.clearCache();
    
    if (!options.skipUndo) {
      const cmd: Command = {
        id: generateCommandId(),
        type: 'addRow',
        timestamp: Date.now(),
        description: `批量新增 ${rows.length} 行`,
        execute: () => raws.forEach(r => this._addRowToBuffer(r, buffer)),
        undo: () => rows.forEach(r => this._removeRowFromBuffer(r.id)),
        canUndo: true,
        canRedo: false,
      };
      this._undoStack.push(cmd);
    }
    
    if (!options.skipEvents) {
      this._emit('rowAdded', rows);
    }
    
    return rows;
  }

  /**
   * 更新行（Phase 1 增强版）
   * - 支持 ItemChanged 拒绝机制
   * - 支持撤销
   * - 记录列级变更历史
   */
  async updateRow(
    rowId: RowId,
    data: Partial<Record<FieldName, RawValue>>,
    options: {
      skipItemChanged?: boolean;
      skipUndo?: boolean;
      skipEvents?: boolean;
      forceAccept?: boolean; // 跳过 ItemChanged 校验
    } = {}
  ): Promise<{ success: boolean; rejected?: ItemChangedEvent }> {
    const row = this._findRowById(rowId);
    if (!row) return { success: false };

    const rejectedEvents: ItemChangedEvent[] = [];

    // 逐字段处理 ItemChanged
    if (!options.skipItemChanged && !options.forceAccept) {
      for (const [field, newValue] of Object.entries(data)) {
        const event = await this.validateItemChange(rowId, field, newValue as RawValue);
        if (event.action === 'reject') {
          this._emit('itemChangedRejected', {
            ...event,
            rowId, field,
            oldValue: row.raw[field],
            newValue: newValue as RawValue,
            accepted: false,
          } as ItemChangedEventData);
          rejectedEvents.push(event);
        } else if (event.action === 'retry') {
          // retry 意味着用户会重试，这里先记录
          rejectedEvents.push(event);
        }
      }
    }

    // 如果有拒绝事件且不是强制接受，返回第一个拒绝
    if (rejectedEvents.length > 0 && !options.forceAccept) {
      return { success: false, rejected: rejectedEvents[0] };
    }

    const oldStatus = row.status;
    const fieldChanges: FieldChangeRecord[] = [];

    // 应用变更
    for (const [field, newValue] of Object.entries(data)) {
      const oldValue = row.raw[field];
      const timestamp = Date.now();
      
      // 记录变更
      row.raw[field] = newValue as RawValue;
      row.changes[field] = { oldValue, newValue: newValue as RawValue, timestamp };
      
      // 记录历史
      if (!row._changeHistory) row._changeHistory = [];
      row._changeHistory.push({ field, change: row.changes[field] });
      
      fieldChanges.push({ field, change: row.changes[field] });
      
      // 触发 ItemChanged 事件
      if (!options.skipEvents) {
        this._emit('itemChanged', {
          rowId, field, oldValue, newValue,
          action: 'accept',
          accepted: true,
        } as ItemChangedEventData);
      }
    }

    // 更新行状态（只在状态真正改变时触发事件）
    const wasNormal = oldStatus === 'normal';
    if (wasNormal) {
      row.status = 'modified';
      if (!options.skipEvents) {
        this._emit('rowStatusChanged', {
          rowId, oldStatus, newStatus: 'modified',
        } as RowStatusChangedEvent);
      }
    }

    this._computeVirtual(row);
    this._aggregator.clearCache();

    // 添加撤销命令
    if (!options.skipUndo) {
      const cmd: Command = {
        id: generateCommandId(),
        type: 'updateField',
        timestamp: Date.now(),
        description: `更新行 #${row.rowNumber} 的 ${fieldChanges.length} 个字段`,
        execute: () => {
          for (const { field, change } of fieldChanges) {
            row.raw[field] = change.newValue;
            row.changes[field] = { ...change, undone: false };
          }
          if (row.status === 'normal') {
            row.status = 'modified';
          }
        },
        undo: () => {
          for (const { field, change } of fieldChanges) {
            row.raw[field] = change.oldValue;
            change.undone = true;
          }
          const hasChanges = Object.values(row.changes).some(c => !c.undone);
          if (!hasChanges && row.status === 'modified') {
            row.status = 'normal';
          }
        },
        canUndo: true,
        canRedo: false,
      };
      this._undoStack.push(cmd);
    }

    if (!options.skipEvents) {
      this._emit('rowUpdated', row);
    }

    return { success: true };
  }

  /**
   * 同步版本的 updateRow（不进行 ItemChanged 校验）
   */
  updateRowSync(
    rowId: RowId,
    data: Partial<Record<FieldName, RawValue>>,
    options: { skipUndo?: boolean; skipEvents?: boolean } = {}
  ): boolean {
    return this.updateRow(rowId, data, { ...options, skipItemChanged: true, forceAccept: true }).then(r => r.success).catch(() => false) as unknown as boolean;
  }

  deleteRow(rowId: RowId, options: { skipUndo?: boolean; skipEvents?: boolean } = {}): boolean {
    const row = this._findRowById(rowId);
    if (!row) return false;
    
    const bufferRows = this._getBufferRows(row.bufferType);
    const idx = bufferRows.findIndex(r => r.id === rowId);
    if (idx === -1) return false;
    
    const [removed] = bufferRows.splice(idx, 1);
    removed.status = 'deleted';
    removed.bufferType = 'deleted';
    this._deletedRows.push(removed);
    
    this._renumber(bufferRows);
    this._aggregator.clearCache();

    // 清除焦点行
    if (this._focusedRowId === rowId) {
      this._focusedRowId = null;
    }

    if (!options.skipUndo) {
      const cmd: Command = {
        id: generateCommandId(),
        type: 'deleteRow',
        timestamp: Date.now(),
        description: `删除行 #${removed.rowNumber}`,
        execute: () => {
          removed.status = 'deleted';
          removed.bufferType = 'deleted';
          this._deletedRows.push(removed);
          this._renumber(bufferRows);
        },
        undo: () => {
          const delIdx = this._deletedRows.findIndex(r => r.id === rowId);
          if (delIdx !== -1) {
            const [restored] = this._deletedRows.splice(delIdx, 1);
            restored.status = restored.status === 'deleted' ? 'normal' : restored.status;
            restored.bufferType = 'main';
            bufferRows.push(restored);
            this._renumber(bufferRows);
          }
        },
        canUndo: true,
        canRedo: false,
      };
      this._undoStack.push(cmd);
    }

    if (!options.skipEvents) {
      this._emit('rowRemoved', removed);
    }

    return true;
  }

  restoreRow(rowId: RowId, options: { skipUndo?: boolean; skipEvents?: boolean } = {}): boolean {
    const idx = this._deletedRows.findIndex(r => r.id === rowId);
    if (idx === -1) return false;
    
    const [row] = this._deletedRows.splice(idx, 1);
    row.status = 'normal';
    row.bufferType = 'main';
    this._mainRows.push(row);
    this._renumber(this._mainRows);
    this._aggregator.clearCache();

    if (!options.skipUndo) {
      const cmd: Command = {
        id: generateCommandId(),
        type: 'restoreRow',
        timestamp: Date.now(),
        description: `恢复行 #${row.rowNumber}`,
        execute: () => {
          // 幂等 redo：检查是否已经在 main 中，不在则从 deleted 恢复
          const alreadyRestored = this._mainRows.some(r => r.id === rowId);
          if (!alreadyRestored) {
            const delIdx = this._deletedRows.findIndex(r => r.id === rowId);
            if (delIdx !== -1) {
              const [restored] = this._deletedRows.splice(delIdx, 1);
              restored.status = 'normal';
              restored.bufferType = 'main';
              this._mainRows.push(restored);
              this._renumber(this._mainRows);
            }
          }
        },
        undo: () => {
          // 幂等 undo：检查是否已经在 deleted 中，不在则从 main 移除
          const alreadyDeleted = this._deletedRows.some(r => r.id === rowId);
          if (!alreadyDeleted) {
            const mainIdx = this._mainRows.findIndex(r => r.id === rowId);
            if (mainIdx !== -1) {
              const [removed] = this._mainRows.splice(mainIdx, 1);
              removed.status = 'deleted';
              removed.bufferType = 'deleted';
              this._deletedRows.push(removed);
              this._renumber(this._mainRows);
            }
          }
        },
        canUndo: true,
        canRedo: true,
      };
      this._undoStack.push(cmd);
    }

    if (!options.skipEvents) {
      this._emit('rowMoved', row);
    }

    return true;
  }

  permanentDelete(rowId: RowId, options: { skipUndo?: boolean; skipEvents?: boolean } = {}): boolean {
    const idx = this._deletedRows.findIndex(r => r.id === rowId);
    if (idx === -1) return false;
    
    const [row] = this._deletedRows.splice(idx, 1);
    const rowData = { ...row.raw, id: row.id, rowNumber: row.rowNumber };
    const deletedTimestamp = row._changeHistory ? [...row._changeHistory] : [];
    const deletedChanges = { ...row.changes };

    if (!options.skipUndo) {
      const cmd: Command = {
        id: generateCommandId(),
        type: 'permanentDelete',
        timestamp: Date.now(),
        description: `永久删除行 #${row.rowNumber}`,
        execute: () => {
          // 行已在函数开始时移除，这里只记录已删除的事实
          // 无法再次移除同一行
        },
        undo: () => {
          // 恢复行到 _deletedRows（利用保存的数据）
          const restored: DataRow = {
            id: rowData.id,
            rowNumber: rowData.rowNumber,
            bufferType: 'deleted',
            status: 'deleted',
            raw: { ...rowData },
            computed: {},
            changes: { ...deletedChanges },
            _changeHistory: [...deletedTimestamp],
          };
          this._deletedRows.push(restored);
        },
        canUndo: true,
        canRedo: false,
      };
      this._undoStack.push(cmd);
    }

    return true;
  }

  // ── 查询 ──────────────────────────────────────────────────────────────────

  getRows(): DataRow[] { return [...this._mainRows]; }
  getRowById(rowId: RowId): DataRow | undefined {
    return this._findRowById(rowId);
  }
  getRowCount(): number { return this._mainRows.length; }

  query(options: QueryOptions = {}): QueryResult {
    let rows = [...this._mainRows];
    if (options.includeFiltered) rows = [...rows, ...this._filteredRows];
    if (options.includeDeleted) rows = [...rows, ...this._deletedRows];

    if (options.filter) {
      rows = rows.filter(r => FilterEvaluator.evaluate(options.filter!, r));
    }

    const total = rows.length;

    if (options.sort?.length) {
      rows = Sorter.sort(rows, options.sort);
    }

    if (options.skip) rows = rows.slice(options.skip);
    const hasMore = options.take ? rows.length > options.take : false;
    if (options.take) rows = rows.slice(0, options.take);

    return { rows, total, hasMore };
  }

  findOne(filter: FilterCondition): DataRow | undefined {
    return this._mainRows.find(r => FilterEvaluator.evaluate(filter, r));
  }

  findMany(filter: FilterCondition): DataRow[] {
    return this._mainRows.filter(r => FilterEvaluator.evaluate(filter, r));
  }

  // ── 过滤 ──────────────────────────────────────────────────────────────────

  applyFilter(filter: FilterCondition): void {
    const pass: DataRow[] = [];
    const fail: DataRow[] = [];
    for (const row of this._mainRows) {
      (FilterEvaluator.evaluate(filter, row) ? pass : fail).push(row);
    }
    for (const row of fail) {
      row.bufferType = 'filtered';
      this._filteredRows.push(row);
    }
    this._mainRows = pass;
    this._renumber(this._mainRows);
    this._renumber(this._filteredRows);
    this._emit('bufferChanged');
  }

  clearFilter(): void {
    for (const row of this._filteredRows) {
      row.bufferType = 'main';
      this._mainRows.push(row);
    }
    this._filteredRows = [];
    this._renumber(this._mainRows);
    this._emit('bufferChanged');
  }

  // ── 排序 / 分组 / 查重 ────────────────────────────────────────────────────

  sort(rules: SortRule[]): DataRow[] {
    return Sorter.sort(this._mainRows, rules);
  }

  groupBy(rules: GroupRule[]): Map<string, DataRow[]> {
    const map = new Map<string, DataRow[]>();
    for (const row of this._mainRows) {
      const key = rules.map(r => String(row.raw[r.field] ?? '')).join('|');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return map;
  }

  findDuplicates(rule: DuplicateRule): Map<string, DataRow[]> {
    const map = new Map<string, DataRow[]>();
    for (const row of this._mainRows) {
      const key = rule.fields.map(f => {
        const v = String(row.raw[f] ?? '');
        return rule.ignoreCase ? v.toLowerCase() : v;
      }).join('|');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    const result = new Map<string, DataRow[]>();
    for (const [k, v] of map) {
      if (v.length > 1) result.set(k, v);
    }
    return result;
  }

  // ── 聚合 ──────────────────────────────────────────────────────────────────

  registerAggregation(formula: AggregationFormula): void {
    this._aggregator.register(formula);
  }

  aggregate(formulaId: string): AggregationResult | undefined {
    return this._aggregator.compute(formulaId, this._mainRows);
  }

  aggregateAll(): Record<string, AggregationResult> {
    return this._aggregator.computeAll(this._mainRows);
  }

  // ── 校验 ──────────────────────────────────────────────────────────────────

  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    for (const row of this._mainRows) {
      errors.push(...this._validateRow(row));
    }
    return { valid: errors.length === 0, errors };
  }

  validateRow(rowId: RowId): ValidationResult {
    const row = this._findRowById(rowId);
    if (!row) return { valid: true, errors: [] };
    const errors = this._validateRow(row);
    return { valid: errors.length === 0, errors };
  }

  // ── 差异更新 ──────────────────────────────────────────────────────────────

  generateDiffUpdates(): UpdateData[] {
    const updates: UpdateData[] = [];
    const ts = Date.now();

    for (const row of this._mainRows) {
      if (row.status === 'new') {
        updates.push({ updateType: 'new', rowId: row.id, data: { ...row.raw }, timestamp: ts });
      } else if (row.status === 'modified') {
        updates.push({
          updateType: 'modified',
          rowId: row.id,
          data: { ...row.raw },
          changedFields: Object.keys(row.changes).filter(f => !row.changes[f].undone),
          timestamp: ts,
        });
      }
    }
    for (const row of this._filteredRows) {
      if (row.status === 'new') {
        updates.push({ updateType: 'new', rowId: row.id, data: { ...row.raw }, timestamp: ts });
      } else if (row.status === 'modified') {
        updates.push({
          updateType: 'modified',
          rowId: row.id,
          data: { ...row.raw },
          changedFields: Object.keys(row.changes).filter(f => !row.changes[f].undone),
          timestamp: ts,
        });
      }
    }
    for (const row of this._deletedRows) {
      updates.push({ updateType: 'deleted', rowId: row.id, data: { ...row.raw }, timestamp: ts });
    }

    return updates;
  }

  clearUpdates(): void {
    for (const row of [...this._mainRows, ...this._filteredRows]) {
      if (row.status === 'modified' || row.status === 'new') {
        row.status = 'normal';
        row.changes = {};
        if (row._changeHistory) row._changeHistory = [];
      }
    }
  }

  // ── 统计 ──────────────────────────────────────────────────────────────────

  getStats(): { main: BufferStats; filtered: BufferStats; deleted: BufferStats } {
    return {
      main: this._bufferStats(this._mainRows),
      filtered: this._bufferStats(this._filteredRows),
      deleted: this._bufferStats(this._deletedRows),
    };
  }

  // ── 事件 ──────────────────────────────────────────────────────────────────

  on(type: DataStoreEventType, listener: EventListener): () => void {
    if (!this._listeners.has(type)) this._listeners.set(type, new Set());
    this._listeners.get(type)!.add(listener);
    return () => this._listeners.get(type)?.delete(listener);
  }

  // ── 私有方法 ──────────────────────────────────────────────────────────────

  private _addRowToBuffer(raw: Record<FieldName, RawValue>, buffer: BufferType): DataRow {
    this._idCounter++;
    const bufferRows = buffer === 'main' ? this._mainRows
      : buffer === 'filtered' ? this._filteredRows
      : this._deletedRows;

    const row: DataRow = {
      id: this._idCounter,
      rowNumber: bufferRows.length + 1,
      bufferType: buffer,
      status: 'new',
      raw: { ...raw },
      computed: {},
      changes: {},
      _changeHistory: [],
    };

    // 填充默认值
    for (const field of this._config.fields) {
      if (row.raw[field.name] === undefined && field.defaultValue !== undefined) {
        row.raw[field.name] = field.defaultValue;
      }
    }

    this._computeVirtual(row);
    bufferRows.push(row);
    return row;
  }

  private _removeRowFromBuffer(rowId: RowId): boolean {
    const row = this._findRowById(rowId);
    if (!row) return false;
    
    const bufferRows = this._getBufferRows(row.bufferType);
    const idx = bufferRows.findIndex(r => r.id === rowId);
    if (idx !== -1) {
      bufferRows.splice(idx, 1);
      this._renumber(bufferRows);
    }
    return true;
  }

  private _getBufferRows(bufferType: BufferType): DataRow[] {
    return bufferType === 'main' ? this._mainRows
      : bufferType === 'filtered' ? this._filteredRows
      : this._deletedRows;
  }

  private _computeVirtual(row: DataRow): void {
    for (const field of this._config.fields) {
      if (field.virtual && field.formula) {
        try {
          row.computed[field.name] = field.formula(row);
        } catch {
          row.computed[field.name] = null;
        }
      }
    }
  }

  private _findRowById(rowId: RowId): DataRow | undefined {
    return this._mainRows.find(r => r.id === rowId)
      ?? this._filteredRows.find(r => r.id === rowId)
      ?? this._deletedRows.find(r => r.id === rowId);
  }

  private _renumber(rows: DataRow[]): void {
    rows.forEach((r, i) => r.rowNumber = i + 1);
  }

  private _validateRow(row: DataRow): ValidationError[] {
    const errors: ValidationError[] = [];
    for (const field of this._config.fields) {
      const val = row.raw[field.name];
      if (field.required && (val === null || val === undefined || val === '')) {
        errors.push({ field: field.name, rowId: row.id, message: `${field.displayName ?? field.name} 不能为空` });
      }
      if (field.validate && val !== undefined) {
        const result = field.validate(val);
        if (result !== true) {
          errors.push({ field: field.name, rowId: row.id, message: typeof result === 'string' ? result : '校验失败' });
        }
      }
    }
    return errors;
  }

  private _bufferStats(rows: DataRow[]): BufferStats {
    return {
      count: rows.length,
      newCount: rows.filter(r => r.status === 'new').length,
      modifiedCount: rows.filter(r => r.status === 'modified').length,
    };
  }

  private _emit(type: DataStoreEventType, data?: unknown): void {
    const event: DataStoreEvent = { type, data, timestamp: Date.now(), source: this._config.name };
    this._listeners.get(type)?.forEach(l => l(event));
  }
}

// ============================================================================
// 引擎管理器
// ============================================================================

export class DataStoreEngine {
  private _stores = new Map<string, DataStoreImpl>();

  createDataStore(config: DataStoreConfig): DataStoreImpl {
    const ds = new DataStoreImpl(config);
    this._stores.set(config.name, ds);
    return ds;
  }

  getDataStore(name: string): DataStoreImpl | undefined {
    return this._stores.get(name);
  }

  destroyDataStore(name: string): boolean {
    return this._stores.delete(name);
  }

  getDataStoreNames(): string[] {
    return [...this._stores.keys()];
  }

  get count(): number { return this._stores.size; }

  crossStoreQuery(options: MergeOptions): QueryResult {
    const allRows: DataRow[] = [];
    for (const source of options.sources) {
      const ds = this._stores.get(source.storeName);
      if (!ds) continue;
      let rows = ds.query({ filter: source.filter }).rows;
      if (source.fieldMapping) {
        rows = rows.map(row => ({
          ...row,
          raw: Object.fromEntries(
            Object.entries(row.raw).map(([k, v]) => [source.fieldMapping![k] ?? k, v])
          ),
        }));
      }
      allRows.push(...rows);
    }

    let result = allRows;
    if (options.dedupe) {
      const seen = new Set<string>();
      result = allRows.filter(row => {
        const key = options.dedupe!.fields.map(f => {
          const v = String(row.raw[f] ?? '');
          return options.dedupe!.ignoreCase ? v.toLowerCase() : v;
        }).join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    return { rows: result, total: result.length, hasMore: false };
  }
}

/** 全局引擎单例 */
export const globalEngine = new DataStoreEngine();

/** 快捷创建 DataStore */
export function createDataStore(config: DataStoreConfig): DataStoreImpl {
  return globalEngine.createDataStore(config);
}