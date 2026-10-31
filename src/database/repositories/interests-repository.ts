import { z } from 'zod';

import type { DatabaseDriver } from '../types';
import { nowIso } from './child-profile-repository';
import { generateUuid } from '../../utils/uuid';

export const interestAreaRowSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  first_observed_on: z.string().nullable(),
  last_observed_on: z.string().nullable(),
  is_active: z.union([z.literal(0), z.literal(1)]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type InterestAreaRow = z.infer<typeof interestAreaRowSchema>;

/**
 * İlgi alanları: sistem çocuğa sabit yetenek tanımlamaz; tamamen ebeveyn girişidir.
 */
export class InterestAreasRepository {
  constructor(private readonly db: DatabaseDriver) {}

  async list(includeInactive = false): Promise<InterestAreaRow[]> {
    const where = includeInactive ? '' : 'WHERE is_active = 1';
    const rows = await this.db.getAllAsync<unknown>(
      `SELECT * FROM interest_areas ${where} ORDER BY is_active DESC, updated_at DESC`,
    );
    return rows.map((r) => interestAreaRowSchema.parse(r));
  }

  async byId(id: string): Promise<InterestAreaRow | null> {
    const row = await this.db.getFirstAsync<unknown>('SELECT * FROM interest_areas WHERE id = ?', [
      id,
    ]);
    return row ? interestAreaRowSchema.parse(row) : null;
  }

  async create(input: {
    title: string;
    description?: string | null;
    firstObservedOn?: string | null;
  }): Promise<InterestAreaRow> {
    if (!input.title.trim()) throw new Error('Başlık boş olamaz.');
    const id = generateUuid();
    const ts = nowIso();
    await this.db.runAsync(
      `INSERT INTO interest_areas (id, title, description, first_observed_on, last_observed_on, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, 1, ?, ?)`,
      [id, input.title.trim(), input.description ?? null, input.firstObservedOn ?? null, ts, ts],
    );
    const row = await this.byId(id);
    if (!row) throw new Error('İlgi alanı oluşturulamadı.');
    return row;
  }

  async update(
    id: string,
    patch: {
      title?: string;
      description?: string | null;
      firstObservedOn?: string | null;
      lastObservedOn?: string | null;
    },
  ): Promise<InterestAreaRow> {
    const current = await this.byId(id);
    if (!current) throw new Error('İlgi alanı bulunamadı.');
    if (patch.title !== undefined && !patch.title.trim()) {
      throw new Error('Başlık boş olamaz.');
    }
    await this.db.runAsync(
      `UPDATE interest_areas
       SET title = ?, description = ?, first_observed_on = ?, last_observed_on = ?, updated_at = ?
       WHERE id = ?`,
      [
        patch.title?.trim() ?? current.title,
        patch.description !== undefined ? patch.description : current.description,
        patch.firstObservedOn !== undefined ? patch.firstObservedOn : current.first_observed_on,
        patch.lastObservedOn !== undefined ? patch.lastObservedOn : current.last_observed_on,
        nowIso(),
        id,
      ],
    );
    const row = await this.byId(id);
    if (!row) throw new Error('İlgi alanı bulunamadı.');
    return row;
  }

  /** Pasifleştirme veriyi silmez; geçmiş korunur (kit kuralı). */
  async setActive(id: string, active: boolean): Promise<void> {
    await this.db.runAsync(
      'UPDATE interest_areas SET is_active = ?, updated_at = ? WHERE id = ?',
      [active ? 1 : 0, nowIso(), id],
    );
  }

  async count(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM interest_areas WHERE is_active = 1',
    );
    return Number(row?.n ?? 0);
  }
}
