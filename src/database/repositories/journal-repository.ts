import { z } from 'zod';

import type { DatabaseDriver } from '../types';
import { nowIso } from './child-profile-repository';
import { generateUuid } from '../../utils/uuid';
import type { JournalEntryType } from '../../domain/journal-types';

export const journalEntryRowSchema = z.object({
  id: z.string().min(1),
  entry_type: z.string(),
  title: z.string().nullable(),
  body: z.string().min(1),
  occurred_at: z.string().min(1),
  area_id: z.string().nullable(),
  is_favorite: z.union([z.literal(0), z.literal(1)]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type JournalEntryRow = z.infer<typeof journalEntryRowSchema>;

export type JournalListFilters = {
  entryType?: JournalEntryType | null;
  favoritesOnly?: boolean;
  /** Serbest metin arama (başlık + gövde, LIKE). */
  search?: string;
  /** Tarih aralığı (occurred_at, YYYY-MM-DD kapsayıcı). */
  dateFrom?: string | null;
  dateTo?: string | null;
  areaId?: string | null;
  /** Etiket adı (tam eşleşme, etiket birleşimi). */
  tag?: string | null;
  limit?: number;
  offset?: number;
};

export type JournalEntryWithTags = JournalEntryRow & { tags: string[] };

export type JournalCreateInput = {
  entryType: JournalEntryType;
  title: string | null;
  body: string;
  occurredAt: string;
  areaId?: string | null;
  tags?: string[];
};

export class JournalRepository {
  constructor(private readonly db: DatabaseDriver) {}

  async list(filters: JournalListFilters = {}): Promise<JournalEntryWithTags[]> {
    const limit = Math.min(filters.limit ?? 30, 100);
    const offset = Math.max(filters.offset ?? 0, 0);

    const where: string[] = [];
    const params: (string | number)[] = [];
    if (filters.entryType) {
      where.push('j.entry_type = ?');
      params.push(filters.entryType);
    }
    if (filters.favoritesOnly) {
      where.push('j.is_favorite = 1');
    }
    if (filters.search && filters.search.trim().length > 0) {
      where.push('(j.title LIKE ? OR j.body LIKE ?)');
      const like = `%${filters.search.trim()}%`;
      params.push(like, like);
    }
    if (filters.dateFrom) {
      where.push('j.occurred_at >= ?');
      params.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      where.push('j.occurred_at <= ?');
      params.push(filters.dateTo);
    }
    if (filters.areaId) {
      where.push('j.area_id = ?');
      params.push(filters.areaId);
    }
    if (filters.tag) {
      where.push(
        'EXISTS (SELECT 1 FROM journal_entry_tags jt JOIN tags t ON t.id = jt.tag_id WHERE jt.journal_entry_id = j.id AND t.name = ?)',
      );
      params.push(filters.tag);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = await this.db.getAllAsync<JournalEntryRow>(
      `SELECT j.* FROM journal_entries j ${whereSql} ORDER BY j.occurred_at DESC, j.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    const result: JournalEntryWithTags[] = [];
    for (const row of rows) {
      const parsed = journalEntryRowSchema.parse(row);
      const tags = await this.db.getAllAsync<{ name: string }>(
        `SELECT t.name FROM tags t
         JOIN journal_entry_tags jt ON jt.tag_id = t.id
         WHERE jt.journal_entry_id = ? ORDER BY t.name`,
        [parsed.id],
      );
      result.push({ ...parsed, tags: tags.map((t) => t.name) });
    }
    return result;
  }

  async get(id: string): Promise<JournalEntryWithTags | null> {
    const row = await this.db.getFirstAsync<JournalEntryRow>(
      'SELECT * FROM journal_entries WHERE id = ?',
      [id],
    );
    if (!row) return null;
    const parsed = journalEntryRowSchema.parse(row);
    const tags = await this.db.getAllAsync<{ name: string }>(
      `SELECT t.name FROM tags t
       JOIN journal_entry_tags jt ON jt.tag_id = t.id
       WHERE jt.journal_entry_id = ? ORDER BY t.name`,
      [parsed.id],
    );
    return { ...parsed, tags: tags.map((t) => t.name) };
  }

  async create(input: JournalCreateInput): Promise<JournalEntryWithTags> {
    const id = generateUuid();
    const ts = nowIso();
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `INSERT INTO journal_entries (id, entry_type, title, body, occurred_at, area_id, is_favorite, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [id, input.entryType, input.title, input.body, input.occurredAt, input.areaId ?? null, ts, ts],
      );
      await this.replaceTags(id, input.tags ?? []);
    });
    const created = await this.get(id);
    if (!created) throw new Error('Kayıt oluşturulamadı.');
    return created;
  }

  async update(
    id: string,
    patch: Partial<JournalCreateInput>,
  ): Promise<JournalEntryWithTags> {
    const current = await this.get(id);
    if (!current) throw new Error('Kayıt bulunamadı.');
    const ts = nowIso();
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
        `UPDATE journal_entries
         SET entry_type = ?, title = ?, body = ?, occurred_at = ?, area_id = ?, updated_at = ?
         WHERE id = ?`,
        [
          patch.entryType ?? current.entry_type,
          patch.title !== undefined ? patch.title : current.title,
          patch.body ?? current.body,
          patch.occurredAt ?? current.occurred_at,
          patch.areaId !== undefined ? patch.areaId : current.area_id,
          ts,
          id,
        ],
      );
      if (patch.tags !== undefined) {
        await this.replaceTags(id, patch.tags);
      }
    });
    const updated = await this.get(id);
    if (!updated) throw new Error('Kayıt bulunamadı.');
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.db.withTransactionAsync(async () => {
      // journal_entry_tags ve journal_media CASCADE ile silinir.
      await this.db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
    });
  }

  async setFavorite(id: string, favorite: boolean): Promise<void> {
    await this.db.runAsync(
      'UPDATE journal_entries SET is_favorite = ?, updated_at = ? WHERE id = ?',
      [favorite ? 1 : 0, nowIso(), id],
    );
  }

  async toggleFavorite(id: string): Promise<boolean> {
    const row = await this.db.getFirstAsync<{ is_favorite: number }>(
      'SELECT is_favorite FROM journal_entries WHERE id = ?',
      [id],
    );
    if (!row) throw new Error('Kayıt bulunamadı.');
    const next = Number(row.is_favorite) === 1 ? false : true;
    await this.setFavorite(id, next);
    return next;
  }

  async count(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM journal_entries');
    return Number(row?.n ?? 0);
  }

  /** Etiketleri yeniden yazar; kullanılmayan etiketler silinmez (tarihçelik korunur). */
  private async replaceTags(entryId: string, tagNames: string[]): Promise<void> {
    await this.db.runAsync('DELETE FROM journal_entry_tags WHERE journal_entry_id = ?', [entryId]);
    const unique = Array.from(new Set(tagNames.map((t) => t.trim()).filter((t) => t.length > 0)));
    for (const name of unique) {
      await this.db.runAsync(
        'INSERT INTO tags (id, name, created_at) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING',
        [generateUuid(), name, nowIso()],
      );
      const tag = await this.db.getFirstAsync<{ id: string }>('SELECT id FROM tags WHERE name = ?', [
        name,
      ]);
      if (!tag) continue;
      await this.db.runAsync(
        'INSERT OR IGNORE INTO journal_entry_tags (journal_entry_id, tag_id) VALUES (?, ?)',
        [entryId, tag.id],
      );
    }
  }
}
