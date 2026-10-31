import { ALLOWED_BACKUP_ROOTS } from './constants';

const ENTRY_PATH_REGEX = /^[A-Za-z0-9][A-Za-z0-9_\-./]*$/;

export type PathCheckResult = { ok: true } | { ok: false; reason: string };

/**
 * ZIP içindeki dosya yollarını doğrular (zip-slip / path traversal koruması).
 * - Absolute path, '..' parçası, ters eğik çizgi, boş yol reddedilir.
 * - Yalnızca izin verilen kök dizinler (database/, media/, metadata/) kabul edilir.
 */
export function validateBackupPath(entryPath: string): PathCheckResult {
  if (entryPath.length === 0) {
    return { ok: false, reason: 'Boş dosya yolu.' };
  }
  if (entryPath.includes('\\')) {
    return { ok: false, reason: `Geçersiz yol (ters eğik çizgi): ${entryPath}` };
  }
  if (entryPath.startsWith('/')) {
    return { ok: false, reason: `Mutlak yol kabul edilmez: ${entryPath}` };
  }
  if (!ENTRY_PATH_REGEX.test(entryPath)) {
    return { ok: false, reason: `Geçersiz karakter içeren yol: ${entryPath}` };
  }
  const parts = entryPath.split('/');
  if (parts.some((p) => p === '..')) {
    return { ok: false, reason: `Yol dışına çıkış reddedildi: ${entryPath}` };
  }
  if (parts.some((p) => p === '.' || p.length === 0)) {
    return { ok: false, reason: `Geçersiz yol parçası: ${entryPath}` };
  }
  const root = parts[0];
  if (!(ALLOWED_BACKUP_ROOTS as readonly string[]).includes(root)) {
    return { ok: false, reason: `Beklenmeyen dizin: ${entryPath}` };
  }
  return { ok: true };
}

/** Ayıklanan ağaçtaki tüm yolları topluca doğrular. */
export function validateBackupPaths(entryPaths: string[]): PathCheckResult {
  for (const p of entryPaths) {
    const result = validateBackupPath(p);
    if (!result.ok) return result;
  }
  return { ok: true };
}
