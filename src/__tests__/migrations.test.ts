import { NodeSqliteDriver } from '@/database/drivers/node-driver';
import { LATEST_SCHEMA_VERSION, runMigrations } from '@/database/migrations';
import { runSeeds } from '@/database/seeds/seed-runner';

const EXPECTED_TABLES = [
  'app_settings',
  'child_profile',
  'development_areas',
  'skills',
  'skill_observations',
  'journal_entries',
  'tags',
  'journal_entry_tags',
  'media_assets',
  'journal_media',
  'guide_categories',
  'guide_activities',
  'planned_activities',
  'activity_sessions',
  'activity_media',
  'interest_areas',
  'reminders',
  'schema_migrations',
];

async function openFreshDb(): Promise<NodeSqliteDriver> {
  return NodeSqliteDriver.openInMemory();
}

describe('migration runner (entegrasyon)', () => {
  it('tüm tabloları oluşturur', async () => {
    const db = await openFreshDb();
    const report = await runMigrations(db);
    expect(report.applied).toHaveLength(LATEST_SCHEMA_VERSION);

    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    const names = tables.map((t) => t.name);
    for (const expected of EXPECTED_TABLES) {
      expect(names).toContain(expected);
    }
    await db.closeAsync();
  });

  it('ikinci çalıştırmada hata vermez ve migration uygulamaz', async () => {
    const db = await openFreshDb();
    await runMigrations(db);
    const second = await runMigrations(db);
    expect(second.applied).toHaveLength(0);

    const rows = await db.getAllAsync<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version',
    );
    expect(rows.map((r) => Number(r.version))).toEqual(
      Array.from({ length: LATEST_SCHEMA_VERSION }, (_, i) => i + 1),
    );
    await db.closeAsync();
  });

  it('PRAGMA user_version güncel schema sürümünü yazar', async () => {
    const db = await openFreshDb();
    await runMigrations(db);
    const uv = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(Number(uv?.user_version)).toBe(LATEST_SCHEMA_VERSION);
    await db.closeAsync();
  });

  it('foreign key kısıtı uygulanır', async () => {
    const db = await openFreshDb();
    await runMigrations(db);

    const fkSetting = await db.getFirstAsync<{ foreign_keys: number }>(
      'PRAGMA foreign_keys',
    );
    expect(Number(fkSetting?.foreign_keys)).toBe(1);

    // journal_entries.area_id → development_areas: geçersiz referans reddedilir.
    await expect(
      db.runAsync(
        `INSERT INTO journal_entries (id, entry_type, body, occurred_at, area_id, is_favorite, created_at, updated_at)
         VALUES ('j1', 'memory', 'test', '2026-01-18', 'yok-boyle-alan', 0, '2026-01-18T00:00:00Z', '2026-01-18T00:00:00Z')`,
      ),
    ).rejects.toThrow();
    await db.closeAsync();
  });

  it('CHECK kısıtları uygulanır (skill_observations.status)', async () => {
    const db = await openFreshDb();
    await runMigrations(db);
    await runSeeds(db);

    const skill = await db.getFirstAsync<{ id: string }>('SELECT id FROM skills LIMIT 1');
    // Faz 5'te beceri seed'i gelecek; şimdilik areas tablosu üzerinden doğrula.
    const areas = await db.getAllAsync<{ slug: string }>('SELECT slug FROM development_areas');
    expect(areas).toHaveLength(10);
    expect(skill).toBeNull(); // beceri seed'i henüz yok

    await expect(
      db.runAsync(
        `INSERT INTO skill_observations (id, skill_id, observed_on, status, created_at, updated_at)
         VALUES ('o1', 's1', '2026-01-18', 'great', '2026-01-18T00:00:00Z', '2026-01-18T00:00:00Z')`,
      ),
    ).rejects.toThrow();
    await db.closeAsync();
  });
});

describe('seed runner (entegrasyon)', () => {
  it('10 gelişim alanı + 5 rehber kategorisi ekler', async () => {
    const db = await openFreshDb();
    await runMigrations(db);
    const report = await runSeeds(db);

    expect(report.developmentAreasUpserted).toBe(10);
    expect(report.guideCategoriesUpserted).toBe(5);

    const areas = await db.getAllAsync<{ slug: string; title: string }>(
      'SELECT slug, title FROM development_areas ORDER BY sort_order',
    );
    expect(areas).toHaveLength(10);
    expect(areas[0].title).toBe('Motor Beceriler');

    const cats = await db.getAllAsync<{ slug: string }>('SELECT slug FROM guide_categories');
    expect(cats).toHaveLength(5);
    await db.closeAsync();
  });

  it('tekrar çalıştırma çoğalma yaratmaz', async () => {
    const db = await openFreshDb();
    await runMigrations(db);
    await runSeeds(db);
    const second = await runSeeds(db);
    expect(second.developmentAreasRan).toBe(false);
    expect(second.guideCategoriesRan).toBe(false);

    const count = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM development_areas',
    );
    expect(Number(count?.n)).toBe(10);
    await db.closeAsync();
  });

  it('sürüm değişiminde içerik güncellenir, çoğalmaz', async () => {
    const db = await openFreshDb();
    await runMigrations(db);
    await runSeeds(db);

    // Sürümü değiştir → seed yeniden çalışır ama satır sayısı artmaz.
    await db.runAsync(
      "UPDATE app_settings SET value = '0.0.1' WHERE key = 'seed:development_areas:version'",
    );
    const report = await runSeeds(db);
    expect(report.developmentAreasRan).toBe(true);
    expect(report.developmentAreasUpserted).toBe(10);

    const count = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM development_areas',
    );
    expect(Number(count?.n)).toBe(10);
    await db.closeAsync();
  });
});
