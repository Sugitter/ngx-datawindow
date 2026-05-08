/**
 * DataWindowVirtualScrollStrategy
 *
 * Custom CDK VirtualScrollStrategy for ngx-datawindow.
 * Implements CDK's VirtualScrollStrategy interface — CDK handles scroll events,
 * touch gestures, keyboard navigation. We compute the visible range.
 */
import { Injectable } from '@angular/core';
import { VirtualScrollStrategy, CdkVirtualScrollViewport, VIRTUAL_SCROLL_STRATEGY } from '@angular/cdk/scrolling';
import { ListRange } from '@angular/cdk/collections';
import { Subject, Observable, Subscription } from 'rxjs';

/** Options for DataWindowVirtualScrollStrategy */
export interface DataWindowScrollStrategyOptions {
  /** Row height in pixels (default: 36) */
  itemSize?: number;
  /** Min buffer in pixels (default: 360 = 10 rows) */
  minBufferPx?: number;
  /** Max buffer in pixels (default: 720 = 20 rows) */
  maxBufferPx?: number;
}

/**
 * DataWindow's custom virtual scroll strategy.
 *
 * Implements CDK's VirtualScrollStrategy interface.
 * CDK viewport calls our methods on scroll, and we tell it which range to render.
 */
export class DataWindowVirtualScrollStrategy implements VirtualScrollStrategy {
  private _viewport: CdkVirtualScrollViewport | null = null;
  private _itemSize: number;
  private _minBufferPx: number;
  private _maxBufferPx: number;
  private _totalItems = 0;
  private _scrolledIndexChange = new Subject<number>();
  private _scrollSub: Subscription | null = null;

  /** Emits when the index of the first element visible in the viewport changes. */
  scrolledIndexChange: Observable<number> = this._scrolledIndexChange.asObservable();

  /** Current rendered range */
  private _renderedRange: ListRange = { start: 0, end: 0 };

  constructor(options: DataWindowScrollStrategyOptions = {}) {
    this._itemSize = options.itemSize ?? 36;
    this._minBufferPx = options.minBufferPx ?? this._itemSize * 10;
    this._maxBufferPx = options.maxBufferPx ?? this._itemSize * 20;
  }

  /** Update row height (e.g., when config changes) */
  setItemSize(size: number): void {
    if (this._itemSize === size) return;
    this._itemSize = size;
    this._minBufferPx = size * 10;
    this._maxBufferPx = size * 20;
    if (this._viewport) {
      this._viewport.setTotalContentSize(this._totalItems * this._itemSize);
      this._updateRenderedRange();
    }
  }

  /** Update total data length — call when data changes */
  setDataLength(length: number): void {
    if (this._totalItems === length) return;
    this._totalItems = length;
    if (this._viewport) {
      this._viewport.setTotalContentSize(length * this._itemSize);
      this._updateRenderedRange();
    }
  }

  /** Get current rendered range */
  get renderedRange(): ListRange {
    return this._renderedRange;
  }

  /** Attach to CDK viewport — called by CDK internally */
  attach(viewport: CdkVirtualScrollViewport): void {
    this._viewport = viewport;
    this._viewport.setTotalContentSize(this._totalItems * this._itemSize);
    this._updateRenderedRange();

    // Subscribe to scroll events to emit scrolledIndexChange
    this._scrollSub = viewport.renderedRangeStream.subscribe(range => {
      if (range.start !== this._renderedRange.start) {
        this._scrolledIndexChange.next(range.start);
      }
    });
  }

  /** Detach from viewport — called by CDK internally */
  detach(): void {
    if (this._scrollSub) {
      this._scrollSub.unsubscribe();
      this._scrollSub = null;
    }
    this._viewport = null;
  }

  /** CDK calls this on scroll */
  onContentScrolled(): void {
    this._updateRenderedRange();
  }

  /** CDK calls this when data length changes via CdkVirtualForOf */
  onDataLengthChanged(): void {
    // Data length is managed by us via setDataLength(), so this is a no-op
  }

  /** CDK calls this when the range of rendered items has changed */
  onContentRendered(): void {
    // No-op
  }

  /** CDK calls this when the offset of rendered items changes */
  onRenderedOffsetChanged(): void {
    // No-op
  }

  /** Scroll to a specific row index */
  scrollToIndex(index: number, behavior?: ScrollBehavior): void {
    if (this._viewport) {
      this._viewport.scrollToOffset(index * this._itemSize, behavior);
    }
  }

  // ── Private ──

  private _updateRenderedRange(): void {
    const vp = this._viewport;
    if (!vp) return;

    const scrollOffset = vp.measureScrollOffset();
    const viewportSize = vp.getViewportSize();
    const dataLength = this._totalItems;

    if (dataLength === 0) {
      vp.setRenderedRange({ start: 0, end: 0 });
      return;
    }

    // Calculate visible range
    const firstVisible = Math.max(0, Math.floor(scrollOffset / this._itemSize));
    const visibleCount = Math.ceil(viewportSize / this._itemSize);

    // Add buffer rows
    const bufferRows = Math.ceil(this._minBufferPx / this._itemSize);
    const start = Math.max(0, firstVisible - bufferRows);
    const end = Math.min(dataLength, firstVisible + visibleCount + bufferRows);

    const newRange: ListRange = { start, end };

    // Only update if range changed
    if (newRange.start !== this._renderedRange.start || newRange.end !== this._renderedRange.end) {
      this._renderedRange = newRange;
      vp.setRenderedRange(newRange);
      vp.setRenderedContentOffset(start * this._itemSize);
    }
  }
}

/**
 * Factory function to create a DataWindowVirtualScrollStrategy.
 * Use with DI: { provide: VIRTUAL_SCROLL_STRATEGY, useFactory: () => createScrollStrategy() }
 */
export function createScrollStrategy(options?: DataWindowScrollStrategyOptions): DataWindowVirtualScrollStrategy {
  return new DataWindowVirtualScrollStrategy(options);
}

/**
 * DI Provider for DataWindowVirtualScrollStrategy.
 * Usage in component providers:
 *   providers: [dataWindowVirtualScrollStrategy({ itemSize: 36 })]
 */
export function dataWindowVirtualScrollStrategy(options?: DataWindowScrollStrategyOptions) {
  return {
    provide: VIRTUAL_SCROLL_STRATEGY,
    useFactory: () => new DataWindowVirtualScrollStrategy(options),
  };
}
