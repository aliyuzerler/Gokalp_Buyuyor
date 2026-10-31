import { useCallback, useEffect, useMemo, useState } from 'react';

import { useReadyDb } from '@/database/db-provider';
import {
  TimelineRepository,
  type TimelineItem,
} from '@/database/repositories/timeline-repository';
import { JournalRepository } from '@/database/repositories/journal-repository';

const PAGE_SIZE = 25;

/**
 * Zaman çizelgesi hook'u (Arşiv sekmesi).
 */
export function useTimeline() {
  const db = useReadyDb();
  const timelineRepo = useMemo(() => new TimelineRepository(db), [db]);
  const journalRepo = useMemo(() => new JournalRepository(db), [db]);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(
    async (offset = 0) => {
      try {
        const page = await timelineRepo.list({ limit: PAGE_SIZE, offset });
        setItems((prev) => (offset === 0 ? page : [...prev, ...page]));
        setHasMore(page.length === PAGE_SIZE);
      } finally {
        setLoading(false);
      }
    },
    [timelineRepo],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  const deleteJournalItem = useCallback(
    async (id: string) => {
      await journalRepo.remove(id);
      await load(0);
    },
    [journalRepo, load],
  );

  return { items, loading, hasMore, load, deleteJournalItem };
}
