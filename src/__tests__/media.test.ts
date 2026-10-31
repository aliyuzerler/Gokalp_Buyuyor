import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { NodeSqliteDriver } from '@/database/drivers/node-driver';
import { runMigrations } from '@/database/migrations';
import { MediaRepository } from '@/database/repositories/media-repository';
import { JournalRepository } from '@/database/repositories/journal-repository';
import {
  GuideRepository,
  PlannedActivitiesRepository,
} from '@/database/repositories/guide-repository';
import { runSeeds } from '@/database/seeds/seed-runner';
import {
  DEFAULT_MAX_MEDIA_FILE_BYTES,
  buildMediaRelativePath,
  detectMediaType,
  extensionFromUriOrMime,
  validateMediaFileSize,
} from '@/domain/media';

async function openDb(): Promise<NodeSqliteDriver> {
  const db = await NodeSqliteDriver.openInMemory();
  await runMigrations(db);
  await runSeeds(db);
  return db;
}

describe('medya yolu ve doğrulama yardımcıları', () => {
  it('relative path biçimi: media/images/YYYY/MM/<uuid>.<ext>', () => {
    const p = buildMediaRelativePath('image', new Date(2026, 9, 31), 'abc-123', 'jpg');
    expect(p).toBe('media/images/2026/10/abc-123.jpg');
    const v = buildMediaRelativePath('video', new Date(2026, 0, 18), 'xyz', 'MP4');
    expect(v).toBe('media/videos/2026/01/xyz.mp4');
  });

  it('dosya boyutu sınırı doğrulanır (yapılandırılabilir)', () => {
    expect(validateMediaFileSize(1024).ok).toBe(true);
    const r = validateMediaFileSize(DEFAULT_MAX_MEDIA_FILE_BYTES + 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain('100 MB');
    const custom = validateMediaFileSize(20 * 1024 * 1024, 10 * 1024 * 1024);
    expect(custom.ok).toBe(false);
    expect(validateMediaFileSize(0).ok).toBe(false);
  });

  it('medya türü mime/uzantıdan tespit edilir', () => {
    expect(detectMediaType('image/jpeg', 'jpg')).toBe('image');
    expect(detectMediaType('video/mp4', 'mp4')).toBe('video');
    expect(detectMediaType(null, 'png')).toBe('image');
    expect(detectMediaType(null, 'mov')).toBe('video');
    expect(detectMediaType(null, 'exe')).toBeNull();
  });

  it('uzantı mime veya uri türetilir', () => {
    expect(extensionFromUriOrMime('file:///a/b.jpeg', 'image/jpeg')).toBe('jpeg');
    expect(extensionFromUriOrMime('file:///a/b.mov', null)).toBe('mov');
  });
});

describe('media repository (entegrasyon)', () => {
  it('asset oluşturma + relative path kaydı', async () => {
    const db = await openDb();
    const repo = new MediaRepository(db);
    const created = await repo.create({
      mediaType: 'image',
      relativePath: 'media/images/2026/10/test-uuid.jpg',
      thumbnailRelativePath: 'media/images/2026/10/test-uuid.jpg',
      originalName: 'deneme.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 12345,
      width: 800,
      height: 600,
      durationMs: null,
      capturedAt: null,
    });
    expect(created.id).toBeTruthy();
    expect(created.relative_path).not.toContain('/home/');
    expect(created.file_size_bytes).toBe(12345);
    expect(await repo.count()).toBe(1);
    await db.closeAsync();
  });

  it('kayıt-medya ilişkisi doğru kurulur ve çözümlenir', async () => {
    const db = await openDb();
    const repo = new MediaRepository(db);
    const journal = new JournalRepository(db);
    const entry = await journal.create({
      entryType: 'memory',
      title: 'Fotoğraflı anı',
      body: 'Birlikte piknik yaptık.',
      occurredAt: '2026-10-10',
    });

    const asset = await repo.create({
      mediaType: 'image',
      relativePath: 'media/images/2026/10/picnic.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 2048,
    });
    await repo.linkToJournal(entry.id, asset.id);

    const linked = await repo.forJournal(entry.id);
    expect(linked).toHaveLength(1);
    expect(linked[0].id).toBe(asset.id);

    const usage = await repo.usage(asset.id);
    expect(usage.usedByJournal).toBe(1);

    // bağlı asset silinemez
    expect(await repo.removeIfUnlinked(asset.id)).toBe(false);

    await repo.unlinkFromJournal(entry.id, asset.id);
    expect(await repo.usage(asset.id)).toMatchObject({ usedByJournal: 0, usedBySession: 0 });
    expect(await repo.removeIfUnlinked(asset.id)).toBe(true);
    expect(await repo.byId(asset.id)).toBeNull();
    await db.closeAsync();
  });

  it('etkinlik oturumu medya ilişkisi çalışır', async () => {
    const db = await openDb();
    const repo = new MediaRepository(db);
    const planned = new PlannedActivitiesRepository(db);
    const guide = new GuideRepository(db);
    const activity = await guide.activityBySlug('book-time');
    const p = await planned.create({ activityId: activity!.id, plannedFor: '2026-10-15' });
    const { sessionId } = await planned.completeWithSession({
      plannedId: p.id,
      happenedAt: '2026-10-16',
      observationNote: null,
    });

    const asset = await repo.create({
      mediaType: 'video',
      relativePath: 'media/videos/2026/10/okuma.mp4',
      mimeType: 'video/mp4',
      fileSizeBytes: 500000,
      durationMs: 45000,
    });
    await repo.linkToSession(sessionId, asset.id);
    const sessionMedia = await repo.forSession(sessionId);
    expect(sessionMedia).toHaveLength(1);
    expect(sessionMedia[0].media_type).toBe('video');
    await db.closeAsync();
  });

  it('orphan tespiti: ilişkisi kalmayan asset listelenir', async () => {
    const db = await openDb();
    const repo = new MediaRepository(db);
    const journal = new JournalRepository(db);
    const entry = await journal.create({
      entryType: 'free_note',
      title: null,
      body: 'test',
      occurredAt: '2026-10-01',
    });
    const a1 = await repo.create({
      mediaType: 'image',
      relativePath: 'media/images/2026/10/a1.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 1,
    });
    const a2 = await repo.create({
      mediaType: 'image',
      relativePath: 'media/images/2026/10/a2.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 1,
    });
    await repo.linkToJournal(entry.id, a1.id);
    await journal.remove(entry.id); // CASCADE: a1 bağlantısı gider

    const orphans = await repo.listOrphanIds();
    expect(orphans.sort()).toEqual([a1.id, a2.id].sort());
    await db.closeAsync();
  });

  it('dosya sistemi tutarlılığı: geçici klasörle kopyala-sil döngüsü', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gb-media-'));
    const filePath = path.join(tmp, 'test.jpg');
    fs.writeFileSync(filePath, Buffer.from('sahte-görsel-içerik'));
    expect(fs.existsSync(filePath)).toBe(true);
    fs.rmSync(filePath);
    expect(fs.existsSync(filePath)).toBe(false);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
