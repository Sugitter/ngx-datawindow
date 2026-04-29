/**
 * @deprecated Use DataTableComponent directly (standalone).
 * This module is kept for backward compatibility only.
 */
import { NgModule } from '@angular/core';
import { DataTableComponent } from './datatable.component';

@NgModule({
  imports: [DataTableComponent],
  exports: [DataTableComponent],
})
export class DataTableModule {}
