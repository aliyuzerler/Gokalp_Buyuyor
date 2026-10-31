import { openDatabaseAsync } from 'expo-sqlite';

import { ExpoDatabaseDriver } from './drivers/expo-driver';
import { runMigrations } from './migrations';
import { runSeeds } from './seeds/seed-runner';

export const DATABASE_NAME = 'gokalp.sqlite';

export type AppDatabase = ExpoDatabaseDriver;

/**
 * Uygulama DB bağlantısını açar: foreign key + WAL açar, migration'ları
 * uygular ve seed içeriklerini kontrol eder. Tek yönetilen instance
 * DatabaseProvider üzerinden sağlanır.
 */
export async function openAppDatabase(): Promise<AppDatabase> {
  const sqlite = await openDatabaseAsync(DATABASE_NAME);
  const driver = new ExpoDatabaseDriver(sqlite);

  await driver.execAsync('PRAGMA foreign_keys = ON');
  // WAL: backup/restore tutarlılığı Faz 3'te checkpoint yaklaşımıyla yönetilir.
  await driver.execAsync('PRAGMA journal_mode = WAL');

  await runMigrations(driver);
  await runSeeds(driver);

  return driver;
}
