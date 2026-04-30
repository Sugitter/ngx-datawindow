import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval, map, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DataTableComponent, DataFeedConfig, ColumnConfig, DataStoreConfig } from 'ngx-datawindow';

interface StockQuote {
  symbol: string;
  name: string;
  _iconColor: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  sparkline: string;
  timestamp: number;
}

/** 生成 SVG 火花线图 */
function sparkline(values: number[], width = 80, height = 28): string {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const isUp = values[values.length - 1] >= values[0];
  const color = isUp ? '#4caf50' : '#f44336';
  const fillColor = isUp ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)';

  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * (height - 4) - 2).toFixed(1)}`)
    .join(' ');

  // 面积填充路径
  const lastX = ((values.length - 1) * step).toFixed(1);
  const areaPath = `M0,${height} L${points.split(' ').join(' L')} L${lastX},${height} Z`;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <path d="${areaPath}" fill="${fillColor}"/>
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${lastX}" cy="${(height - ((values[values.length - 1] - min) / range) * (height - 4) - 2).toFixed(1)}" r="2" fill="${color}"/>
  </svg>`;
}

/** 生成成交量柱状图 */
function volumeBar(current: number, max: number, width = 60, height = 20): string {
  if (!max) return '';
  const ratio = Math.min(current / max, 1);
  const barHeight = ratio * height;
  const color = '#90caf9';
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="${height - barHeight}" width="${width}" height="${barHeight}" fill="${color}" rx="2"/>
  </svg>`;
}

@Component({
  selector: 'app-realtime-demo',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, DataTableComponent],
  template: `
    <div class="realtime-demo">
      <div class="demo-header">
        <div class="header-row">
          <div>
            <h3>📈 Live Stock Quotes</h3>
            <p class="demo-desc">
              Real-time data feed with sparkline charts, color-coded price changes, and volume bars.
            </p>
          </div>
          <div class="controls">
            <button mat-stroked-button (click)="toggleFeed()">
              <mat-icon>{{ isRunning ? 'pause' : 'play_arrow' }}</mat-icon>
              {{ isRunning ? 'Pause' : 'Start' }}
            </button>
            <span class="status-badge" [class.active]="isRunning">
              <span class="dot"></span>
              {{ isRunning ? 'LIVE' : 'PAUSED' }}
            </span>
          </div>
        </div>
        <div class="ticker-stats" *ngIf="isRunning">
          <span class="stat">⏱ {{ updateInterval }}ms</span>
          <span class="stat">📊 {{ stockSymbols.length }} symbols</span>
          <span class="stat">🔄 {{ tickCount }} updates</span>
        </div>
      </div>

      <ngx-datawindow
        [datastoreConfig]="datastoreConfig"
        [columns]="columns"
        [dataFeed]="dataFeedConfig"
        [tableConfig]="tableConfig">
      </ngx-datawindow>
    </div>
  `,
  styles: [`
    .realtime-demo {
      padding: 16px;
    }
    .demo-header {
      margin-bottom: 16px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .demo-header h3 {
      margin: 0 0 4px 0;
      font-size: 20px;
      font-weight: 600;
    }
    .demo-desc {
      margin: 0;
      color: #666;
      font-size: 13px;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      padding: 6px 12px;
      border-radius: 20px;
      background: #f5f5f5;
      color: #999;
      transition: all 0.3s;
    }
    .status-badge.active {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #999;
    }
    .status-badge.active .dot {
      background: #4caf50;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .ticker-stats {
      display: flex;
      gap: 16px;
      margin-top: 10px;
      padding: 6px 0;
    }
    .stat {
      font-size: 12px;
      color: #888;
    }

    /* 表格内样式通过全局 styles.scss 处理 */
  `]
})
export class RealtimeDemoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private dataSubject$ = new Subject<StockQuote[]>();
  isRunning = false;
  tickCount = 0;
  updateInterval = 500;

  /** 价格历史（用于火花线图） */
  private priceHistory: Map<string, number[]> = new Map();
  private maxHistoryLen = 30;
  private maxVolume = 10000000;

  datastoreConfig: DataStoreConfig = {
    name: 'stocks',
    fields: [
      { name: 'symbol', type: 'string' },
      { name: 'name', type: 'string' },
      { name: '_iconColor', type: 'string' },
      { name: 'price', type: 'number' },
      { name: 'change', type: 'number' },
      { name: 'changePercent', type: 'number' },
      { name: 'volume', type: 'number' },
      { name: 'high', type: 'number' },
      { name: 'low', type: 'number' },
      { name: 'open', type: 'number' },
      { name: 'sparkline', type: 'string' },
      { name: 'timestamp', type: 'number' },
    ]
  };

  columns: ColumnConfig[] = [
    {
      field: 'symbol',
      header: 'Symbol',
      width: '120px',
      sortable: true,
      cellRenderer: (v: unknown, row: Record<string, unknown>) => {
        const symbol = String(v);
        const name = String(row['name'] || '');
        const color = String(row['_iconColor'] || '#666');
        const letter = symbol.charAt(0);
        return `<div class="rt-symbol">
          <span class="rt-icon" style="background:${color}">${letter}</span>
          <span class="rt-sym-wrap">
            <span class="rt-sym">${symbol}</span>
            <span class="rt-name">${name}</span>
          </span>
        </div>`;
      }
    },
    {
      field: 'sparkline',
      header: 'Trend',
      width: '100px',
      align: 'center',
      sortable: false,
      cellRenderer: (v: unknown) => String(v || ''),
    },
    {
      field: 'price',
      header: 'Price',
      width: '100px',
      align: 'right',
      cellRenderer: (v: unknown, row: Record<string, unknown>) => {
        const price = typeof v === 'number' ? v : 0;
        const change = typeof row['change'] === 'number' ? row['change'] as number : 0;
        const color = change >= 0 ? '#2e7d32' : '#c62828';
        return `<span style="color:${color};font-weight:600;font-variant-numeric:tabular-nums">$${price.toFixed(2)}</span>`;
      },
      cellStyle: (v: unknown, row: Record<string, unknown>) => {
        const change = typeof row['change'] === 'number' ? row['change'] as number : 0;
        return {
          'background': change > 0 ? 'rgba(76,175,80,0.06)' : change < 0 ? 'rgba(244,67,54,0.06)' : 'transparent',
          'transition': 'background 0.3s',
        };
      }
    },
    {
      field: 'change',
      header: 'Change',
      width: '100px',
      align: 'right',
      cellRenderer: (v: unknown) => {
        const change = typeof v === 'number' ? v : 0;
        const color = change >= 0 ? '#2e7d32' : '#c62828';
        const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '━';
        return `<span style="color:${color};font-weight:500;font-variant-numeric:tabular-nums">
          <span style="font-size:10px;margin-right:2px">${arrow}</span>${change >= 0 ? '+' : ''}${change.toFixed(2)}</span>`;
      },
      cellStyle: (v: unknown) => {
        const change = typeof v === 'number' ? v as number : 0;
        return {
          'background': change > 0 ? 'rgba(76,175,80,0.06)' : change < 0 ? 'rgba(244,67,54,0.06)' : 'transparent',
          'transition': 'background 0.3s',
        };
      }
    },
    {
      field: 'changePercent',
      header: '%',
      width: '80px',
      align: 'right',
      cellRenderer: (v: unknown) => {
        const pct = typeof v === 'number' ? v : 0;
        const color = pct >= 0 ? '#2e7d32' : '#c62828';
        const bg = pct >= 0 ? 'rgba(76,175,80,0.12)' : 'rgba(244,67,54,0.12)';
        return `<span style="color:${color};background:${bg};padding:2px 6px;border-radius:3px;font-size:12px;font-weight:500;font-variant-numeric:tabular-nums">
          ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%</span>`;
      }
    },
    {
      field: 'volume',
      header: 'Volume',
      width: '110px',
      align: 'right',
      cellRenderer: (v: unknown, row: Record<string, unknown>) => {
        const vol = typeof v === 'number' ? v : 0;
        const bar = volumeBar(vol, this.maxVolume, 50, 18);
        return `<div class="rt-vol">
          <span class="rt-vol-text">${vol >= 1000000 ? (vol / 1000000).toFixed(1) + 'M' : vol >= 1000 ? (vol / 1000).toFixed(0) + 'K' : String(vol)}</span>
          ${bar}
        </div>`;
      }
    },
    {
      field: 'high',
      header: 'H / L',
      width: '120px',
      align: 'right',
      cellRenderer: (v: unknown, row: Record<string, unknown>) => {
        const high = typeof v === 'number' ? v : 0;
        const low = typeof row['low'] === 'number' ? row['low'] as number : 0;
        return `<span class="rt-hl">
          <span style="color:#2e7d32">$${high.toFixed(2)}</span>
          <span class="rt-hl-sep">/</span>
          <span style="color:#c62828">$${low.toFixed(2)}</span>
        </span>`;
      }
    },
  ];

  tableConfig = {
    autoHeight: true,
    title: '',
    showToolbar: false,
    showPaginator: false,
    showGlobalSearch: false,
  };

  dataFeedConfig?: DataFeedConfig;

  stockSymbols = [
    { sym: 'AAPL', name: 'Apple Inc.', color: '#999' },
    { sym: 'GOOGL', name: 'Alphabet', color: '#4285f4' },
    { sym: 'MSFT', name: 'Microsoft', color: '#00a4ef' },
    { sym: 'AMZN', name: 'Amazon', color: '#ff9900' },
    { sym: 'META', name: 'Meta', color: '#1877f2' },
    { sym: 'NVDA', name: 'NVIDIA', color: '#76b900' },
    { sym: 'TSLA', name: 'Tesla', color: '#cc0000' },
    { sym: 'JPM', name: 'JPMorgan', color: '#003087' },
    { sym: 'V', name: 'Visa', color: '#1a1f71' },
    { sym: 'WMT', name: 'Walmart', color: '#0071ce' },
    { sym: 'NFLX', name: 'Netflix', color: '#e50914' },
    { sym: 'DIS', name: 'Disney', color: '#113ccf' },
  ];

  private prices: Map<string, { price: number; high: number; low: number; open: number }> = new Map();

  ngOnInit(): void {
    // Initialize with random prices
    for (const s of this.stockSymbols) {
      const basePrice = 50 + Math.random() * 450;
      this.prices.set(s.sym, {
        price: basePrice,
        high: basePrice * (1 + Math.random() * 0.02),
        low: basePrice * (1 - Math.random() * 0.02),
        open: basePrice + (Math.random() - 0.5) * 5,
      });
      // 初始化价格历史
      const history: number[] = [];
      let p = basePrice;
      for (let i = 0; i < 15; i++) {
        p += (Math.random() - 0.48) * 2;
        history.push(p);
      }
      history.push(basePrice);
      this.priceHistory.set(s.sym, history);
    }

    // Set up data feed config
    this.dataFeedConfig = {
      source: this.dataSubject$.asObservable(),
      mode: 'merge',
      keyField: 'symbol',
      highlightDuration: 0, // disable highlight animation
    };

    // Auto-start
    this.startFeed();
  }

  ngOnDestroy(): void {
    this.stopFeed();
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleFeed(): void {
    if (this.isRunning) {
      this.stopFeed();
    } else {
      this.startFeed();
    }
  }

  private startFeed(): void {
    this.isRunning = true;
    this.destroy$ = new Subject<void>();

    interval(this.updateInterval)
      .pipe(
        takeUntil(this.destroy$),
        map(() => this.generateQuotes())
      )
      .subscribe(quotes => {
        this.dataSubject$.next(quotes);
        this.tickCount++;
      });
  }

  private stopFeed(): void {
    this.isRunning = false;
    this.destroy$.next();
  }

  private generateQuotes(): StockQuote[] {
    const quotes: StockQuote[] = [];

    for (const s of this.stockSymbols) {
      const current = this.prices.get(s.sym)!;

      // 随机游走
      const volatility = 0.5 + Math.random() * 1.5;
      const drift = (Math.random() - 0.48) * volatility;
      const newPrice = Math.max(1, current.price + drift);
      const priceChange = newPrice - current.price;

      const newHigh = Math.max(current.high, newPrice);
      const newLow = Math.min(current.low, newPrice);

      this.prices.set(s.sym, {
        price: newPrice,
        high: newHigh,
        low: newLow,
        open: current.open,
      });

      // 更新价格历史
      const history = this.priceHistory.get(s.sym) || [];
      history.push(newPrice);
      if (history.length > this.maxHistoryLen) {
        history.shift();
      }
      this.priceHistory.set(s.sym, history);

      const volume = Math.floor(Math.random() * this.maxVolume) + 100000;

      quotes.push({
        symbol: s.sym,
        name: s.name,
        _iconColor: s.color,
        price: newPrice,
        change: priceChange,
        changePercent: (priceChange / current.price) * 100,
        volume,
        high: newHigh,
        low: newLow,
        open: current.open,
        sparkline: sparkline(history) as unknown as string,
        timestamp: Date.now(),
      });
    }

    return quotes;
  }
}
