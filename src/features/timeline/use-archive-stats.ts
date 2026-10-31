import { useEffect, useMemo, useState } from 'react';

import { useReadyDb } from '@/database/db-provider';
import { JournalRepository } from '@/database/repositories/journal-repository';
import { MediaRepository } from '@/database/repositories/media-repository';
import { InterestAreasRepository } from '@/database/repositories/interests-repository';

export type ArchiveStats = {
  journalCount: number;
  mediaCount: number;
  interestCount: number;
  firstRecord: string | null;
  lastRecord: string | null;
};

/**
 * Arşiv istatistikleri: yalnızca kayıt sayısı ve tarih aralığı gibi
 * betimleyici bilgi. Gelişim skoru üretilmez (kit kuralı).
 */
export function useArchiveStats(): ArchiveStats {
  const db = useReadyDb();
  const journalRepo = useMemo(() => new JournalRepository(db), [db]);
  const mediaRepo = useMemo(() => new MediaRepository(db), [db]);
  const interestRepo = useMemo(() => new InterestAreasRepository(db), [db]);
  const [stats, setStats] = useState<ArchiveStats>({
    journalCount: 0,
    mediaCount: 0,
    interestCount: 0,
    firstRecord: null,
    lastRecord: null,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const journalCount = await journalRepo.count();
        const mediaCount = await mediaRepo.count();
        const interestCount = await interestRepo.count();
        const range = await db.getFirstAsync<{ first: string | null; last: string | null }>(
          'SELECT MIN(occurred_at) AS first, MAX(occurred_at) AS last FROM journal_entries',
        );
        if (!active) return;
        setStats({
          journalCount,
          mediaCount,
          interestCount,
          firstRecord: range?.first ?? null,
          lastRecord: range?.last ?? null,
        });
      } catch {
        // Sessiz: özet kritik değil
      }
    })();
    return () => {
      active = false;
    };
  }, [db, journalRepo, mediaRepo, interestRepo]);

  return stats;
}
