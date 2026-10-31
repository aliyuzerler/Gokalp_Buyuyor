import { z } from 'zod';

import type { DatabaseDriver } from '../types';
import { nowIso } from './child-profile-repository';
import { generateUuid } from '../../utils/uuid';

export const mediaAssetRowSchema = z.object({
  id: z.string().min(1),
  media_type: z.enum(['image', 'video']),
  relative_path: z.string().min(1),
  thumbnail_relative_path: z.string().nullable(),
  original_name: z.string().nullable(),
  mime_type: z.string().min(1),
  file_size_bytes: z.number().int().nonnegative(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  duration_ms: z.number().int().nullable(),
  captured_at: z.string().nullable(),
  created_at: z.string(),
});

export type MediaAssetRow = z.infer<typeof mediaAssetRowSchema>;

export type MediaWithUsage = MediaAssetRow & {
  usedByJournal: number;
  usedBySession: number;
};

export class MediaRepository {
  constructor(private readonly db: DatabaseDriver) {}

  async create(input: {
    mediaType: 'image' | 'video';
    relativePath: string;
    thumbnailRelativePath?: string | null;
    originalName?: string | null;
    mimeType: string;
    fileSizeBytes: number;
    width?: number | null;
    height?: number | null;
    durationMs?: number | null;
    capturedAt?: string | null;
  }): Promise<MediaAssetRow> {
    const id = generateUuid();
    await this.db.runAsync(
      `INSERT INTO media_assets (
         id, media_type, relative_path, thumbnail_relative_path, original_name, mime_type,
         file_size_bytes, width, height, duration_ms, captured_at, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.mediaType,
        input.relativePath,
        input.thumbnailRelativePath ?? null,
        input.originalName ?? null,
        input.mimeType,
        input.fileSizeBytes,
        input.width ?? null,
        input.height ?? null,
        input.durationMs ?? null,
        input.capturedAt ?? null,
        nowIso(),
      ],
    );
    const row = await this.db.getFirstAsync<unknown>(
      'SELECT * FROM media_assets WHERE id = ?',
      [id],
    );
    return mediaAssetRowSchema.parse(row);
  }

  async byId(id: string): Promise<MediaAssetRow | null> {
    const row = await this.db.getFirstAsync<unknown>(
      'SELECT * FROM media_assets WHERE id = ?',
      [id],
    );
    return row ? mediaAssetRowSchema.parse(row) : null;
  }

  async list(limit = 60, offset = 0): Promise<MediaAssetRow[]> {
    const rows = await this.db.getAllAsync<unknown>(
      'SELECT * FROM media_assets ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [Math.min(limit, 200), Math.max(offset, 0)],
    );
    return rows.map((r) => mediaAssetRowSchema.parse(r));
  }

  async forJournal(journalEntryId: string): Promise<MediaAssetRow[]> {
    const rows = await this.db.getAllAsync<unknown>(
      `SELECT m.* FROM media_assets m
       JOIN journal_media jm ON jm.media_asset_id = m.id
       WHERE jm.journal_entry_id = ?
       ORDER BY jm.sort_order`,
      [journalEntryId],
    );
    return rows.map((r) => mediaAssetRowSchema.parse(r));
  }

  async forSession(activitySessionId: string): Promise<MediaAssetRow[]> {
    const rows = await this.db.getAllAsync<unknown>(
      `SELECT m.* FROM media_assets m
       JOIN activity_media am ON am.media_asset_id = m.id
       WHERE am.activity_session_id = ?
       ORDER BY am.sort_order`,
      [activitySessionId],
    );
    return rows.map((r) => mediaAssetRowSchema.parse(r));
  }

  async linkToJournal(journalEntryId: string, mediaId: string): Promise<void> {
    await this.db.runAsync(
      'INSERT OR IGNORE INTO journal_media (journal_entry_id, media_asset_id, sort_order) VALUES (?, ?, 0)',
      [journalEntryId, mediaId],
    );
  }

  async unlinkFromJournal(journalEntryId: string, mediaId: string): Promise<void> {
    await this.db.runAsync(
      'DELETE FROM journal_media WHERE journal_entry_id = ? AND media_asset_id = ?',
      [journalEntryId, mediaId],
    );
  }

  async linkToSession(activitySessionId: string, mediaId: string): Promise<void> {
    await this.db.runAsync(
      'INSERT OR IGNORE INTO activity_media (activity_session_id, media_asset_id, sort_order) VALUES (?, ?, 0)',
      [activitySessionId, mediaId],
    );
  }

  /** Varlığı ve dosyalarını siler; başka kayıtla bağlıysa silmez. */
  async removeIfUnlinked(mediaId: string): Promise<boolean> {
    const usage = await this.usage(mediaId);
    if (usage.usedByJournal > 0 || usage.usedBySession > 0) {
      return false;
    }
    await this.db.runAsync('DELETE FROM media_assets WHERE id = ?', [mediaId]);
    return true;
  }

  async usage(mediaId: string): Promise<{ usedByJournal: number; usedBySession: number }> {
    const journal = await this.db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM journal_media WHERE media_asset_id = ?',
      [mediaId],
    );
    const session = await this.db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM activity_media WHERE media_asset_id = ?',
      [mediaId],
    );
    return { usedByJournal: Number(journal?.n ?? 0), usedBySession: Number(session?.n ?? 0) };
  }

  async count(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM media_assets');
    return Number(row?.n ?? 0);
  }

  /** DB'de hiçbir kayda bağlı olmayan asset'ler (bakım temizliği için). */
  async listOrphanIds(): Promise<string[]> {
    const rows = await this.db.getAllAsync<{ id: string }>(
      `SELECT m.id FROM media_assets m
       WHERE NOT EXISTS (SELECT 1 FROM journal_media jm WHERE jm.media_asset_id = m.id)
         AND NOT EXISTS (SELECT 1 FROM activity_media am WHERE am.media_asset_id = m.id)`,
    );
    return rows.map((r) => r.id);
  }
}
