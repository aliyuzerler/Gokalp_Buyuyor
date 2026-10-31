import { useCallback, useEffect, useMemo, useState } from 'react';

import { useReadyDb } from '@/database/db-provider';
import {
  MediaRepository,
  type MediaAssetRow,
} from '@/database/repositories/media-repository';
import { MediaService } from '@/services/media/media-service';

/**
 * Medya galerisi + kayıt-medya ilişkilendirme hook'ları.
 */
export function useMediaGallery() {
  const db = useReadyDb();
  const repo = useMemo(() => new MediaRepository(db), [db]);
  const service = useMemo(() => new MediaService(db), [db]);
  const [assets, setAssets] = useState<MediaAssetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setAssets(await repo.list());
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const deleteAsset = useCallback(
    async (asset: MediaAssetRow) => {
      await service.deleteAsset(asset);
      await reload();
    },
    [service, reload],
  );

  return { assets, loading, reload, deleteAsset };
}

/** Bir günlük kaydına bağlı medya listesi + ekleme/çıkarma. */
export function useJournalMedia(journalEntryId: string | null) {
  const db = useReadyDb();
  const repo = useMemo(() => new MediaRepository(db), [db]);
  const service = useMemo(() => new MediaService(db), [db]);
  const [assets, setAssets] = useState<MediaAssetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setAssets(journalEntryId ? await repo.forJournal(journalEntryId) : []);
    } finally {
      setLoading(false);
    }
  }, [repo, journalEntryId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addFromLibrary = useCallback(async () => {
    if (!journalEntryId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await service.importFromLibrary();
      if (result.ok) {
        await repo.linkToJournal(journalEntryId, result.asset.id);
        await reload();
      } else if (!result.canceled) {
        setError(result.reason);
      }
      return result;
    } finally {
      setBusy(false);
    }
  }, [service, repo, journalEntryId, reload]);

  const remove = useCallback(
    async (mediaId: string) => {
      if (!journalEntryId) return;
      await repo.unlinkFromJournal(journalEntryId, mediaId);
      const asset = await repo.byId(mediaId);
      if (asset) {
        await service.deleteAsset(asset).catch(() => undefined);
      }
      await reload();
    },
    [repo, service, journalEntryId, reload],
  );

  return { assets, loading, busy, error, addFromLibrary, remove, reload };
}
