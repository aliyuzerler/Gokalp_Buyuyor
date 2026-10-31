import { z } from 'zod';

import type { DatabaseDriver } from '../types';
import { nowIso } from './child-profile-repository';
import { generateUuid } from '../../utils/uuid';
import type { PlannedActivityStatus } from '../../domain/journal-types';

export const guideCategoryRowSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  sort_order: z.number().int(),
});

export type GuideCategoryRow = z.infer<typeof guideCategoryRowSchema>;

export const guideActivityRowSchema = z.object({
  id: z.string().min(1),
  category_id: z.string().nullable(),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  purpose: z.string().nullable(),
  min_age_months: z.number().int().min(0).max(216),
  max_age_months: z.number().int().min(0).max(216),
  estimated_minutes: z.number().int().nullable(),
  materials_json: z.string(),
  steps_json: z.string(),
  safety_notes: z.string(),
  adult_supervision: z.string(),
  source_name: z.string().nullable(),
  source_url: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  content_version: z.string(),
  is_active: z.union([z.literal(0), z.literal(1)]),
});

export type GuideActivityRow = z.infer<typeof guideActivityRowSchema>;

export type GuideActivityFull = GuideActivityRow & {
  category_title: string | null;
  materials: string[];
  steps: string[];
};

export type ActivityListFilters = {
  categorySlug?: string | null;
  ageMonths?: number | null;
  search?: string;
  limit?: number;
  offset?: number;
};

/** Rehber (salt-okunur içerik) repository'si. */
export class GuideRepository {
  constructor(private readonly db: DatabaseDriver) {}

  async listCategories(): Promise<GuideCategoryRow[]> {
    const rows = await this.db.getAllAsync<unknown>(
      'SELECT * FROM guide_categories ORDER BY sort_order',
    );
    return rows.map((r) => guideCategoryRowSchema.parse(r));
  }

  async listActivities(filters: ActivityListFilters = {}): Promise<GuideActivityFull[]> {
    const limit = Math.min(filters.limit ?? 50, 200);
    const offset = Math.max(filters.offset ?? 0, 0);
    const where: string[] = ['g.is_active = 1'];
    const params: (string | number)[] = [];
    if (filters.categorySlug) {
      where.push('c.slug = ?');
      params.push(filters.categorySlug);
    }
    if (filters.ageMonths !== null && filters.ageMonths !== undefined) {
      where.push('g.min_age_months <= ? AND g.max_age_months >= ?');
      params.push(filters.ageMonths, filters.ageMonths);
    }
    if (filters.search && filters.search.trim().length > 0) {
      where.push('(g.title LIKE ? OR g.summary LIKE ?)');
      const like = `%${filters.search.trim()}%`;
      params.push(like, like);
    }
    const rows = await this.db.getAllAsync<unknown>(
      `SELECT g.*, c.title AS category_title
       FROM guide_activities g
       LEFT JOIN guide_categories c ON c.id = g.category_id
       WHERE ${where.join(' AND ')}
       ORDER BY g.min_age_months, g.title
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    return rows.map((r) => this.parseFull(r));
  }

  async activityBySlug(slug: string): Promise<GuideActivityFull | null> {
    const row = await this.db.getFirstAsync<unknown>(
      `SELECT g.*, c.title AS category_title
       FROM guide_activities g
       LEFT JOIN guide_categories c ON c.id = g.category_id
       WHERE g.slug = ? AND g.is_active = 1`,
      [slug],
    );
    return row ? this.parseFull(row) : null;
  }

  async activityById(id: string): Promise<GuideActivityFull | null> {
    const row = await this.db.getFirstAsync<unknown>(
      `SELECT g.*, c.title AS category_title
       FROM guide_activities g
       LEFT JOIN guide_categories c ON c.id = g.category_id
       WHERE g.id = ? AND g.is_active = 1`,
      [id],
    );
    return row ? this.parseFull(row) : null;
  }

  async countActivities(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM guide_activities WHERE is_active = 1',
    );
    return Number(row?.n ?? 0);
  }

  private parseFull(row: unknown): GuideActivityFull {
    const parsed = guideActivityRowSchema.parse(row);
    const withCategory = row as { category_title: string | null };
    let materials: string[] = [];
    let steps: string[] = [];
    try {
      materials = JSON.parse(parsed.materials_json) as string[];
      steps = JSON.parse(parsed.steps_json) as string[];
    } catch {
      // Bozuk JSON: boş liste ile devam (içerik görüntülenir, uygulama çökmez)
    }
    return { ...parsed, category_title: withCategory.category_title, materials, steps };
  }
}

export const plannedActivityRowSchema = z.object({
  id: z.string().min(1),
  activity_id: z.string().nullable(),
  custom_title: z.string().nullable(),
  planned_for: z.string().nullable(),
  status: z.enum(['planned', 'completed', 'postponed', 'skipped']),
  parent_note: z.string().nullable(),
  reminder_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PlannedActivityRow = z.infer<typeof plannedActivityRowSchema>;

export type PlannedActivityFull = PlannedActivityRow & { activity_title: string | null };

export class PlannedActivitiesRepository {
  constructor(private readonly db: DatabaseDriver) {}

  async create(input: {
    activityId?: string | null;
    customTitle?: string | null;
    plannedFor?: string | null;
    reminderId?: string | null;
  }): Promise<PlannedActivityRow> {
    const id = generateUuid();
    const ts = nowIso();
    await this.db.runAsync(
      `INSERT INTO planned_activities (id, activity_id, custom_title, planned_for, status, parent_note, reminder_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'planned', NULL, ?, ?, ?)`,
      [id, input.activityId ?? null, input.customTitle ?? null, input.plannedFor ?? null, input.reminderId ?? null, ts, ts],
    );
    const row = await this.db.getFirstAsync<unknown>('SELECT * FROM planned_activities WHERE id = ?', [id]);
    return plannedActivityRowSchema.parse(row);
  }

  async list(status?: PlannedActivityStatus | null): Promise<PlannedActivityFull[]> {
    const where = status ? 'WHERE p.status = ?' : '';
    const params: string[] = status ? [status] : [];
    const rows = await this.db.getAllAsync<unknown>(
      `SELECT p.*, g.title AS activity_title
       FROM planned_activities p
       LEFT JOIN guide_activities g ON g.id = p.activity_id
       ${where}
       ORDER BY CASE WHEN p.planned_for IS NULL THEN 1 ELSE 0 END, p.planned_for DESC, p.created_at DESC`,
      params,
    );
    return rows.map((r) => this.parseFull(r));
  }

  async byId(id: string): Promise<PlannedActivityFull | null> {
    const row = await this.db.getFirstAsync<unknown>(
      `SELECT p.*, g.title AS activity_title
       FROM planned_activities p
       LEFT JOIN guide_activities g ON g.id = p.activity_id
       WHERE p.id = ?`,
      [id],
    );
    return row ? this.parseFull(row) : null;
  }

  async updateStatus(
    id: string,
    status: PlannedActivityStatus,
    parentNote?: string | null,
  ): Promise<PlannedActivityFull> {
    await this.db.runAsync(
      'UPDATE planned_activities SET status = ?, parent_note = COALESCE(?, parent_note), updated_at = ? WHERE id = ?',
      [status, parentNote ?? null, nowIso(), id],
    );
    const row = await this.byId(id);
    if (!row) throw new Error('Plan bulunamadı.');
    return row;
  }

  async setReminderId(id: string, reminderId: string | null): Promise<void> {
    await this.db.runAsync(
      'UPDATE planned_activities SET reminder_id = ?, updated_at = ? WHERE id = ?',
      [reminderId, nowIso(), id],
    );
  }

  /**
   * Etkinliği tamamlar ve oturum (gözlem notuyla) oluşturur — tek transaction.
   */
  async completeWithSession(input: {
    plannedId: string;
    happenedAt: string;
    observationNote?: string | null;
  }): Promise<{ planned: PlannedActivityFull; sessionId: string }> {
    const planned = await this.byId(input.plannedId);
    if (!planned) throw new Error('Plan bulunamadı.');
    const sessionId = generateUuid();
    const ts = nowIso();
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        "UPDATE planned_activities SET status = 'completed', parent_note = COALESCE(?, parent_note), updated_at = ? WHERE id = ?",
        [input.observationNote ?? null, ts, input.plannedId],
      );
      await this.db.runAsync(
        `INSERT INTO activity_sessions (id, planned_activity_id, activity_id, happened_at, observation_note, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [sessionId, planned.id, planned.activity_id, input.happenedAt, input.observationNote ?? null, ts],
      );
    });
    const updated = await this.byId(input.plannedId);
    if (!updated) throw new Error('Plan bulunamadı.');
    return { planned: updated, sessionId };
  }

  private parseFull(row: unknown): PlannedActivityFull {
    const parsed = plannedActivityRowSchema.parse(row);
    return { ...parsed, activity_title: (row as { activity_title: string | null }).activity_title };
  }
}
