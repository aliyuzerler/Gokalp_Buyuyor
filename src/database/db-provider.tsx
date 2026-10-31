import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { openAppDatabase } from './db';
import type { DatabaseDriver } from './types';

type DbStatus = 'loading' | 'ready' | 'error';

type DatabaseContextValue = {
  status: DbStatus;
  db: DatabaseDriver | null;
  error: string | null;
};

const DatabaseContext = createContext<DatabaseContextValue>({
  status: 'loading',
  db: null,
  error: null,
});

/**
 * Uygulama açılışında DB'yi açar, migration + seed çalıştırır.
 * Hazır olana kadar alt ağaç gösterilmez (yuvarlama hatası riskini ortadan kaldırır).
 */
export function DatabaseProvider({ children }: PropsWithChildren) {
  const [value, setValue] = useState<DatabaseContextValue>({
    status: 'loading',
    db: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    openAppDatabase()
      .then((db) => {
        if (!cancelled) setValue({ status: 'ready', db, error: null });
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
  }, []);

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext);
}

/** Repository'lerin eriştiği hazır DB; yalnızca ready durumunda çağrılmalı. */
export function useReadyDb(): DatabaseDriver {
  const { db, status } = useDatabase();
  return useMemo(() => {
    if (status !== 'ready' || !db) {
      throw new Error('Veritabanı henüz hazır değil.');
    }
    return db;
  }, [db, status]);
}
