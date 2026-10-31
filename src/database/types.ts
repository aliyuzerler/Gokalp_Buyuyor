/**
 * DB sürücü soyutlaması.
 *
 * UI ve repository katmanı bu arayüzü kullanır; expo-sqlite yalnızca
 * uygulama içindeki ExpoDatabaseDriver'da referans edilir. Test ortamı
 * aynı arayüzü node:sqlite üzerinden uygular (aynı SQL, aynı migration).
 */

export type SqlValue = string | number | null;
export type SqlParams = SqlValue[];

export type SqlRunResult = {
  changes: number;
  lastInsertRowId: number;
};

export interface DatabaseDriver {
  /** Çok satırlı/PRAGMA gibi sonuç döndürmeyen SQL. */
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SqlParams): Promise<SqlRunResult>;
  getAllAsync<T>(source: string, params?: SqlParams): Promise<T[]>;
  getFirstAsync<T>(source: string, params?: SqlParams): Promise<T | null>;
  /** BEGIN/COMMIT/ROLLBACK sarmalayan transaction. */
  withTransactionAsync<T>(task: () => Promise<T>): Promise<T>;
  closeAsync(): Promise<void>;
  /** DB hâlâ açık mı (backup/restore için). */
  isOpen(): boolean;
}
