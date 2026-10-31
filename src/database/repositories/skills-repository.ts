import { z } from 'zod';

import type { DatabaseDriver } from '../types';
import { nowIso } from './child-profile-repository';
import { generateUuid } from '../../utils/uuid';
import { SKILL_OBSERVATION_STATUSES, type SkillObservationStatus } from '../../domain/journal-types';
import { validateEventDate } from '../../domain/calendar-date';

export const skillRowSchema = z.object({
  id: z.string().min(1),
  area_id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  min_age_months: z.number().int().min(0).max(216),
  max_age_months: z.number().int().min(0).max(216),
  sort_order: z.number().int(),
  source_name: z.string().nullable(),
  source_url: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  content_version: z.string(),
  is_active: z.union([z.literal(0), z.literal(1)]),
});

export type SkillRow = z.infer<typeof skillRowSchema>;

export const skillObservationRowSchema = z.object({
  id: z.string().min(1),
  skill_id: z.string().min(1),
  observed_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(SKILL_OBSERVATION_STATUSES),
  note: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SkillObservationRow = z.infer<typeof skillObservationRowSchema>;

export type SkillWithArea = SkillRow & { area_title: string };

export type SkillListFilters = {
  search?: string;
  /** 0–216 ay; verilirse min_age <= age <= max_age. */
  ageMonths?: number | null;
  limit?: number;
  offset?: number;
};

export class SkillsRepository {
  constructor(private readonly db: DatabaseDriver) {}

  async byId(id: string): Promise<SkillWithArea | null> {
    const row = await this.db.getFirstAsync<unknown>(
      `SELECT s.*, a.title AS area_title
       FROM skills s JOIN development_areas a ON a.id = s.area_id
       WHERE s.id = ? AND s.is_active = 1`,
      [id],
    );
    const parsed = skillRowSchema.safeParse(row);
    if (!parsed.success || !row) return null;
    return { ...(row as SkillRow), area_title: (row as { area_title: string }).area_title };
  }

  async listByArea(areaId: string, filters: SkillListFilters = {}): Promise<SkillRow[]> {
    const limit = Math.min(filters.limit ?? 50, 200);
    const offset = Math.max(filters.offset ?? 0, 0);
    const where = ['s.area_id = ?', 's.is_active = 1'];
    const params: (string | number)[] = [areaId];
    if (filters.search && filters.search.trim().length > 0) {
      where.push('(s.title LIKE ? OR s.description LIKE ?)');
      const like = `%${filters.search.trim()}%`;
      params.push(like, like);
    }
    if (filters.ageMonths !== null && filters.ageMonths !== undefined) {
      where.push('s.min_age_months <= ? AND s.max_age_months >= ?');
      params.push(filters.ageMonths, filters.ageMonths);
    }
    const rows = await this.db.getAllAsync<unknown>(
      `SELECT s.* FROM skills s WHERE ${where.join(' AND ')}
       ORDER BY s.min_age_months, s.title LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    return rows.map((r) => skillRowSchema.parse(r));
  }

  /** Alan özetleri: beceri ve gözlem sayıları (başarı skoru DEĞİL — betimleyici). */
  async countsPerArea(): Promise<Record<string, { skills: number; observations: number }>> {
    const skillCounts = await this.db.getAllAsync<{ area_id: string; n: number }>(
      'SELECT area_id, COUNT(*) AS n FROM skills WHERE is_active = 1 GROUP BY area_id',
    );
    const obsCounts = await this.db.getAllAsync<{
      area_id: string;
      n: number;
    }>(
      `SELECT s.area_id AS area_id, COUNT(so.id) AS n
       FROM skills s LEFT JOIN skill_observations so ON so.skill_id = s.id
       GROUP BY s.area_id`,
    );
    const result: Record<string, { skills: number; observations: number }> = {};
    for (const row of skillCounts) result[row.area_id] = { skills: Number(row.n), observations: 0 };
    for (const row of obsCounts) {
      const key = row.area_id;
      if (!result[key]) result[key] = { skills: 0, observations: 0 };
      result[key].observations = Number(row.n);
    }
    return result;
  }

  /** Gözlem geçmişi — her gözlem yeni satırdır, geçmiş asla silinmez. */
  async observations(skillId: string): Promise<SkillObservationRow[]> {
    const rows = await this.db.getAllAsync<unknown>(
      'SELECT * FROM skill_observations WHERE skill_id = ? ORDER BY observed_on DESC, created_at DESC',
      [skillId],
    );
    return rows.map((r) => skillObservationRowSchema.parse(r));
  }

  async observationCountsPerSkill(skillIds: string[]): Promise<Record<string, number>> {
    if (skillIds.length === 0) return {};
    const placeholders = skillIds.map(() => '?').join(',');
    const rows = await this.db.getAllAsync<{ skill_id: string; n: number }>(
      `SELECT skill_id, COUNT(*) AS n FROM skill_observations WHERE skill_id IN (${placeholders}) GROUP BY skill_id`,
      skillIds,
    );
    const map: Record<string, number> = {};
    for (const r of rows) map[r.skill_id] = Number(r.n);
    return map;
  }

  /**
   * Tarihli gözlem ekler. Her çağrı yeni satır oluşturur (overwrite yok).
   * Gelecek tarih ve enum dışı durum reddedilir.
   */
  async addObservation(input: {
    skillId: string;
    observedOn: string;
    status: SkillObservationStatus;
    note?: string | null;
  }): Promise<SkillObservationRow> {
    const dateCheck = validateEventDate(input.observedOn);
    if (!dateCheck.ok) {
      throw new Error(dateCheck.message);
    }
    if (!(SKILL_OBSERVATION_STATUSES as readonly string[]).includes(input.status)) {
      throw new Error('Geçersiz gözlem durumu.');
    }
    const id = generateUuid();
    const ts = nowIso();
    await this.db.runAsync(
      `INSERT INTO skill_observations (id, skill_id, observed_on, status, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, input.skillId, input.observedOn, input.status, input.note ?? null, ts, ts],
    );
    const row = await this.db.getFirstAsync<unknown>(
      'SELECT * FROM skill_observations WHERE id = ?',
      [id],
    );
    return skillObservationRowSchema.parse(row);
  }
}
