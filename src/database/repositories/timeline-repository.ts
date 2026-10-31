import type { DatabaseDriver } from '../types';

export type TimelineItemKind = 'journal' | 'skill_observation' | 'activity_session';

export type TimelineItem = {
  id: string;
  kind: TimelineItemKind;
  occurredAt: string;
  title: string | null;
  preview: string;
  /** journal için entry_type; skill observation için status; session için null. */
  meta: string | null;
};

export type TimelineQuery = {
  limit?: number;
  offset?: number;
  /** Belirli bir güne kadar (YYYY-MM-DD, kapsayıcı). */
  until?: string;
};

/**
 * Zaman çizelgesi: günlük kayıtları, beceri gözlemleri ve etkinlik oturumlarını
 * kronolojik birleştirir. Faz 4'te yalnızca günlük döner; UNION kolları
 * Faz 5/6'da etkinleşir (PRD 5.4).
 */
export class TimelineRepository {
  constructor(private readonly db: DatabaseDriver) {}

  async list(query: TimelineQuery = {}): Promise<TimelineItem[]> {
    const limit = Math.min(query.limit ?? 30, 100);
    const offset = Math.max(query.offset ?? 0, 0);

    const journalFilter = query.until
      ? 'WHERE j.occurred_at <= ?'
      : '';
    const journalParams: (string | number)[] = query.until ? [query.until] : [];

    const rows = await this.db.getAllAsync<{
      id: string;
      kind: TimelineItemKind;
      occurred_at: string;
      title: string | null;
      preview: string;
      meta: string | null;
    }>(
      `SELECT j.id AS id, 'journal' AS kind, j.occurred_at AS occurred_at,
              j.title AS title, substr(j.body, 1, 140) AS preview, j.entry_type AS meta
       FROM journal_entries j ${journalFilter}
       UNION ALL
       SELECT so.id, 'skill_observation', so.observed_on, NULL, COALESCE(so.note, ''), so.status
       FROM skill_observations so ${query.until ? 'WHERE so.observed_on <= ?' : ''}
       UNION ALL
       SELECT s.id, 'activity_session', s.happened_at, NULL, COALESCE(s.observation_note, ''), NULL
       FROM activity_sessions s ${query.until ? 'WHERE s.happened_at <= ?' : ''}
       ORDER BY occurred_at DESC, id ASC
       LIMIT ? OFFSET ?`,
      [...journalParams, ...journalParams, ...journalParams, limit, offset],
    );

    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      occurredAt: r.occurred_at,
      title: r.title,
      preview: r.preview,
      meta: r.meta,
    }));
  }
}
