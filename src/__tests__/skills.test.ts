import { NodeSqliteDriver } from '@/database/drivers/node-driver';
import { runMigrations } from '@/database/migrations';
import { runSeeds } from '@/database/seeds/seed-runner';
import { SKILLS_SEED } from '@/database/seeds/index';
import { SkillsRepository } from '@/database/repositories/skills-repository';

async function openDb(): Promise<NodeSqliteDriver> {
  const db = await NodeSqliteDriver.openInMemory();
  await runMigrations(db);
  await runSeeds(db);
  return db;
}

describe('beceri seed', () => {
  it('tüm beceriler alanlarıyla eşleşir ve yaş aralığı 0–216 içindedir', async () => {
    const db = await openDb();
    const rows = await db.getAllAsync<{ slug: string; area_id: string; min: number; max: number }>(
      `SELECT s.slug, s.area_id, s.min_age_months AS min, s.max_age_months AS max
       FROM skills s`,
    );
    expect(rows.length).toBe(SKILLS_SEED.length);
    for (const row of rows) {
      expect(row.area_id).not.toBeNull();
      expect(row.min).toBeGreaterThanOrEqual(0);
      expect(row.max).toBeLessThanOrEqual(216);
      expect(row.min).toBeLessThanOrEqual(row.max);
    }
    await db.closeAsync();
  });

  it('her becerinin kaynağı var (kaynaksız milestone yok)', async () => {
    const db = await openDb();
    const missing = await db.getAllAsync<{ slug: string }>(
      'SELECT slug FROM skills WHERE source_name IS NULL OR source_url IS NULL OR reviewed_at IS NULL',
    );
    expect(missing).toEqual([]);
    await db.closeAsync();
  });

  it('seed tekrar çalışınca çoğalmaz', async () => {
    const db = await openDb();
    await runSeeds(db);
    const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM skills');
    expect(Number(count?.n)).toBe(SKILLS_SEED.length);
    await db.closeAsync();
  });

  it('beceriler alanlarla doğru ilişkilendirilir', async () => {
    const db = await openDb();
    const repo = new SkillsRepository(db);
    const motor = (await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM development_areas WHERE slug = ?',
      ['motor'],
    ))!;
    const motorSkills = await repo.listByArea(motor.id);
    expect(motorSkills.length).toBeGreaterThanOrEqual(8);
    // 9 aylık çocuk için filtre çalışır (Gökalp: 2026-01-18 doğum, test bugünü Ekim 2026)
    const forNineMonths = await repo.listByArea(motor.id, { ageMonths: 9 });
    for (const s of forNineMonths) {
      expect(s.min_age_months).toBeLessThanOrEqual(9);
      expect(s.max_age_months).toBeGreaterThanOrEqual(9);
    }
    await db.closeAsync();
  });
});

describe('skills repository', () => {
  it('arama Türkçe karakter ve büyük/küçük harf duyarsız çalışır', async () => {
    const db = await openDb();
    const repo = new SkillsRepository(db);
    const anySkill = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM development_areas WHERE slug = 'language-communication'",
    );
    const found = await repo.listByArea(anySkill!.id, { search: 'babillik' });
    expect(found.length).toBeGreaterThanOrEqual(1);
    await db.closeAsync();
  });

  it('yaş filtresi 0–216 sınırlarıyla çalışır', async () => {
    const db = await openDb();
    const repo = new SkillsRepository(db);
    const area = (await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM development_areas WHERE slug = 'motor'",
    ))!;
    const all = await repo.listByArea(area.id, { ageMonths: null });
    const for216 = await repo.listByArea(area.id, { ageMonths: 216 });
    // 216 aylık çocuk için yalnızca üst aralığı kapatan beceriler döner
    expect(for216.every((s) => s.max_age_months >= 216)).toBe(true);
    expect(all.length).toBeGreaterThanOrEqual(for216.length);
    await db.closeAsync();
  });

  it('alan özetleri betimleyici sayılar verir (skor yok)', async () => {
    const db = await openDb();
    const repo = new SkillsRepository(db);
    const counts = await repo.countsPerArea();
    const motorArea = (await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM development_areas WHERE slug = 'motor'",
    ))!;
    expect(counts[motorArea.id].skills).toBeGreaterThanOrEqual(8);
    expect(counts[motorArea.id].observations).toBe(0);
    await db.closeAsync();
  });
});

describe('beceri gözlemleri', () => {
  it('her gözlem tarihli yeni kayıttır ve geçmişi silmez', async () => {
    const db = await openDb();
    const repo = new SkillsRepository(db);
    const skill = (await db.getFirstAsync<{ id: string }>('SELECT id FROM skills LIMIT 1'))!;

    await repo.addObservation({
      skillId: skill.id,
      observedOn: '2026-10-01',
      status: 'not_tried',
      note: 'Denemedik',
    });
    await repo.addObservation({
      skillId: skill.id,
      observedOn: '2026-10-20',
      status: 'practicing',
      note: 'Birlikte denedik',
    });
    await repo.addObservation({
      skillId: skill.id,
      observedOn: '2026-10-25',
      status: 'sometimes',
    });

    const history = await repo.observations(skill.id);
    expect(history).toHaveLength(3);
    // En yeni tarih önce
    expect(history[0].observed_on).toBe('2026-10-25');
    expect(history[0].status).toBe('sometimes');
    expect(history[2].status).toBe('not_tried');
    await db.closeAsync();
  });

  it('yalnızca izin verilen enum değerleri kabul edilir', async () => {
    const db = await openDb();
    const repo = new SkillsRepository(db);
    const skill = (await db.getFirstAsync<{ id: string }>('SELECT id FROM skills LIMIT 1'))!;
    await expect(
      repo.addObservation({ skillId: skill.id, observedOn: '2026-10-20', status: 'great' as never }),
    ).rejects.toThrow('Geçersiz gözlem durumu');
    await db.closeAsync();
  });

  it('gelecek tarihli gözlem reddedilir', async () => {
    const db = await openDb();
    const repo = new SkillsRepository(db);
    const skill = (await db.getFirstAsync<{ id: string }>('SELECT id FROM skills LIMIT 1'))!;
    await expect(
      repo.addObservation({ skillId: skill.id, observedOn: '2099-01-01', status: 'often' }),
    ).rejects.toThrow('gelecekte olamaz');
    await db.closeAsync();
  });

  it('gözlem sayıları doğru toplanır', async () => {
    const db = await openDb();
    const repo = new SkillsRepository(db);
    const s1 = (await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM skills WHERE slug = 'sits-without-support'",
    ))!;
    await repo.addObservation({ skillId: s1.id, observedOn: '2026-10-10', status: 'practicing' });
    await repo.addObservation({ skillId: s1.id, observedOn: '2026-10-15', status: 'sometimes' });
    const counts = await repo.observationCountsPerSkill([s1.id]);
    expect(counts[s1.id]).toBe(2);
    await db.closeAsync();
  });
});
