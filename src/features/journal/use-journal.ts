import { useCallback, useEffect, useMemo, useState } from 'react';

import { useReadyDb } from '@/database/db-provider';
import {
  JournalRepository,
  type JournalEntryWithTags,
} from '@/database/repositories/journal-repository';
import { parseJournalEntryInput, type JournalEntryInput } from '@/domain/journal-entry';
import type { JournalEntryType } from '@/domain/journal-types';

const PAGE_SIZE = 20;

/**
 * Günlük feature hook'u: liste + CRUD + sayfalama. UI SQL yazmaz.
 */
export function useJournal(options: {
  entryType?: JournalEntryType | null;
  favoritesOnly?: boolean;
  search?: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  areaId?: string | null;
  tag?: string | null;
} = {}) {
  const db = useReadyDb();
  const repository = useMemo(() => new JournalRepository(db), [db]);
  const [entries, setEntries] = useState<JournalEntryWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(
    async (offset = 0) => {
      try {
        const page = await repository.list({
          entryType: options.entryType ?? null,
          favoritesOnly: options.favoritesOnly,
          search: options.search,
          dateFrom: options.dateFrom ?? null,
          dateTo: options.dateTo ?? null,
          areaId: options.areaId ?? null,
          tag: options.tag ?? null,
          limit: PAGE_SIZE,
          offset,
        });
        setEntries((prev) => (offset === 0 ? page : [...prev, ...page]));
        setHasMore(page.length === PAGE_SIZE);
      } finally {
        setLoading(false);
      }
    },
    [repository, options.entryType, options.favoritesOnly, options.search, options.dateFrom, options.dateTo, options.areaId, options.tag],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  const createEntry = useCallback(
    async (input: JournalEntryInput) => {
      const parsed = parseJournalEntryInput(input);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Girdi doğrulanamadı.');
      }
      const created = await repository.create({
        entryType: parsed.data.entryType,
        title: parsed.data.title,
        body: parsed.data.body,
        occurredAt: parsed.data.occurredAt,
        areaId: parsed.data.areaId ?? null,
        tags: parsed.data.tags ?? [],
      });
      await load(0);
      return created;
    },
    [repository, load],
  );

  const updateEntry = useCallback(
    async (id: string, input: JournalEntryInput) => {
      const parsed = parseJournalEntryInput(input);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Girdi doğrulanamadı.');
      }
      const updated = await repository.update(id, {
        entryType: parsed.data.entryType,
        title: parsed.data.title,
        body: parsed.data.body,
        occurredAt: parsed.data.occurredAt,
        areaId: parsed.data.areaId ?? null,
        tags: parsed.data.tags ?? [],
      });
      await load(0);
      return updated;
    },
    [repository, load],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      await repository.remove(id);
      await load(0);
    },
    [repository, load],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      await repository.toggleFavorite(id);
      await load(0);
    },
    [repository, load],
  );

  return { entries, loading, hasMore, load, createEntry, updateEntry, deleteEntry, toggleFavorite };
}
