import { useCallback, useEffect, useMemo, useState } from 'react';

import { useReadyDb } from '@/database/db-provider';
import {
  DevelopmentAreasRepository,
  type DevelopmentAreaRow,
} from '@/database/repositories/development-areas-repository';
import {
  SkillsRepository,
  type SkillRow,
} from '@/database/repositories/skills-repository';
import { useProfile } from '@/features/profile/use-profile';

export type AreaSummary = DevelopmentAreaRow & {
  skillCount: number;
  observationCount: number;
};

/**
 * Gelişim merkezini besler: 10 alan + betimleyici sayılar (skor yok).
 */
export function useDevelopmentAreas2(): {
  areas: AreaSummary[];
  loading: boolean;
} {
  const db = useReadyDb();
  const areasRepo = useMemo(() => new DevelopmentAreasRepository(db), [db]);
  const skillsRepo = useMemo(() => new SkillsRepository(db), [db]);
  const [areas, setAreas] = useState<AreaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await areasRepo.listActive();
        const counts = await skillsRepo.countsPerArea();
        if (!active) return;
        setAreas(
          list.map((a) => ({
            ...a,
            skillCount: counts[a.id]?.skills ?? 0,
            observationCount: counts[a.id]?.observations ?? 0,
          })),
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [areasRepo, skillsRepo]);

  return { areas, loading };
}

/**
 * Alan içindeki beceri listesi: arama + yaş filtresi (0–216).
 */
export function useSkills(areaId: string | null, search: string, ageMonths: number | null) {
  const db = useReadyDb();
  const skillsRepo = useMemo(() => new SkillsRepository(db), [db]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const rows = areaId ? await skillsRepo.listByArea(areaId, { search, ageMonths }) : [];
      setSkills(rows);
    } finally {
      setLoading(false);
    }
  }, [skillsRepo, areaId, search, ageMonths]);

  useEffect(() => {
    void load();
  }, [load]);

  return { skills, loading, reload: load };
}

/**
 * Profilden yaş (ay) — filtre çipleri için.
 */
export function useChildAgeMonths(): number | null {
  const { profile } = useProfile();
  if (!profile) return null;
  const birth = profile.birth_date;
  const [y, m, d] = birth.split('-').map((p) => Number.parseInt(p, 10));
  const now = new Date();
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (now.getDate() < d) months -= 1;
  return Math.max(0, months);
}
