import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { openAppDatabase } from './db';
import type { DatabaseDriver } from './types';
import { rescheduleRemindersOnStart } from '@/services/notifications/reminder-sync';
import { Platform } from 'react-native';

type DbStatus = 'loading' | 'ready' | 'error';

type DatabaseContextValue = {
  status: DbStatus;
  db: DatabaseDriver | null;
  error: string | null;
  /**
   * DB bağlantısını güvenle kapatıp task'i çalıştırır (backup/restore),
   * ardından bağlantıyı tazeleyip açar.
   */
  withDbClosed: <T>(task: () => Promise<T>) => Promise<T>;
};

const DatabaseContext = createContext<DatabaseContextValue>({
  status: 'loading',
  db: null,
  error: null,
  withDbClosed: async () => {
    throw new Error('Veritabanı henüz hazır değil.');
  },
});

/**
 * Uygulama açılışında DB'yi açar, migration + seed çalıştırır.
 * Hazır olana kadar alt ağaç gösterilmez.
 */
export function DatabaseProvider({ children }: PropsWithChildren) {
  const [value, setValue] = useState<Omit<DatabaseContextValue, 'withDbClosed'>>({
    status: 'loading',
    db: null,
    error: null,
  });
  const dbRef = useRef<DatabaseDriver | null>(null);
  const openingRef = useRef<Promise<DatabaseDriver> | null>(null);

  const open = useCallback((): Promise<DatabaseDriver> => {
    if (dbRef.current?.isOpen()) {
      return Promise.resolve(dbRef.current);
    }
    if (!openingRef.current) {
      openingRef.current = openAppDatabase()
        .then((db) => {
          dbRef.current = db;
          return db;
        })
        .finally(() => {
          openingRef.current = null;
        });
    }
    return openingRef.current;
  }, []);

  useEffect(() => {
    let cancelled = false;
    open()
      .then((db) => {
        if (!cancelled) setValue({ status: 'ready', db, error: null });
        // Açılışta hatırlatma yeniden planlama doğrulaması (Faz 8).
        // İzin yoksa hata üretmez; yalnızca yerel log.
        if (Platform.OS !== 'web') {
          rescheduleRemindersOnStart(db).catch(() => undefined);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setValue({
            status: 'error',
            db: null,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const withDbClosed = useCallback(
    async <T,>(task: () => Promise<T>): Promise<T> => {
      const current = dbRef.current;
      if (!current || !current.isOpen()) {
        throw new Error('Veritabanı bağlantısı kapalı.');
      }
      await current.closeAsync();
      dbRef.current = null;
      try {
        return await task();
      } finally {
        // Yeniden açma: migration + seed kontrolüyle taze bağlantı.
        const fresh = await open();
        setValue({ status: 'ready', db: fresh, error: null });
      }
    },
    [open],
  );

  return <DatabaseContext.Provider value={{ ...value, withDbClosed }}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext);
}

/** Repository'lerin eriştiği hazır DB; yalnızca ready durumunda çağrılmalı. */
export function useReadyDb(): DatabaseDriver {
  const { db, status } = useDatabase();
  if (status !== 'ready' || !db) {
    throw new Error('Veritabanı henüz hazır değil.');
  }
  return db;
}
