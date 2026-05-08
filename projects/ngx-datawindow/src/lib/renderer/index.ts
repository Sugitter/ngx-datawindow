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

import { DataWindowRenderer, DisplayMode } from './renderer';
import { GridRenderer } from './grid-renderer';
import { GroupRenderer } from './group-renderer';
import { TreeRenderer } from './tree-renderer';

/** Factory: create renderer by display mode */
export function createRenderer(mode: DisplayMode = 'grid'): DataWindowRenderer {
  switch (mode) {
    case 'grid':     return new GridRenderer();
    case 'group':    return new GroupRenderer();
    case 'tree':     return new TreeRenderer();
    default:         return new GridRenderer(); // fallback to grid
  }
}
