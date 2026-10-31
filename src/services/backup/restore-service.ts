import { Directory, File } from 'expo-file-system';
import { openDatabaseAsync } from 'expo-sqlite';

import { LATEST_SCHEMA_VERSION } from '@/database/migrations';
import { BACKUP_DATABASE_ENTRY, BACKUP_MANIFEST_ENTRY } from './constants';
import { validateRestoreExtracted, type RestoreIO } from './restore-validator';
import {
  copyDirectoryRecursive,
  copyFileAsync,
  deleteRecursively,
  ensureDirectory,
  fileBytes,
  fileSizeBytes,
  joinUri,
  relativeTo,
  sha256Bytes,
  walkFiles,
} from '@/services/files/fs-utils';
import { getDatabaseFile, getMediaRoot, getRestoreStagingRoot, getSqliteDirectory } from '@/services/files/paths';

export type PickBackupResult =
  | { canceled: true }
  | { canceled: false; fileUri: string; fileName: string };

/** Kullanıcıdan .gokalpbackup dosyası seçmesini ister (sistem dosya seçici). */
export async function pickBackupFile(): Promise<PickBackupResult> {
  const DocumentPicker = await import('expo-document-picker');
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || result.assets.length === 0) {
    return { canceled: true };
  }
  const asset = result.assets[0];
  return {
    canceled: false,
    fileUri: asset.uri,
    fileName: asset.name ?? 'yedek.gokalpbackup',
  };
}

/** Native RestoreIO: expo-file-system + expo-sqlite. */
function createRestoreIO(): RestoreIO {
  return {
    async listFiles(extractedRoot: string) {
      const files = await walkFiles(extractedRoot);
      return files.map((f) => relativeTo(extractedRoot, f));
    },
    async readFileBytes(root, rel) {
      return fileBytes(joinUri(root, rel));
    },
    async sha256Bytes(bytes) {
      return sha256Bytes(bytes);
    },
    async fileSize(root, rel) {
      return fileSizeBytes(joinUri(root, rel));
    },
    async openSqlite(root, rel) {
      const target = joinUri(root, rel);
      // Yalnızca bütünlük amaçlı açılış; yazma yapılmaz.
      const db = await openDatabaseAsync(new File(target).name, undefined, new Directory(root).uri.replace('file://', ''));
      return {
        async quickCheck() {
          const row = await db.getFirstAsync<{ quick_check: string }>('PRAGMA quick_check');
          return row?.quick_check ?? '';
        },
        async userVersion() {
          const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
          return Number(row?.user_version ?? 0);
        },
        async close() {
          await db.closeAsync();
        },
      };
    },
  };
}

export type RestoreProgress = {
  stage: 'extract' | 'validate' | 'swap' | 'done';
};

export type RestoreOutcome =
  | { ok: true; entryCount: number }
  | { ok: false; reason: string; stage: 'extract' | 'manifest' | 'paths' | 'hash' | 'database' | 'swap' };

export type RestoreDeps = {
  /** DB'yi güvenli biçimde kapatıp işi çalıştıran provider köprüsü. */
  withDbClosed: <T>(task: () => Promise<T>) => Promise<T>;
  onProgress?: (progress: RestoreProgress) => void;
};

/**
 * Geri yükleme: staging → doğrulama → (yalnızca tüm kontroller geçerse) değişim.
 * Mevcut veri, değişim öncesi emniyet kopyasına alınır; hata halinde geri konur.
 */
export async function restoreFromUri(fileUri: string, deps: RestoreDeps): Promise<RestoreOutcome> {
  const { withDbClosed, onProgress } = deps;

  onProgress?.({ stage: 'extract' });
  const root = getRestoreStagingRoot();
  await deleteRecursively(root.uri);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const workDir = new Directory(root, stamp);
  const extracted = new Directory(workDir, 'extracted');
  const safety = new Directory(workDir, 'safety');
  await ensureDirectory(extracted.uri);
  await ensureDirectory(safety.uri);

  // eslint-disable-next-line @typescript-eslint/no-require-imports -- native modül web ortamında yüklenmemeli
  const RNZip = require('react-native-zip-archive') as { zip(files: string[], dest: string): Promise<string>; unzip(file: string, dest: string): Promise<string> };
  try {
    await RNZip.unzip(fileUri.replace('file://', ''), extracted.uri.replace('file://', ''));
  } catch {
    await deleteRecursively(workDir.uri);
    return { ok: false, reason: 'Yedek dosyası açılamadı. Dosya bozulmuş olabilir.', stage: 'extract' };
  }

  onProgress?.({ stage: 'validate' });
  const validation = await validateRestoreExtracted({
    extractedRoot: extracted.uri,
    currentSchemaVersion: LATEST_SCHEMA_VERSION,
    io: createRestoreIO(),
  });

  if (!validation.ok) {
    await deleteRecursively(workDir.uri);
    return { ok: false, reason: validation.reason, stage: validation.stage };
  }

  onProgress?.({ stage: 'swap' });
  try {
    await withDbClosed(async () => {
      // Emniyet kopyası: mevcut DB (+wal/shm) ve medya
      const dbFile = getDatabaseFile();
      if (dbFile.exists) {
        await copyFileAsync(dbFile.uri, joinUri(safety.uri, 'gokalp.sqlite'));
        for (const suffix of ['-wal', '-shm', '-journal']) {
          const side = new File(getSqliteDirectory(), `gokalp.sqlite${suffix}`);
          if (side.exists) {
            await copyFileAsync(side.uri, joinUri(safety.uri, `gokalp.sqlite${suffix}`));
          }
        }
      }
      const mediaRoot = getMediaRoot();
      if (mediaRoot.exists) {
        await copyDirectoryRecursive(mediaRoot.uri, joinUri(safety.uri, 'media'));
      }

      try {
        // DB değişimi
        await copyFileAsync(
          joinUri(extracted.uri, BACKUP_DATABASE_ENTRY),
          dbFile.uri,
        );
        // Medya değişimi
        await deleteRecursively(mediaRoot.uri);
        await ensureDirectory(mediaRoot.uri);
        await copyDirectoryRecursive(
          joinUri(extracted.uri, 'media'),
          mediaRoot.uri,
        );
      } catch (swapError) {
        // Rollback: emniyet kopyasını geri koy
        const safetyDb = new File(safety, 'gokalp.sqlite');
        if (safetyDb.exists) {
          await copyFileAsync(safetyDb.uri, dbFile.uri);
          for (const suffix of ['-wal', '-shm', '-journal']) {
            const src = new File(safety, `gokalp.sqlite${suffix}`);
            const dst = new File(getSqliteDirectory(), `gokalp.sqlite${suffix}`);
            if (src.exists) {
              await copyFileAsync(src.uri, dst.uri);
            } else if (dst.exists) {
              await deleteRecursively(dst.uri);
            }
          }
        }
        await deleteRecursively(mediaRoot.uri);
        await ensureDirectory(mediaRoot.uri);
        await copyDirectoryRecursive(joinUri(safety.uri, 'media'), mediaRoot.uri);
        throw swapError;
      }
    });
  } catch (error) {
    await deleteRecursively(workDir.uri);
    return {
      ok: false,
      reason: error instanceof Error ? error.message : 'Geri yükleme sırasında hata oluştu.',
      stage: 'swap',
    };
  }

  // Yeniden açılan DB migration'ları uygular (eski şema → güncel). openAppDatabase hata fırlatırsa
  // provider error durumuna düşer; bu yüzden swap sonrası ek kontrol yapılmaz.
  onProgress?.({ stage: 'done' });
  await deleteRecursively(workDir.uri);

  const manifestEntryCount = validation.manifest.files.length;
  void BACKUP_MANIFEST_ENTRY;
  return { ok: true, entryCount: manifestEntryCount };
}
