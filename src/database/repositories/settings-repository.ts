import { z } from 'zod';

import type { DatabaseDriver } from '../types';

const settingValueSchema = z.string();
const rowSchema = z.object({ value: z.string(), updated_at: z.string() });

/**
 * Basit anahtar-değer ayar deposu (app_settings tablosu).
 */
export class SettingsRepository {
  constructor(private readonly db: DatabaseDriver) {}

  async get(key: string): Promise<string | null> {
    const row = await this.db.getFirstAsync<unknown>('SELECT value, updated_at FROM app_settings WHERE key = ?', [
      key,
    ]);
    if (!row) return null;
    const parsed = rowSchema.safeParse(row);
    if (!parsed.success) return null;
    return settingValueSchema.parse(parsed.data.value);
  }

  async getNumber(key: string, fallback: number): Promise<number> {
    const raw = await this.get(key);
    if (raw === null) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  async set(key: string, value: string): Promise<void> {
    const ts = new Date().toISOString();
    await this.db.runAsync(
      `INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, ts],
    );
  }

  async setNumber(key: string, value: number): Promise<void> {
    await this.set(key, String(value));
  }
}
