import { useCallback, useEffect, useState } from 'react';

import { useReadyDb } from '@/database/db-provider';
import { developmentAreaRowSchema, type DevelopmentAreaRow } from '@/database/repositories/development-areas-repository';

/**
 * Gelişim alanları okuma hook'u (günlük kaydında alan seçimi vb. için).
 */
export function useDevelopmentAreas() {
  const db = useReadyDb();
  const [areas, setAreas] = useState<DevelopmentAreaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const rows = await db.getAllAsync<unknown>(
        'SELECT * FROM development_areas WHERE is_active = 1 ORDER BY sort_order',
      );
      setAreas(rows.map((r) => developmentAreaRowSchema.parse(r)));
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { areas, loading };
}
