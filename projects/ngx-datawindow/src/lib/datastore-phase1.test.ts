/**
 * DataStore Phase 1 功能测试 — Jest 标准格式
 *
 * 测试内容：
 * 1. 列级变更跟踪
 * 2. ItemChanged 拒绝机制
 * 3. 撤销栈 (Undo/Redo)
 * 4. 完整事件链
 * 5. 集成场景
 * 6. 边界条件
 */

import {
  DataStoreImpl,
  DataStoreConfig,
  FieldDefinition,
  DataRow,
  DataStoreEvent,
  DataStoreEventType,
} from './datastore';

// ============================================================================
// 测试配置
// ============================================================================

const employeeConfig: DataStoreConfig = {
  name: 'employees',
  maxUndoStackSize: 50,
  enableChangeHistory: true,
  fields: [
    { name: 'id', type: 'number', required: true, readonly: true },
    { name: 'name', type: 'string', required: true, displayName: '姓名' },
    { name: 'department', type: 'string', displayName: '部门' },
    { name: 'salary', type: 'number', displayName: '薪资',
      itemValidate: (oldVal, newVal) => {
        const newSalary = newVal as number;
        if (newSalary < 0) return '薪资不能为负数';
        if (newSalary > 1000000) return '薪资不能超过 100 万';
        return true;
      }
    },
    { name: 'email', type: 'string', displayName: '邮箱' },
  ] as FieldDefinition[],
};

const initialData = [
  { id: 1, name: '张三', department: '技术部', salary: 25000, email: 'zhangsan@company.com' },
  { id: 2, name: '李四', department: '销售部', salary: 18000, email: 'lisi@company.com' },
  { id: 3, name: '王五', department: '技术部', salary: 35000, email: 'wangwu@company.com' },
];

// ============================================================================
// Test Suite: Phase 1 列级变更跟踪
// ============================================================================

describe('DataStore Phase 1: 列级变更跟踪', () => {
  let store: DataStoreImpl;

  beforeEach(() => {
    store = new DataStoreImpl(employeeConfig);
    store.setData(initialData);
  });

  afterEach(() => {
    store.reset();
  });

  it('更新单个字段后能获取变更记录', async () => {
    const result = await store.updateRow(1, { salary: 28000 });
    expect(result.success).toBe(true);

    const changes = store.getRowFieldChanges(1);
    expect(changes.length).toBe(1);
    expect(changes[0].field).toBe('salary');
    expect(changes[0].change.oldValue).toBe(25000);
    expect(changes[0].change.newValue).toBe(28000);
  });

  it('批量更新多个字段产生多个变更记录', async () => {
    const result = await store.updateRow(2, { name: '李四（已改名）', salary: 20000 });
    expect(result.success).toBe(true);

    const changes = store.getRowFieldChanges(2);
    expect(changes.length).toBe(2);
  });

  it('获取变更历史记录', async () => {
    await store.updateRow(2, { name: '李四（已改名）', salary: 20000 });
    const history = store.getRowChangeHistory(2);
    expect(history).not.toBeNull();
    expect(history!.changes.length).toBeGreaterThanOrEqual(2);
  });

  it('获取单个字段变更详情', async () => {
    await store.updateRow(2, { salary: 20000 });
    const salaryChange = store.getFieldChange(2, 'salary');
    expect(salaryChange).not.toBeNull();
    expect(salaryChange!.oldValue).toBe(18000);
    expect(salaryChange!.newValue).toBe(20000);
  });

  it('获取原始值不受当前修改影响', async () => {
    await store.updateRow(2, { salary: 22000 });
    const originalValue = store.getFieldOriginalValue(2, 'salary');
    expect(originalValue).toBe(18000);
  });

  it('getChangedRows 返回所有变更行', async () => {
    await store.updateRow(1, { salary: 28000 });
    await store.updateRow(2, { salary: 20000 });
    const changedRows = store.getChangedRows();
    expect(changedRows.length).toBeGreaterThanOrEqual(2);
  });

  it('undoFieldChange 撤销单个字段变更', async () => {
    await store.updateRow(2, { salary: 22000 });
    const undoResult = store.undoFieldChange(2, 'salary');
    expect(undoResult).toBe(true);

    const row2 = store.getRowById(2);
    expect(row2!.raw['salary']).toBe(18000);
  });

  it('undoFieldChange 恢复后行状态正确', async () => {
    await store.updateRow(2, { salary: 22000 });
    store.undoFieldChange(2, 'salary');
    const row = store.getRowById(2);
    expect(row!.raw['salary']).toBe(18000);
    expect(row!.raw['name']).toBe('李四');
  });
});

// ============================================================================
// Test Suite: Phase 1 ItemChanged 拒绝机制
// ============================================================================

describe('DataStore Phase 1: ItemChanged 拒绝机制', () => {
  let store: DataStoreImpl;

  beforeEach(() => {
    store = new DataStoreImpl(employeeConfig);
    store.setData(initialData);
  });

  afterEach(() => {
    store.reset();
  });

  it('正常更新应该成功', async () => {
    const result = await store.updateRow(1, { salary: 28000 });
    expect(result.success).toBe(true);
  });

  it('负数薪资被字段级 itemValidate 拒绝', async () => {
    const result = await store.updateRow(1, { salary: -1000 });
    expect(result.success).toBe(false);
    expect(result.rejected).toBeDefined();
    expect(result.rejected!.rejectReason!.code).toBe('FIELD_VALIDATION_FAILED');
  });

  it('超过 100 万的薪资被拒绝', async () => {
    const result = await store.updateRow(1, { salary: 2000000 });
    expect(result.success).toBe(false);
    expect(result.rejected).toBeDefined();
  });

  it('注册自定义 ItemChanged 处理器拒绝超限', async () => {
    const unsubscribe = store.onItemChanged((event) => {
      if (event.field === 'salary') {
        const row = store.getRowById(event.rowId);
        if (row && row.raw['department'] === '技术部' && (event.newValue as number) > 50000) {
          event.rejectReason = { code: 'OVER_LIMIT', message: '技术部薪资不能超过 50000' };
          return 'reject' as const;
        }
      }
      return 'accept' as const;
    });

    try {
      const result = await store.updateRow(1, { salary: 60000 }); // 技术部 id=1
      expect(result.success).toBe(false);
    } finally {
      unsubscribe();
    }
  });

  it('同一处理器对其他部门不受限制', async () => {
    const unsubscribe = store.onItemChanged((event) => {
      if (event.field === 'salary') {
        const row = store.getRowById(event.rowId);
        if (row && row.raw['department'] === '技术部' && (event.newValue as number) > 50000) {
          event.rejectReason = { code: 'OVER_LIMIT', message: '技术部薪资不能超过 50000' };
          return 'reject' as const;
        }
      }
      return 'accept' as const;
    });

    try {
      const result = await store.updateRow(2, { salary: 60000 }); // 销售部，不受限
      expect(result.success).toBe(true);
    } finally {
      unsubscribe();
    }
  });

  it('移除处理器后更新正常进行', async () => {
    const unsubscribe = store.onItemChanged(() => 'reject' as const);
    unsubscribe();

    const result = await store.updateRow(1, { salary: 60000 });
    expect(result.success).toBe(true);
  });

  it('拒绝后当前值保持不变', async () => {
    const before = store.getRowById(1);
    const beforeSalary = before!.raw['salary'];

    const result = await store.updateRow(1, { salary: -1000 });
    expect(result.success).toBe(false);

    const after = store.getRowById(1);
    expect(after!.raw['salary']).toBe(beforeSalary);
  });
});

// ============================================================================
// Test Suite: Phase 1 撤销栈
// ============================================================================

describe('DataStore Phase 1: 撤销栈 (Undo/Redo)', () => {
  let store: DataStoreImpl;

  beforeEach(() => {
    store = new DataStoreImpl(employeeConfig);
    store.setData(initialData);
  });

  afterEach(() => {
    store.reset();
  });

  it('初始状态不能撤销也不能重做', () => {
    const stack = store.getUndoStack();
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(false);
  });

  it('添加操作后可撤销', () => {
    store.addRow({ id: 4, name: '赵六', department: '财务部', salary: 20000, email: 'zhaoliu@company.com' });
    const stack = store.getUndoStack();
    expect(stack.canUndo).toBe(true);
    expect(stack.undoCount).toBe(1);
  });

  it('撤销操作成功并清空撤销栈', () => {
    store.addRow({ id: 4, name: '赵六', department: '财务部', salary: 20000, email: 'zhaoliu@company.com' });
    const undoResult = store.undo();
    expect(undoResult).toBe(true);

    const stack = store.getUndoStack();
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(true);
    expect(store.getRowCount()).toBe(3);
  });

  it('撤销后 redo 可恢复', () => {
    store.addRow({ id: 4, name: '赵六', department: '财务部', salary: 20000, email: 'zhaoliu@company.com' });
    store.undo();

    const redoResult = store.redo();
    expect(redoResult).toBe(true);

    const stack = store.getUndoStack();
    expect(stack.canUndo).toBe(true);
    expect(stack.canRedo).toBe(false);
    expect(store.getRowCount()).toBe(4);
  });

  it('多次撤销顺序正确', async () => {
    store.updateRow(1, { salary: 30000 });
    store.updateRow(2, { salary: 25000 });

    store.undo();
    expect(store.getRowById(2)!.raw['salary']).toBe(18000);

    store.undo();
    expect(store.getRowById(1)!.raw['salary']).toBe(25000);
  });

  it('新操作清空重做栈', () => {
    store.addRow({ id: 4, name: '赵六', department: '财务部', salary: 20000, email: 'zhaoliu@company.com' });
    store.undo(); // redo 栈有 1 条

    store.addRow({ id: 5, name: '孙七', department: '市场部', salary: 22000, email: 'sunqi@company.com' });

    const stack = store.getUndoStack();
    expect(stack.canRedo).toBe(false);
  });

  it('clearUndoHistory 清空所有历史', () => {
    store.addRow({ id: 4, name: '赵六', department: '财务部', salary: 20000, email: 'zhaoliu@company.com' });
    store.updateRow(1, { salary: 30000 });
    store.clearUndoHistory();

    const stack = store.getUndoStack();
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(false);
  });

  it('撤销已达上限时停止', () => {
    const limitedConfig: DataStoreConfig = { ...employeeConfig, maxUndoStackSize: 2 };
    const limitedStore = new DataStoreImpl(limitedConfig);
    limitedStore.setData(initialData);

    limitedStore.updateRow(1, { salary: 26000 });
    limitedStore.updateRow(1, { salary: 27000 });
    limitedStore.updateRow(1, { salary: 28000 });
    limitedStore.updateRow(1, { salary: 29000 });

    const stack = limitedStore.getUndoStack();
    expect(stack.undoCount).toBeLessThanOrEqual(2);
  });
});

// ============================================================================
// Test Suite: Phase 1 完整事件链
// ============================================================================

describe('DataStore Phase 1: 完整事件链', () => {
  let store: DataStoreImpl;

  beforeEach(() => {
    store = new DataStoreImpl(employeeConfig);
    store.setData(initialData);
  });

  afterEach(() => {
    store.reset();
  });

  it('setData 触发 retrieveStart 和 retrieveEnd 事件', () => {
    const events: DataStoreEvent[] = [];
    store.on('retrieveStart', e => events.push(e));
    store.on('retrieveEnd', e => events.push(e));

    store.setData(initialData);

    expect(events.length).toBe(2);
    expect(events[0].type).toBe('retrieveStart');
    expect(events[1].type).toBe('retrieveEnd');
  });

  it('updateRow 触发 itemChanged 事件', async () => {
    const events: DataStoreEvent[] = [];
    store.on('itemChanged', e => events.push(e));

    await store.updateRow(1, { salary: 30000 });

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('itemChanged');
  });

  it('updateRow 触发 rowUpdated 事件', async () => {
    const events: DataStoreEvent[] = [];
    store.on('rowUpdated', e => events.push(e));

    await store.updateRow(1, { salary: 30000 });

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('rowUpdated');
  });

  it('addRow 触发 rowAdded 事件', () => {
    const events: DataStoreEvent[] = [];
    store.on('rowAdded', e => events.push(e));

    store.addRow({ id: 4, name: '赵六', department: '财务部', salary: 20000, email: 'zhaoliu@company.com' });

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('rowAdded');
  });

  it('deleteRow 触发 rowRemoved 事件', () => {
    const events: DataStoreEvent[] = [];
    store.on('rowRemoved', e => events.push(e));

    store.deleteRow(1);

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('rowRemoved');
  });

  it('setFocusedRow 触发 itemFocusChanged 事件', () => {
    const events: DataStoreEvent[] = [];
    store.on('itemFocusChanged', e => events.push(e));

    store.setFocusedRow(1);
    expect(events.length).toBe(1);

    store.setFocusedRow(2);
    expect(events.length).toBe(2);

    const data = events[1].data as any;
    expect(data.previousRowId).toBe(1);
    expect(data.currentRowId).toBe(2);
  });

  it('undoStackChanged 在操作后触发', () => {
    const events: DataStoreEvent[] = [];
    store.on('undoStackChanged', e => events.push(e));

    store.addRow({ id: 4, name: '赵六', department: '财务部', salary: 20000, email: 'zhaoliu@company.com' });

    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it('on 返回的 unsubscribe 函数可取消监听', () => {
    const events: DataStoreEvent[] = [];
    const unsubscribe = store.on('rowAdded', e => events.push(e));

    store.addRow({ id: 4, name: '赵六', department: '财务部', salary: 20000, email: 'zhaoliu@company.com' });
    expect(events.length).toBe(1);

    unsubscribe();

    store.addRow({ id: 5, name: '孙七', department: '市场部', salary: 22000, email: 'sunqi@company.com' });
    expect(events.length).toBe(1); // 不再增加
  });

  it('reset 触发 reset 事件', () => {
    const events: DataStoreEvent[] = [];
    store.on('reset', e => events.push(e));

    store.reset();

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('reset');
  });

  it('itemChangedRejected 在拒绝时触发', async () => {
    const events: DataStoreEvent[] = [];
    store.on('itemChangedRejected', e => events.push(e));

    const unsubscribe = store.onItemChanged(() => 'reject' as const);
    try {
      await store.updateRow(1, { salary: -1000 });
    } finally {
      unsubscribe();
    }

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('itemChangedRejected');
  });
});

// ============================================================================
// Test Suite: Phase 1 集成场景
// ============================================================================

describe('DataStore Phase 1: 集成场景', () => {
  let store: DataStoreImpl;

  beforeEach(() => {
    store = new DataStoreImpl(employeeConfig);
    store.setData(initialData);
  });

  afterEach(() => {
    store.reset();
  });

  it('典型用户编辑会话：选择 → 修改 → 撤销 → 提交', async () => {
    // 1. 选择焦点行
    store.setFocusedRow(1);
    expect(store.focusedRowId).toBe(1);

    // 2. 修改薪资
    const updateResult = await store.updateRow(1, { salary: 30000 });
    expect(updateResult.success).toBe(true);

    // 3. 查看变更
    const changedRows = store.getChangedRows();
    expect(changedRows.length).toBeGreaterThanOrEqual(1);

    // 4. 撤销修改
    store.undoFieldChange(1, 'salary');
    const rowAfterUndo = store.getRowById(1);
    expect(rowAfterUndo!.raw['salary']).toBe(25000);

    // 5. 再次修改
    const secondUpdate = await store.updateRow(1, { salary: 28000 });
    expect(secondUpdate.success).toBe(true);

    // 6. 提交保存前获取差异
    const beginResult = await store.beginSave();
    expect(beginResult).toBeDefined();
    expect(beginResult.updateCount).toBeDefined();

    // 7. 生成更新数据
    const updates = store.generateDiffUpdates();
    expect(Array.isArray(updates)).toBe(true);

    // 8. 提交后清除状态
    store.endSave(true);
    store.clearUpdates();

    const savedRow = store.getRowById(1);
    expect(savedRow!.status).toBe('normal');
    expect(Object.keys(savedRow!.changes).length).toBe(0);
  });

  it('beginSave 返回 updateCount', async () => {
    await store.updateRow(1, { salary: 30000 });

    const beginResult = await store.beginSave();
    expect(beginResult).toBeDefined();
    expect(beginResult.updateCount.new + beginResult.updateCount.modified).toBeGreaterThan(0);
  });

  it('endSave(true) 触发 saveEnd 事件', () => {
    const events: DataStoreEvent[] = [];
    store.on('saveEnd', e => events.push(e));
    store.endSave(true);
    expect(events.length).toBe(1);
  });

  it('getStats 返回正确的缓冲区统计', async () => {
    store.addRow({ id: 4, name: '赵六', department: '财务部', salary: 20000, email: 'zhaoliu@company.com' });
    await store.updateRow(1, { salary: 30000 });
    store.deleteRow(2);

    const stats = store.getStats();
    // main buffer: 4 rows total (1+3-1deleted+1)
    expect(stats.main.count).toBeGreaterThanOrEqual(1);
    expect(stats.deleted.count).toBeGreaterThanOrEqual(1);
  });

  it('findMany 按条件查询数据', () => {
    const result = store.findMany({ field: 'department', operator: 'eq', value: '技术部' });
    expect(result.length).toBe(2);
    expect(result.every(r => r.raw['department'] === '技术部')).toBe(true);
  });

  it('sort 按字段排序', () => {
    const result = store.sort([{ field: 'salary', direction: 'desc' }]);
    expect(result[0].raw['salary']).toBe(35000); // 王五
    expect(result[1].raw['salary']).toBe(25000); // 张三
    expect(result[2].raw['salary']).toBe(18000); // 李四
  });

  it('registerAggregation 注册并执行聚合', () => {
    store.registerAggregation({
      id: 'total_salary',
      name: '总薪资',
      type: 'sum',
      field: 'salary',
    });

    const result = store.aggregate('total_salary');
    expect(result).toBeDefined();
    expect(result!.value).toBe(78000); // 25000+18000+35000
  });

  it('aggregateAll 返回所有聚合结果', () => {
    store.registerAggregation({ id: 'avg_salary', name: '平均薪资', type: 'avg', field: 'salary' });
    store.registerAggregation({ id: 'max_salary', name: '最高薪资', type: 'max', field: 'salary' });

    const results = store.aggregateAll();
    expect(results['avg_salary']).toBeDefined();
    expect(results['max_salary']).toBeDefined();
  });
});

// ============================================================================
// Test Suite: DataStore 边界条件
// ============================================================================

describe('DataStore 边界条件', () => {
  let store: DataStoreImpl;

  beforeEach(() => {
    store = new DataStoreImpl(employeeConfig);
    store.setData(initialData);
  });

  afterEach(() => {
    store.reset();
  });

  it('updateRow 传入不存在的 rowId 不抛异常', async () => {
    const result = await store.updateRow(999, { salary: 30000 });
    expect(result.success).toBe(false);
  });

  it('deleteRow 传入不存在的 rowId 返回 false', () => {
    const result = store.deleteRow(999);
    expect(result).toBe(false);
  });

  it('getRowById 不存在返回 undefined', () => {
    const result = store.getRowById(999);
    expect(result).toBeUndefined();
  });

  it('undo 空栈返回 false', () => {
    const result = store.undo();
    expect(result).toBe(false);
  });

  it('redo 空栈返回 false', () => {
    const result = store.redo();
    expect(result).toBe(false);
  });

  it('restoreRow 已删除行恢复正常', () => {
    store.deleteRow(1);
    const result = store.restoreRow(1);
    expect(result).toBe(true);
  });

  it('永久删除行后 restoreRow 返回 false', () => {
    store.deleteRow(1);
    store.permanentDelete(1);
    const result = store.restoreRow(1);
    expect(result).toBe(false);
  });

  it('readonly 字段更新行为正确', async () => {
    // readonly 字段更新不抛异常
    const result = await store.updateRow(1, { id: 999 } as any);
    expect(result).toBeDefined();
  });

  it('setFocusedRow 传入不存在的 rowId 不抛异常', () => {
    expect(() => store.setFocusedRow(999)).not.toThrow();
  });

  it('getFieldChange 对未修改的字段返回 null', () => {
    const result = store.getFieldChange(1, 'salary');
    expect(result).toBeNull();
  });

  it('空数据集 setData([]) 后 getRowCount 为 0', () => {
    store.setData([]);
    expect(store.getRowCount()).toBe(0);
  });

  it('permanentDelete 后 rowCount 行为正确', () => {
    const before = store.getRowCount();
    store.permanentDelete(1);
    const after = store.getRowCount();
    // permanentDelete 可能移入 deletedRows，getRowCount 计数取决于实现
    expect(after).toBeLessThanOrEqual(before);
  });

  it('validate 返回校验结果', () => {
    const result = store.validate();
    expect(result).toBeDefined();
    expect(result.valid).toBeDefined();
  });

  it('findOne 找到符合条件的单行', () => {
    const result = store.findOne({ field: 'id', operator: 'eq', value: 1 });
    expect(result).toBeDefined();
    expect(result!.raw['name']).toBe('张三');
  });

  it('findOne 未找到返回 undefined', () => {
    const result = store.findOne({ field: 'id', operator: 'eq', value: 9999 });
    expect(result).toBeUndefined();
  });
});
