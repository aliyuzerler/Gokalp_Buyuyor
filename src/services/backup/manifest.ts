import { z } from 'zod';

import { BACKUP_FORMAT, BACKUP_FORMAT_VERSION } from './constants';

export const manifestFileSchema = z.object({
  path: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});

export const manifestSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  formatVersion: z.literal(BACKUP_FORMAT_VERSION),
  appVersion: z.string().min(1),
  schemaVersion: z.number().int().nonnegative(),
  exportedAt: z.string().min(1),
  encrypted: z.literal(false),
  files: z.array(manifestFileSchema),
});

export type ManifestFile = z.infer<typeof manifestFileSchema>;
export type BackupManifest = z.infer<typeof manifestSchema>;

export type ManifestInputFile = {
  path: string;
  sizeBytes: number;
  sha256: string;
};

export type ManifestBuildInput = {
  appVersion: string;
  schemaVersion: number;
  exportedAt?: string;
  files: ManifestInputFile[];
};

/**
 * Manifest üretimi. SHA-256 yalnızca bütünlük kontrolüdür; yedek şifrelenmez.
 */
export function buildManifest(input: ManifestBuildInput): BackupManifest {
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: input.appVersion,
    schemaVersion: input.schemaVersion,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    encrypted: false,
    files: input.files.map((f) => ({
      path: f.path,
      sizeBytes: f.sizeBytes,
      sha256: f.sha256,
    })),
  };
}

export type ManifestParseResult =
  | { ok: true; manifest: BackupManifest }
  | { ok: false; reason: string };

/** Manifest JSON doğrulaması (biçim + sürüm + şifresizlik). */
export function validateManifestJson(
  raw: unknown,
  currentSchemaVersion: number,
): ManifestParseResult {
  const parsed = manifestSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path?.length ? issue.path.join('.') : 'manifest';
    return { ok: false, reason: `Manifest doğrulanamadı (${where}).` };
  }
  const manifest = parsed.data;
  if (manifest.schemaVersion > currentSchemaVersion) {
    return {
      ok: false,
      reason: `Bu yedek daha yeni bir uygulama sürümüyle alındı (şema ${manifest.schemaVersion}). Lütfen uygulamayı güncelleyin.`,
    };
  }
  return { ok: true, manifest };
}
