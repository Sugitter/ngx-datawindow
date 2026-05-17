import { Injectable, signal, computed } from '@angular/core';
import { ReportTemplate } from '../report-template.model';

/**
 * 撤销/重做服务
 * 使用快照栈实现，最大保存 50 个快照
 */
@Injectable()
export class UndoRedoService {
  private readonly MAXSTACK_SIZE = 50;
  
  private undoStack: ReportTemplate[] = [];
  private redoStack: ReportTemplate[] = [];

  // Signals 用于 UI 状态
  canUndo = signal(false);
  canRedo = signal(false);

  /**
   * 推入一个新快照（当前状态）
   */
  pushSnapshot(template: ReportTemplate): void {
    const snapshot = this.deepClone(template);
    this.undoStack.push(snapshot);
    
    // 限制栈大小
    if (this.undoStack.length > this.MAXSTACK_SIZE) {
      this.undoStack.shift();
    }
    
    // 新操作清空重做栈
    this.redoStack = [];
    
    this.updateSignals();
  }

  /**
   * 撤销
   */
  undo(currentTemplate: ReportTemplate): ReportTemplate | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    // 当前状态压入重做栈
    const currentSnapshot = this.deepClone(currentTemplate);
    this.redoStack.push(currentSnapshot);

    // 弹出上一个状态
    const previousSnapshot = this.undoStack.pop()!;
    
    this.updateSignals();
    return previousSnapshot;
  }

  /**
   * 重做
   */
  redo(currentTemplate: ReportTemplate): ReportTemplate | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    // 当前状态压入撤销栈
    const currentSnapshot = this.deepClone(currentTemplate);
    this.undoStack.push(currentSnapshot);

    // 弹出重做状态
    const nextSnapshot = this.redoStack.pop()!;
    
    this.updateSignals();
    return nextSnapshot;
  }

  /**
   * 清空栈（如新建/打开报表时）
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.updateSignals();
  }

  private updateSignals(): void {
    this.canUndo.set(this.undoStack.length > 0);
    this.canRedo.set(this.redoStack.length > 0);
  }

  /**
   * 深拷贝（简单实现，适合 MVP）
   * 生产环境建议使用 structuredClone 或 lodash.cloneDeep
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
}
