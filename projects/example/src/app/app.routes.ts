import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'demo',
        loadComponent: () => import('./pages/demo/demo.component').then(m => m.DemoComponent),
        children: [
            { path: '', redirectTo: 'basic', pathMatch: 'full' },
            { path: 'basic', loadComponent: () => import('./pages/demo/basic/basic.component').then(m => m.BasicComponent) },
            { path: 'columns', loadComponent: () => import('./pages/demo/columns/columns.component').then(m => m.ColumnsComponent) },
            { path: 'filter', loadComponent: () => import('./pages/demo/filter/filter.component').then(m => m.FilterComponent) },
            { path: 'editing', loadComponent: () => import('./pages/demo/editing/editing.component').then(m => m.EditingComponent) },
            { path: 'aggregation', loadComponent: () => import('./pages/demo/aggregation/aggregation.component').then(m => m.AggregationComponent) },
            { path: 'selection', loadComponent: () => import('./pages/demo/selection/selection.component').then(m => m.SelectionComponent) },
            { path: 'virtual', loadComponent: () => import('./pages/demo/virtual/virtual.component').then(m => m.VirtualComponent) },
            { path: 'realtime', loadComponent: () => import('./pages/demo/realtime/realtime.component').then(m => m.RealtimeDemoComponent) },
            { path: 'toolbar', loadComponent: () => import('./pages/demo/toolbar/toolbar.component').then(m => m.ToolbarComponent) },
            { path: 'business', loadComponent: () => import('./pages/demo/business/business.component').then(m => m.BusinessComponent) },
        ]
    },
    { path: '**', redirectTo: 'demo' }
];
