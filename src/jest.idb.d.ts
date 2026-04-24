/**
 * Jest test type definitions for IndexedDB
 */
/// <reference types="node" />

// IndexedDB types for test environment
interface IDBRequest<T = any> {
  result: T;
  error: DOMException | null;
  onsuccess: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  readyState: 'pending' | 'done';
  transaction: IDBTransaction | null;
  source: IDBObjectStore | IDBIndex | null;
}

interface IDBDatabase {
  objectStoreNames: DOMStringList;
  name: string;
  version: number;
  createObjectStore(name: string, options?: IDBObjectStoreParameters): IDBObjectStore;
  deleteObjectStore(name: string): void;
  transaction(storeNames: string | string[], mode?: IDBTransactionMode): IDBTransaction;
  close(): void;
  onerror: ((event: Event) => void) | null;
  onabort: ((event: Event) => void) | null;
}

interface IDBObjectStore {
  name: string;
  keyPath: string | string[] | null;
  indexNames: DOMStringList;
  transaction: IDBTransaction;
  autoIncrement: boolean;
  add(value: any, key?: IDBValidKey): IDBRequest;
  clear(): IDBRequest;
  count(key?: IDBValidKey | IDBKeyRange): IDBRequest<number>;
  createIndex(name: string, keyPath: string | string[], options?: IDBIndexParameters): IDBIndex;
  delete(key: IDBValidKey): IDBRequest;
  deleteIndex(name: string): void;
  get(key: IDBValidKey | IDBKeyRange): IDBRequest;
  getAll(key?: IDBValidKey | IDBKeyRange): IDBRequest<any[]>;
  getAllKeys(key?: IDBValidKey | IDBKeyRange): IDBRequest<any[]>;
  put(value: any, key?: IDBValidKey): IDBRequest;
  openCursor(key?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): IDBRequest<IDBCursorWithValue | null>;
}

interface IDBTransaction {
  objectStoreNames: DOMStringList;
  mode: IDBTransactionMode;
  db: IDBDatabase;
  error: DOMException | null;
  abort(): void;
  commit(): void;
  objectStore(name: string): IDBObjectStore;
  onabort: ((event: Event) => void) | null;
  oncomplete: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
}

interface IDBIndex {
  name: string;
  objectStore: IDBObjectStore;
  keyPath: string | string[];
  multiEntry: boolean;
  unique: boolean;
  count(key?: IDBValidKey | IDBKeyRange): IDBRequest<number>;
  get(key: IDBValidKey | IDBKeyRange): IDBRequest<any>;
  getAll(key?: IDBValidKey | IDBKeyRange): IDBRequest<any[]>;
  openCursor(key?: IDBValidKey | IDBKeyRange, direction?: IDBCursorDirection): IDBRequest<IDBCursorWithValue | null>;
}

interface IDBCursorWithValue extends IDBCursor {
  value: any;
}

interface IDBCursor {
  direction: IDBCursorDirection;
  key: IDBValidKey;
  primaryKey: IDBValidKey;
  request: IDBRequest;
  advance(count: number): void;
  continue(key?: IDBValidKey): void;
  delete(): IDBRequest;
  update(value: any): IDBRequest;
}

type IDBTransactionMode = 'readonly' | 'readwrite' | 'versionchange';
type IDBCursorDirection = 'next' | 'nextunique' | 'prev' | 'prevunique';
type IDBValidKey = number | string | Date | BufferSource | IDBArrayKey;
type IDBArrayKey = any[];
type IDBKeyRange = any;
type DOMStringList = {
  length: number;
  contains(str: string): boolean;
  item(index: number): string | null;
  [index: number]: string;
};

interface IDBObjectStoreParameters {
  keyPath?: string | string[];
  autoIncrement?: boolean;
}

interface IDBIndexParameters {
  unique?: boolean;
  multiEntry?: boolean;
  locale?: string;
}

interface IDBDatabaseEventMap {
  'abort': Event;
  'close': Event;
  'error': Event;
  'versionchange': IDBVersionChangeEvent;
}

interface IDBVersionChangeEvent extends Event {
  oldVersion: number;
  newVersion: number | null;
}

interface IDBOpenDBRequestEventMap {
  'blocked': Event;
  'upgradeneeded': IDBVersionChangeEvent;
  'success': Event;
}

interface IDBFactory {
  open(name: string, version?: number): IDBOpenDBRequest;
  deleteDatabase(name: string): IDBOpenDBRequest;
  cmp(first: IDBValidKey, second: IDBValidKey): number;
  databases(): Promise<{ name: string; version: number }[]>;
}

interface IDBOpenDBRequest extends IDBRequest<IDBDatabase> {
  onblocked: ((event: Event) => void) | null;
  onupgradeneeded: ((event: IDBVersionChangeEvent) => void) | null;
  onsuccess: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
  result: IDBDatabase;
  error: DOMException | null;
  source: IDBFactory | null;
  transaction: IDBTransaction | null;
}

declare const indexedDB: IDBFactory;
