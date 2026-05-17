import { Component } from '@angular/core';
import { ReportDesignerNewComponent } from 'ngx-datawindow';

@Component({
  selector: 'app-report-designer-v2',
  standalone: true,
  imports: [ReportDesignerNewComponent],
  template: '<div style="height: 100vh"><ngx-report-designer></ngx-report-designer></div>'
})
export class ReportDesignerV2PageComponent {}
