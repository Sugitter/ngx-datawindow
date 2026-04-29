/**
 * IndexedDB Manager
 * 统一管理 IndexedDB 连接、事务、版本升级
 */

import { DB_CONFIG, STORE_CONFIG, DB_UPGRADE_PLANS, type StoreIndex } from './schema';

export type UpgradeHandler = (db: IDBDatabase, oldVersion: number, newVersion: number) => void;

/** 数据库状态 */
export interface DBState {
  isOpen: boolean;
  version: number;
  lastError?: Error;
}

/** IndexedDB 操作结果 */
export interface IDBResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 事务模式 */
export type TransactionMode = 'readonly' | 'readwrite';

/**
 * IndexedDB Manager
 * 统一管理数据库生命周期
 */
export class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;
  private upgradeHandlers: Map<number, UpgradeHandler> = new Map();
  private state: DBState = { isOpen: false, version: 0 };

  constructor(name?: string, version?: number) {
    this.dbName = name ?? DB_CONFIG.name;
    this.dbVersion = version ?? DB_CONFIG.version;
    this.registerDefaultUpgraders();
  }

  /** 注册默认的版本升级处理器 */
  private registerDefaultUpgraders(): void {
    // 根据 DB_UPGRADE_PLANS 注册处理器
    DB_UPGRADE_PLANS.forEach(plan => {
      plan.upgrades.forEach(upgrade => {
        const handler: UpgradeHandler = (db, oldVer) => {
          // 创建 ObjectStore
          upgrade.createStores?.forEach(store => {
            if (!db.objectStoreNames.contains(store.name)) {
              const objectStore = db.createObjectStore(store.name, {
                keyPath: store.keyPath,
                autoIncrement: store.autoIncrement ?? false
              });

              // 创建索引
              store.indexes?.forEach(index => {
                objectStore.createIndex(index.name, index.keyPath, {
                  unique: index.unique ?? false,
                  multiEntry: index.multiEntry ?? false
                });
              });
            }
          });

          // 删除 ObjectStore
          upgrade.deleteStores?.forEach(storeName => {
            if (db.objectStoreNames.contains(storeName)) {
              db.deleteObjectStore(storeName);
            }
          });

          console.log(`[IndexedDB] Upgraded from v${oldVer} to v${plan.version}`);
        };

        this.upgradeHandlers.set(upgrade.toVersion, handler);
      });
    });
  }

  /**
   * 打开数据库
   */
  async open(): Promise<IDBResult<IDBDatabase>> {
    if (this.state.isOpen && this.db) {
      return { success: true, data: this.db };
    }

    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        const error = new Error(`Failed to open database: ${request.error?.message}`);
        this.state.lastError = error;
        console.error('[IndexedDB] Open error:', error);
        resolve({ success: false, error: error.message });
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.state.isOpen = true;
        this.state.version = this.db.version;
        console.log(`[IndexedDB] Opened: ${this.dbName} v${this.db.version}`);
        resolve({ success: true, data: this.db });
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as unknown as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion ?? this.dbVersion;

        console.log(`[IndexedDB] Upgrading: v${oldVersion} → v${newVersion}`);

        // 按顺序执行所有升级
        for (let v = oldVersion + 1; v <= newVersion; v++) {
          const handler = this.upgradeHandlers.get(v);
          if (handler) {
            handler(db, oldVersion, v);
          }
        }
      };
    });
  }

  /**
   * 关闭数据库
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.state.isOpen = false;
      console.log('[IndexedDB] Closed');
    }
  }

  /**
   * 获取数据库实例
   */
  getDB(): IDBDatabase | null {
    return this.db;
  }

  /**
   * 检查数据库是否已打开
   */
  isOpen(): boolean {
    return this.state.isOpen;
  }

  /**
   * 获取事务
   */
  getTransaction(storeName: string, mode: TransactionMode = 'readonly'): IDBTransaction | null {
    if (!this.db) {
      console.warn('[IndexedDB] Database not opened');
      return null;
    }

    try {
      return this.db.transaction(storeName, mode);
    } catch (error) {
      console.error('[IndexedDB] Transaction error:', error);
      return null;
    }
  }

  /**
   * 获取 ObjectStore
   */
  getObjectStore(storeName: string, mode: TransactionMode = 'readonly'): IDBObjectStore | null {
    const transaction = this.getTransaction(storeName, mode);
    if (!transaction) return null;

    try {
      return transaction.objectStore(storeName);
    } catch (error) {
      console.error('[IndexedDB] ObjectStore error:', error);
      return null;
    }
  }

  /**
   * 通用的增删改查操作
   */
  async operate<T>(
    storeName: string,
    operation: 'add' | 'put' | 'delete' | 'get' | 'getAll' | 'clear' | 'count',
    dataOrKey?: unknown,
    mode: TransactionMode = 'readwrite'
  ): Promise<IDBResult<T>> {
    if (!this.isOpen()) {
      await this.open();
    }

    return new Promise((resolve) => {
      const store = this.getObjectStore(storeName, mode);
      if (!store) {
        resolve({ success: false, error: 'ObjectStore not available' });
        return;
      }

      let request: IDBRequest;
      switch (operation) {
        case 'add':
          request = store.add(dataOrKey as IDBValidKey);
          break;
        case 'put':
          request = store.put(dataOrKey as IDBValidKey);
          break;
        case 'delete':
          request = store.delete(dataOrKey as IDBValidKey);
          break;
        case 'get':
          request = store.get(dataOrKey as IDBValidKey);
          break;
        case 'getAll':
          request = store.getAll();
          break;
        case 'clear':
          request = store.clear() as any;
          break;
        case 'count':
          request = store.count() as any;
          break;
        default:
          resolve({ success: false, error: `Unknown operation: ${operation}` });
          return;
      }

      request.onsuccess = () => {
        resolve({ success: true, data: request.result as T });
      };

      request.onerror = () => {
        resolve({ success: false, error: request.error?.message ?? 'Operation failed' });
      };
    });
  }

  /**
   * 批量操作（原子性）
   */
  async batchOperate(
    storeName: string,
    operations: Array<{
      type: 'add' | 'put' | 'delete' | 'clear';
      data?: unknown;
      key?: IDBValidKey;
    }>,
    mode: TransactionMode = 'readwrite'
  ): Promise<IDBResult<number>> {
    if (!this.isOpen()) {
      await this.open();
    }

    return new Promise((resolve) => {
      const transaction = this.getTransaction(storeName, mode);
      if (!transaction) {
        resolve({ success: false, error: 'Transaction not available' });
        return;
      }

      const store = transaction.objectStore(storeName);
      let processedCount = 0;
      let hasError = false;

      transaction.oncomplete = () => {
        if (!hasError) {
          resolve({ success: true, data: processedCount });
        }
      };

      transaction.onerror = () => {
        hasError = true;
        resolve({ success: false, error: 'Batch operation failed' });
      };

      operations.forEach(op => {
        if (op.type === 'clear') {
          store.clear();
          processedCount++;
          return;
        }
        const request = op.type === 'delete'
          ? store.delete(op.key as IDBValidKey)
          : (op.type === 'add' ? store.add(op.data as IDBValidKey) : store.put(op.data as IDBValidKey));

        request.onsuccess = () => processedCount++;
        request.onerror = () => { hasError = true; };
      });
    });
  }

  /**
   * 删除数据库
   */
  async deleteDatabase(): Promise<IDBResult<void>> {
    this.close();
    return new Promise((resolve) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => {
        console.log(`[IndexedDB] Deleted: ${this.dbName}`);
        resolve({ success: true });
      };
      request.onerror = () => {
        resolve({ success: false, error: 'Delete failed' });
      };
    });
  }
}

/** 默认实例 */
export const defaultDB = new IndexedDBManager();
