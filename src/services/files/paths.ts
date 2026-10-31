import { Directory, File, Paths } from 'expo-file-system';

/**
 * Uygulama özel dosya yolları (ARCHITECTURE.md bölüm 4).
 * DB'de yalnızca relative_path saklanır; mutlak yol çalışma anında birleştirilir.
 */
export function getDocumentRoot(): Directory {
  return Paths.document;
}

/** expo-sqlite varsayılan dizini: <documents>/SQLite/ */
export function getSqliteDirectory(): Directory {
  return new Directory(Paths.document, 'SQLite');
}

export function getDatabaseFile(): File {
  return new File(getSqliteDirectory(), 'gokalp.sqlite');
}

/** Medya kökü: <documents>/media/ */
export function getMediaRoot(): Directory {
  return new Directory(Paths.document, 'media');
}

export function getBackupStagingRoot(): Directory {
  return new Directory(Paths.cache, 'backup-staging');
}

export function getRestoreStagingRoot(): Directory {
  return new Directory(Paths.cache, 'restore-staging');
}
