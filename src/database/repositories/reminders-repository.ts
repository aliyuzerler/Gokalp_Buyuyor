import { z } from 'zod';

import type { DatabaseDriver } from '../types';
import { nowIso } from './child-profile-repository';
import { generateUuid } from '../../utils/uuid';
import { validateEventDate } from '../../domain/calendar-date';

export const reminderRowSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  note: z.string().nullable(),
  scheduled_at: z.string().min(1),
  notification_id: z.string().nullable(),
  is_enabled: z.union([z.literal(0), z.literal(1)]),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ReminderRow = z.infer<typeof reminderRowSchema>;

/**
 * Yerel hatırlatmalar (reminders tablosu). Bildirim kimlikleri cihaz restart'ında
 * uygulama açılışında yeniden doğrulanır (reschedule).
 */
export class RemindersRepository {
  constructor(private readonly db: DatabaseDriver) {}

  async list(includeDisabled = false): Promise<ReminderRow[]> {
    const where = includeDisabled ? '' : 'WHERE is_enabled = 1';
    const rows = await this.db.getAllAsync<unknown>(
      `SELECT * FROM reminders ${where} ORDER BY scheduled_at ASC`,
    );
    return rows.map((r) => reminderRowSchema.parse(r));
  }

  async byId(id: string): Promise<ReminderRow | null> {
    const row = await this.db.getFirstAsync<unknown>('SELECT * FROM reminders WHERE id = ?', [id]);
    return row ? reminderRowSchema.parse(row) : null;
  }

  async create(input: {
    title: string;
    note?: string | null;
    /** ISO 8601 yerel-uyarılı zaman damgası. */
    scheduledAt: Date;
    notificationId?: string | null;
  }): Promise<ReminderRow> {
    if (!input.title.trim()) throw new Error('Başlık boş olamaz.');
    if (input.scheduledAt.getTime() <= Date.now()) {
      throw new Error('Hatırlatma zamanı gelecekte olmalı.');
    }
    const id = generateUuid();
    const ts = nowIso();
    await this.db.runAsync(
      `INSERT INTO reminders (id, title, note, scheduled_at, notification_id, is_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        input.title.trim(),
        input.note ?? null,
        input.scheduledAt.toISOString(),
        input.notificationId ?? null,
        ts,
        ts,
      ],
    );
    const row = await this.byId(id);
    if (!row) throw new Error('Hatırlatma oluşturulamadı.');
    return row;
  }

  async update(
    id: string,
    patch: { title?: string; note?: string | null; scheduledAt?: Date; notificationId?: string | null },
  ): Promise<ReminderRow> {
    const current = await this.byId(id);
    if (!current) throw new Error('Hatırlatma bulunamadı.');
    if (patch.scheduledAt && patch.scheduledAt.getTime() <= Date.now()) {
      throw new Error('Hatırlatma zamanı gelecekte olmalı.');
    }
    await this.db.runAsync(
      `UPDATE reminders SET title = ?, note = ?, scheduled_at = ?, notification_id = ?, updated_at = ? WHERE id = ?`,
      [
        patch.title?.trim() ?? current.title,
        patch.note !== undefined ? patch.note : current.note,
        patch.scheduledAt ? patch.scheduledAt.toISOString() : current.scheduled_at,
        patch.notificationId !== undefined ? patch.notificationId : current.notification_id,
        nowIso(),
        id,
      ],
    );
    const row = await this.byId(id);
    if (!row) throw new Error('Hatırlatma bulunamadı.');
    return row;
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    await this.db.runAsync(
      'UPDATE reminders SET is_enabled = ?, updated_at = ? WHERE id = ?',
      [enabled ? 1 : 0, nowIso(), id],
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM reminders WHERE id = ?', [id]);
  }
}

/** Hatırlatma zamanı yardımcıları (saf). */
export function validateReminderDate(isoDateTime: string, now: Date = new Date()): { ok: true } | { ok: false; message: string } {
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, message: 'Geçersiz tarih/saat.' };
  }
  if (date.getTime() <= now.getTime()) {
    return { ok: false, message: 'Hatırlatma zamanı gelecekte olmalı.' };
  }
  void validateEventDate;
  return { ok: true };
}
