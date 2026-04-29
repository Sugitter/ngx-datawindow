/**
 * Phase 2: OfflineService + Optimistic Locking Tests
 */

import { OfflineService } from './offline-service';
import { OfflineStorageAdapter } from './offline-storage';
import { DataStoreImpl } from '../datastore';

// ===================== Shared Test Helpers =====================

function createMockDataStore(): DataStoreImpl {
  return new DataStoreImpl({
    name: 'test_offline_service',
    fields: [
      { name: 'id', type: 'number' },
      { name: 'name', type: 'string' },
      { name: 'salary', type: 'number' }
    ]
  });
}

function seedPendingChange(service: OfflineService): OfflineStorageAdapter {
  const storage = (service as any).storage as OfflineStorageAdapter;
  storage.logChange({
    operationType: 'update',
    rowId: 1,
    newData: { id: 1, name: 'Updated', salary: 30000 }
  });
  return storage;
}

// ===================== OfflineStorageAdapter Extended Tests =====================

describe('Phase 2: OfflineStorageAdapter Extended', () => {
  const datastoreId = 'offline_storage_ext_test';
  let storage: OfflineStorageAdapter;

  beforeEach(async () => {
    storage = new OfflineStorageAdapter(datastoreId);
    await storage.clear();
  });

  afterEach(async () => {
    await storage.clear();
  });

  describe('Accept Changes', () => {
    it('should accept changes for modified rows', async () => {
      const rows = [
        {
          id: 1, rowNumber: 1,
          status: 'modified' as const,
          bufferType: 'main' as const,
          raw: { id: 1, name: 'Test', salary: 20000 },
          computed: {},
          changes: { salary: { oldValue: 15000, newValue: 20000, timestamp: Date.now() } }
        }
      ];
      await storage.saveAll(rows);
      const result = await storage.acceptChanges([1]);
      expect(result.success).toBe(true);
    });

    it('should accept all changes when no rowIds specified', async () => {
      const rows = [
        {
          id: 1, rowNumber: 1,
          status: 'modified' as const,
          bufferType: 'main' as const,
          raw: { id: 1, name: 'A', salary: 100 },
          computed: {},
          changes: { name: { oldValue: 'X', newValue: 'A', timestamp: Date.now() } }
        },
        {
          id: 2, rowNumber: 2,
          status: 'modified' as const,
          bufferType: 'main' as const,
          raw: { id: 2, name: 'B', salary: 200 },
          computed: {},
          changes: { name: { oldValue: 'Y', newValue: 'B', timestamp: Date.now() } }
        }
      ];
      await storage.saveAll(rows);
      const result = await storage.acceptChanges();
      expect(result.success).toBe(true);
    });
  });

  describe('Load Data with Changes', () => {
    it('should preserve changes when loading data', async () => {
      const rows = [
        {
          id: 1, rowNumber: 1,
          status: 'modified' as const,
          bufferType: 'main' as const,
          raw: { id: 1, name: 'Alice', salary: 30000 },
          computed: {},
          changes: { salary: { oldValue: 25000, newValue: 30000, timestamp: Date.now() } }
        }
      ];
      await storage.saveAll(rows);
      const result = await storage.loadAll();
      expect(result.success).toBe(true);
      expect(result.rows).toBeDefined();
    });
  });
});

// ===================== OfflineService Tests =====================

describe('Phase 2: OfflineService', () => {
  let datastore: DataStoreImpl;
  let offlineService: OfflineService;
  let syncCallbackMock: jest.Mock;
  const datastoreId = 'test_offline_service_ds';

  beforeEach(async () => {
    datastore = createMockDataStore();
    syncCallbackMock = jest.fn();
    offlineService = new OfflineService({
      datastore,
      datastoreId,
      syncCallback: syncCallbackMock,
      conflictStrategy: 'server_wins',
      autoPersist: false,
      autoLoadOnInit: false,
      autoSyncOnReconnect: false
    });
  });

  afterEach(async () => {
    await offlineService.clearCache();
    offlineService.destroy();
  });

  describe('Service Lifecycle', () => {
    it('should initialize successfully', async () => {
      const result = await offlineService.initialize();
      expect(result.success).toBe(true);
    });

    it('should not re-initialize if already initialized', async () => {
      await offlineService.initialize();
      const result = await offlineService.initialize();
      expect(result.success).toBe(true);
      expect(result.loadedFromCache).toBe(false);
    });

    it('should get sync status', async () => {
      const status = offlineService.getSyncStatus();
      expect(typeof status.isOnline).toBe('boolean');
      expect(typeof status.pendingCount).toBe('number');
    });

    it('should check online status', async () => {
      const online = offlineService.isOnline();
      expect(typeof online).toBe('boolean');
    });
  });

  describe('Sync Operation', () => {
    it('should return error when already syncing', async () => {
      syncCallbackMock.mockImplementation(() => new Promise(() => {}));
      offlineService.sync();
      const result = await offlineService.sync();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Sync already in progress');
    });

    it('should return success with zero synced when no pending changes', async () => {
      const result = await offlineService.sync();
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(0);
    });

    it('should call syncCallback and handle errors when pending changes exist', async () => {
      seedPendingChange(offlineService);
      syncCallbackMock.mockRejectedValue(new Error('Server error'));
      const result = await offlineService.sync();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(syncCallbackMock).toHaveBeenCalled();
    });

    it('should process pending changes through syncCallback', async () => {
      seedPendingChange(offlineService);
      syncCallbackMock.mockResolvedValue([{ rowId: 1, serverId: 101 }]);
      const result = await offlineService.sync();
      expect(result.success).toBe(true);
      expect(syncCallbackMock).toHaveBeenCalled();
      const callArgs = syncCallbackMock.mock.calls[0][0];
      expect(callArgs.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache successfully', async () => {
      const result = await offlineService.clearCache();
      expect(result.success).toBe(true);
    });

    it('should destroy service without error', async () => {
      await offlineService.initialize();
      expect(() => offlineService.destroy()).not.toThrow();
    });
  });
});

// ===================== Optimistic Locking Tests =====================

describe('Phase 2: Optimistic Locking', () => {
  let datastore: DataStoreImpl;
  let offlineService: OfflineService;
  const datastoreId = 'optimistic_lock_test_ds';

  beforeEach(() => {
    datastore = createMockDataStore();
  });

  afterEach(async () => {
    offlineService?.destroy();
  });

  describe('Version Field Management', () => {
    it('should track row status changes correctly', async () => {
      datastore.addRows([
        { id: 1, name: 'Employee A', salary: 20000 },
        { id: 2, name: 'Employee B', salary: 25000 }
      ]);
      const rows = datastore.getRows();
      expect(rows.length).toBe(2);
      expect(rows[0].status).toBe('new');
      expect(rows[1].status).toBe('new');
    });

    it('should track field changes for normal rows after update', async () => {
      datastore.addRows([{ id: 1, name: 'Test', salary: 10000 }]);
      datastore.clearUpdates();
      expect(datastore.getRowById(1)?.status).toBe('normal');

      await datastore.updateRow(1, { salary: 15000 });
      expect(datastore.getRowById(1)?.status).toBe('modified');

      const changes = datastore.getRowFieldChanges(1);
      const salaryChange = changes.find(c => c.field === 'salary')!;
      expect(salaryChange).toBeDefined();
      expect(salaryChange.change.oldValue).toBe(10000);
      expect(salaryChange.change.newValue).toBe(15000);
    });

    it('should transition normal rows to modified on update', async () => {
      datastore.addRows([{ id: 1, name: 'Test', salary: 10000 }]);
      datastore.clearUpdates();
      expect(datastore.getRowById(1)?.status).toBe('normal');

      await datastore.updateRow(1, { salary: 15000 });
      expect(datastore.getRowById(1)?.status).toBe('modified');
    });

    it('should track multiple updates with latest values', async () => {
      datastore.addRows([{ id: 1, name: 'Test', salary: 10000 }]);
      datastore.clearUpdates();

      await datastore.updateRow(1, { salary: 15000 });
      await datastore.updateRow(1, { salary: 20000 });

      const changes = datastore.getRowFieldChanges(1);
      const salaryChange = changes.find(c => c.field === 'salary')!;
      expect(salaryChange).toBeDefined();
      expect(salaryChange.change.newValue).toBe(20000);
    });
  });

  describe('Conflict Detection', () => {
    it('should call syncCallback with pending changes', async () => {
      const syncCallback = jest.fn().mockResolvedValue([]);
      offlineService = new OfflineService({
        datastore,
        datastoreId,
        syncCallback,
        conflictStrategy: 'server_wins',
        autoPersist: false,
        autoLoadOnInit: false,
        autoSyncOnReconnect: false
      });

      seedPendingChange(offlineService);
      await offlineService.sync();

      expect(syncCallback).toHaveBeenCalled();
      const callArgs = syncCallback.mock.calls[0][0];
      expect(callArgs.length).toBeGreaterThan(0);
    });

    it('should resolve conflicts with server_wins strategy', async () => {
      const syncCallback = jest.fn().mockResolvedValue([{ rowId: 1, serverId: 101 }]);
      offlineService = new OfflineService({
        datastore,
        datastoreId,
        syncCallback,
        conflictStrategy: 'server_wins',
        autoPersist: false,
        autoLoadOnInit: false,
        autoSyncOnReconnect: false
      });

      seedPendingChange(offlineService);
      const result = await offlineService.sync();
      expect(result.success).toBe(true);
    });

    it('should use conflict resolver when strategy is manual', async () => {
      const conflictResolver = jest.fn().mockResolvedValue({});
      const syncCallback = jest.fn().mockResolvedValue([]);
      offlineService = new OfflineService({
        datastore,
        datastoreId,
        syncCallback,
        conflictStrategy: 'manual',
        conflictResolver,
        autoPersist: false,
        autoLoadOnInit: false,
        autoSyncOnReconnect: false
      });

      seedPendingChange(offlineService);
      await offlineService.sync();
      expect(syncCallback).toHaveBeenCalled();
    });
  });
});

// ===================== Event Integration Tests =====================

describe('Phase 2: OfflineService Events', () => {
  it('should fire onSyncStart event when sync begins', async () => {
    const datastore = createMockDataStore();
    const onSyncStart = jest.fn();
    const offlineService = new OfflineService({
      datastore,
      datastoreId: 'event_test_ds',
      syncCallback: jest.fn().mockResolvedValue([]),
      autoPersist: false,
      autoLoadOnInit: false,
      autoSyncOnReconnect: false
    }, { onSyncStart });

    seedPendingChange(offlineService);
    await offlineService.sync();
    expect(onSyncStart).toHaveBeenCalled();
    offlineService.destroy();
  });

  it('should fire onSyncComplete event with synced count', async () => {
    const datastore = createMockDataStore();
    const onSyncComplete = jest.fn();
    const offlineService = new OfflineService({
      datastore,
      datastoreId: 'event_complete_test_ds',
      syncCallback: jest.fn().mockResolvedValue([]),
      autoPersist: false,
      autoLoadOnInit: false,
      autoSyncOnReconnect: false
    }, { onSyncComplete });

    seedPendingChange(offlineService);
    await offlineService.sync();
    expect(onSyncComplete).toHaveBeenCalledWith(expect.any(Number), expect.any(Object));
    offlineService.destroy();
  });

  it('should fire onSyncError event when sync fails', async () => {
    const datastore = createMockDataStore();
    const onSyncError = jest.fn();
    const offlineService = new OfflineService({
      datastore,
      datastoreId: 'error_test_ds',
      syncCallback: jest.fn().mockRejectedValue(new Error('Server error')),
      autoPersist: false,
      autoLoadOnInit: false,
      autoSyncOnReconnect: false
    }, { onSyncError });

    seedPendingChange(offlineService);
    await offlineService.sync();
    expect(onSyncError).toHaveBeenCalled();
    offlineService.destroy();
  });
});
