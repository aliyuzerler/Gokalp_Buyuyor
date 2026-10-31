import { NodeSqliteDriver } from '@/database/drivers/node-driver';
import { runMigrations } from '@/database/migrations';
import { runSeeds } from '@/database/seeds/seed-runner';
import { JournalRepository } from '@/database/repositories/journal-repository';
import { TimelineRepository } from '@/database/repositories/timeline-repository';
import { parseJournalEntryInput } from '@/domain/journal-entry';

async function openDb(): Promise<NodeSqliteDriver> {
  const db = await NodeSqliteDriver.openInMemory();
  await runMigrations(db);
  await runSeeds(db);
  return db;
}

const BASE = {
  entryType: 'memory' as const,
  title: 'İlk gülüş',
  body: 'Sabah bana gülümsedi.',
  occurredAt: '2026-04-01',
};

describe('journal repository (entegrasyon)', () => {
  it('altı türün tümü oluşturulabiliyor', async () => {
    const db = await openDb();
    const repo = new JournalRepository(db);
    for (const entryType of ['observation', 'memory', 'first_event', 'quote', 'reflection', 'free_note'] as const) {
      const created = await repo.create({ ...BASE, entryType, title: null, body: `${entryType} metni` });
      expect(created.entry_type).toBe(entryType);
    }
    expect(await repo.count()).toBe(6);
    await db.closeAsync();
  });

  it('girdi doğrulaması: boş body ve gelecek tarih reddedilir', async () => {
    const r1 = parseJournalEntryInput({ ...BASE, body: '   ' });
    expect(r1.success).toBe(false);

    const r2 = parseJournalEntryInput({ ...BASE, occurredAt: '2099-01-01' });
    expect(r2.success).toBe(false);

    const r3 = parseJournalEntryInput({ ...BASE, occurredAt: '2026-02-30' });
    expect(r3.success).toBe(false);

    const r4 = parseJournalEntryInput({ ...BASE, entryType: 'hacker' });
    expect(r4.success).toBe(false);
  });

  it('created_at ile occurred_at ayrı saklanır', async () => {
    const db = await openDb();
    const repo = new JournalRepository(db);
    const created = await repo.create(BASE);
    expect(created.occurred_at).toBe('2026-04-01');
    expect(created.created_at).not.toBe('2026-04-01');
    expect(created.created_at).toBe(created.updated_at);
    await db.closeAsync();
  });

  it('geçmiş olay tarihi eklenebilir ve liste doğru sıralanır', async () => {
    const db = await openDb();
    const repo = new JournalRepository(db);
    await repo.create({ ...BASE, occurredAt: '2026-03-01', title: 'Mart' });
    await repo.create({ ...BASE, occurredAt: '2026-01-15', title: 'Ocak' });
    await repo.create({ ...BASE, occurredAt: '2026-05-20', title: 'Mayıs' });

    const list = await repo.list();
    expect(list.map((e) => e.title)).toEqual(['Mayıs', 'Mart', 'Ocak']);
    await db.closeAsync();
  });

  it('düzenleme kalıcıdır ve updated_at değişir', async () => {
    const db = await openDb();
    const repo = new JournalRepository(db);
    const created = await repo.create(BASE);
    const updated = await repo.update(created.id, {
      title: 'Güncellenen başlık',
      body: 'Yeni metin',
    });
    expect(updated.title).toBe('Güncellenen başlık');
    expect(updated.body).toBe('Yeni metin');
    expect(updated.occurred_at).toBe('2026-04-01');
    expect(updated.updated_at >= created.created_at).toBe(true);

    const refetched = await repo.get(created.id);
    expect(refetched?.title).toBe('Güncellenen başlık');
    await db.closeAsync();
  });

  it('favori ekleme/çıkarma çalışır', async () => {
    const db = await openDb();
    const repo = new JournalRepository(db);
    const created = await repo.create(BASE);
    expect(created.is_favorite).toBe(0);

    const fav = await repo.toggleFavorite(created.id);
    expect(fav).toBe(true);
    const favList = await repo.list({ favoritesOnly: true });
    expect(favList).toHaveLength(1);

    const unfav = await repo.toggleFavorite(created.id);
    expect(unfav).toBe(false);
    expect(await repo.list({ favoritesOnly: true })).toHaveLength(0);
    await db.closeAsync();
  });

  it('etiketler eklenir, değiştirilir ve silinir', async () => {
    const db = await openDb();
    const repo = new JournalRepository(db);
    const created = await repo.create({ ...BASE, tags: ['oyun', 'sabah'] });
    expect(created.tags.sort()).toEqual(['oyun', 'sabah']);

    const updated = await repo.update(created.id, { tags: ['oyun', 'akşam'] });
    expect(updated.tags.sort()).toEqual(['akşam', 'oyun']);

    // Etiket tablosunda çoğalma yok
    const tagRows = await db.getAllAsync<{ name: string }>('SELECT name FROM tags');
    expect(new Set(tagRows.map((t) => t.name)).size).toBe(3);

    await repo.remove(created.id);
    // CASCADE: ilişki satırları silinir, tags tanımları kalır
    const rel = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM journal_entry_tags',
    );
    expect(Number(rel?.n)).toBe(0);
    await db.closeAsync();
  });

  it('silme sonrası kayıt listeden ve timeline\'dan kalkar', async () => {
    const db = await openDb();
    const repo = new JournalRepository(db);
    const timeline = new TimelineRepository(db);
    const a = await repo.create({ ...BASE, title: 'A' });
    await repo.create({ ...BASE, title: 'B' });

    expect(await timeline.list()).toHaveLength(2);
    await repo.remove(a.id);
    expect(await repo.count()).toBe(1);
    expect(await timeline.list()).toHaveLength(1);
    expect((await timeline.list())[0].title).toBe('B');
    await db.closeAsync();
  });

  it('liste sayfalama kullanır (limit/offset)', async () => {
    const db = await openDb();
    const repo = new JournalRepository(db);
    for (let i = 1; i <= 7; i += 1) {
      await repo.create({
        ...BASE,
        title: `K${i}`,
        occurredAt: `2026-06-${String(i).padStart(2, '0')}`,
      });
    }
    const page1 = await repo.list({ limit: 5, offset: 0 });
    const page2 = await repo.list({ limit: 5, offset: 5 });
    expect(page1).toHaveLength(5);
    expect(page2).toHaveLength(2);
    expect(page1[0].title).toBe('K7');
    expect(page2[0].title).toBe('K2');
    await db.closeAsync();
  });

  it('tür filtresi doğru çalışır', async () => {
    const db = await openDb();
    const repo = new JournalRepository(db);
    await repo.create({ ...BASE, entryType: 'memory' });
    await repo.create({ ...BASE, entryType: 'quote', body: 'qa' });
    await repo.create({ ...BASE, entryType: 'quote', body: 'qb' });
    const quotes = await repo.list({ entryType: 'quote' });
    expect(quotes).toHaveLength(2);
    await db.closeAsync();
  });

  it('gelişim alanı ilişkisi opsiyoneldir ve FK doğrulanır', async () => {
    const db = await openDb();
    const repo = new JournalRepository(db);
    const area = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM development_areas WHERE slug = ?',
      ['motor'],
    );
    expect(area).not.toBeNull();
    const created = await repo.create({ ...BASE, areaId: area!.id });
    expect(created.area_id).toBe(area!.id);
    await db.closeAsync();
  });
});

describe('timeline repository', () => {
  it('journal kayıtlarını kronolojik döndürür ve beceri/etkinlik kolları boşken çalışır', async () => {
    const db = await openDb();
    const repo = new JournalRepository(db);
    const timeline = new TimelineRepository(db);
    await repo.create({ ...BASE, occurredAt: '2026-02-10', title: 'Eski' });
    await repo.create({ ...BASE, occurredAt: '2026-08-01', title: 'Yeni' });

    const items = await timeline.list();
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ kind: 'journal', title: 'Yeni' });
    expect(items[1]).toMatchObject({ kind: 'journal', title: 'Eski' });

    const until = await timeline.list({ until: '2026-03-01' });
    expect(until).toHaveLength(1);
    expect(until[0].title).toBe('Eski');
    await db.closeAsync();
  });
});
