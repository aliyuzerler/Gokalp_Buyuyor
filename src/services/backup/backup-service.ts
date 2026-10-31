import Constants from 'expo-constants';
import { Directory, File } from 'expo-file-system';
import { Platform } from 'react-native';

import { LATEST_SCHEMA_VERSION } from '@/database/migrations';
import {
  BACKUP_DATABASE_ENTRY,
  BACKUP_MANIFEST_ENTRY,
  BACKUP_METADATA_ENTRY_DIR,
  buildBackupFileName,
  BACKUP_MIME_TYPE,
} from './constants';
import { buildManifest } from './manifest';
import {
  copyDirectoryRecursive,
  copyFileAsync,
  deleteRecursively,
  ensureDirectory,
  freeDiskBytes,
  joinUri,
  relativeTo,
  sha256File,
  walkFiles,
  writeFileText,
} from '@/services/files/fs-utils';
import { getBackupStagingRoot, getDatabaseFile, getMediaRoot } from '@/services/files/paths';

/** Minimum yedek alımı için tercih edilen serbest alan (kaba güvenlik payı). */
const MIN_FREE_DISK_BYTES = 50 * 1024 * 1024;

export type BackupProgress = {
  stage: 'preparing' | 'snapshot' | 'media' | 'manifest' | 'zip' | 'verify' | 'export';
};

export type CreateBackupResult = {
  fileUri: string;
  fileName: string;
  sizeBytes: number;
  fileCount: number;
};

export type BackupDeps = {
  /** DB'yi güvenli biçimde kapatıp işi çalıştıran provider köprüsü. */
  withDbClosed: <T>(task: () => Promise<T>) => Promise<T>;
  onProgress?: (progress: BackupProgress) => void;
};

/**
 * Yedek üretimi:
 * 1) DB kapatılır → dosya staging'e kopyalanır → DB yeniden açılır (WAL güvenli snapshot).
 * 2) Medya dosyaları staging'e kopyalanır.
 * 3) SHA-256 + manifest.json + metadata/export-info.json yazılır.
 * 4) ZIP üretimi (native, dosya tabanlı).
 * 5) ZIP yeniden açılarak doğrulanır.
 */
export async function createBackup(deps: BackupDeps): Promise<CreateBackupResult> {
  const { withDbClosed, onProgress } = deps;
  onProgress?.({ stage: 'preparing' });

  const free = await freeDiskBytes();
  if (free < MIN_FREE_DISK_BYTES) {
    throw new Error('Cihazda yeterli boş alan yok. Biraz yer açıp tekrar deneyin.');
  }

  const stagingRoot = getBackupStagingRoot();
  await deleteRecursively(stagingRoot.uri);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const staging = new Directory(stagingRoot, stamp);
  await ensureDirectory(staging.uri);
  await ensureDirectory(joinUri(staging.uri, 'database'));
  await ensureDirectory(joinUri(staging.uri, 'database-backup'));

  // 1) Tutarlı DB snapshot'ı: bağlantı düzgün kapatılıp dosya kopyalanır.
  onProgress?.({ stage: 'snapshot' });
  const dbFile = getDatabaseFile();
  if (!dbFile.exists) {
    throw new Error('Veritabanı dosyası bulunamadı.');
  }
  await withDbClosed(async () => {
    await copyFileAsync(dbFile.uri, joinUri(staging.uri, BACKUP_DATABASE_ENTRY));
  });

  // 2) Medya (henüz yoksa boş klasör bırakılır)
  onProgress?.({ stage: 'media' });
  const mediaRoot = getMediaRoot();
  await ensureDirectory(joinUri(staging.uri, 'media'));
  await copyDirectoryRecursive(mediaRoot.uri, joinUri(staging.uri, 'media'));

  // 3) Manifest
  onProgress?.({ stage: 'manifest' });
  const stagedFiles = await walkFiles(staging.uri);
  const manifestInputFiles = [] as { path: string; sizeBytes: number; sha256: string }[];
  for (const fileUri of stagedFiles) {
    const rel = relativeTo(staging.uri, fileUri);
    manifestInputFiles.push({
      path: rel,
      sizeBytes: new File(fileUri).size,
      sha256: await sha256File(fileUri),
    });
  }

  const manifest = buildManifest({
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
    schemaVersion: LATEST_SCHEMA_VERSION,
    files: manifestInputFiles,
  });
  await writeFileText(joinUri(staging.uri, BACKUP_MANIFEST_ENTRY), JSON.stringify(manifest, null, 2));

  await ensureDirectory(joinUri(staging.uri, BACKUP_METADATA_ENTRY_DIR));
  await writeFileText(
    joinUri(staging.uri, `${BACKUP_METADATA_ENTRY_DIR}/export-info.json`),
    JSON.stringify(
      {
        appName: 'Gökalp Büyüyor',
        platform: Platform.OS,
        exportedAt: manifest.exportedAt,
        note: 'Bu yedek şifrelenmez. Fotoğraflar, videolar ve kişisel notlar içerir. Dosyayı güvenli bir yerde saklayın.',
      },
      null,
      2,
    ),
  );

  // 4) ZIP üretimi (react-native-zip-archive: native, streaming)
  onProgress?.({ stage: 'zip' });
  const fileName = buildBackupFileName();
  const zipFile = new File(stagingRoot, fileName);
  await deleteRecursively(zipFile.uri);

  // eslint-disable-next-line @typescript-eslint/no-require-imports -- native modül web ortamında yüklenmemeli
  const RNZip = require('react-native-zip-archive') as { zip(files: string[], dest: string): Promise<string>; unzip(file: string, dest: string): Promise<string> };
  const entries = [
    joinUri(staging.uri, BACKUP_MANIFEST_ENTRY),
    joinUri(staging.uri, 'database'),
    joinUri(staging.uri, 'media'),
    joinUri(staging.uri, BACKUP_METADATA_ENTRY_DIR),
  ];
  await RNZip.zip(entries, zipFile.uri.replace('file://', ''));

  // 5) Doğrulama: ZIP yeniden açılır, içerik listesi manifest ile karşılaştırılır
  onProgress?.({ stage: 'verify' });
  const verifyDir = new Directory(stagingRoot, `${stamp}-verify`);
  await deleteRecursively(verifyDir.uri);
  await ensureDirectory(verifyDir.uri);
  try {
    await RNZip.unzip(zipFile.uri.replace('file://', ''), verifyDir.uri.replace('file://', ''));
    const extracted = await walkFiles(verifyDir.uri);
    const extractedRel = new Set(
      extracted
        .map((u) => relativeTo(verifyDir.uri, u))
        .filter((p) => p !== BACKUP_MANIFEST_ENTRY),
    );
    for (const f of manifest.files) {
      if (f.path === BACKUP_MANIFEST_ENTRY) continue;
      if (!extractedRel.has(f.path)) {
        throw new Error(`Doğrulama başarısız: ZIP içinde ${f.path} eksik.`);
      }
    }
  } finally {
    await deleteRecursively(verifyDir.uri);
  }

  if (!zipFile.exists || zipFile.size === 0) {
    throw new Error('Yedek dosyası üretilemedi.');
  }

  // Staging içeriği (zip dışı) temizlenir; zip dosyası export için kalır.
  for (const child of new Directory(stagingRoot).list()) {
    if (child.uri !== zipFile.uri) {
      await deleteRecursively(child.uri);
    }
  }

  return {
    fileUri: zipFile.uri,
    fileName,
    sizeBytes: zipFile.size,
    fileCount: manifest.files.length,
  };
}

export type ExportResult = {
  /** Kullanıcının dosyayı kaydettiği gerçek bir konum doğrulanamaz; başarı mesajı verilmemesi için ayrım yapılır. */
  shared: boolean;
};

/**
 * Yedeği dışa aktarır.
 * Android: SAF klasör izni + native copy (dosya JS belleğine yüklenmez).
 * iOS: sistem paylaşım sayfası (Files uygulamasına kaydetme).
 * Kullanıcı akışı iptal ederse sessizce döner; başarı mesajı üretilmez.
 */
export async function exportBackupFile(fileUri: string): Promise<ExportResult> {
  if (Platform.OS === 'android') {
    const legacy = (await import('@/services/files/legacy-adapter')).legacy;
    const perms = await legacy.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!perms.granted) {
      return { shared: false };
    }
    const fileName = fileUri.split('/').pop() ?? buildBackupFileName();
    const contentUri = await legacy.StorageAccessFramework.createFileAsync(
      perms.directoryUri,
      fileName,
      BACKUP_MIME_TYPE,
    );
    await legacy.copyAsync({ from: fileUri, to: contentUri });
    return { shared: true };
  }

  const Sharing = await import('expo-sharing');
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Paylaşım hizmeti bu cihazda kullanılamıyor.');
  }
  await Sharing.shareAsync(fileUri, {
    mimeType: BACKUP_MIME_TYPE,
    dialogTitle: 'Yedeği kaydet',
    UTI: 'public.zip-archive',
  });
  return { shared: true };
}

/** Export tamamlandıktan sonra staging temizliği. */
export async function cleanupBackupStaging(): Promise<void> {
  await deleteRecursively(getBackupStagingRoot().uri);
}
