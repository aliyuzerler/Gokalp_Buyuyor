import { Platform } from 'react-native';

import type { SQLiteDatabase } from 'expo-sqlite';

import type { DatabaseDriver, SqlParams, SqlRunResult } from '../types';

/**
 * expo-sqlite üzerindeki DatabaseDriver uygulaması.
 * Yalnızca uygulama çalışma zamanında kullanılır; testler node sürücüsünü kullanır.
 */
export class ExpoDatabaseDriver implements DatabaseDriver {
  private closed = false;

  constructor(private readonly db: SQLiteDatabase) {}

  async execAsync(source: string): Promise<void> {
    await this.db.execAsync(source);
  }

  async runAsync(source: string, params?: SqlParams): Promise<SqlRunResult> {
    const result = await this.db.runAsync(source, params ?? []);
    return {
      changes: Number(result.changes),
      lastInsertRowId: Number(result.lastInsertRowId),
    };
  }

  async getAllAsync<T>(source: string, params?: SqlParams): Promise<T[]> {
    return this.db.getAllAsync<T>(source, params ?? []);
  }

  async getFirstAsync<T>(source: string, params?: SqlParams): Promise<T | null> {
    return this.db.getFirstAsync<T>(source, params ?? []);
  }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    let result: T;
    // Web (WA-SQLite/OPFS) sürümü withExclusiveTransactionAsync'i desteklemez;
    // mobil davranış aynen korunur, web'de işlem söz öbek içinde yürütülür.
    if (Platform.OS === 'web') {
      result = await task();
      return result;
    }
    await this.db.withExclusiveTransactionAsync(async () => {
      result = await task();
    });
    return result!;
  }

  async closeAsync(): Promise<void> {
    if (this.closed) return;
    await this.db.closeAsync();
    this.closed = true;
  }

  isOpen(): boolean {
    return !this.closed;
  }
}
