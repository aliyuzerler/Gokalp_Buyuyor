import { z } from 'zod';

import { validateBirthDate } from '../../domain/birth-date';
import { generateUuid } from '../../utils/uuid';
import type { DatabaseDriver } from '../types';

/** ISO 8601 UTC zaman damgası. */
export function nowIso(): string {
  return new Date().toISOString();
}

export const childProfileRowSchema = z.object({
  id: z.string().min(1),
  display_name: z.string().min(1),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1),
  profile_photo_media_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ChildProfileRow = z.infer<typeof childProfileRowSchema>;

export type ChildProfileInput = {
  displayName: string;
  birthDate: string;
  /** Varsayılan Europe/Istanbul (AGENTS.md). */
  timezone?: string;
};

/** Girdi doğrulaması: ad zorunlu, doğum tarihi takvim kurallarına uygun. */
export function parseProfileInput(input: ChildProfileInput): ChildProfileInput {
  const displayName = input.displayName?.trim() ?? '';
  if (displayName.length === 0) {
    throw new Error('Ad boş olamaz.');
  }
  const check = validateBirthDate({ birthDate: input.birthDate });
  if (!check.ok) {
    throw new Error(check.message);
  }
  return { ...input, displayName };
}

export class ChildProfileRepository {
  constructor(private readonly db: DatabaseDriver) {}

  /** İlk profili döndürür (tek profil ürün kuralı; veri modeli genişlemeye açık). */
  async getPrimary(): Promise<ChildProfileRow | null> {
    const row = await this.db.getFirstAsync<ChildProfileRow>(
      'SELECT * FROM child_profile ORDER BY created_at ASC LIMIT 1',
    );
    return row ? childProfileRowSchema.parse(row) : null;
  }

  async count(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM child_profile',
    );
    return Number(row?.n ?? 0);
  }

  async create(rawInput: ChildProfileInput): Promise<ChildProfileRow> {
    const input = parseProfileInput(rawInput);
    const id = generateUuid();
    const ts = nowIso();
    await this.db.runAsync(
      `INSERT INTO child_profile (id, display_name, birth_date, timezone, profile_photo_media_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?)`,
      [id, input.displayName.trim(), input.birthDate, input.timezone ?? 'Europe/Istanbul', ts, ts],
    );
    const created = await this.db.getFirstAsync<ChildProfileRow>(
      'SELECT * FROM child_profile WHERE id = ?',
      [id],
    );
    return childProfileRowSchema.parse(created);
  }

  async update(
    id: string,
    patch: Partial<Pick<ChildProfileInput, 'displayName' | 'birthDate' | 'timezone'>> & {
      profilePhotoMediaId?: string | null;
    },
  ): Promise<ChildProfileRow> {
    const current = await this.db.getFirstAsync<ChildProfileRow>(
      'SELECT * FROM child_profile WHERE id = ?',
      [id],
    );
    if (!current) {
      throw new Error('Profil bulunamadı.');
    }
    if (patch.displayName !== undefined && patch.displayName.trim().length === 0) {
      throw new Error('Ad boş olamaz.');
    }
    if (patch.birthDate !== undefined) {
      const check = validateBirthDate({ birthDate: patch.birthDate });
      if (!check.ok) {
        throw new Error(check.message);
      }
    }
    const next = {
      display_name: patch.displayName?.trim() ?? current.display_name,
      birth_date: patch.birthDate ?? current.birth_date,
      timezone: patch.timezone ?? current.timezone,
      profile_photo_media_id:
        patch.profilePhotoMediaId === undefined
          ? current.profile_photo_media_id
          : patch.profilePhotoMediaId,
      updated_at: nowIso(),
    };
    await this.db.runAsync(
      `UPDATE child_profile
       SET display_name = ?, birth_date = ?, timezone = ?, profile_photo_media_id = ?, updated_at = ?
       WHERE id = ?`,
      [next.display_name, next.birth_date, next.timezone, next.profile_photo_media_id, next.updated_at, id],
    );
    const updated = await this.db.getFirstAsync<ChildProfileRow>(
      'SELECT * FROM child_profile WHERE id = ?',
      [id],
    );
    return childProfileRowSchema.parse(updated);
  }

  /** Onboarding/ayarlar akışının tek giriş noktası: profil yoksa oluşturur, varsa günceller. */
  async upsertPrimary(input: ChildProfileInput): Promise<ChildProfileRow> {
    const existing = await this.getPrimary();
    if (existing) {
      return this.update(existing.id, {
        displayName: input.displayName,
        birthDate: input.birthDate,
        timezone: input.timezone,
      });
    }
    return this.create(input);
  }
}
