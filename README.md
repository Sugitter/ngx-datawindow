# ngx-datawindow

Bringing PowerBuilder DataWindow's design philosophy to the modern web era.

**ngx-datawindow** is an Angular table component that reimagines the DataWindow — a legendary data management paradigm from 1991 — for today's web applications. It provides zero-config CRUD, virtual computed columns, multi-buffer state management, optimistic offline sync, and column-level change tracking out of the box.

[![npm version](https://img.shields.io/npm/v/ngx-datawindow.svg)](https://www.npmjs.com/package/ngx-datawindow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Test Status](https://img.shields.io/badge/tests-51%2F51-green)](https://github.com/sugitter/ngx-datawindow)

---

## Why ngx-datawindow?

In 1991, PowerBuilder introduced **DataWindow** — a component that treated data as a first-class citizen with state, history, and traceability. It proved that "data should be managed seriously." Thirty years later, this philosophy is still ahead of most modern frontend approaches.

ngx-datawindow is not a nostalgia project. It is a **translation of DataWindow's design principles** into modern Angular:

- Data managed by an engine, not scattered across components
- Operations are staged (temp → confirm → commit), not instantaneous
- Changes are traceable to the exact column, not coarse row diffs
- Validation intercepts at entry, not after submission
- Every operation has lifecycle hooks for intervention

See [doc/DATAWINDOW-SOUL.md](doc/DATAWINDOW-SOUL.md) for the full design manifesto and [doc/DATAWINDOW-MODERN.md](doc/DATAWINDOW-MODERN.md) for why these ideas remain relevant today.

---

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Zero-config CRUD | Built-in create/read/update/delete | Phase 1 |
| Virtual Computed Columns | JS function formulas, auto-recompute | Phase 1 |
| Multi-buffer Management | main / filter / delete buffers | Phase 1 |
| Aggregation | sum / avg / count / min / max with grouping | Phase 1 |
| Reactive Design | Angular Signals, real-time updates | Phase 1 |
| Row Status Tracking | new / modified / deleted with visual cues | Phase 1 |
| Column Filtering | 15 operators, text/number/select/date/boolean | Phase 1 |
| Global Search | Cross-column search | Phase 1 |
| Sort & Pagination | Material Sort + Paginator | Phase 1 |
| Row Selection | Single and multi-select modes | Phase 1 |
| Inline Editing | Double-click to edit cells | Phase 1 |
| Validation | Required, format (regex), range checks | Phase 1 |
| Delta Updates | Generate new/modified/deleted update data | Phase 1 |
| Column-level Change Tracking | Old/new value + timestamp per column | Phase 1 |
| ItemChanged Rejection | Real-time interception, reject invalid input | Phase 1 |
| Undo / Redo | Command Pattern, full stack | Phase 1 |
| Complete Event Lifecycle | RetrieveStart → RowFocusChanged → ItemChanged → SaveStart | Phase 1 |
| Offline Persistence | IndexedDB storage, works offline | Phase 2 |
| Optimistic Locking | rowVersionMap conflict detection (server/client/manual) | Phase 2 |
| Sync Metrics | Duration, bytes, synced/conflict counts | Phase 2 |
| Virtual Scroll | CDK CdkVirtualScrollViewport for large datasets | Phase 2 |

---

## Installation

```bash
npm install ngx-datawindow
```

---

## Quick Start

### 1. Import the module

```typescript
import { DataTableModule } from 'ngx-datawindow';

@NgModule({
  imports: [DataTableModule],
})
export class AppModule {}
```

### 2. Basic usage

```typescript
import { Component } from '@angular/core';
import { DataTableComponent, DataStoreConfig, ColumnConfig, TableConfig } from 'ngx-datawindow';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <ngx-datawindow
      [datastoreConfig]="config"
      [columns]="columns"
      [data]="employees"
      [tableConfig]="tableConfig"
      (rowAdded)="onAdd($event)"
      (rowUpdated)="onUpdate($event)"
      (rowDeleted)="onDelete($event)">
    </ngx-datawindow>
  `,
})
export class EmployeesComponent {
  config: DataStoreConfig = {
    name: 'employees',
    fields: [
      { name: 'id', type: 'number', required: true },
      { name: 'name', type: 'string', required: true },
      { name: 'department', type: 'string' },
      { name: 'salary', type: 'number' },
    ],
  };

  columns: ColumnConfig[] = [
    { field: 'id', header: 'ID', width: '60px' },
    { field: 'name', header: 'Name', editable: true, filterable: true },
    { field: 'department', header: 'Department', editable: true, filterType: 'select',
      filterOptions: [{ value: 'Engineering', label: 'Engineering' }, { value: 'Sales', label: 'Sales' }]
    },
    { field: 'salary', header: 'Salary', editable: true, editType: 'number', align: 'right' },
  ];

  tableConfig: TableConfig = {
    title: 'Employee Management',
    showToolbar: true,
    showGlobalSearch: true,
    selectionMode: 'multiple',
    toolbarActions: { add: true, delete: true, refresh: true, export: true },
    pagination: { pageSizeOptions: [10, 25, 50, 100], defaultPageSize: 10 },
  };

  employees = [
    { id: 1, name: 'Alice', department: 'Engineering', salary: 25000 },
    { id: 2, name: 'Bob', department: 'Sales', salary: 18000 },
    { id: 3, name: 'Charlie', department: 'Engineering', salary: 35000 },
  ];

  onAdd(row) { console.log('Row added:', row); }
  onUpdate(event) { console.log('Row updated:', event); }
  onDelete(rowId) { console.log('Row deleted:', rowId); }
}
```

### 3. Virtual Computed Columns

```typescript
config: DataStoreConfig = {
  name: 'orders',
  fields: [
    { name: 'product', type: 'string' },
    { name: 'quantity', type: 'number' },
    { name: 'price', type: 'number' },
    { name: 'total', type: 'virtual', virtual: true,
      formula: (row) => row.raw['quantity'] * row.raw['price'] },
  ],
};
```

### 4. Column-Level Change Tracking

```typescript
// Modify a field
await store.updateRow(1, { salary: 30000 });

// Get all changes for a row
const changes = store.getRowFieldChanges(1);
// Returns: [{ field: 'salary', change: { oldValue: 25000, newValue: 30000, timestamp: ... } }]

// Get original value (ignoring current modifications)
const original = store.getFieldOriginalValue(1, 'salary'); // 25000

// Undo a single field change
store.undoFieldChange(1, 'salary');
```

### 5. ItemChanged Rejection

```typescript
// Field-level validation
fields: [{
  name: 'salary',
  itemValidate: (oldVal, newVal) => {
    if (newVal < 0) return 'Salary cannot be negative';
    return true;
  }
}]

// Global handler
store.onItemChanged(async (event) => {
  if (event.field === 'salary' && event.newValue > 50000) {
    return 'reject'; // Reject and prevent entry
  }
  return 'accept';
});

// The update will be rejected
const result = await store.updateRow(1, { salary: -1000 });
if (!result.success) {
  console.log('Rejected:', result.rejected.rejectReason.message);
}
```

### 6. Undo / Redo

```typescript
// Basic operations
store.addRow({ name: 'Alice' });
store.undo(); // Undo
store.redo(); // Redo

// Check stack state
const stack = store.getUndoStack();
console.log(`Undoable: ${stack.undoCount}, Redoable: ${stack.redoCount}`);

// Get full history
const history = store.getUndoHistory();
history.forEach(cmd => {
  console.log(`${cmd.type}: ${cmd.description}`);
});

// Clear history
store.clearUndoHistory();
```

### 7. Offline Persistence

```typescript
import { OfflineService } from 'ngx-datawindow';

// Initialize offline sync
const offlineService = new OfflineService(store);

// Sync when online
await offlineService.sync((pending) => {
  // Send to your backend API
  return fetch('/api/sync', {
    method: 'POST',
    body: JSON.stringify(pending),
  }).then(res => res.json());
});

// Conflict resolution strategies
// - server_wins: server version always wins
// - client_wins: local changes always win
// - manual: returns conflicts for manual resolution
```

---

## API Reference

### DataTableComponent

**Inputs:**

| Input | Type | Description |
|-------|------|-------------|
| `datastoreConfig` | `DataStoreConfig` | Schema definition (name, fields, computed columns) |
| `columns` | `ColumnConfig[]` | Column display configuration |
| `data` | `DataRow[]` | Initial data array |
| `tableConfig` | `TableConfig` | UI settings (title, toolbar, pagination, etc.) |
| `isLoading` | `boolean` | Loading state indicator |

**Outputs:**

| Output | Payload | Description |
|--------|---------|-------------|
| `rowAdded` | `DataRow` | Fired when a row is added |
| `rowUpdated` | `ChangeEvent` | Fired when a row is modified |
| `rowDeleted` | `RowId` | Fired when a row is deleted |
| `rowClicked` | `RowClickEvent` | Fired on row click |
| `rowDoubleClicked` | `RowClickEvent` | Fired on row double-click |
| `selectionChanged` | `DataRow[]` | Fired when selection changes |
| `toolbarAction` | `ToolbarEvent` | Fired on toolbar action |
| `pageChanged` | `PageEvent` | Fired on pagination change |

### ColumnConfig

```typescript
{
  field: string;           // Data field name
  header: string;          // Display header
  width?: string;          // e.g. '120px'
  sortable?: boolean;      // Enable sorting
  filterable?: boolean;    // Enable column filter
  filterType?: 'text' | 'number' | 'select' | 'date' | 'boolean';
  filterOptions?: { value: any; label: string }[];
  editable?: boolean;     // Enable inline editing
  editType?: 'text' | 'number' | 'select' | 'date';
  aggregate?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  sticky?: 'left' | 'right';
  virtual?: boolean;      // Virtual computed column
  format?: { type: 'currency' | 'percent' | 'date'; args?: any };
  align?: 'left' | 'center' | 'right';
}
```

### TableConfig

```typescript
{
  title?: string;
  showToolbar?: boolean;
  showPaginator?: boolean;
  showColumnFilter?: boolean;
  showGlobalSearch?: boolean;
  toolbarActions?: {
    add?: boolean | { label?: string };
    delete?: boolean | { label?: string };
    refresh?: boolean;
    export?: boolean | 'csv' | 'json' | 'xlsx';
  };
  selectionMode?: 'none' | 'single' | 'multiple';
  pagination?: {
    pageSizeOptions?: number[];
    defaultPageSize?: number;
  };
  virtualScroll?: boolean;
  virtualScrollItemSize?: number;
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│          DataTableComponent (UI Layer)          │
│   Material Table + CDK Virtual Scroll + Signals  │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│            DataTableService (State)             │
│  CRUD, filtering, sorting, aggregation, events   │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              DataStore (Core Engine)             │
│  Pure TypeScript, framework-agnostic (~50KB)     │
│  Buffers, state, change tracking, validation     │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│          OfflineService (Persistence)             │
│  IndexedDBManager → OfflineStorageAdapter        │
│  → OfflineService (optimistic locking + sync)    │
└─────────────────────────────────────────────────┘
```

The **DataStore engine** is written in pure TypeScript with zero Angular dependencies. It can be extracted and used in any framework.

---

## Tech Stack

- **Angular 21** — Component framework
- **Angular Material** — UI components
- **Angular CDK** — Virtual scrolling, accessibility
- **TypeScript 5.4+** — Strict mode
- **IndexedDB** — Offline persistence (via raw API)
- **Jest** — Unit and integration testing (51/51 passing)

---

## Roadmap

### Phase 3: Developer Experience (in progress)
- [ ] Visual column config designer
- [ ] Declarative persistence configuration
- [ ] Multiple presentation styles (Grid / Form / Card)
- [ ] PDF / Excel export
- [ ] Full documentation + StackBlitz demos

### Future
- [ ] Database connection layer (optional backend integration)
- [ ] Nested datawindows (Master-Detail)
- [ ] Report engine (grouped reports, crosstabs)
- [ ] Real-time collaboration

---

## Contributing

We welcome all contributions! See [doc/CONTRIBUTING.md](doc/CONTRIBUTING.md) for development setup, coding standards, and PR workflow.

```bash
# Clone
git clone https://github.com/Sugitter/ngx-datawindow.git
cd ngx-datawindow

# Install
npm install

# Run example
cd example && npm install && ng serve

# Test
npm run test

# Build
npm run build
```

---

## License

MIT — open source, free for all.

---

## Acknowledgments

This project draws its inspiration from **PowerBuilder DataWindow** (1991–). We are grateful to Powersoft, Sybase, SAP, and Appeon for keeping DataWindow alive through decades of transition. We hope to carry its philosophy into the web era.

---

*Good design is timeless.*
