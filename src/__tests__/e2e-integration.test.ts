import * as crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { NodeSqliteDriver } from '@/database/drivers/node-driver';
import { LATEST_SCHEMA_VERSION, runMigrations } from '@/database/migrations';
import { runSeeds } from '@/database/seeds/seed-runner';
import { ChildProfileRepository } from '@/database/repositories/child-profile-repository';
import { JournalRepository } from '@/database/repositories/journal-repository';
import { SkillsRepository } from '@/database/repositories/skills-repository';
import {
  GuideRepository,
  PlannedActivitiesRepository,
} from '@/database/repositories/guide-repository';
import { MediaRepository } from '@/database/repositories/media-repository';
import { TimelineRepository } from '@/database/repositories/timeline-repository';
import { calculateAge, formatAgeTr } from '@/domain/age';
import { buildManifest } from '@/services/backup/manifest';
import { validateRestoreExtracted } from '@/services/backup/restore-validator';
import { BACKUP_DATABASE_ENTRY, BACKUP_MANIFEST_ENTRY } from '@/services/backup/constants';

/**
 * Faz 9 uçtan uca senaryo (veri düzlemi, node:sqlite ile aynı SQL):
 * onboarding → profil → günlük → beceri gözlemi → etkinlik → medya →
 * yedek manifesti → doğrulama → temiz kurulumda restore → veri bütünlüğü.
 */

function sha256(bytes: Uint8Array): string {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

async function nodeValidator(root: string, schemaVersion: number) {
  return validateRestoreExtracted({
    extractedRoot: root,
    currentSchemaVersion: schemaVersion,
    io: {
      async listFiles(r) {
        const walk = (dir: string): string[] => {
          const out: string[] = [];
          for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) out.push(...walk(full));
            else out.push(full);
          }
          return out;
        };
        return walk(r).map((f) => path.relative(r, f).split(path.sep).join('/'));
      },
      async readFileBytes(r, rel) {
        return new Uint8Array(fs.readFileSync(path.join(r, rel)));
      },
      async sha256Bytes(bytes) {
        return sha256(bytes);
      },
      async fileSize(r, rel) {
        return fs.statSync(path.join(r, rel)).size;
      },
      async openSqlite(r, rel) {
            const db = new DatabaseSync(path.join(r, rel));
        return {
          async quickCheck() {
            return (db.prepare('PRAGMA quick_check').get() as { quick_check: string }).quick_check;
          },
          async userVersion() {
            return Number((db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version);
          },
          async close() {
            db.close();
          },
        };
      },
    },
  });
}

describe('Faz 9 — uçtan uca bütünleştirme (veri düzlemi)', () => {
  let tmp: string;
  let liveDb: NodeSqliteDriver;

  beforeEach(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gb-e2e-'));
    liveDb = await NodeSqliteDriver.openFile(path.join(tmp, 'gokalp.sqlite'));
    await runMigrations(liveDb);
    await runSeeds(liveDb);
  });

  afterEach(async () => {
    try {
      if (liveDb.isOpen()) await liveDb.closeAsync();
    } catch {
      // zaten kapalı
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('onboarding → profil → günlük → beceri → etkinlik → medya → timeline', async () => {
    // 1) Profil (onboarding bitişi)
    const profiles = new ChildProfileRepository(liveDb);
    const profile = await profiles.upsertPrimary({ displayName: 'Gökalp', birthDate: '2026-01-18' });
    expect(profile.display_name).toBe('Gökalp');
    const age = calculateAge(profile.birth_date, new Date(2026, 9, 31));
    expect(formatAgeTr(age)).toBe('9 ay 13 gün');

    // 2) Günlük + etiket + favori
    const journal = new JournalRepository(liveDb);
    const entry = await journal.create({
      entryType: 'first_event',
      title: 'İlk kez desteksiz oturdu',
      body: 'Koltukta desteksiz oturmayı denedi ve birkaç saniye kaldı!',
      occurredAt: '2026-10-20',
      tags: ['motor', ' ilk'],
    });
    await journal.setFavorite(entry.id, true);

    // 3) Beceri gözlemi
    const skills = new SkillsRepository(liveDb);
    const skillRow = await liveDb.getFirstAsync<{ id: string }>(
      "SELECT id FROM skills WHERE slug = 'sits-without-support'",
    );
    await skills.addObservation({
      skillId: skillRow!.id,
      observedOn: '2026-10-20',
      status: 'practicing',
      note: 'Kısa süre de olsa oturabildi.',
    });
    expect(await skills.observations(skillRow!.id)).toHaveLength(1);

    // 4) Etkinlik planla + tamamla (oturum + not)
    const guide = new GuideRepository(liveDb);
    const planned = new PlannedActivitiesRepository(liveDb);
    const activity = await guide.activityBySlug('tummy-time-play');
    const plan = await planned.create({ activityId: activity!.id, plannedFor: '2026-10-21' });
    const { sessionId: createdSessionId } = await planned.completeWithSession({
      plannedId: plan.id,
      happenedAt: '2026-10-21',
      observationNote: 'Beş dakika keyifle oynadı.',
    });

    // 5) Medya (DB satırı + kayıt ilişkisi)
    const media = new MediaRepository(liveDb);
    const asset = await media.create({
      mediaType: 'image',
      relativePath: 'media/images/2026/10/e2e-photo.jpg',
      thumbnailRelativePath: 'media/images/2026/10/e2e-photo.jpg',
      originalName: 'e2e.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 4096,
      width: 100,
      height: 100,
    });
    await media.linkToJournal(entry.id, asset.id);
    expect((await media.forJournal(entry.id)).map((m) => m.id)).toContain(asset.id);

    // 6) Zaman çizelgesi üç türü birlikte gösterir
    expect(createdSessionId).toBeTruthy();
    const timeline = new TimelineRepository(liveDb);
    const items = await timeline.list();
    const kinds = items.map((i) => i.kind);
    expect(kinds).toContain('journal');
    expect(kinds).toContain('skill_observation');
    expect(kinds).toContain('activity_session');

    // kayıtlar (günlük, medya) uygulama kapansın-açılsın kalıcı (aynı dosya yeniden açılır)
    await liveDb.closeAsync();
    liveDb = await NodeSqliteDriver.openFile(path.join(tmp, 'gokalp.sqlite'));
    const reopened = new ChildProfileRepository(liveDb);
    expect((await reopened.getPrimary())?.display_name).toBe('Gökalp');
    expect(await new JournalRepository(liveDb).count()).toBe(1);
  });

  it('yedek üret → doğrula → temiz kurulumda restore → veri bütünlüğü', async () => {
    // Veri hazırla
    const profiles = new ChildProfileRepository(liveDb);
    await profiles.upsertPrimary({ displayName: 'Gökalp', birthDate: '2026-01-18' });
    const journal = new JournalRepository(liveDb);
    const entry = await journal.create({
      entryType: 'memory',
      title: null,
      body: 'Yedek öncesi kayıt',
      occurredAt: '2026-10-25',
    });
    const media = new MediaRepository(liveDb);
    const asset = await media.create({
      mediaType: 'image',
      relativePath: 'media/images/2026/10/backup-test.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 128,
    });
    await media.linkToJournal(entry.id, asset.id);
    await liveDb.closeAsync();

    const dbPath = path.join(tmp, 'gokalp.sqlite');
    const dbBytes = fs.readFileSync(dbPath);

    // Yedek ağacı (backup servisinin ürettiği yapı)
    const extracted = path.join(tmp, 'extracted');
    fs.mkdirSync(path.join(extracted, 'database'), { recursive: true });
    fs.mkdirSync(path.join(extracted, 'media', 'images', '2026', '10'), { recursive: true });
    fs.writeFileSync(path.join(extracted, BACKUP_DATABASE_ENTRY), dbBytes);
    fs.writeFileSync(path.join(extracted, 'media/images/2026/10/backup-test.jpg'), Buffer.alloc(128, 7));

    const manifest = buildManifest({
      appVersion: '1.0.0',
      schemaVersion: LATEST_SCHEMA_VERSION,
      files: [
        { path: BACKUP_DATABASE_ENTRY, sizeBytes: dbBytes.length, sha256: sha256(dbBytes) },
        {
          path: 'media/images/2026/10/backup-test.jpg',
          sizeBytes: 128,
          sha256: sha256(Buffer.alloc(128, 7)),
        },
      ],
    });
    fs.writeFileSync(path.join(extracted, BACKUP_MANIFEST_ENTRY), JSON.stringify(manifest));

    // Doğrulama (bozuk/hileli yedek reddedilir)
    const validation = await nodeValidator(extracted, LATEST_SCHEMA_VERSION);
    expect(validation.ok).toBe(true);

    // Temiz kurulum: boş dosya + migration
    const cleanPath = path.join(tmp, 'clean', 'gokalp.sqlite');
    fs.mkdirSync(path.dirname(cleanPath), { recursive: true });
    const cleanDb = await NodeSqliteDriver.openFile(cleanPath);
    await runMigrations(cleanDb);
    await cleanDb.closeAsync();

    // Restore: dosya değişimi + yeniden açılış
    fs.copyFileSync(dbPath, cleanPath);
    const restoredDb = await NodeSqliteDriver.openFile(cleanPath);
    const migrationReport = await runMigrations(restoredDb);
    expect(migrationReport.applied).toHaveLength(0); // zaten güncel

    const restoredProfiles = new ChildProfileRepository(restoredDb);
    expect((await restoredProfiles.getPrimary())?.display_name).toBe('Gökalp');
    const restoredJournal = new JournalRepository(restoredDb);
    expect(await restoredJournal.count()).toBe(1);
    const restoredMedia = new MediaRepository(restoredDb);
    expect(await restoredMedia.count()).toBe(1);
    await restoredDb.closeAsync();
  });

  it('eski şemalı yedek restore: açılışta migration ileri sarar', async () => {
    // v2 (yalnızca app_settings + child_profile) şemasında DB üret → user_version=2
    const oldPath = path.join(tmp, 'old', 'gokalp.sqlite');
    fs.mkdirSync(path.dirname(oldPath), { recursive: true });
    await liveDb.closeAsync();

    // Manuel eski şema: user_version=2 içerik
    const legacy = new DatabaseSync(oldPath);
    legacy.exec(`
      CREATE TABLE app_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE child_profile (id TEXT PRIMARY KEY NOT NULL, display_name TEXT NOT NULL, birth_date TEXT NOT NULL, timezone TEXT NOT NULL DEFAULT 'Europe/Istanbul', profile_photo_media_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      INSERT INTO child_profile VALUES ('legacy-1', 'Gökalp', '2026-01-18', 'Europe/Istanbul', NULL, '2026-01-18T00:00:00Z', '2026-01-18T00:00:00Z');
      PRAGMA user_version = 2;
    `);
    legacy.close();

    // Restore hedefi: dosyayı kopyala, uygulama açılışı migration'ları uygular
    const targetPath = path.join(tmp, 'restored-legacy.sqlite');
    fs.copyFileSync(oldPath, targetPath);
    const restored = await NodeSqliteDriver.openFile(targetPath);
    const report = await runMigrations(restored);
    expect(report.applied.length).toBeGreaterThan(0);

    const uv = await restored.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(Number(uv?.user_version)).toBe(LATEST_SCHEMA_VERSION);
    const profile = await new ChildProfileRepository(restored).getPrimary();
    expect(profile?.display_name).toBe('Gökalp');
    await restored.closeAsync();
  });
});
