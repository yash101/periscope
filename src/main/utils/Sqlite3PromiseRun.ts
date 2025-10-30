import type { Database, RunResult } from "@vscode/sqlite3";

export function runAsyncQuery(
  db: Database,
  sql: string,
  params: any[] = []
): Promise<RunResult> {
  return new Promise<RunResult>((resolve, reject) => {
    db.run(sql, params, function (this: RunResult, err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    })
  });
}

export function allAsyncQuery<T>(
  db: Database,
  sql: string,
  params: any[] = []
): Promise<T[]> {
  return new Promise<T[]>((resolve, reject) => {
    db.all(sql, params, (err: Error | null, rows: T[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  })
}
