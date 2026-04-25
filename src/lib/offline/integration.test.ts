/**
 * 集成测试：DataStore + OfflineStorage + OfflineService 协作
 * 
 * 测试场景：
 * 1. 数据变更 → IndexedDB 持久化 → 重新加载
 * 2. 离线操作 → 同步回调 → 冲突检测
 * 3. 性能：大数据量写入/读取
 */

import { DataStoreImpl, DataStoreConfig, DataRow } from '../datastore';
import { OfflineStorageAdapter, SyncStatus } from './offline-storage';
import { OfflineService, SyncResult, ConflictInfo } from './offline-service';
import { IndexedDBManager } from './idb-manager';

// 清理 IndexedDB（使用实例方法）
async function cleanupDb(dbName: string): Promise<void> {
  try {
    const manager = new IndexedDBManager(dbName, 1);
    await manager.open();
    manager.close();
    await manager.deleteDatabase();
  } catch (e) {
    // ignore cleanup errors
  }
}

afterEach(async () => {
  // 清理测试数据库
  const testDbs = [
    'integration_test_db_1',
    'integration_test_db_2',
    'integration_test_sync_1',
    'integration_test_conflict_1',
    'integration_test_perf_1',
    'integration_test_concurrent_1',
    'integration_test_lifecycle_1',
  ];
  for (const name of testDbs) {
    await cleanupDb(name);
  }
});

// ============================================================================
// 测试配置
// ============================================================================

const testConfig: DataStoreConfig = {
  name: 'integration_test_store',
  fields: [
    { name: 'id', type: 'number', required: true },
    { name: 'name', type: 'string' },
    { name: 'value', type: 'number' },
  ],
};

const testData = [
  { id: 1, name: 'Alpha', value: 100 },
  { id: 2, name: 'Beta', value: 200 },
  { id: 3, name: 'Gamma', value: 300 },
];

// ============================================================================
// 场景 1：数据持久化与恢复
// ============================================================================

describe('Integration: DataStore → OfflineStorage → Reload', () => {
  it('should persist DataStore changes to IndexedDB and reload', async () => {
    const datastore = new DataStoreImpl(testConfig);
    datastore.setData(testData);

    // 1. 保存到 IndexedDB
    const storage = new OfflineStorageAdapter('integration_test_db_1');
    const rows = datastore.getRows();
    await storage.saveAll(rows);

    // 2. 模拟重新加载
    const datastore2 = new DataStoreImpl(testConfig);
    const loadResult = await storage.loadAll();
    expect(loadResult.success).toBe(true);
    expect(loadResult.rows).toHaveLength(3);

    datastore2.setData(loadResult.rows!.map(r => r.raw as any));

    // 3. 验证数据一致
    const reloadedRows = datastore2.getRows();
    expect(reloadedRows).toHaveLength(3);
    expect(reloadedRows[0].raw['name']).toBe('Alpha');
    expect(reloadedRows[1].raw['value']).toBe(200);

    await storage.clear();
  });

  it('should track and persist row changes', async () => {
    const datastore = new DataStoreImpl(testConfig);
    datastore.setData(testData);

    const storage = new OfflineStorageAdapter('integration_test_db_2');

    // 1. 保存初始数据
    await storage.saveAll(datastore.getRows());

    // 2. 修改行
    await datastore.updateRow(1, { name: 'Alpha Updated', value: 150 });
    const changedRows = datastore.getChangedRows();

    // 3. 保存变更
    await storage.saveChanges(changedRows.map(c => c.row));

    // 4. 记录变更日志
    for (const { row } of changedRows) {
      await storage.logChange({
        operationType: 'update',
        rowId: row.id,
        newData: row.raw
      });
    }

    // 5. 验证待同步变更
    const pending = await storage.getPendingChanges();
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.find(p => p.rowId === 1)).toBeDefined();

    await storage.clear();
  });
});

// ============================================================================
// 场景 2：OfflineService 同步流程
// ============================================================================

describe('Integration: OfflineService sync flow', () => {
  it('should sync changes and return metrics', async () => {
    const datastore = new DataStoreImpl(testConfig);
    datastore.setData(testData);

    const syncCallback = jest.fn().mockResolvedValue([
      { rowId: 1, serverVersion: 2 },
      { rowId: 2, serverVersion: 2 },
    ]);

    const service = new OfflineService({
      datastore,
      datastoreId: 'integration_test_sync_1',
      syncCallback,
      autoLoadOnInit: false,
      autoPersist: false,
    });

    // 初始化
    await service.initialize();

    // 模拟变更
    await datastore.updateRow(1, { value: 999 });

    // 手动记录变更（因为 autoPersist: false）
    const storage = (service as any).storage as OfflineStorageAdapter;
    await storage.saveChanges([datastore.getRowById(1)!]);
    await storage.logChange({
      operationType: 'update',
      rowId: 1,
      newData: datastore.getRowById(1)!.raw
    });

    // 同步
    const result = await service.sync();

    expect(result.success).toBe(true);
    expect(result.syncedCount).toBeGreaterThan(0);
    expect(result.metrics).toBeDefined();
    expect(result.metrics!.duration).toBeGreaterThan(0);

    service.destroy();
  });

  it('should detect and resolve version conflicts', async () => {
    const datastore = new DataStoreImpl(testConfig);
    datastore.setData(testData);

    // 模拟服务端返回版本号与本地不一致
    const syncCallback = jest.fn().mockResolvedValue([
      { rowId: 1, serverVersion: 5 }, // 服务端版本 5
    ]);

    const service = new OfflineService({
      datastore,
      datastoreId: 'integration_test_conflict_1',
      syncCallback,
      conflictStrategy: 'server_wins',
      autoLoadOnInit: false,
      autoPersist: false,
    });

    await service.initialize();

    // 设置本地版本为 1（模拟旧版本）
    const storage = (service as any).storage as OfflineStorageAdapter;
    storage['rowVersionMap'].set(1, 1); // 本地版本 1

    // 记录变更
    await storage.logChange({
      operationType: 'update',
      rowId: 1,
      newData: { id: 1, name: 'Updated Locally', value: 999 }
    });

    // 同步
    const result = await service.sync();

    // 验证冲突检测
    expect(result.conflictCount).toBe(1);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].localVersion).toBe(1);
    expect(result.conflicts[0].serverVersion).toBe(5);

    service.destroy();
  });
});

// ============================================================================
// 场景 3：性能测试
// ============================================================================

describe('Performance: Large dataset operations', () => {
  const ROW_COUNT = 1000;

  it(`should persist ${ROW_COUNT} rows within reasonable time`, async () => {
    const datastore = new DataStoreImpl(testConfig);

    // 生成大数据集
    const largeData = Array.from({ length: ROW_COUNT }, (_, i) => ({
      id: i + 1,
      name: `Row_${i + 1}`,
      value: Math.floor(Math.random() * 10000),
    }));

    const startData = Date.now();
    datastore.setData(largeData);
    const dataTime = Date.now() - startData;

    const storage = new OfflineStorageAdapter('integration_test_perf_1');

    // 测量保存时间
    const startSave = Date.now();
    await storage.saveAll(datastore.getRows());
    const saveTime = Date.now() - startSave;

    // 测量加载时间
    const startLoad = Date.now();
    const loadResult = await storage.loadAll();
    const loadTime = Date.now() - startLoad;

    console.log(`[Perf] Data load: ${dataTime}ms, Save: ${saveTime}ms, Load: ${loadTime}ms`);

    expect(loadResult.success).toBe(true);
    expect(loadResult.rows).toHaveLength(ROW_COUNT);

    // 性能断言：保存 1000 行应在 5 秒内完成
    expect(saveTime).toBeLessThan(5000);
    expect(loadTime).toBeLessThan(3000);

    await storage.clear();
  });

  it('should handle concurrent operations', async () => {
    const datastore = new DataStoreImpl(testConfig);
    datastore.setData(testData);

    const storage = new OfflineStorageAdapter('integration_test_concurrent_1');
    await storage.saveAll(datastore.getRows());

    // 并发执行多次更新
    const updates = Array.from({ length: 10 }, (_, i) =>
      storage.logChange({
        operationType: 'update',
        rowId: (i % 3) + 1,
        newData: { id: (i % 3) + 1, name: `Updated_${i}`, value: i * 100 }
      })
    );

    await Promise.all(updates);

    const pending = await storage.getPendingChanges();
    expect(pending.length).toBeGreaterThan(0);

    await storage.clear();
  });
});

// ============================================================================
// 场景 4：完整生命周期
// ============================================================================

describe('Integration: Full offline lifecycle', () => {
  it('should handle complete offline → online → sync cycle', async () => {
    const datastore = new DataStoreImpl(testConfig);

    // 模拟服务端同步回调
    const serverData: Map<number, any> = new Map();
    const syncCallback = jest.fn(async (changes) => {
      // 模拟服务端处理
      return changes.map((c: any) => ({
        rowId: c.rowId,
        serverVersion: Date.now(),
      }));
    });

    const service = new OfflineService({
      datastore,
      datastoreId: 'integration_test_lifecycle_1',
      syncCallback,
      autoLoadOnInit: true,
      autoPersist: true,
    });

    // 1. 初始化（空数据）
    await service.initialize();

    // 2. 离线添加数据（autoPersist: true 会自动触发 rowAdded 事件处理）
    datastore.addRows(testData);

    // 3. 等待事件处理完成
    await new Promise(r => setTimeout(r, 50));

    // 4. 手动记录变更到 pending（因为 rowAdded 只保存到 main store，不记录到 pending）
    const storage = (service as any).storage as OfflineStorageAdapter;
    for (const row of datastore.getRows()) {
      await storage.logChange({
        operationType: 'insert',
        rowId: row.id,
        newData: row.raw
      });
    }

    // 5. 模拟上线
    const isOnline = service.isOnline();
    console.log(`[Lifecycle] Online status: ${isOnline}`);

    // 6. 同步
    if (isOnline) {
      const result = await service.sync();
      expect(result.success).toBe(true);
      console.log(`[Lifecycle] Synced ${result.syncedCount} rows in ${result.metrics?.duration}ms`);
    }

    // 7. 清理
    service.destroy();

    // 验证 syncCallback 被调用
    expect(syncCallback).toHaveBeenCalled();
  });
});
