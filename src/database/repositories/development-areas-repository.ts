import { z } from 'zod';

import type { DatabaseDriver } from '../types';

export const developmentAreaRowSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable(),
  sort_order: z.number().int(),
  is_active: z.union([z.literal(0), z.literal(1)]),
});

export type DevelopmentAreaRow = z.infer<typeof developmentAreaRowSchema>;

/** Gelişim alanları okuma repository'si (seed yazımı seed-runner'da). */
export class DevelopmentAreasRepository {
  constructor(private readonly db: DatabaseDriver) {}

  async listActive(): Promise<DevelopmentAreaRow[]> {
    const rows = await this.db.getAllAsync<unknown>(
      'SELECT * FROM development_areas WHERE is_active = 1 ORDER BY sort_order',
    );
    return rows.map((r) => developmentAreaRowSchema.parse(r));
  }

  async count(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM development_areas',
    );
    return Number(row?.n ?? 0);
  }

  async bySlug(slug: string): Promise<DevelopmentAreaRow | null> {
    const row = await this.db.getFirstAsync<unknown>(
      'SELECT * FROM development_areas WHERE slug = ?',
      [slug],
    );
    return row ? developmentAreaRowSchema.parse(row) : null;
  }
}
