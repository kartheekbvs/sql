'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { phases, Phase, Topic } from '@/lib/curriculum';
import { problems, Problem, TestCase } from '@/lib/problems';
import { useLearningStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// ─── Client-Side SQL.js Engine ─────────────────────────────────
let sqlJsModule: any = null;
let sqlJsLoading: Promise<any> | null = null;
let sqlJsError: string | null = null;

function getWasmUrl(): string {
  if (typeof window === 'undefined') return '/sql-wasm.wasm';
  const path = window.location.pathname;
  const basePath = path.startsWith('/sql') ? '/sql' : '';
  return `${basePath}/sql-wasm.wasm`;
}

async function getSqlJs(): Promise<any> {
  if (sqlJsModule) return sqlJsModule;
  if (sqlJsLoading) return sqlJsLoading;

  sqlJsLoading = (async () => {
    try {
      const initSqlJs = (await import('sql.js')).default;
      const wasmUrl = getWasmUrl();
      
      // Try fetching WASM as binary first (most reliable for static hosting)
      let SQL;
      try {
        const response = await fetch(wasmUrl);
        if (!response.ok) throw new Error(`WASM fetch failed: ${response.status}`);
        const wasmBinary = await response.arrayBuffer();
        SQL = await initSqlJs({ wasmBinary });
      } catch (wasmErr) {
        // Fallback: let sql.js locate the file itself
        console.warn('WASM binary fetch failed, trying locateFile fallback:', wasmErr);
        SQL = await initSqlJs({
          locateFile: (file: string) => getWasmUrl(),
        });
      }
      
      sqlJsModule = SQL;
      sqlJsError = null;
      return SQL;
    } catch (e: any) {
      sqlJsLoading = null;
      sqlJsError = e.message;
      console.error('Failed to load SQL.js:', e);
      throw e;
    }
  })();

  return sqlJsLoading;
}

async function executeQueryClient(schema: string, query: string): Promise<{ columns: string[]; rows: any[][]; error: string | null }> {
  try {
    const SQL = await getSqlJs();
    const db = new SQL.Database();
    try {
      db.run(schema);
      const result = db.exec(query);
      if (result.length > 0) {
        return { columns: result[0].columns, rows: result[0].values, error: null };
      }
      return { columns: [], rows: [], error: null };
    } catch (e: any) {
      return { columns: [], rows: [], error: e.message };
    } finally {
      db.close();
    }
  } catch (e: any) {
    return { columns: [], rows: [], error: `SQL Engine Error: ${e.message}. Please refresh the page.` };
  }
}

// Use client-side execution everywhere (works on GitHub Pages)
const executeQuery = executeQueryClient;

// ─── Schema Parser & Display ───────────────────────────────────
interface SchemaTable {
  name: string;
  columns: string[];
  sampleRows: any[][];
}

function parseSchemaTables(schema: string): SchemaTable[] {
  const tables: SchemaTable[] = [];
  const createRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([^)]+)\)/gi;
  let match;
  while ((match = createRegex.exec(schema)) !== null) {
    const tableName = match[1];
    const colDefs = match[2].split(',').map(c => c.trim()).filter(c => !c.match(/^(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT|UNIQUE|CHECK|INDEX)/i));
    const columns = colDefs.map(c => {
      const parts = c.trim().split(/\s+/);
      return parts[0].replace(/"/g, '');
    }).filter(c => c.length > 0);
    if (columns.length > 0) {
      tables.push({ name: tableName, columns, sampleRows: [] });
    }
  }

  // Extract sample data from INSERT statements
  for (const table of tables) {
    const insertRegex = new RegExp(`INSERT\\s+INTO\\s+${table.name}\\s+VALUES\\s*\\(([^)]+\\))`, 'gi');
    let insertMatch;
    let count = 0;
    while ((insertMatch = insertRegex.exec(schema)) !== null && count < 3) {
      const rowStr = insertMatch[1];
      const values = rowStr.split(',').map(v => {
        v = v.trim();
        if (v.toUpperCase() === 'NULL') return null;
        if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) return v.slice(1, -1);
        const num = Number(v);
        return isNaN(num) ? v : num;
      });
      table.sampleRows.push(values);
      count++;
    }
  }

  return tables;
}

// ─── Test Case Validation Engine ───────────────────────────────
export interface TestCaseResult {
  id: string;
  description: string;
  type: string;
  passed: boolean;
  message: string;
  actual?: any;
  expected?: any;
}

function normalizeVal(v: any): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return String(v).trim();
}

function normalizeRow(row: any[]): string[] {
  return row.map(normalizeVal);
}

function sortRowsForCompare(rows: any[][]): string[][] {
  return rows.map(normalizeRow).sort((a, b) => {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const cmp = a[i].localeCompare(b[i]);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

function rowsEqual(a: any[][], b: any[][]): boolean {
  const sa = sortRowsForCompare(a);
  const sb = sortRowsForCompare(b);
  if (sa.length !== sb.length) return false;
  for (let i = 0; i < sa.length; i++) {
    if (sa[i].length !== sb[i].length) return false;
    for (let j = 0; j < sa[i].length; j++) {
      if (sa[i][j] !== sb[i][j]) return false;
    }
  }
  return true;
}

function columnsMatch(expected: string[], actual: string[]): boolean {
  const e = expected.map(c => c.toLowerCase().trim());
  const a = actual.map(c => c.toLowerCase().trim());
  if (e.length !== a.length) return false;
  return e.every(col => a.includes(col));
}

function columnsExactOrder(expected: string[], actual: string[]): boolean {
  const e = expected.map(c => c.toLowerCase().trim());
  const a = actual.map(c => c.toLowerCase().trim());
  if (e.length !== a.length) return false;
  return e.every((col, i) => col === a[i]);
}

async function runTestCases(problem: Problem, userQuery: string): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = [];

  // Run the solution query to get expected result
  const solutionResult = await executeQuery(problem.schema, problem.solution);
  if (solutionResult.error) {
    return problem.testCases.map(tc => ({
      id: tc.id,
      description: tc.description,
      type: tc.type,
      passed: false,
      message: `Solution query error: ${solutionResult.error}`,
    }));
  }

  // Run the user's query
  const userResult = await executeQuery(problem.schema, userQuery);
  if (userResult.error) {
    return problem.testCases.map(tc => ({
      id: tc.id,
      description: tc.description,
      type: tc.type,
      passed: false,
      message: `Query Error: ${userResult.error}`,
    }));
  }

  for (const tc of problem.testCases) {
    const expectedCols = tc.expectedColumns || solutionResult.columns;
    const expectedRowCount = tc.expectedRowCount ?? solutionResult.rows.length;

    switch (tc.type) {
      case 'column_match': {
        const match = columnsMatch(expectedCols, userResult.columns);
        results.push({
          id: tc.id,
          description: tc.description,
          type: tc.type,
          passed: match,
          message: match
            ? `Column names match (${userResult.columns.join(', ')})`
            : `Column mismatch. Expected: [${expectedCols.join(', ')}], Got: [${userResult.columns.join(', ')}]`,
          actual: userResult.columns,
          expected: expectedCols,
        });
        break;
      }

      case 'column_order': {
        const match = columnsExactOrder(expectedCols, userResult.columns);
        results.push({
          id: tc.id,
          description: tc.description,
          type: tc.type,
          passed: match,
          message: match
            ? `Column order matches`
            : `Column order mismatch. Expected: [${expectedCols.join(', ')}], Got: [${userResult.columns.join(', ')}]`,
          actual: userResult.columns,
          expected: expectedCols,
        });
        break;
      }

      case 'row_count': {
        const match = userResult.rows.length === expectedRowCount;
        results.push({
          id: tc.id,
          description: tc.description,
          type: tc.type,
          passed: match,
          message: match
            ? `Row count matches: ${userResult.rows.length}`
            : `Row count mismatch. Expected: ${expectedRowCount}, Got: ${userResult.rows.length}`,
          actual: userResult.rows.length,
          expected: expectedRowCount,
        });
        break;
      }

      case 'exact_match': {
        const colsOk = columnsExactOrder(solutionResult.columns, userResult.columns);
        const rowsOk = rowsEqual(solutionResult.rows, userResult.rows);
        const match = colsOk && rowsOk;
        let msg = '';
        if (match) {
          msg = `Exact match! ${userResult.rows.length} rows, ${userResult.columns.length} columns`;
        } else if (!colsOk) {
          msg = `Column mismatch. Expected: [${solutionResult.columns.join(', ')}], Got: [${userResult.columns.join(', ')}]`;
        } else {
          msg = `Row data mismatch. Expected ${solutionResult.rows.length} rows, Got ${userResult.rows.length} rows`;
          // Find first differing row
          const sSorted = sortRowsForCompare(solutionResult.rows);
          const uSorted = sortRowsForCompare(userResult.rows);
          const maxCheck = Math.min(3, Math.max(sSorted.length, uSorted.length));
          for (let i = 0; i < maxCheck; i++) {
            if (!sSorted[i] || !uSorted[i]) {
              msg += ` | Row ${i + 1}: ${sSorted[i] ? sSorted[i].join(',') : 'missing'} vs ${uSorted[i] ? uSorted[i].join(',') : 'extra'}`;
            } else if (sSorted[i].join(',') !== uSorted[i].join(',')) {
              msg += ` | Row ${i + 1}: expected [${sSorted[i].join(', ')}], got [${uSorted[i].join(', ')}]`;
              break;
            }
          }
        }
        results.push({
          id: tc.id,
          description: tc.description,
          type: tc.type,
          passed: match,
          message: msg,
          actual: { columns: userResult.columns, rowCount: userResult.rows.length },
          expected: { columns: solutionResult.columns, rowCount: solutionResult.rows.length },
        });
        break;
      }

      case 'unordered_match': {
        const colsOk = columnsMatch(solutionResult.columns, userResult.columns);
        const rowsOk = rowsEqual(solutionResult.rows, userResult.rows);
        const match = colsOk && rowsOk;
        results.push({
          id: tc.id,
          description: tc.description,
          type: tc.type,
          passed: match,
          message: match
            ? `Results match (order-independent)! ${userResult.rows.length} rows`
            : !colsOk
              ? `Column mismatch. Expected: [${solutionResult.columns.join(', ')}], Got: [${userResult.columns.join(', ')}]`
              : `Row data mismatch despite correct columns. Expected ${solutionResult.rows.length} rows, Got ${userResult.rows.length}`,
          actual: { columns: userResult.columns, rowCount: userResult.rows.length },
          expected: { columns: solutionResult.columns, rowCount: solutionResult.rows.length },
        });
        break;
      }

      case 'not_empty': {
        const match = userResult.rows.length > 0 && userResult.columns.length > 0;
        results.push({
          id: tc.id,
          description: tc.description,
          type: tc.type,
          passed: match,
          message: match
            ? `Query returns ${userResult.rows.length} rows`
            : 'Query returned no results',
          actual: userResult.rows.length,
          expected: '> 0',
        });
        break;
      }

      case 'sorted_order': {
        const sortColIdx = tc.sortColumn ?? 0;
        const sortDir = tc.sortDirection ?? 'ASC';
        let isSorted = true;
        if (userResult.rows.length > 1) {
          for (let i = 1; i < userResult.rows.length; i++) {
            const prev = normalizeVal(userResult.rows[i - 1][sortColIdx]);
            const curr = normalizeVal(userResult.rows[i][sortColIdx]);
            if (sortDir === 'ASC' && prev.localeCompare(curr) > 0) { isSorted = false; break; }
            if (sortDir === 'DESC' && prev.localeCompare(curr) < 0) { isSorted = false; break; }
          }
        }
        const colName = userResult.columns[sortColIdx] || `column ${sortColIdx}`;
        results.push({
          id: tc.id,
          description: tc.description,
          type: tc.type,
          passed: isSorted,
          message: isSorted
            ? `Results sorted by ${colName} (${sortDir})`
            : `Results NOT sorted by ${colName} (${sortDir})`,
          actual: 'See query output',
          expected: `Sorted ${sortDir} by ${colName}`,
        });
        break;
      }

      default: {
        results.push({
          id: tc.id,
          description: tc.description,
          type: tc.type,
          passed: false,
          message: `Unknown test type: ${tc.type}`,
        });
      }
    }
  }

  return results;
}

// ─── Icons ─────────────────────────────────────────────────────
function BookOpen({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}
function Code({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
}
function CheckCircle({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
function XCircle({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
}
function Play({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>;
}
function ChevronRight({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function ChevronDown({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
}
function Menu({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
function X({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function Lightbulb({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>;
}
function AlertTriangle({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function Eye({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function EyeOff({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function Trophy({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
}
function Flask({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6"/><path d="M10 9V3h4v6l5 8.5a2 2 0 0 1-1.7 3H6.7a2 2 0 0 1-1.7-3L10 9z"/></svg>;
}
function Terminal({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>;
}

// ─── Result Table Component ────────────────────────────────────
function ResultTable({ columns, rows, maxRows = 50, highlight }: { columns: string[]; rows: any[][]; maxRows?: number; highlight?: boolean }) {
  if (columns.length === 0 && rows.length === 0) return <div className="text-slate-500 text-sm italic p-3">Query executed successfully (no results to display)</div>;
  const displayRows = rows.slice(0, maxRows);
  return (
    <div className="overflow-x-auto">
      <table className="sql-table">
        <thead>
          <tr>{columns.map((col, i) => <th key={i}>{col}</th>)}</tr>
        </thead>
        <tbody>
          {displayRows.map((row, ri) => (
            <tr key={ri}>{row.map((cell, ci) => <td key={ci} className={highlight ? 'py-1 text-xs' : ''}>{cell === null ? <span className="text-slate-500 italic">NULL</span> : String(cell)}</td>)}</tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && <div className="text-xs text-slate-500 mt-1 px-2">Showing {maxRows} of {rows.length} rows</div>}
    </div>
  );
}

// ─── Schema Display Component ─────────────────────────────────
function SchemaDisplay({ schema }: { schema: string }) {
  const [tables, setTables] = useState<SchemaTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parsed = parseSchemaTables(schema);
    setTables(parsed);
    setLoading(false);
  }, [schema]);

  if (loading) return <div className="text-slate-500 text-xs p-2">Loading schema...</div>;
  if (tables.length === 0) return null;

  return (
    <div className="space-y-3">
      {tables.map((table) => (
        <div key={table.name} className="bg-slate-900/80 rounded-lg border border-slate-700/50 overflow-hidden">
          <div className="px-3 py-2 bg-slate-800/60 border-b border-slate-700/50 flex items-center gap-2">
            <span className="text-emerald-400 text-xs font-bold font-mono">{table.name}</span>
            <span className="text-slate-500 text-[10px]">{table.columns.length} columns</span>
            {table.sampleRows.length > 0 && <span className="text-slate-600 text-[10px]">| {table.sampleRows.length} sample rows shown</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="sql-table text-xs">
              <thead>
                <tr>{table.columns.map((col, i) => <th key={i} className="text-[11px] px-2 py-1.5">{col}</th>)}</tr>
              </thead>
              <tbody>
                {table.sampleRows.length > 0 ? (
                  table.sampleRows.map((row, ri) => (
                    <tr key={ri}>
                      {table.columns.map((_, ci) => (
                        <td key={ci} className="px-2 py-1 text-[11px]">
                          {row[ci] === null || row[ci] === undefined ? <span className="text-slate-600 italic">NULL</span> : String(row[ci])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={table.columns.length} className="px-2 py-1 text-[11px] text-slate-600 italic text-center">No sample data</td></tr>
                )}
                <tr>
                  <td colSpan={table.columns.length} className="px-2 py-1 text-[10px] text-slate-600 text-center border-t border-slate-700/30">
                    ... more rows in database
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SQL Editor Component ──────────────────────────────────────
function SqlEditor({ initialCode, onRun, schema, runLabel }: { initialCode: string; onRun: (result: { columns: string[]; rows: any[][]; error: string | null }, query: string) => void; schema: string; runLabel?: string }) {
  const [code, setCode] = useState(initialCode);
  const [running, setRunning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setCode(initialCode); }, [initialCode]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    try {
      const result = await executeQuery(schema, code);
      onRun(result, code);
    } catch (e: any) {
      onRun({ columns: [], rows: [], error: `Execution failed: ${e.message}` }, code);
    } finally {
      setRunning(false);
    }
  }, [code, schema, onRun]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleRun(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newCode = code.substring(0, start) + '  ' + code.substring(end);
        setCode(newCode);
        setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = start + 2; }, 0);
      }
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-slate-950 text-emerald-300 font-mono text-sm p-4 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none resize-y min-h-[120px]"
        placeholder="-- Write your SQL query here...&#10;SELECT * FROM employees;"
        spellCheck={false}
      />
      <button
        onClick={handleRun}
        disabled={running}
        className={cn(
          "absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
          !running
            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50"
            : "bg-slate-700 text-slate-400 cursor-not-allowed"
        )}
      >
        <Play className="w-3 h-3" /> {running ? 'Running...' : runLabel || 'Run'} {!running && '(Ctrl+Enter)'}
      </button>
    </div>
  );
}

// ─── Checkpoint Quiz ───────────────────────────────────────────
function CheckpointQuiz({ checkpoint, onComplete }: { checkpoint: Topic['checkpoint']; onComplete: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === checkpoint.answer) onComplete();
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
      <h4 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" /> Quick Check
      </h4>
      <p className="text-slate-200 mb-4 text-sm">{checkpoint.question}</p>
      <div className="space-y-2">
        {checkpoint.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            className={cn(
              "w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all border",
              !showResult && "border-slate-600 hover:border-emerald-500 hover:bg-slate-700/50 text-slate-300",
              showResult && i === checkpoint.answer && "border-emerald-500 bg-emerald-900/30 text-emerald-300",
              showResult && i === selected && i !== checkpoint.answer && "border-red-500 bg-red-900/30 text-red-300",
              showResult && i !== selected && i !== checkpoint.answer && "border-slate-700 text-slate-500"
            )}
          >
            <span className="font-mono mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
          </button>
        ))}
      </div>
      {showResult && (
        <div className={cn("mt-3 p-3 rounded-lg text-sm", selected === checkpoint.answer ? "bg-emerald-900/20 text-emerald-300" : "bg-amber-900/20 text-amber-300")}>
          {selected === checkpoint.answer ? "Correct! " : "Not quite. "}
          {checkpoint.explanation}
        </div>
      )}
    </div>
  );
}

// ─── Test Case Results Panel ───────────────────────────────────
function TestCaseResults({ results, onShowExpected }: { results: TestCaseResult[]; onShowExpected: (result: TestCaseResult) => void }) {
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
      <div className={cn(
        "px-4 py-2.5 border-b border-slate-700 flex items-center justify-between",
        allPassed ? "bg-emerald-900/20" : "bg-red-900/10"
      )}>
        <div className="flex items-center gap-2">
          {allPassed ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
          <span className={cn("text-sm font-semibold", allPassed ? "text-emerald-400" : "text-red-400")}>
            {allPassed ? 'All Test Cases Passed!' : `${passed}/${total} Test Cases Passed`}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-24 bg-slate-700 rounded-full h-2">
            <div
              className={cn("rounded-full h-2 transition-all duration-500", allPassed ? "bg-emerald-500" : "bg-amber-500")}
              style={{ width: `${total > 0 ? (passed / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-slate-400">{passed}/{total}</span>
        </div>
      </div>
      <div className="divide-y divide-slate-800">
        {results.map((result, idx) => (
          <div key={result.id} className="px-4 py-3 hover:bg-slate-800/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {result.passed ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold border",
                    result.passed
                      ? "text-emerald-400 bg-emerald-900/20 border-emerald-800"
                      : "text-red-400 bg-red-900/20 border-red-800"
                  )}>
                    {result.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className={cn("text-xs font-medium", result.passed ? "text-slate-300" : "text-slate-200")}>
                    Test {idx + 1}: {result.description}
                  </span>
                </div>
                <p className={cn("text-xs", result.passed ? "text-emerald-400/70" : "text-red-400/80")}>
                  {result.message}
                </p>
                {!result.passed && result.expected !== undefined && (
                  <button
                    onClick={() => onShowExpected(result)}
                    className="mt-1.5 text-[10px] text-slate-500 hover:text-amber-400 transition-colors underline"
                  >
                    View expected vs actual
                  </button>
                )}
              </div>
              <span className={cn(
                "text-xs font-bold flex-shrink-0",
                result.passed ? "text-emerald-500" : "text-red-500"
              )}>
                {result.passed ? 'PASS' : 'FAIL'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Learn Mode ────────────────────────────────────────────────
function LearnMode() {
  const { currentTopicId, setCurrentTopic, completedTopics, toggleComplete, isCompleted } = useLearningStore();
  const [expandedPhase, setExpandedPhase] = useState<string>('1');
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[][]; error: string | null } | null>(null);
  const [activeSection, setActiveSection] = useState<'story' | 'steps' | 'code' | 'syntax' | 'mistakes' | 'quiz'>('story');
  const { sidebarOpen, setSidebarOpen } = useLearningStore();

  const currentTopic = phases.flatMap(p => p.topics).find(t => t.id === currentTopicId) || phases[0].topics[0];

  const allTopics = phases.flatMap(p => p.topics);
  const currentIdx = allTopics.findIndex(t => t.id === currentTopic.id);
  const prevTopic = currentIdx > 0 ? allTopics[currentIdx - 1] : null;
  const nextTopic = currentIdx < allTopics.length - 1 ? allTopics[currentIdx + 1] : null;

  const completedCount = completedTopics.length;
  const totalCount = allTopics.length;

  useEffect(() => { setQueryResult(null); setActiveSection('story'); }, [currentTopicId]);

  const handleQueryResult = useCallback((result: { columns: string[]; rows: any[][]; error: string | null }) => {
    setQueryResult(result);
  }, []);

  const sections = [
    { id: 'story' as const, label: 'Concept', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'steps' as const, label: 'Step-by-Step', icon: <Code className="w-3.5 h-3.5" /> },
    { id: 'code' as const, label: 'Try It', icon: <Play className="w-3.5 h-3.5" /> },
    { id: 'syntax' as const, label: 'Syntax', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'mistakes' as const, label: 'Pitfalls', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    { id: 'quiz' as const, label: 'Quiz', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">🗃️</span>
            <span className="font-bold text-emerald-400">SQL Mastery</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Progress</span>
            <span>{completedCount}/{totalCount} topics</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-emerald-500 rounded-full h-2 transition-all duration-500" style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Topics */}
        <div className="overflow-y-auto flex-1 p-2" style={{ maxHeight: 'calc(100vh - 10rem)' }}>
          {phases.map(phase => (
            <div key={phase.id} className="mb-1">
              <button
                onClick={() => setExpandedPhase(expandedPhase === phase.id ? '' : phase.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <span>{phase.icon}</span>
                <span className="flex-1 text-left">{phase.title}</span>
                {expandedPhase === phase.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              {expandedPhase === phase.id && (
                <div className="ml-4 space-y-0.5 animate-fade-in">
                  {phase.topics.map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => { setCurrentTopic(topic.id); setSidebarOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all text-left",
                        currentTopicId === topic.id ? "bg-emerald-900/40 text-emerald-300 border border-emerald-800" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      )}
                    >
                      {isCompleted(topic.id) ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex-shrink-0" />}
                      <span className="truncate">{topic.id} — {topic.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 px-4 py-2.5 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white"><Menu className="w-5 h-5" /></button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-200 truncate">{currentTopic.id} — {currentTopic.title}</h2>
          </div>
          <button
            onClick={() => toggleComplete(currentTopic.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              isCompleted(currentTopic.id) ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800" : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
            )}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {isCompleted(currentTopic.id) ? 'Completed' : 'Mark Done'}
          </button>
        </div>

        {/* Section tabs */}
        <div className="border-b border-slate-800 px-4 flex gap-1 overflow-x-auto">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap",
                activeSection === s.id ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 max-w-4xl mx-auto animate-fade-in">
          {/* Concept */}
          {activeSection === 'story' && (
            <div className="space-y-6">
              <div className="whitespace-pre-line text-slate-300 leading-relaxed text-sm">{currentTopic.story}</div>
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Visual</h4>
                <pre className="text-emerald-300/80 text-xs leading-relaxed overflow-x-auto">{currentTopic.tableViz}</pre>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentTopic.subtopics.map(st => (
                  <span key={st} className="px-2.5 py-1 rounded-full text-xs bg-slate-800 text-slate-400 border border-slate-700">{st}</span>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-step */}
          {activeSection === 'steps' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Step-by-Step Breakdown</h3>
              {currentTopic.stepByStep.map((step, i) => (
                <div key={i} className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <div className="flex-1 space-y-2">
                      <code className="text-amber-300 text-sm font-mono block bg-slate-950 px-3 py-2 rounded-md">{step.line}</code>
                      <p className="text-slate-300 text-sm">{step.explanation}</p>
                      <p className="text-emerald-400/80 text-xs font-medium">Result: {step.result}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Try It (Code) */}
          {activeSection === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">SQL Playground</h3>
                <span className="text-xs text-slate-500">Ctrl+Enter to run</span>
              </div>
              <SqlEditor
                initialCode={currentTopic.code}
                onRun={(result) => setQueryResult(result)}
                schema={currentTopic.schema}
              />
              {queryResult && (
                <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-700 flex items-center gap-2">
                    {queryResult.error ? (
                      <span className="text-red-400 text-xs font-semibold">Error</span>
                    ) : (
                      <span className="text-emerald-400 text-xs font-semibold">Result ({queryResult.rows.length} rows)</span>
                    )}
                  </div>
                  {queryResult.error ? (
                    <div className="p-4 text-red-400 text-sm font-mono">{queryResult.error}</div>
                  ) : (
                    <ResultTable columns={queryResult.columns} rows={queryResult.rows} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Syntax Card */}
          {activeSection === 'syntax' && (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-xl p-5 border border-emerald-900/30">
                <h4 className="text-emerald-400 font-semibold text-sm mb-3">{currentTopic.syntaxCard.title}</h4>
                <pre className="text-amber-300/90 text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">{currentTopic.syntaxCard.content}</pre>
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {activeSection === 'mistakes' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Common Mistakes to Avoid</h3>
              {currentTopic.mistakes.map((m, i) => (
                <div key={i} className="bg-slate-900 rounded-xl p-4 border border-red-900/20">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-red-400 text-xs font-bold mt-0.5">WRONG</span>
                      <code className="text-red-300/80 text-sm font-mono flex-1">{m.wrong}</code>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 text-xs font-bold mt-0.5">RIGHT</span>
                      <code className="text-emerald-300/80 text-sm font-mono flex-1">{m.correct}</code>
                    </div>
                    <p className="text-slate-400 text-xs pl-12">{m.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quiz */}
          {activeSection === 'quiz' && (
            <CheckpointQuiz
              checkpoint={currentTopic.checkpoint}
              onComplete={() => {
                if (!isCompleted(currentTopic.id)) toggleComplete(currentTopic.id);
              }}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800">
            {prevTopic ? (
              <button
                onClick={() => setCurrentTopic(prevTopic.id)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                <ChevronRight className="w-3 h-3 rotate-180" /> {prevTopic.id} {prevTopic.title}
              </button>
            ) : <div />}
            {nextTopic ? (
              <button
                onClick={() => setCurrentTopic(nextTopic.id)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {nextTopic.id} {nextTopic.title} <ChevronRight className="w-3 h-3" />
              </button>
            ) : <div />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Practice Mode ─────────────────────────────────────────────
function PracticeMode() {
  const { practiceFilter, setPracticeFilter, practiceCategory, setPracticeCategory, completedProblems, toggleProblemComplete, isProblemCompleted, currentProblemId, setCurrentProblem } = useLearningStore();
  const [queryResult, setQueryResult] = useState<{ columns: string[]; rows: any[][]; error: string | null } | null>(null);
  const [testResults, setTestResults] = useState<TestCaseResult[] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solved, setSolved] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState<'output' | 'tests'>('tests');
  const [showDiffModal, setShowDiffModal] = useState<TestCaseResult | null>(null);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const { sidebarOpen, setSidebarOpen } = useLearningStore();

  const categories = ['all', ...Array.from(new Set(problems.map(p => p.category)))];
  const filteredProblems = problems.filter(p => {
    if (practiceFilter !== 'all' && p.difficulty !== practiceFilter) return false;
    if (practiceCategory !== 'all' && p.category !== practiceCategory) return false;
    return true;
  });

  const currentProblem = currentProblemId ? problems.find(p => p.id === currentProblemId) : null;
  const completedCount = completedProblems.length;

  useEffect(() => {
    setQueryResult(null);
    setTestResults(null);
    setShowHint(false);
    setShowSolution(false);
    setSolved(false);
    setActiveResultTab('tests');
    setShowDiffModal(null);
  }, [currentProblemId]);

  const handleQueryResult = useCallback(async (result: { columns: string[]; rows: any[][]; error: string | null }, query: string) => {
    setQueryResult(result);
    setLastQuery(query);
    setTestResults(null);

    if (!result.error && currentProblem) {
      setIsRunning(true);
      // Run full test case validation
      const tcResults = await runTestCases(currentProblem, query);
      setTestResults(tcResults);
      setIsRunning(false);

      const allPassed = tcResults.every(r => r.passed);
      if (allPassed) {
        setSolved(true);
        if (!isProblemCompleted(currentProblem.id)) toggleProblemComplete(currentProblem.id);
      } else {
        setSolved(false);
      }
      setActiveResultTab('tests');
    }
  }, [currentProblem, isProblemCompleted, toggleProblemComplete]);

  const handleRunTests = useCallback(async () => {
    if (!currentProblem || !lastQuery) return;
    setIsRunning(true);
    const result = await executeQuery(currentProblem.schema, lastQuery);
    setQueryResult(result);
    if (!result.error) {
      const tcResults = await runTestCases(currentProblem, lastQuery);
      setTestResults(tcResults);
      const allPassed = tcResults.every(r => r.passed);
      if (allPassed) {
        setSolved(true);
        if (!isProblemCompleted(currentProblem.id)) toggleProblemComplete(currentProblem.id);
      } else {
        setSolved(false);
      }
    }
    setIsRunning(false);
  }, [currentProblem, lastQuery, isProblemCompleted, toggleProblemComplete]);

  const difficultyColor = (d: string) => d === 'Easy' ? 'text-emerald-400 bg-emerald-900/20 border-emerald-800' : d === 'Medium' ? 'text-amber-400 bg-amber-900/20 border-amber-800' : 'text-red-400 bg-red-900/20 border-red-800';

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-200 lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-amber-400">Practice</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Progress & Filters */}
        <div className="px-4 py-3 border-b border-slate-800 space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Solved</span>
            <span>{completedCount}/{problems.length} problems</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-amber-500 rounded-full h-2 transition-all duration-500" style={{ width: `${problems.length > 0 ? (completedCount / problems.length) * 100 : 0}%` }} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'Easy', 'Medium', 'Hard'] as const).map(f => (
              <button
                key={f}
                onClick={() => setPracticeFilter(f)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  practiceFilter === f ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >{f === 'all' ? 'All' : f}</button>
            ))}
          </div>
          <select
            value={practiceCategory}
            onChange={(e) => setPracticeCategory(e.target.value)}
            className="w-full bg-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2 border border-slate-700 focus:border-amber-500 focus:outline-none"
          >
            {categories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
          </select>
        </div>

        {/* Problem List */}
        <div className="overflow-y-auto flex-1 p-2" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
          {filteredProblems.map(p => (
            <button
              key={p.id}
              onClick={() => { setCurrentProblem(p.id); setSidebarOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all text-left mb-0.5",
                currentProblemId === p.id ? "bg-amber-900/30 text-amber-300 border border-amber-800" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              {isProblemCompleted(p.id) ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex-shrink-0" />}
              <span className="flex-1 truncate">{p.id}. {p.title}</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0", difficultyColor(p.difficulty))}>{p.difficulty}</span>
            </button>
          ))}
          {filteredProblems.length === 0 && <div className="text-slate-500 text-xs text-center py-4">No problems match your filters</div>}
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {currentProblem ? (
          <>
            <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800 px-4 py-2.5 flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white"><Menu className="w-5 h-5" /></button>
              <span className={cn("text-[10px] px-2 py-1 rounded border font-semibold", difficultyColor(currentProblem.difficulty))}>{currentProblem.difficulty}</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">{currentProblem.category}</span>
              <h2 className="text-sm font-semibold text-slate-200 flex-1 truncate">{currentProblem.id}. {currentProblem.title}</h2>
              {testResults && (
                <span className={cn(
                  "text-xs font-semibold flex items-center gap-1",
                  testResults.every(r => r.passed) ? "text-emerald-400" : "text-red-400"
                )}>
                  {testResults.every(r => r.passed) ? <><CheckCircle className="w-3.5 h-3.5" /> All Passed</> : <><XCircle className="w-3.5 h-3.5" /> {testResults.filter(r => r.passed).length}/{testResults.length}</>}
                </span>
              )}
              {solved && !testResults && <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Solved!</span>}
            </div>

            <div className="p-4 max-w-4xl mx-auto space-y-4 animate-fade-in">
              {/* Problem Description */}
              <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
                <p className="text-slate-200 text-sm leading-relaxed">{currentProblem.description}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Flask className="w-3.5 h-3.5" />
                  <span>{currentProblem.testCases.length} test cases</span>
                </div>
              </div>

              {/* Database Schema */}
              <div className="bg-slate-900/50 rounded-xl border border-slate-700 overflow-hidden">
                <details open>
                  <summary className="px-4 py-3 cursor-pointer flex items-center gap-2 hover:bg-slate-800/30 transition-colors">
                    <span className="text-xs font-semibold text-slate-300">Database Schema & Sample Data</span>
                    <span className="text-[10px] text-slate-600">(click to expand/collapse)</span>
                  </summary>
                  <div className="px-4 pb-4">
                    <SchemaDisplay schema={currentProblem.schema} />
                  </div>
                </details>
              </div>

              {/* SQL Editor */}
              <SqlEditor
                initialCode={`-- Write your solution here\n`}
                onRun={handleQueryResult}
                schema={currentProblem.schema}
                runLabel="Run & Test"
              />

              {/* Running indicator */}
              {isRunning && (
                <div className="bg-amber-900/10 rounded-xl p-4 border border-amber-800/30 flex items-center gap-3 animate-fade-in">
                  <svg className="w-4 h-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" /></svg>
                  <span className="text-amber-300 text-sm">Running test cases...</span>
                </div>
              )}

              {/* Query Result & Test Cases */}
              {(queryResult || testResults) && (
                <>
                  {/* Tab bar */}
                  <div className="flex gap-1 border-b border-slate-800">
                    <button
                      onClick={() => setActiveResultTab('tests')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all",
                        activeResultTab === 'tests' ? "border-amber-500 text-amber-400" : "border-transparent text-slate-500 hover:text-slate-300"
                      )}
                    >
                      <Flask className="w-3.5 h-3.5" /> Test Results
                      {testResults && (
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold",
                          testResults.every(r => r.passed) ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"
                        )}>
                          {testResults.filter(r => r.passed).length}/{testResults.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveResultTab('output')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all",
                        activeResultTab === 'output' ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-300"
                      )}
                    >
                      <Terminal className="w-3.5 h-3.5" /> Console Output
                    </button>
                  </div>

                  {/* Test Results Tab */}
                  {activeResultTab === 'tests' && testResults && (
                    <TestCaseResults
                      results={testResults}
                      onShowExpected={(result) => setShowDiffModal(result)}
                    />
                  )}

                  {activeResultTab === 'tests' && !testResults && queryResult && (
                    <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 text-center">
                      <p className="text-slate-400 text-sm">Run your query to see test results</p>
                    </div>
                  )}

                  {/* Console Output Tab */}
                  {activeResultTab === 'output' && queryResult && (
                    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                      <div className="px-4 py-2 border-b border-slate-700 flex items-center gap-2">
                        {queryResult.error ? (
                          <span className="text-red-400 text-xs font-semibold">Error</span>
                        ) : (
                          <span className="text-emerald-400 text-xs font-semibold">Result ({queryResult.rows.length} rows)</span>
                        )}
                      </div>
                      {queryResult.error ? (
                        <div className="p-4 text-red-400 text-sm font-mono">{queryResult.error}</div>
                      ) : (
                        <ResultTable columns={queryResult.columns} rows={queryResult.rows} />
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Hint & Solution */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-900/20 text-amber-400 border border-amber-800 hover:bg-amber-900/30 transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5" /> {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200 transition-colors"
                >
                  {showSolution ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {showSolution ? 'Hide Solution' : 'Show Solution'}
                </button>
              </div>

              {showHint && (
                <div className="bg-amber-900/10 rounded-xl p-4 border border-amber-800/30 animate-fade-in">
                  <p className="text-amber-300 text-sm"><Lightbulb className="w-4 h-4 inline mr-2" />{currentProblem.hint}</p>
                </div>
              )}

              {showSolution && (
                <div className="bg-slate-900 rounded-xl p-4 border border-emerald-900/30 animate-fade-in">
                  <h4 className="text-emerald-400 text-xs font-semibold mb-2">Solution</h4>
                  <pre className="text-emerald-300/90 text-sm overflow-x-auto">{currentProblem.solution}</pre>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Trophy className="w-16 h-16 text-amber-500/30 mb-4" />
            <h2 className="text-xl font-bold text-slate-300 mb-2">Ready to Practice?</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-md">Select a problem from the sidebar to start solving. Filter by difficulty and category to find problems that match your skill level.</p>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-colors">
              Browse Problems
            </button>
          </div>
        )}
      </div>

      {/* Diff Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowDiffModal(null)}>
          <div className="bg-slate-900 rounded-xl border border-slate-700 max-w-lg w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Test Case Detail: {showDiffModal.description}</h3>
              <button onClick={() => setShowDiffModal(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">Expected</h4>
                <pre className="bg-slate-950 rounded-lg p-3 text-xs text-emerald-300 font-mono overflow-x-auto">
                  {typeof showDiffModal.expected === 'object'
                    ? JSON.stringify(showDiffModal.expected, null, 2)
                    : String(showDiffModal.expected)}
                </pre>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Your Output</h4>
                <pre className="bg-slate-950 rounded-lg p-3 text-xs text-red-300 font-mono overflow-x-auto">
                  {typeof showDiffModal.actual === 'object'
                    ? JSON.stringify(showDiffModal.actual, null, 2)
                    : String(showDiffModal.actual)}
                </pre>
              </div>
              <div className="bg-amber-900/10 rounded-lg p-3 border border-amber-800/30">
                <p className="text-amber-300 text-xs">{showDiffModal.message}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SQL Engine Status ─────────────────────────────────────────
function SqlEngineStatus() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadEngine = useCallback(() => {
    setStatus('loading');
    sqlJsModule = null;
    sqlJsLoading = null;
    getSqlJs()
      .then(() => setStatus('ready'))
      .catch((e) => { console.error('SQL Engine error:', e); setStatus('error'); });
  }, []);

  useEffect(() => { loadEngine(); }, [loadEngine]);

  return (
    <div className="flex items-center gap-2">
      {status === 'loading' && (
        <span className="text-xs text-amber-400 flex items-center gap-1">
          <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" /></svg>
          Loading SQL Engine...
        </span>
      )}
      {status === 'ready' && (
        <span className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> SQL Engine Ready</span>
      )}
      {status === 'error' && (
        <button onClick={loadEngine} className="text-xs text-red-400 flex items-center gap-1 hover:text-red-300 transition-colors">
          <XCircle className="w-3 h-3" /> SQL Engine Failed (click to retry)
        </button>
      )}
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────
export default function Home() {
  const { mode, setMode } = useLearningStore();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗃️</span>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">SQL Mastery</h1>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">Zero to Placement Ready</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
            <button
              onClick={() => setMode('learn')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                mode === 'learn' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" /> Learn
            </button>
            <button
              onClick={() => setMode('practice')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                mode === 'practice' ? "bg-amber-600 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Code className="w-3.5 h-3.5" /> Practice
            </button>
          </div>

          {/* SQL Status */}
          <SqlEngineStatus />
        </div>
      </header>

      {/* Content */}
      {mode === 'learn' ? (
        <LearnMode />
      ) : (
        <PracticeMode />
      )}
    </div>
  );
}
