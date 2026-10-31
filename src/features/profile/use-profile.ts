import { useCallback, useEffect, useMemo, useState } from 'react';

import { useReadyDb } from '@/database/db-provider';
import {
  ChildProfileRepository,
  type ChildProfileInput,
  type ChildProfileRow,
} from '@/database/repositories/child-profile-repository';
import { calculateAge, formatAgeTr } from '@/domain/age';

/**
 * Profil feature hook'u: UI → repository akışını uygular. UI SQL yazmaz.
 */
export function useProfile() {
  const db = useReadyDb();
  const repository = useMemo(() => new ChildProfileRepository(db), [db]);
  const [profile, setProfile] = useState<ChildProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    repository
      .getPrimary()
      .then((row) => {
        if (!active) return;
        setProfile(row);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository]);

  const saveProfile = useCallback(
    async (input: ChildProfileInput) => {
      const saved = await repository.upsertPrimary(input);
      setProfile(saved);
      return saved;
    },
    [repository],
  );

  const age = profile ? calculateAge(profile.birth_date) : null;
  const ageLabel = age ? formatAgeTr(age) : null;

  return { profile, loading, saveProfile, age, ageLabel };
}
