/**
 * Find 表达式功能测试
 * 测试 PowerBuilder 风格的 Find() 表达式解析和查找功能
 */

import { DataStoreImpl, SimpleExpressionEvaluator } from './datastore';

describe('Find Expression Tests', () => {
  let store: DataStoreImpl;

  beforeEach(() => {
    const config = {
      name: 'test-find',
      fields: [
        { name: 'id', type: 'number', required: true },
        { name: 'name', type: 'string' },
        { name: 'age', type: 'number' },
        { name: 'department', type: 'string' },
        { name: 'salary', type: 'number' },
        { name: 'active', type: 'boolean' },
      ],
    };
    store = new DataStoreImpl(config);

    // 添加测试数据
    store.addRow({ id: 1, name: 'Alice', age: 30, department: 'Engineering', salary: 50000, active: true });
    store.addRow({ id: 2, name: 'Bob', age: 25, department: 'Sales', salary: 40000, active: true });
    store.addRow({ id: 3, name: 'Charlie', age: 35, department: 'Engineering', salary: 60000, active: false });
    store.addRow({ id: 4, name: 'David', age: 28, department: 'Marketing', salary: 45000, active: true });
    store.addRow({ id: 5, name: 'Eve', age: 32, department: 'Engineering', salary: 55000, active: true });
  });

  describe('SimpleExpressionEvaluator', () => {
    it('should evaluate simple equality', () => {
      const evaluator = new SimpleExpressionEvaluator("name = 'Alice'");
      expect(evaluator.evaluate({ name: 'Alice', age: 30 })).toBe(true);
      expect(evaluator.evaluate({ name: 'Bob', age: 25 })).toBe(false);
    });

    it('should evaluate numeric comparisons', () => {
      const evaluator = new SimpleExpressionEvaluator('age > 30');
      expect(evaluator.evaluate({ age: 35 })).toBe(true);
      expect(evaluator.evaluate({ age: 25 })).toBe(false);
      expect(evaluator.evaluate({ age: 30 })).toBe(false);
    });

    it('should evaluate AND conditions', () => {
      const evaluator = new SimpleExpressionEvaluator("department = 'Engineering' AND age > 30");
      expect(evaluator.evaluate({ department: 'Engineering', age: 35 })).toBe(true);
      expect(evaluator.evaluate({ department: 'Engineering', age: 25 })).toBe(false);
      expect(evaluator.evaluate({ department: 'Sales', age: 35 })).toBe(false);
    });

    it('should evaluate OR conditions', () => {
      const evaluator = new SimpleExpressionEvaluator("department = 'Engineering' OR salary > 50000");
      expect(evaluator.evaluate({ department: 'Engineering', salary: 40000 })).toBe(true);
      expect(evaluator.evaluate({ department: 'Sales', salary: 55000 })).toBe(true);
      expect(evaluator.evaluate({ department: 'Sales', salary: 40000 })).toBe(false);
    });

    it('should evaluate NOT conditions', () => {
      const evaluator = new SimpleExpressionEvaluator("NOT department = 'Sales'");
      expect(evaluator.evaluate({ department: 'Engineering' })).toBe(true);
      expect(evaluator.evaluate({ department: 'Sales' })).toBe(false);
    });

    it('should evaluate >= and <= operators', () => {
      const evaluator1 = new SimpleExpressionEvaluator('salary >= 50000');
      expect(evaluator1.evaluate({ salary: 50000 })).toBe(true);
      expect(evaluator1.evaluate({ salary: 49999 })).toBe(false);

      const evaluator2 = new SimpleExpressionEvaluator('age <= 30');
      expect(evaluator2.evaluate({ age: 30 })).toBe(true);
      expect(evaluator2.evaluate({ age: 31 })).toBe(false);
    });

    it('should evaluate <> operator', () => {
      const evaluator = new SimpleExpressionEvaluator("department <> 'Engineering'");
      expect(evaluator.evaluate({ department: 'Sales' })).toBe(true);
      expect(evaluator.evaluate({ department: 'Engineering' })).toBe(false);
    });

    it('should handle complex expressions', () => {
      const evaluator = new SimpleExpressionEvaluator(
        "(department = 'Engineering' OR department = 'Sales') AND age > 25 AND salary >= 45000"
      );
      expect(evaluator.evaluate({ department: 'Engineering', age: 30, salary: 50000 })).toBe(true);
      expect(evaluator.evaluate({ department: 'Sales', age: 24, salary: 50000 })).toBe(false);
      expect(evaluator.evaluate({ department: 'Marketing', age: 30, salary: 50000 })).toBe(false);
    });

    it('should handle invalid expressions gracefully', () => {
      const evaluator = new SimpleExpressionEvaluator('invalid syntax here');
      expect(evaluator.evaluate({ name: 'Alice' })).toBe(false);
    });

    it('should handle empty expressions', () => {
      const evaluator = new SimpleExpressionEvaluator('');
      expect(evaluator.evaluate({ name: 'Alice' })).toBe(false);
    });
  });

  describe('DataStore.findRows()', () => {
    it('should find rows by simple equality', () => {
      const result = store.findRows("name = 'Alice'");
      expect(result).toEqual([1]);
    });

    it('should find rows by numeric comparison', () => {
      const result = store.findRows('age > 30');
      expect(result).toEqual([3, 5]);
    });

    it('should find rows by AND condition', () => {
      const result = store.findRows("department = 'Engineering' AND age > 30");
      expect(result).toEqual([3, 5]);
    });

    it('should find rows by OR condition', () => {
      const result = store.findRows("department = 'Sales' OR department = 'Marketing'");
      expect(result).toEqual([2, 4]);
    });

    it('should find rows by complex expression', () => {
      const result = store.findRows('salary >= 50000 AND active = true');
      expect(result).toEqual([1, 5]);
    });

    it('should return empty array for no matches', () => {
      const result = store.findRows("name = 'NonExistent'");
      expect(result).toEqual([]);
    });

    it('should return empty array for empty expression', () => {
      const result = store.findRows('');
      expect(result).toEqual([]);
    });

    it('should handle boolean comparisons', () => {
      const result = store.findRows('active = true');
      expect(result).toEqual([1, 2, 4, 5]);
    });
  });

  describe('DataStore.findFirst()', () => {
    it('should return first matching row ID', () => {
      const result = store.findFirst("department = 'Engineering'");
      expect(result).toBe(1);
    });

    it('should return null when no match found', () => {
      const result = store.findFirst("name = 'NonExistent'");
      expect(result).toBeNull();
    });
  });

  describe('DataStore.findAndFocus()', () => {
    it('should focus on first matching row', () => {
      const result = store.findAndFocus("name = 'Charlie'");
      expect(result).toBe(true);
      // Note: Cannot easily test _currentRowId as it's private
    });

    it('should return false when no match found', () => {
      const result = store.findAndFocus("name = 'NonExistent'");
      expect(result).toBe(false);
    });
  });
});
