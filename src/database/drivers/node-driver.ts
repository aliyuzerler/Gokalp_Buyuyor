import { DatabaseSync } from 'node:sqlite';

import type { DatabaseDriver, SqlParams, SqlRunResult } from '../types';

/**
 * Test sürücüsü: node:sqlite üzerinde aynı DatabaseDriver arayüzü.
 * ExpoDatabaseDriver ile birebir aynı SQL'i çalıştırır; migration ve
 * repository entegrasyon testleri bu sürücüyle koşar.
 */
export class NodeSqliteDriver implements DatabaseDriver {
  private closed = false;
  private inTransaction = false;

  constructor(private readonly db: DatabaseSync) {}

  static async openInMemory(): Promise<NodeSqliteDriver> {
    const db = new DatabaseSync(':memory:');
    const driver = new NodeSqliteDriver(db);
    await driver.execAsync('PRAGMA foreign_keys = ON');
    return driver;
  }

  static async openFile(path: string): Promise<NodeSqliteDriver> {
    const db = new DatabaseSync(path);
    const driver = new NodeSqliteDriver(db);
    await driver.execAsync('PRAGMA foreign_keys = ON');
    return driver;
  }

  async execAsync(source: string): Promise<void> {
    this.db.exec(source);
  }

  async runAsync(source: string, params?: SqlParams): Promise<SqlRunResult> {
    const stmt = this.db.prepare(source);
    const result = stmt.run(...(params ?? []));
    return {
      changes: Number(result.changes),
      lastInsertRowId: Number(result.lastInsertRowid),
    };
  }

  async getAllAsync<T>(source: string, params?: SqlParams): Promise<T[]> {
    const stmt = this.db.prepare(source);
    return stmt.all(...(params ?? [])) as T[];
  }

  async getFirstAsync<T>(source: string, params?: SqlParams): Promise<T | null> {
    const stmt = this.db.prepare(source);
    const row = stmt.get(...(params ?? []));
    return (row as T) ?? null;
  }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    if (this.inTransaction) {
      // İç içe çağrı tek transaction içinde çalışır.
      return task();
    }
    this.inTransaction = true;
    try {
      this.db.exec('BEGIN IMMEDIATE');
      const result = await task();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    } finally {
      this.inTransaction = false;
    }
  }

  async closeAsync(): Promise<void> {
    this.db.close();
    this.closed = true;
  }

  isOpen(): boolean {
    return !this.closed;
  }
}
