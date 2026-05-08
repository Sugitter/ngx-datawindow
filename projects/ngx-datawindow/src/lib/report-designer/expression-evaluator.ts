/**
 * 表达式计算器 — ngx-datawindow Report Designer
 *
 * 支持语法：
 *   {field}              → 取字段值
 *   {field | format}     → 取字段值并格式化
 *   {SUM(field)}         → 聚合（必须在 group-footer / report-footer 中使用）
 *   {AVG(field)}         → 同上
 *   {COUNT()}            → 记录数
 *   {MAX(field)}         → 最大值
 *   {MIN(field)}         → 最小值
 *   {IIF(cond, trueVal, falseVal)}  → 条件表达式
 *   {CASE field WHEN 'x' THEN 'y' ELSE 'z' END} → 分支
 *   {field1 + field2}    → 数学运算
 *   {field1 > 100}       → 比较运算
 *   {'text'}             → 字符串字面量
 *   {'text' + field}    → 字符串拼接
 *   条件表达式: {field > 0 ? 'positive' : 'negative'}
 *
 * 作用域：
 *   - Data Band / Group Header / Group Footer: row = 当前行
 *   - Report Footer / Page Footer: row = null, 可用聚合函数
 */

// ══════════════════════════════════════════════════════════════
// Token 定义
// ══════════════════════════════════════════════════════════════

type TokenKind =
  | 'FIELD'        // {fieldname}
  | 'FMT'          // |format
  | 'STRING'       // 'literal'
  | 'NUMBER'       // 123 或 123.45
  | 'BOOL'         // true / false
  | 'NULL'         // null
  | 'LPAREN'       // (
  | 'RPAREN'       // )
  | 'LBRACE'       // {
  | 'RBRACE'       // }
  | 'COMMA'        // ,
  | 'PLUS'         // +
  | 'MINUS'        // -
  | 'STAR'         // *
  | 'SLASH'        // /
  | 'PERCENT'      // %
  | 'GT'           // >
  | 'LT'           // <
  | 'GE'           // >=
  | 'LE'           // <=
  | 'EQ'           // ==
  | 'NE'           // !=
  | 'AND'          // and / &&
  | 'OR'           // or / ||
  | 'NOT'          // not / !
  | 'QUESTION'     // ?
  | 'COLON'        // :
  | 'PIPE'         // |
  | 'FUNC'         // 函数名（内置）
  | 'IDENT'        // 标识符
  | 'EOF';

interface Token {
  kind: TokenKind;
  value: string;
  pos: number;
}

// ══════════════════════════════════════════════════════════════
// Tokenizer
// ══════════════════════════════════════════════════════════════

class Tokenizer {
  private pos = 0;
  private input: string;

  constructor(input: string) {
    // 预处理：替换中文标点
    this.input = input
      .replace(/（/g, '(').replace(/）/g, ')')
      .replace(/【/g, '[').replace(/】/g, ']')
      .replace(/，/g, ',').replace(/。/g, '.')
      .replace(/：/g, ':').replace(/；/g, ';')
      .replace(/＋/g, '+').replace(/－/g, '-')
      .replace(/＝/g, '==').replace(/＜/g, '<')
      .replace(/＞/g, '>').replace(/！/g, '!')
      .trim();
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      const t = this._next();
      if (t.kind !== 'EOF') tokens.push(t);
    }
    tokens.push({ kind: 'EOF', value: '', pos: this.pos });
    return tokens;
  }

  private _next(): Token {
    const start = this.pos;
    const ch = this._peek();

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      this._advance();
      return this._next();
    }

    if (ch === "'") return this._string();
    if (ch === '{') { this._advance(); return { kind: 'LBRACE', value: '{', pos: start }; }
    if (ch === '}') { this._advance(); return { kind: 'RBRACE', value: '}', pos: start }; }
    if (ch === '(') { this._advance(); return { kind: 'LPAREN', value: '(', pos: start }; }
    if (ch === ')') { this._advance(); return { kind: 'RPAREN', value: ')', pos: start }; }
    if (ch === ',') { this._advance(); return { kind: 'COMMA', value: ',', pos: start }; }
    if (ch === '+') { this._advance(); return { kind: 'PLUS', value: '+', pos: start }; }
    if (ch === '-') { this._advance(); return { kind: 'MINUS', value: '-', pos: start }; }
    if (ch === '*') { this._advance(); return { kind: 'STAR', value: '*', pos: start }; }
    if (ch === '/') { this._advance(); return { kind: 'SLASH', value: '/', pos: start }; }
    if (ch === '%') { this._advance(); return { kind: 'PERCENT', value: '%', pos: start }; }
    if (ch === '?') { this._advance(); return { kind: 'QUESTION', value: '?', pos: start }; }
    if (ch === ':') { this._advance(); return { kind: 'COLON', value: ':', pos: start }; }
    if (ch === '|') { this._advance(); return { kind: 'PIPE', value: '|', pos: start }; }
    if (ch === '=') { this._advance(); return { kind: 'EQ', value: '==', pos: start }; }
    if (ch === '!') {
      this._advance();
      if (this._peek() === '=') { this._advance(); return { kind: 'NE', value: '!=', pos: start }; }
      return { kind: 'NOT', value: '!', pos: start };
    }
    if (ch === '>') {
      this._advance();
      if (this._peek() === '=') { this._advance(); return { kind: 'GE', value: '>=', pos: start }; }
      return { kind: 'GT', value: '>', pos: start };
    }
    if (ch === '<') {
      this._advance();
      if (this._peek() === '=') { this._advance(); return { kind: 'LE', value: '<=', pos: start }; }
      return { kind: 'LT', value: '<', pos: start };
    }

    if (/[0-9]/.test(ch)) return this._number();
    if (/[a-zA-Z_$]/.test(ch)) return this._ident();

    this._advance();
    return this._next(); // 跳过未知字符
  }

  private _peek(): string {
    return this.input[this.pos] ?? '';
  }

  private _advance(): void {
    this.pos++;
  }

  private _string(): Token {
    const start = this.pos;
    this._advance(); // 跳过开始的引号
    let val = '';
    while (this._peek() !== "'" && this.pos < this.input.length) {
      if (this._peek() === '\\' && this.input[this.pos + 1] === "'") {
        val += "'";
        this._advance();
      } else {
        val += this._peek();
      }
      this._advance();
    }
    if (this._peek() === "'") this._advance();
    return { kind: 'STRING', value: val, pos: start };
  }

  private _number(): Token {
    const start = this.pos;
    let val = '';
    while (/[0-9.]/.test(this._peek())) {
      val += this._peek();
      this._advance();
    }
    return { kind: 'NUMBER', value: val, pos: start };
  }

  private _ident(): Token {
    const start = this.pos;
    let val = '';
    while (/[a-zA-Z0-9_$]/.test(this._peek())) {
      val += this._peek();
      this._advance();
    }

    const keywords: Record<string, TokenKind> = {
      'true': 'BOOL', 'false': 'BOOL',
      'null': 'NULL', 'and': 'AND', 'or': 'OR', 'not': 'NOT',
      'IIF': 'FUNC', 'IF': 'FUNC', 'CASE': 'FUNC', 'WHEN': 'FUNC', 'ELSE': 'FUNC', 'END': 'FUNC',
      'SUM': 'FUNC', 'AVG': 'FUNC', 'COUNT': 'FUNC', 'MAX': 'FUNC', 'MIN': 'FUNC',
      'FIRST': 'FUNC', 'LAST': 'FUNC', 'COALESCE': 'FUNC',
    };

    if (keywords[val]) return { kind: keywords[val], value: val.toUpperCase(), pos: start };
    if (val.match(/^(SUM|AVG|COUNT|MIN|MAX|FIRST|LAST|MEDIAN|STDDEV|DISTINCT)$/i)) {
      return { kind: 'FUNC', value: val.toUpperCase(), pos: start };
    }
    return { kind: 'IDENT', value: val, pos: start };
  }
}

// ══════════════════════════════════════════════════════════════
// Parser → AST
// ══════════════════════════════════════════════════════════════

type ASTNode =
  | { kind: 'literal'; value: string | number | boolean | null }
  | { kind: 'field'; name: string; format?: string }
  | { kind: 'binary'; op: string; left: ASTNode; right: ASTNode }
  | { kind: 'unary'; op: string; operand: ASTNode }
  | { kind: 'ternary'; cond: ASTNode; trueVal: ASTNode; falseVal: ASTNode }
  | { kind: 'call'; func: string; args: ASTNode[] }
  | { kind: 'ident'; name: string };

class Parser {
  private tokens: Token[] = [];
  private pos = 0;

  parse(input: string): ASTNode {
    this.tokens = new Tokenizer(input).tokenize();
    return this._parseExpr();
  }

  private _peek(): Token {
    return this.tokens[this.pos] ?? { kind: 'EOF', value: '', pos: 0 };
  }

  private _advance(): Token {
    const t = this._peek();
    this.pos++;
    return t;
  }

  private _expect(kind: TokenKind): Token {
    const t = this._advance();
    if (t.kind !== kind) {
      throw new Error(`Expected ${kind}, got ${t.kind} (${t.value}) at pos ${t.pos}`);
    }
    return t;
  }

  private _parseExpr(): ASTNode {
    return this._parseTernary();
  }

  private _parseTernary(): ASTNode {
    let cond = this._parseOr();
    if (this._peek().kind === 'QUESTION') {
      this._advance(); // ?
      const trueVal = this._parseOr();
      this._expect('COLON');
      const falseVal = this._parseOr();
      return { kind: 'ternary', cond, trueVal, falseVal };
    }
    return cond;
  }

  private _parseOr(): ASTNode {
    let left = this._parseAnd();
    while (this._peek().kind === 'OR') {
      this._advance();
      const right = this._parseAnd();
      left = { kind: 'binary', op: '||', left, right };
    }
    return left;
  }

  private _parseAnd(): ASTNode {
    let left = this._parseEquality();
    while (this._peek().kind === 'AND') {
      this._advance();
      const right = this._parseEquality();
      left = { kind: 'binary', op: '&&', left, right };
    }
    return left;
  }

  private _parseEquality(): ASTNode {
    let left = this._parseComparison();
    while (this._peek().kind === 'EQ' || this._peek().kind === 'NE') {
      const op = this._advance().value;
      const right = this._parseComparison();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private _parseComparison(): ASTNode {
    let left = this._parseAdditive();
    while (this._peek().kind === 'GT' || this._peek().kind === 'LT' ||
           this._peek().kind === 'GE' || this._peek().kind === 'LE') {
      const op = this._advance().value;
      const right = this._parseAdditive();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private _parseAdditive(): ASTNode {
    let left = this._parseMultiplicative();
    while (this._peek().kind === 'PLUS' || this._peek().kind === 'MINUS') {
      const op = this._advance().value;
      const right = this._parseMultiplicative();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private _parseMultiplicative(): ASTNode {
    let left = this._parseUnary();
    while (this._peek().kind === 'STAR' || this._peek().kind === 'SLASH' ||
           this._peek().kind === 'PERCENT') {
      const op = this._advance().value;
      const right = this._parseUnary();
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private _parseUnary(): ASTNode {
    if (this._peek().kind === 'NOT' || this._peek().kind === 'MINUS') {
      const op = this._advance().value;
      const operand = this._parseUnary();
      return { kind: 'unary', op: op === 'not' ? '!' : '-', operand };
    }
    return this._parsePrimary();
  }

  private _parsePrimary(): ASTNode {
    const tok = this._peek();

    if (tok.kind === 'STRING') { this._advance(); return { kind: 'literal', value: tok.value }; }
    if (tok.kind === 'NUMBER') { this._advance(); return { kind: 'literal', value: parseFloat(tok.value) }; }
    if (tok.kind === 'BOOL') { this._advance(); return { kind: 'literal', value: tok.value === 'true' }; }
    if (tok.kind === 'NULL') { this._advance(); return { kind: 'literal', value: null }; }

    if (tok.kind === 'LBRACE') {
      this._advance(); // skip {
      const inner = this._parseBraceContent();
      this._expect('RBRACE');
      return inner;
    }

    if (tok.kind === 'FUNC') {
      const funcName = this._advance().value;
      this._expect('LPAREN');
      const args: ASTNode[] = [];
      if (this._peek().kind !== 'RPAREN') {
        args.push(this._parseExpr());
        while (this._peek().kind === 'COMMA') {
          this._advance();
          args.push(this._parseExpr());
        }
      }
      this._expect('RPAREN');
      return { kind: 'call', func: funcName, args };
    }

    if (tok.kind === 'IDENT') {
      const name = this._advance().value;
      // 检查是否跟着 |
      if (this._peek().kind === 'PIPE') {
        this._advance();
        const fmtTok = this._peek();
        this._advance();
        return { kind: 'field', name, format: fmtTok.value };
      }
      return { kind: 'field', name };
    }

    if (tok.kind === 'LPAREN') {
      this._advance();
      const expr = this._parseExpr();
      this._expect('RPAREN');
      return expr;
    }

    throw new Error(`Unexpected token: ${tok.kind} (${tok.value}) at pos ${tok.pos}`);
  }

  private _parseBraceContent(): ASTNode {
    // {field} 或 {field|format} 或 {func(args)} 或 {expr ? a : b}
    const tok = this._peek();

    if (tok.kind === 'FUNC') {
      const funcName = tok.value;
      this._advance();
      this._expect('LPAREN');
      const args: ASTNode[] = [];
      if (this._peek().kind !== 'RPAREN') {
        args.push(this._parseExpr());
        while (this._peek().kind === 'COMMA') {
          this._advance();
          args.push(this._parseExpr());
        }
      }
      this._expect('RPAREN');
      return { kind: 'call', func: funcName, args };
    }

    if (tok.kind === 'IDENT') {
      const fieldName = tok.value;
      this._advance();
      if (this._peek().kind === 'PIPE') {
        this._advance();
        const fmtTok = this._peek();
        this._advance();
        return { kind: 'field', name: fieldName, format: fmtTok.value };
      }
      return { kind: 'field', name: fieldName };
    }

    // 普通表达式（可能是条件表达式等）
    return this._parseExpr();
  }
}

// ══════════════════════════════════════════════════════════════
// Evaluator — 执行 AST
// ══════════════════════════════════════════════════════════════

export interface EvalContext {
  /** 当前行数据（Data Band 中） */
  row?: Record<string, unknown>;
  /** 全部行数据（用于聚合） */
  rows?: Record<string, unknown>[];
  /** 当前行索引 */
  rowIndex?: number;
  /** 全局参数 */
  params?: Record<string, unknown>;
  /** 格式化器 */
  format?: (value: unknown, pattern?: string, dataType?: string) => string;
}

/** 内置聚合函数 */
const AGGREGATES: Record<string, (rows: Record<string, unknown>[], field: string) => number | null> = {
  SUM: (rows, f) => rows.reduce((s, r) => s + (Number(r[f]) || 0), 0),
  AVG: (rows, f) => rows.reduce((s, r) => s + (Number(r[f]) || 0), 0) / rows.length,
  COUNT: (rows) => rows.length,
  COUNT_DISTINCT: (rows, f) => new Set(rows.map(r => r[f])).size,
  MIN: (rows, f) => Math.min(...rows.map(r => Number(r[f]) || 0)),
  MAX: (rows, f) => Math.max(...rows.map(r => Number(r[f]) || 0)),
  FIRST: (rows, f) => (rows[0]?.[f] ?? null) as number | null,
  LAST: (rows, f) => (rows[rows.length - 1]?.[f] ?? null) as number | null,
  MEDIAN: (rows, f) => {
    const vals = rows.map(r => Number(r[f]) || 0).sort((a, b) => a - b);
    const mid = Math.floor(vals.length / 2);
    return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
  },
  STDDEV: (rows, f) => {
    if (rows.length === 0) return 0;
    const mean = rows.reduce((s, r) => s + (Number(r[f]) || 0), 0) / rows.length;
    const variance = rows.reduce((s, r) => s + Math.pow((Number(r[f]) || 0) - mean, 2), 0) / rows.length;
    return Math.sqrt(variance);
  },
};

/** 二进制运算符 */
function evalBinary(op: string, a: unknown, b: unknown): unknown {
  switch (op) {
    case '+': return (Number(a) || 0) + (Number(b) || 0);
    case '-': return (Number(a) || 0) - (Number(b) || 0);
    case '*': return (Number(a) || 0) * (Number(b) || 0);
    case '/': return (Number(b) || 0) === 0 ? 0 : (Number(a) || 0) / (Number(b) || 0);
    case '%': return (Number(a) || 0) % (Number(b) || 0);
    case '==': return a == b; // eslint-disable-line eqeqeq
    case '!=': return a != b; // eslint-disable-line eqeqeq
    case '>': return (Number(a) || 0) > (Number(b) || 0);
    case '<': return (Number(a) || 0) < (Number(b) || 0);
    case '>=': return (Number(a) || 0) >= (Number(b) || 0);
    case '<=': return (Number(a) || 0) <= (Number(b) || 0);
    case '&&': return Boolean(a) && Boolean(b);
    case '||': return Boolean(a) || Boolean(b);
    default: return null;
  }
}

export class ExpressionEvaluator {
  private parser = new Parser();

  /**
   * 解析并缓存表达式 AST
   */
  parse(expression: string): ASTNode {
    return this.parser.parse(expression);
  }

  /**
   * 执行表达式
   * @param expression 表达式字符串，如 "{amount * 1.06}" 或 "{SUM(sales)}"
   * @param ctx 上下文（行数据、全部行、参数等）
   */
  evaluate(expression: string, ctx: EvalContext): unknown {
    if (!expression || expression.trim() === '') return '';
    try {
      const ast = this.parser.parse(expression);
      return this._eval(ast, ctx);
    } catch (e) {
      console.warn(`[ExpressionEvaluator] Error evaluating "${expression}":`, e);
      return `!${expression}`;
    }
  }

  /**
   * 评估表达式并返回字符串（用于显示）
   */
  evaluateAsString(expression: string, ctx: EvalContext, format?: string, dataType?: string): string {
    const val = this.evaluate(expression, ctx);
    if (val == null) return ctx.row ? (ctx.row['nullText'] as string) ?? '' : '';
    if (format) return this._format(val, format, dataType);
    return String(val ?? '');
  }

  private _eval(node: ASTNode, ctx: EvalContext): unknown {
    switch (node.kind) {
      case 'literal': return node.value;

      case 'field': {
        const val = ctx.row ? ctx.row[node.name] : undefined;
        if (node.format && ctx.format) {
          return ctx.format(val, node.format, undefined);
        }
        return val;
      }

      case 'ident': return ctx.params?.[node.name] ?? ctx.row?.[node.name];

      case 'binary': {
        const a = this._eval(node.left, ctx);
        const b = this._eval(node.right, ctx);
        return evalBinary(node.op, a, b);
      }

      case 'unary': {
        const operand = this._eval(node.operand, ctx);
        return node.op === '!' ? !operand : -(Number(operand) || 0);
      }

      case 'ternary': {
        const cond = this._eval(node.cond, ctx);
        return Boolean(cond) ? this._eval(node.trueVal, ctx) : this._eval(node.falseVal, ctx);
      }

      case 'call': {
        const args = node.args.map(a => this._eval(a, ctx));
        return this._callBuiltin(node.func, args, ctx);
      }

      default: return null;
    }
  }

  private _callBuiltin(func: string, args: unknown[], ctx: EvalContext): unknown {
    const upper = func.toUpperCase();
    const rows = ctx.rows ?? (ctx.row ? [ctx.row] : []);

    switch (upper) {
      case 'SUM':
      case 'AVG':
      case 'COUNT':
      case 'COUNT_DISTINCT':
      case 'MIN':
      case 'MAX':
      case 'FIRST':
      case 'LAST':
      case 'MEDIAN':
      case 'STDDEV': {
        const field = args[0] == null ? '' : String(args[0]);
        const aggFn = AGGREGATES[upper];
        if (!aggFn) return 0;
        const result = aggFn(rows, field);
        return args[1] != null ? this._format(result, String(args[1])) : result;
      }

      case 'DISTINCT': {
        const field = args[0] == null ? '' : String(args[0]);
        return [...new Set(rows.map(r => r[field]))];
      }

      case 'IIF': {
        const cond = Boolean(args[0]);
        return cond ? args[1] : args[2];
      }

      case 'IF': {
        const cond = Boolean(args[0]);
        return cond ? args[1] : args[2];
      }

      case 'COALESCE': {
        for (const a of args) {
          if (a != null && a !== '') return a;
        }
        return null;
      }

      case 'LEN': return String(args[0] ?? '').length;
      case 'TRIM': return String(args[0] ?? '').trim();
      case 'UPPER': return String(args[0] ?? '').toUpperCase();
      case 'LOWER': return String(args[0] ?? '').toLowerCase();
      case 'LEFT': return String(args[0] ?? '').slice(0, Number(args[1]) || 0);
      case 'RIGHT': return String(args[0] ?? '').slice(-(Number(args[1]) || 0));
      case 'MID': return String(args[0] ?? '').slice(Number(args[1]) || 0, Number(args[2]) ?? undefined);
      case 'REPLACE': return String(args[0] ?? '').replace(new RegExp(String(args[1] ?? ''), 'g'), String(args[2] ?? ''));
      case 'ROUND': return Math.round(Number(args[0]) * Math.pow(10, Number(args[1]) || 0)) / Math.pow(10, Number(args[1]) || 0);
      case 'FLOOR': return Math.floor(Number(args[0]));
      case 'CEIL': return Math.ceil(Number(args[0]));
      case 'ABS': return Math.abs(Number(args[0]));
      case 'NOW': return new Date();
      case 'TODAY': return new Date().toISOString().slice(0, 10);
      case 'YEAR': return new Date(String(args[0])).getFullYear();
      case 'MONTH': return new Date(String(args[0])).getMonth() + 1;
      case 'DAY': return new Date(String(args[0])).getDate();
      case 'CONCAT': return args.map(a => String(a ?? '')).join(String(args[1] ?? ''));

      default:
        // 尝试作为字段引用
        if (ctx.row) return ctx.row[func];
        return null;
    }
  }

  private _format(value: unknown, pattern?: string, dataType?: string): string {
    if (value == null) return '';
    const n = Number(value);
    if (isNaN(n)) return String(value);

    if (!pattern) {
      if (dataType === 'currency') return `¥${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
      if (dataType === 'date' || dataType === 'datetime') {
        const d = new Date(String(value));
        if (!isNaN(d.getTime())) return d.toLocaleDateString('zh-CN');
      }
      return String(n);
    }

    // 格式化模式（简化版）
    if (/¥[#0,]+\.?[#0]*/.test(pattern)) {
      return `¥${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
    if (/[$][#0,]+\.?[#0]*/.test(pattern)) {
      return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    }
    if (pattern === '#,##0.00') {
      return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    if (pattern === '#,##0') {
      return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    if (pattern === '0%') {
      return `${(n * 100).toFixed(0)}%`;
    }
    if (/0\.00%/.test(pattern)) {
      return `${(n * 100).toFixed(2)}%`;
    }
    return String(n);
  }
}

/** 全局单例实例 */
export const expressionEvaluator = new ExpressionEvaluator();
