import * as ImagePicker from 'expo-image-picker';

import type { DatabaseDriver } from '@/database/types';
import { MediaRepository, type MediaAssetRow } from '@/database/repositories/media-repository';
import { SettingsRepository } from '@/database/repositories/settings-repository';
import {
  MEDIA_MAX_SIZE_SETTING_KEY,
  buildMediaRelativePath,
  detectMediaType,
  extensionFromUriOrMime,
  validateMediaFileSize,
} from '@/domain/media';
import {
  copyFileAsync,
  deleteRecursively,
  fileSizeBytes,
  joinUri,
} from '@/services/files/fs-utils';
import { getMediaRoot } from '@/services/files/paths';
import { generateUuid } from '@/utils/uuid';

export type ImportProgress =
  | { stage: 'picking' }
  | { stage: 'importing' }
  | { stage: 'thumbnail' }
  | { stage: 'done' };

export type ImportResult =
  | { ok: true; asset: MediaAssetRow; canceled: false }
  | { ok: false; canceled: true }
  | { ok: false; canceled: false; reason: string };

/**
 * Medya servisi: sistem seçici → uygulama özel alanına kopya → DB kaydı.
 * Büyük dosyalar JS belleğine bütünüyle yüklenmez (native copy).
 */
export class MediaService {
  private readonly repository: MediaRepository;
  private readonly settings: SettingsRepository;

  constructor(private readonly db: DatabaseDriver) {
    this.repository = new MediaRepository(db);
    this.settings = new SettingsRepository(db);
  }

  /** Yapılandırılabilir sınır (ayarlar ekranından değiştirilebilir). */
  async getMaxFileBytes(): Promise<number> {
    return this.settings.getNumber(MEDIA_MAX_SIZE_SETTING_KEY, 100 * 1024 * 1024);
  }

  async setMaxFileBytes(bytes: number): Promise<void> {
    await this.settings.setNumber(MEDIA_MAX_SIZE_SETTING_KEY, bytes);
  }

  /** Galeriden seçim + içe aktarma. */
  async importFromLibrary(onProgress?: (p: ImportProgress) => void): Promise<ImportResult> {
    onProgress?.({ stage: 'picking' });
    const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    let granted = permission.granted;
    if (!granted && permission.canAskAgain) {
      const request = await ImagePicker.requestMediaLibraryPermissionsAsync();
      granted = request.granted;
    }
    if (!granted) {
      return { ok: false, canceled: false, reason: 'Galeri izni verilmedi.' };
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 1,
      exif: false,
    });
    if (pickerResult.canceled || pickerResult.assets.length === 0) {
      return { ok: false, canceled: true };
    }
    const asset = pickerResult.assets[0];

    onProgress?.({ stage: 'importing' });
    const extension = extensionFromUriOrMime(asset.uri, asset.mimeType ?? null);
    const mediaType = detectMediaType(asset.mimeType ?? null, extension);
    if (!mediaType) {
      return { ok: false, canceled: false, reason: 'Bu dosya türü desteklenmiyor.' };
    }

    let size = typeof asset.fileSize === 'number' ? asset.fileSize : 0;
    if (size === 0) {
      try {
        size = await fileSizeBytes(asset.uri);
      } catch {
        return { ok: false, canceled: false, reason: 'Dosya okunamadı. Lütfen tekrar deneyin.' };
      }
    }
    const sizeCheck = validateMediaFileSize(size, await this.getMaxFileBytes());
    if (!sizeCheck.ok) {
      return { ok: false, canceled: false, reason: sizeCheck.message };
    }

    const relativePath = buildMediaRelativePath(mediaType, new Date(), generateUuid(), extension);
    const absolutePath = joinUri(getMediaRoot().uri, relativePath);
    try {
      await copyFileAsync(asset.uri, absolutePath);
    } catch {
      return {
        ok: false,
        canceled: false,
        reason: 'Dosya kopyalanamadı. Depolama alanı yeterli olmayabilir.',
      };
    }

    onProgress?.({ stage: 'thumbnail' });
    let thumbnailRelative: string | null = null;
    if (mediaType === 'video') {
      thumbnailRelative = await this.generateVideoThumbnail(absolutePath, relativePath);
    } else {
      // Görseller için öz dosya thumbnail olarak kullanılır (ayrı üretim gerekmez).
      thumbnailRelative = relativePath;
    }

    const row = await this.repository.create({
      mediaType,
      relativePath,
      thumbnailRelativePath: thumbnailRelative,
      originalName: asset.fileName ?? null,
      mimeType: asset.mimeType ?? (mediaType === 'image' ? 'image/jpeg' : 'video/mp4'),
      fileSizeBytes: size,
      width: asset.width ?? null,
      height: asset.height ?? null,
      durationMs: asset.duration != null ? Math.round(asset.duration * 1000) : null,
      // SDK 58 seçicicreation time vermiyor; olay zamanı kayıt tarihinden izlenebilir.
      capturedAt: null,
    });

    onProgress?.({ stage: 'done' });
    return { ok: true, asset: row, canceled: false };
  }

  /** Video thumbnail üretimi; desteklenmeyorsa null (kontrollü fallback). */
  private async generateVideoThumbnail(
    absolutePath: string,
    relativePath: string,
  ): Promise<string | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- native modül yalnızca native runtime'da
      const VideoThumbnails = require('expo-video-thumbnails') as {
        getThumbnailAsync: (uri: string, o?: Record<string, unknown>) => Promise<{ uri: string }>;
      };
      const thumb = await VideoThumbnails.getThumbnailAsync(absolutePath, { quality: 0.5 });
      const thumbRelative = relativePath.replace(/\.([A-Za-z0-9]+)$/, '') + '-thumb.jpg';
      const thumbAbsolute = joinUri(getMediaRoot().uri, thumbRelative);
      await copyFileAsync(thumb.uri, thumbAbsolute);
      return thumbRelative;
    } catch {
      return null; // UI video simge placeholder'ı gösterir
    }
  }

  /**
   * Günlük kaydı silinmeden ÖNCE çağrılır: bağlı medya dosyalarını siler ve
   * asset kayıtlarını temizler (orphan dosya bırakmaz). Kayıt silme işini çağıran yapar.
   */
  async cleanupJournalMedia(journalEntryId: string): Promise<void> {
    const media = await this.repository.forJournal(journalEntryId);
    for (const asset of media) {
      await deleteRecursively(joinUri(getMediaRoot().uri, asset.relative_path));
      if (asset.thumbnail_relative_path && asset.thumbnail_relative_path !== asset.relative_path) {
        await deleteRecursively(joinUri(getMediaRoot().uri, asset.thumbnail_relative_path));
      }
    }
  }

  /** Cascade sonrası artık bağımsız kalan asset satırlarını siler. */
  async removeAssetsIfUnlinked(ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.repository.removeIfUnlinked(id);
    }
  }

  /** Görseli app-private alandan siler; DB kaydını kaldırır. */
  async deleteAsset(asset: MediaAssetRow): Promise<void> {
    const usage = await this.repository.usage(asset.id);
    if (usage.usedByJournal > 0 || usage.usedBySession > 0) {
      throw new Error('Bu medya bir kayıta bağlı; önce kayıttan çıkarın.');
    }
    await deleteRecursively(joinUri(getMediaRoot().uri, asset.relative_path));
    if (asset.thumbnail_relative_path && asset.thumbnail_relative_path !== asset.relative_path) {
      await deleteRecursively(joinUri(getMediaRoot().uri, asset.thumbnail_relative_path));
    }
    await this.repository.removeIfUnlinked(asset.id);
  }
}

/** Dosya yolu → UI'da gösterilebilir file:// URI. */
export function mediaAbsoluteUri(relativePath: string): string {
  return joinUri(getMediaRoot().uri, relativePath);
}
