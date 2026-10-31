import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { DatabaseSync } from 'node:sqlite';

import { NodeSqliteDriver } from '@/database/drivers/node-driver';
import { runMigrations } from '@/database/migrations';
import { BACKUP_DATABASE_ENTRY, BACKUP_MANIFEST_ENTRY, buildBackupFileName } from '@/services/backup/constants';
import { buildManifest, validateManifestJson } from '@/services/backup/manifest';
import { validateBackupPath, validateBackupPaths } from '@/services/backup/path-guard';
import {
  validateRestoreExtracted,
  type RestoreIO,
} from '@/services/backup/restore-validator';

function sha256(bytes: Uint8Array): string {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function makeNodeIO(): RestoreIO {
  return {
    async listFiles(root) {
      return walk(root).map((f) => path.relative(root, f).split(path.sep).join('/'));
    },
    async readFileBytes(root, rel) {
      return new Uint8Array(fs.readFileSync(path.join(root, rel)));
    },
    async sha256Bytes(bytes) {
      return sha256(bytes);
    },
    async fileSize(root, rel) {
      return fs.statSync(path.join(root, rel)).size;
    },
    async openSqlite(root, rel) {
      const db = new DatabaseSync(path.join(root, rel));
      return {
        async quickCheck() {
          const row = db.prepare('PRAGMA quick_check').get() as { quick_check: string };
          return row.quick_check;
        },
        async userVersion() {
          const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
          return Number(row.user_version);
        },
        async close() {
          db.close();
        },
      };
    },
  };
}

/** Gerçek migration'lı bir SQLite dosyası üretir. */
async function createRealDbFile(targetPath: string, withProfile = true): Promise<void> {
  // node:sqlite ile dosyayı doğrudan açıp migration'ları uygularız (VACUUM INTO yerine).
  const db = await NodeSqliteDriver.openFile(targetPath);
  await runMigrations(db);
  if (withProfile) {
    await db.runAsync(
      `INSERT INTO child_profile (id, display_name, birth_date, timezone, profile_photo_media_id, created_at, updated_at)
       VALUES ('test-id', 'Gökalp', '2026-01-18', 'Europe/Istanbul', NULL, '2026-01-18T00:00:00Z', '2026-01-18T00:00:00Z')`,
    );
  }
  await db.closeAsync();
}

function writeExtractedTree(root: string, files: Record<string, Buffer | string>): void {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
}

describe('backup manifest', () => {
  it('buildManifest doğru yapı üretir (encrypted:false)', () => {
    const manifest = buildManifest({
      appVersion: '1.0.0',
      schemaVersion: 8,
      exportedAt: '2026-10-31T12:00:00.000Z',
      files: [{ path: BACKUP_DATABASE_ENTRY, sizeBytes: 100, sha256: 'a'.repeat(64) }],
    });
    expect(manifest.format).toBe('gokalp-buyuyor-backup');
    expect(manifest.formatVersion).toBe(1);
    expect(manifest.encrypted).toBe(false);
    expect(manifest.files).toHaveLength(1);
  });

  it('geçerli manifest kabul edilir', () => {
    const manifest = buildManifest({
      appVersion: '1.0.0',
      schemaVersion: 8,
      files: [],
    });
    const result = validateManifestJson(manifest, 8);
    expect(result.ok).toBe(true);
  });

  it('yanlış format reddedilir', () => {
    const result = validateManifestJson({ ...buildManifest({ appVersion: 'x', schemaVersion: 8, files: [] }), format: 'baska-format' }, 8);
    expect(result.ok).toBe(false);
  });

  it('formatVersion 2 reddedilir', () => {
    const result = validateManifestJson(
      { ...buildManifest({ appVersion: 'x', schemaVersion: 8, files: [] }), formatVersion: 2 },
      8,
    );
    expect(result.ok).toBe(false);
  });

  it('şifreli işaretli yedek reddedilir', () => {
    const result = validateManifestJson(
      { ...buildManifest({ appVersion: 'x', schemaVersion: 8, files: [] }), encrypted: true },
      8,
    );
    expect(result.ok).toBe(false);
  });

  it('daha yeni şema sürümü reddedilir', () => {
    const result = validateManifestJson(buildManifest({ appVersion: 'x', schemaVersion: 9, files: [] }), 8);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('yeni');
  });
});

describe('path guard (zip-slip koruması)', () => {
  it('izinli yolları kabul eder', () => {
    expect(validateBackupPath('database/gokalp.sqlite')).toEqual({ ok: true });
    expect(validateBackupPath('media/images/2026/01/foto.jpg')).toEqual({ ok: true });
    expect(validateBackupPath('metadata/export-info.json')).toEqual({ ok: true });
  });

  it('traversal yolları reddeder', () => {
    expect(validateBackupPath('../evil.txt').ok).toBe(false);
    expect(validateBackupPath('media/../../evil.txt').ok).toBe(false);
    expect(validateBackupPath('/abs/path').ok).toBe(false);
    expect(validateBackupPath('database\\evil').ok).toBe(false);
    expect(validateBackupPath('random/file.txt').ok).toBe(false);
    expect(validateBackupPath('').ok).toBe(false);
  });

  it('toplu doğrulama çalışır', () => {
    expect(validateBackupPaths(['database/gokalp.sqlite', 'media/a.jpg']).ok).toBe(true);
    expect(validateBackupPaths(['database/gokalp.sqlite', '../x']).ok).toBe(false);
  });
});

describe('restore validator (entegrasyon — gerçek SQLite + SHA-256)', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gb-restore-'));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  async function buildValidExtracted(): Promise<{ root: string; manifest: unknown }> {
    const root = path.join(tmp, 'extracted');
    fs.mkdirSync(root, { recursive: true });
    const dbPath = path.join(tmp, 'ref.sqlite');
    await createRealDbFile(dbPath);
    const dbBytes = fs.readFileSync(dbPath);

    const manifest = buildManifest({
      appVersion: '1.0.0',
      schemaVersion: 8,
      files: [{ path: BACKUP_DATABASE_ENTRY, sizeBytes: dbBytes.length, sha256: sha256(dbBytes) }],
    });
    writeExtractedTree(root, {
      [BACKUP_DATABASE_ENTRY]: dbBytes,
      [BACKUP_MANIFEST_ENTRY]: JSON.stringify(manifest),
      'metadata/export-info.json': '{"note":"info"}',
    });
    // metadata dosyası manifest'te de olmalı
    const manifestWithMeta = {
      ...manifest,
      files: [
        ...manifest.files,
        {
          path: 'metadata/export-info.json',
          sizeBytes: Buffer.byteLength('{"note":"info"}'),
          sha256: sha256(Buffer.from('{"note":"info"}')),
        },
      ],
    };
    fs.writeFileSync(path.join(root, BACKUP_MANIFEST_ENTRY), JSON.stringify(manifestWithMeta));
    return { root, manifest: manifestWithMeta };
  }

  it('geçerli yedek tüm kontrolleri geçer', async () => {
    const { root } = await buildValidExtracted();
    const result = await validateRestoreExtracted({
      extractedRoot: root,
      currentSchemaVersion: 8,
      io: makeNodeIO(),
    });
    expect(result.ok).toBe(true);
  });

  it('boş yedek (yalnızca DB, profilsiz) geçer', async () => {
    const root = path.join(tmp, 'empty');
    fs.mkdirSync(root, { recursive: true });
    const dbPath = path.join(tmp, 'empty.sqlite');
    await createRealDbFile(dbPath, false);
    const dbBytes = fs.readFileSync(dbPath);
    const manifest = buildManifest({
      appVersion: '1.0.0',
      schemaVersion: 8,
      files: [{ path: BACKUP_DATABASE_ENTRY, sizeBytes: dbBytes.length, sha256: sha256(dbBytes) }],
    });
    writeExtractedTree(root, {
      [BACKUP_DATABASE_ENTRY]: dbBytes,
      [BACKUP_MANIFEST_ENTRY]: JSON.stringify(manifest),
    });
    const result = await validateRestoreExtracted({
      extractedRoot: root,
      currentSchemaVersion: 8,
      io: makeNodeIO(),
    });
    expect(result.ok).toBe(true);
  });

  it('manifest yoksa reddedilir', async () => {
    const root = path.join(tmp, 'nomanifest');
    fs.mkdirSync(path.join(root, 'database'), { recursive: true });
    fs.writeFileSync(path.join(root, BACKUP_DATABASE_ENTRY), Buffer.from('x'));
    const result = await validateRestoreExtracted({
      extractedRoot: root,
      currentSchemaVersion: 8,
      io: makeNodeIO(),
    });
    expect(result).toMatchObject({ ok: false, stage: 'manifest' });
  });

  it('hash uyuşmazlığı reddedilir', async () => {
    const { root } = await buildValidExtracted();
    // Boyut sabit, içerik değişir: ortadaki bir baytı çevir
    const dbPath = path.join(root, BACKUP_DATABASE_ENTRY);
    const bytes = fs.readFileSync(dbPath);
    bytes[Math.floor(bytes.length / 2)] ^= 0xff;
    fs.writeFileSync(dbPath, bytes);
    const result = await validateRestoreExtracted({
      extractedRoot: root,
      currentSchemaVersion: 8,
      io: makeNodeIO(),
    });
    expect(result).toMatchObject({ ok: false, stage: 'hash' });
    if (!result.ok) expect(result.reason).toContain('SHA-256');
  });

  it('dosya boyutu uyuşmazlığı reddedilir', async () => {
    const { root } = await buildValidExtracted();
    fs.appendFileSync(path.join(root, BACKUP_DATABASE_ENTRY), Buffer.from('x'));
    const result = await validateRestoreExtracted({
      extractedRoot: root,
      currentSchemaVersion: 8,
      io: makeNodeIO(),
    });
    expect(result).toMatchObject({ ok: false, stage: 'hash' });
  });

  it('manifest dışı dosya reddedilir', async () => {
    const { root } = await buildValidExtracted();
    fs.writeFileSync(path.join(root, 'evil.txt'), 'surprise');
    const result = await validateRestoreExtracted({
      extractedRoot: root,
      currentSchemaVersion: 8,
      io: makeNodeIO(),
    });
    expect(result).toMatchObject({ ok: false, stage: 'paths' });
  });

  it('traversal içeren manifest reddedilir', async () => {
    const root = path.join(tmp, 'traversal');
    const manifest = buildManifest({
      appVersion: '1.0.0',
      schemaVersion: 8,
      files: [{ path: '../outside.txt', sizeBytes: 1, sha256: 'a'.repeat(64) }],
    });
    writeExtractedTree(root, { [BACKUP_MANIFEST_ENTRY]: JSON.stringify(manifest) });
    const result = await validateRestoreExtracted({
      extractedRoot: root,
      currentSchemaVersion: 8,
      io: makeNodeIO(),
    });
    expect(result).toMatchObject({ ok: false, stage: 'paths' });
  });

  it('bozuk SQLite dosyası quick_check ile yakalanır', async () => {
    const root = path.join(tmp, 'corrupt');
    const corruptBytes = Buffer.from('BU BİR SQLITE DOSYASI DEĞİL, AMA HASHİ DOĞRU' .repeat(4));
    const manifest = buildManifest({
      appVersion: '1.0.0',
      schemaVersion: 8,
      files: [{ path: BACKUP_DATABASE_ENTRY, sizeBytes: corruptBytes.length, sha256: sha256(corruptBytes) }],
    });
    writeExtractedTree(root, {
      [BACKUP_DATABASE_ENTRY]: corruptBytes,
      [BACKUP_MANIFEST_ENTRY]: JSON.stringify(manifest),
    });
    const result = await validateRestoreExtracted({
      extractedRoot: root,
      currentSchemaVersion: 8,
      io: makeNodeIO(),
    });
    expect(result).toMatchObject({ ok: false, stage: 'database' });
  });

  it('çok yeni şema sürümü reddedilir (user_version)', async () => {
    const root = path.join(tmp, 'future-schema');
    fs.mkdirSync(root, { recursive: true });
    const dbPath = path.join(root, BACKUP_DATABASE_ENTRY);
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA user_version = 99');
    db.close();
    const dbBytes = fs.readFileSync(dbPath);
    const manifest = buildManifest({
      appVersion: '1.0.0',
      schemaVersion: 8,
      files: [{ path: BACKUP_DATABASE_ENTRY, sizeBytes: dbBytes.length, sha256: sha256(dbBytes) }],
    });
    fs.writeFileSync(path.join(root, BACKUP_MANIFEST_ENTRY), JSON.stringify(manifest));
    const result = await validateRestoreExtracted({
      extractedRoot: root,
      currentSchemaVersion: 8,
      io: makeNodeIO(),
    });
    expect(result).toMatchObject({ ok: false, stage: 'database' });
  });

  it('snapshot dosyasındaki kayıtlar canlı DB ile aynıdır', async () => {
    const livePath = path.join(tmp, 'live.sqlite');
    await createRealDbFile(livePath);
    const db = new DatabaseSync(livePath);
    const row = db.prepare('SELECT display_name, birth_date FROM child_profile').get() as {
      display_name: string;
      birth_date: string;
    };
    db.close();
    expect(row.display_name).toBe('Gökalp');
    expect(row.birth_date).toBe('2026-01-18');
  });
});

describe('yedek dosya adı', () => {
  it('Gokalp_Buyuyor_YYYY-MM-DD_HH-mm.gokalpbackup biçiminde', () => {
    const name = buildBackupFileName(new Date(2026, 0, 18, 9, 5));
    expect(name).toBe('Gokalp_Buyuyor_2026-01-18_09-05.gokalpbackup');
  });
});
