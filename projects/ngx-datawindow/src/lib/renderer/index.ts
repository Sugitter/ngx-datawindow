/**
 * DataWindow Renderer — Framework-free view computation
 */
export {
  DataWindowRenderer, DisplayMode, DataWindowView, RendererState,
  ViewRow, ViewCell, ViewCell as Cell, RowType, RowStatus,
  ColumnConfig as RendererColumnConfig,
} from './renderer';

export { GridRenderer } from './grid-renderer';
export { GroupRenderer } from './group-renderer';
export { TreeRenderer } from './tree-renderer';
export { CardRenderer } from './card-renderer';
export { TreeGridRenderer } from './tree-grid-renderer';

import { DataWindowRenderer, DisplayMode } from './renderer';
import { GridRenderer } from './grid-renderer';
import { GroupRenderer } from './group-renderer';
import { TreeRenderer } from './tree-renderer';
import { CardRenderer } from './card-renderer';
import { TreeGridRenderer } from './tree-grid-renderer';

/** Factory: create renderer by display mode */
export function createRenderer(mode: DisplayMode = 'grid'): DataWindowRenderer {
  switch (mode) {
    case 'grid':     return new GridRenderer();
    case 'group':    return new GroupRenderer();
    case 'tree':     return new TreeRenderer();
    case 'card':     return new CardRenderer();
    case 'tree-grid': return new TreeGridRenderer();
    default:
      // Unimplemented modes: form, report, master-detail, export, pivot, gantt
      // Log warning once and fall back to grid
      if (createRenderer._warnedModes === undefined) {
        createRenderer._warnedModes = new Set<string>();
      }
      const warned = (createRenderer as any)._warnedModes;
      if (!warned.has(mode)) {
        console.warn(
          `[ngx-datawindow] DisplayMode "${mode}" is not yet implemented, falling back to "grid". ` +
          `This mode is planned for future releases.`
        );
        warned.add(mode);
      }
      return new GridRenderer();
  }
}

// Track warned modes to avoid repeated warnings
(createRenderer as any)._warnedModes = undefined;
