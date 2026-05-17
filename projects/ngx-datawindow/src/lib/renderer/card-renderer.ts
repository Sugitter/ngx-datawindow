/**
 * CardRenderer — Card grid layout for visual browsing
 *
 * Each row is displayed as a card in a grid layout.
 * Cards are arranged in rows of configurable width.
 * Virtual scroll wraps the card grid container.
 */
import {
  DataWindowRenderer, DisplayMode, DataWindowView, RendererState,
  ViewRow, ViewCell
} from './renderer';
import { GridRenderer } from './grid-renderer';

export class CardRenderer implements DataWindowRenderer {
  readonly mode: DisplayMode = 'card';

  private _gridRenderer = new GridRenderer();
  private _state!: RendererState;
  private _view: DataWindowView = this._emptyView();
  private _cardsPerRow = 3; // Configurable via viewportWidth

  update(state: RendererState): void {
    this._state = state;
    this._recompute();
  }

  get view(): DataWindowView {
    return this._view;
  }

  onScroll(offset: number): void {
    if (!this._state) return;
    this._state = { ...this._state, scrollOffset: offset };
    this._recompute();
  }

  onGroupToggle(_groupKey: string): void { /* no-op for card */ }
  onTreeToggle(_nodeId: string): void { /* no-op for card */ }

  // ── Private ──

  private _recompute(): void {
    const s = this._state;
    const rows = s.rows;

    // Calculate cards per row based on viewport width and card width
    const cardWidth = 300; // Default card width in pixels
    this._cardsPerRow = Math.max(1, Math.floor(s.viewportHeight / cardWidth));

    // Group rows into card rows
    const cardRows: any[][] = [];
    for (let i = 0; i < rows.length; i += this._cardsPerRow) {
      cardRows.push(rows.slice(i, i + this._cardsPerRow));
    }

    // Virtual scroll calculation
    const cardHeight = 280; // Default card height
    const rowGap = 16;
    const rowHeight = cardHeight + rowGap;
    const totalRows = cardRows.length;

    const firstVisible = Math.floor(s.scrollOffset / rowHeight);
    const visibleCount = Math.ceil(s.viewportHeight / rowHeight);
    const start = Math.max(0, firstVisible - 1);
    const end = Math.min(totalRows, firstVisible + visibleCount + 1);

    const bodyRows: ViewRow[] = [];

    // Add a "card row" ViewRow for each visible card row
    for (let i = start; i < end; i++) {
      const cards = cardRows[i];
      bodyRows.push(this._buildCardRow(cards, s, i));
    }

    this._view = {
      headerRows: s.showHeader ? [this._buildHeaderRow(s)] : [],
      bodyRows,
      footerRows: [],
      totalScrollHeight: totalRows * rowHeight,
      scrollOffset: start * rowHeight,
      totalRows: rows.length,
      collapsedGroups: s.collapsedGroups,
      treeExpanded: s.treeExpanded,
    };
  }

  private _buildCardRow(cards: any[], state: RendererState, rowIndex: number): ViewRow {
    const cells: ViewCell[] = [];

    // Each card becomes a cell in this row
    cards.forEach((card, index) => {
      const id = card._id ?? card.id ?? `card-${rowIndex}-${index}`;
      const status = this._getRowStatus(card);

      // Card header (first field as title)
      const titleField = state.columns[0]?.field;
      const title = titleField ? String(card[titleField] ?? '') : '';

      // Card content (summary of key fields)
      const summaryFields = state.columns.slice(1, 4).map(c => c.field);
      const summary = summaryFields
        .map(f => `${c.header}: ${String(card[f] ?? '-')}`)
        .join(' | ');

      cells.push({
        field: `card_${index}`,
        value: card,
        formatted: `${title}\n${summary}`,
        editable: false,
        highlighted: false,
        width: '300px',
      });
    });

    return {
      id: `cardrow-${rowIndex}`,
      type: 'data',
      cells,
      depth: 0,
      status: 'normal',
      raw: cards[0] ?? null,
    };
  }

  private _buildHeaderRow(state: RendererState): ViewRow {
    const cells: ViewCell[] = [{
      field: 'card_header',
      value: null,
      formatted: '📋 Card Grid View',
      editable: false,
      highlighted: false,
      width: '100%',
      align: 'left',
    }];

    return {
      id: '__header',
      type: 'header',
      cells,
      depth: 0,
      status: 'normal',
      raw: null,
    };
  }

  private _getRowStatus(row: any): 'normal' | 'new' | 'modified' | 'deleted' {
    if (row._status === 'new' || row._isNew) return 'new';
    if (row._status === 'modified' || row._isModified) return 'modified';
    if (row._status === 'deleted' || row._isDeleted) return 'deleted';
    return 'normal';
  }

  private _emptyView(): DataWindowView {
    return {
      headerRows: [], bodyRows: [], footerRows: [],
      totalScrollHeight: 0, scrollOffset: 0, totalRows: 0,
      collapsedGroups: new Set(), treeExpanded: new Set(),
    };
  }
}
