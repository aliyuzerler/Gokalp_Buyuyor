/**
 * Medya yolları ve doğrulama yardımcıları (saf — test edilebilir).
 */
export type MediaType = 'image' | 'video';

/** Yedeklemede de kullanılan relative path biçimi: media/images/YYYY/MM/<uuid>.<ext> */
export function buildMediaRelativePath(
  type: MediaType,
  date: Date,
  uuid: string,
  extension: string,
): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const folder = type === 'image' ? 'images' : 'videos';
  const safeExt = extension.replace(/[^A-Za-z0-9]/g, '').toLowerCase() || (type === 'image' ? 'jpg' : 'mp4');
  return `media/${folder}/${yyyy}/${mm}/${uuid}.${safeExt}`;
}

export const DEFAULT_MAX_MEDIA_FILE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MEDIA_MAX_SIZE_SETTING_KEY = 'media:max_file_size_bytes';

/** Yapılandırılabilir dosya boyutu sınırı (kullanıcıya açıklanır). */
export function validateMediaFileSize(
  sizeBytes: number,
  limitBytes: number = DEFAULT_MAX_MEDIA_FILE_BYTES,
): { ok: true } | { ok: false; message: string } {
  if (sizeBytes <= 0) {
    return { ok: false, message: 'Dosya boyutu okunamadı. Lütfen tekrar deneyin.' };
  }
  if (sizeBytes > limitBytes) {
    const limitMb = Math.round(limitBytes / 1024 / 1024);
    return {
      ok: false,
      message: `Dosya çok büyük. Sınır ${limitMb} MB; daha küçük bir dosya seçin.`,
    };
  }
  return { ok: true };
}

const IMAGE_MIME_PREFIXES = ['image/'];
const VIDEO_MIME_PREFIXES = ['video/'];
const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif']);
const VIDEO_EXT = new Set(['mp4', 'mov', 'm4v', 'webm', '3gp']);

export function detectMediaType(mimeType: string | null, extension: string): MediaType | null {
  const ext = extension.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  if (mimeType) {
    if (IMAGE_MIME_PREFIXES.some((p) => mimeType.startsWith(p))) return 'image';
    if (VIDEO_MIME_PREFIXES.some((p) => mimeType.startsWith(p))) return 'video';
  }
  if (IMAGE_EXT.has(ext)) return 'image';
  if (VIDEO_EXT.has(ext)) return 'video';
  return null;
}

export function extensionFromUriOrMime(uri: string, mimeType: string | null): string {
  if (mimeType && mimeType.includes('/')) {
    const sub = mimeType.split('/')[1] ?? '';
    if (sub && sub.length <= 5) return sub.replace(/[^A-Za-z0-9]/g, '');
  }
  const last = uri.split('.').pop() ?? '';
  return last.replace(/[^A-Za-z0-9]/g, '').slice(0, 5);
}
