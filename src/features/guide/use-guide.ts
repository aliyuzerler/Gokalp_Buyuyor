import { useCallback, useEffect, useMemo, useState } from 'react';

import { useReadyDb } from '@/database/db-provider';
import {
  GuideRepository,
  PlannedActivitiesRepository,
  type GuideActivityFull,
  type PlannedActivityFull,
  type GuideCategoryRow,
} from '@/database/repositories/guide-repository';
import type { PlannedActivityStatus } from '@/domain/journal-types';

/**
 * Rehber ve etkinlik planlama hook'ları.
 */
export function useGuide() {
  const db = useReadyDb();
  const repo = useMemo(() => new GuideRepository(db), [db]);
  const plannedRepo = useMemo(() => new PlannedActivitiesRepository(db), [db]);

  const [categories, setCategories] = useState<GuideCategoryRow[]>([]);
  const [activities, setActivities] = useState<GuideActivityFull[]>([]);
  const [planned, setPlanned] = useState<PlannedActivityFull[]>([]);
  const [loading, setLoading] = useState(true);

  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const reload = useCallback(async () => {
    try {
      setCategories(await repo.listCategories());
      setActivities(
        await repo.listActivities({ categorySlug, search, ageMonths: null }),
      );
      setPlanned(await plannedRepo.list(null));
    } finally {
      setLoading(false);
    }
  }, [repo, plannedRepo, categorySlug, search]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    categories,
    activities,
    planned,
    loading,
    categorySlug,
    setCategorySlug,
    search,
    setSearch,
    reload,
    plannedRepo,
  };
}

/** Etkinlik detayı için tek kayıt. */
export function useActivity(activityId: string | null) {
  const db = useReadyDb();
  const repo = useMemo(() => new GuideRepository(db), [db]);
  const [activity, setActivity] = useState<GuideActivityFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!activityId) return;
        const row = await repo.activityById(activityId);
        if (active) setActivity(row);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [repo, activityId]);

  return { activity, loading };
}

/** Plan listesi ve durum değişimi. */
export function usePlannedActivities() {
  const db = useReadyDb();
  const repo = useMemo(() => new PlannedActivitiesRepository(db), [db]);
  const [items, setItems] = useState<PlannedActivityFull[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setItems(await repo.list(null));
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const setStatus = useCallback(
    async (id: string, status: PlannedActivityStatus, note?: string | null) => {
      await repo.updateStatus(id, status, note ?? null);
      await reload();
    },
    [repo, reload],
  );

  const completeWithNote = useCallback(
    async (id: string, happenedAt: string, note?: string | null) => {
      await repo.completeWithSession({ plannedId: id, happenedAt, observationNote: note ?? null });
      await reload();
    },
    [repo, reload],
  );

  return { items, loading, reload, setStatus, completeWithNote };
}
