/**
 * Backup format sabitleri — docs/BACKUP_RESTORE.md ile uyumlu.
 */
export const BACKUP_FORMAT = 'gokalp-buyuyor-backup';
export const BACKUP_FORMAT_VERSION = 1;

export const BACKUP_MIME_TYPE = 'application/zip';
export const BACKUP_FILE_EXTENSION = '.gokalpbackup';

/**
 * Gokalp_Buyuyor_YYYY-MM-DD_HH-mm.gokalpbackup
 */
export function buildBackupFileName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `Gokalp_Buyuyor_${yyyy}-${mm}-${dd}_${hh}-${mi}${BACKUP_FILE_EXTENSION}`;
}

/** ZIP içi sabit yapı. */
export const BACKUP_MANIFEST_ENTRY = 'manifest.json';
export const BACKUP_DATABASE_ENTRY_DIR = 'database';
export const BACKUP_MEDIA_ENTRY_DIR = 'media';
export const BACKUP_METADATA_ENTRY_DIR = 'metadata';
export const BACKUP_DATABASE_ENTRY = `${BACKUP_DATABASE_ENTRY_DIR}/gokalp.sqlite`;

/** Yedeğin kapsayabildiği ZIP kök dizinleri (path traversal koruması). */
export const ALLOWED_BACKUP_ROOTS = [
  BACKUP_DATABASE_ENTRY_DIR,
  BACKUP_MEDIA_ENTRY_DIR,
  BACKUP_METADATA_ENTRY_DIR,
] as const;
