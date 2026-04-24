/**
 * Jest setup file - uses fake-indexeddb for IndexedDB support in Node.js environment
 */
import fake from 'fake-indexeddb';

(globalThis as any).indexedDB = fake.indexedDB;

console.log('[Jest Setup] IndexedDB mock initialized');
