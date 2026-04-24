/**
 * Jest setup file - uses fake-indexeddb for IndexedDB support in Node.js environment
 */
const fake = require('fake-indexeddb');

// Mock browser APIs needed by fake-indexeddb and our code
global.indexedDB = fake.indexedDB;
global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));

console.log('[Jest Setup] IndexedDB mock initialized');
