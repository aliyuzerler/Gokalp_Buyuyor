import { BACKUP_DATABASE_ENTRY, BACKUP_MANIFEST_ENTRY } from './constants';
import type { BackupManifest } from './manifest';
import { validateManifestJson } from './manifest';
import { validateBackupPath } from './path-guard';

/**
 * Geri yükleme doğrulama hattı — platform bağımsız saf mantık.
 * Uygulama IO'yu expo-file-system/expo-sqlite ile, testler node:fs/sqlite ile sağlar.
 * Tüm kontroller geçmeden onVerified çağrılmaz; mevcut veri asla risk altında kalmaz.
 */
export interface RestoreIO {
  /** Ayıklanan kök altındaki göreli dosya yolları. */
  listFiles(extractedRoot: string): Promise<string[]>;
  readFileBytes(extractedRoot: string, relativePath: string): Promise<Uint8Array>;
  sha256Bytes(bytes: Uint8Array): Promise<string>;
  fileSize(extractedRoot: string, relativePath: string): Promise<number>;
  /** Ayıklanan SQLite dosyasını bütünlük için açar. */
  openSqlite(extractedRoot: string, relativePath: string): Promise<RestoredSqliteProbe>;
}

export interface RestoredSqliteProbe {
  quickCheck(): Promise<string>;
  userVersion(): Promise<number>;
  close(): Promise<void>;
}

export type RestoreValidationFailure = {
  ok: false;
  reason: string;
  /** Hangi kontrol katmanı reddetti. */
  stage: 'manifest' | 'paths' | 'hash' | 'database';
};

export type RestoreValidationSuccess = {
  ok: true;
  manifest: BackupManifest;
};

export type RestoreValidationResult = RestoreValidationFailure | RestoreValidationSuccess;

export type RestoreValidationOptions = {
  extractedRoot: string;
  currentSchemaVersion: number;
  io: RestoreIO;
};

/**
 * Sıra: manifest → yollar → hash → SQLite bütünlüğü/şema sürümü.
 */
export async function validateRestoreExtracted(
  options: RestoreValidationOptions,
): Promise<RestoreValidationResult> {
  const { extractedRoot, currentSchemaVersion, io } = options;

  // 1) Manifest var mı ve geçerli mi?
  let manifestRaw: unknown;
  try {
    const bytes = await io.readFileBytes(extractedRoot, BACKUP_MANIFEST_ENTRY);
    manifestRaw = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return { ok: false, reason: 'manifest.json bulunamadı veya okunamadı.', stage: 'manifest' };
  }

  const manifestResult = validateManifestJson(manifestRaw, currentSchemaVersion);
  if (!manifestResult.ok) {
    return { ok: false, reason: manifestResult.reason, stage: 'manifest' };
  }
  const manifest = manifestResult.manifest;

  // 2) Ayıklanan dosya listesi: manifest yolları + beklenmeyen ek dosyalar
  const diskFiles = await io.listFiles(extractedRoot);
  const manifestPaths = new Set(manifest.files.map((f) => f.path));

  for (const p of manifestPaths) {
    const check = validateBackupPath(p);
    if (!check.ok) return { ok: false, reason: check.reason, stage: 'paths' };
  }

  const unexpected = diskFiles.filter((p) => p !== BACKUP_MANIFEST_ENTRY && !manifestPaths.has(p));
  if (unexpected.length > 0) {
    return {
      ok: false,
      reason: `Yedekte manifest dışı dosyalar bulundu: ${unexpected[0]}`,
      stage: 'paths',
    };
  }

  // 3) Boyut + SHA-256 doğrulaması
  for (const file of manifest.files) {
    const check = validateBackupPath(file.path);
    if (!check.ok) return { ok: false, reason: check.reason, stage: 'paths' };

    let size = 0;
    try {
      size = await io.fileSize(extractedRoot, file.path);
    } catch {
      return { ok: false, reason: `Dosya eksik: ${file.path}`, stage: 'hash' };
    }
    if (size !== file.sizeBytes) {
      return {
        ok: false,
        reason: `Dosya boyutu eşleşmiyor: ${file.path}`,
        stage: 'hash',
      };
    }

    let bytes: Uint8Array;
    try {
      bytes = await io.readFileBytes(extractedRoot, file.path);
    } catch {
      return { ok: false, reason: `Dosya okunamadı: ${file.path}`, stage: 'hash' };
    }
    const hash = await io.sha256Bytes(bytes);
    if (hash.toLowerCase() !== file.sha256.toLowerCase()) {
      return { ok: false, reason: `SHA-256 özeti eşleşmiyor: ${file.path}`, stage: 'hash' };
    }
  }

  // 4) SQLite bütünlüğü ve şema sürümü
  if (!manifestPaths.has(BACKUP_DATABASE_ENTRY)) {
    return {
      ok: false,
      reason: 'Yedekte veritabanı dosyası (database/gokalp.sqlite) yok.',
      stage: 'database',
    };
  }

  let probe: RestoredSqliteProbe;
  try {
    probe = await io.openSqlite(extractedRoot, BACKUP_DATABASE_ENTRY);
  } catch (error) {
    return {
      ok: false,
      reason: `Veritabanı açılamadı: ${error instanceof Error ? error.message : 'bilinmeyen hata'}`,
      stage: 'database',
    };
  }
  try {
    const quick = await probe.quickCheck();
    if (quick.trim().toLowerCase() !== 'ok') {
      return { ok: false, reason: `Veritabanı bütünlük kontrolü başarısız: ${quick}`, stage: 'database' };
    }
    const userVersion = await probe.userVersion();
    if (userVersion > currentSchemaVersion) {
      return {
        ok: false,
        reason: `Yedek veritabanı şema sürümü çok yeni (${userVersion}).`,
        stage: 'database',
      };
    }
  } catch (error) {
    return {
      ok: false,
      reason: `Veritabanı kontrolü sırasında hata: ${error instanceof Error ? error.message : 'bilinmeyen hata'}`,
      stage: 'database',
    };
  } finally {
    await probe.close();
  }

  return { ok: true, manifest };
}
