import { NextRequest, NextResponse } from "next/server";
import path from 'path';
import fs from 'fs';

// SQL.js server-side execution
let sqlJsModule: any = null;

async function getSqlJs() {
  if (sqlJsModule) return sqlJsModule;
  const initSqlJs = (await import('sql.js')).default;
  const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  const wasmBinary = fs.readFileSync(wasmPath);
  const SQL = await initSqlJs({ wasmBinary });
  sqlJsModule = SQL;
  return SQL;
}

export async function POST(request: NextRequest) {
  try {
    const { query, schema } = await request.json();

    if (!query || !schema) {
      return NextResponse.json({ error: 'Missing query or schema' }, { status: 400 });
    }

    const SQL = await getSqlJs();
    const db = new SQL.Database();
    db.run(schema);

    try {
      const result = db.exec(query);
      db.close();

      if (result.length > 0) {
        return NextResponse.json({
          columns: result[0].columns,
          rows: result[0].values,
          error: null,
        });
      }
      return NextResponse.json({
        columns: [],
        rows: [],
        error: null,
      });
    } catch (e: any) {
      db.close();
      return NextResponse.json({
        columns: [],
        rows: [],
        error: e.message,
      });
    }
  } catch (e: any) {
    return NextResponse.json({ error: `Server error: ${e.message}` }, { status: 500 });
  }
}
