/**
 * ngx-datawindow Report Designer — 导出全部 public API
 *
 * 注意：不重新导出 report-template.model 中的 AggregationType，
 * 因为它与 datastore.ts/models.ts 中的 AggregationType 同名。
 * 直接从 report-template.model 导入需要的类型。
 */
export {
  ReportTemplate,
  ReportBand,
  ReportItem,
  ReportItemType,
  ReportStyle,
  ReportGroup,
  ReportParameter,
  ReportSort,
  TableColumn,
  createEmptyTemplate,
  fieldsFromColumns,
} from './report-template.model';

export {
  ExpressionEvaluator,
  expressionEvaluator,
  EvalContext,
} from './expression-evaluator';

export {
  ReportEngine,
  ReportPages,
  ReportPage,
  ReportSection,
  ReportRow,
  ReportCell,
  ResolvedStyle,
  RenderContext,
  BandContext,
} from './report-engine';

export { ReportDesignerComponent } from './report-designer.component';
export { ReportDesignerDemoComponent } from './report-designer-demo.component';
