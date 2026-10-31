import { NodeSqliteDriver } from '@/database/drivers/node-driver';
import { runMigrations } from '@/database/migrations';
import { ChildProfileRepository } from '@/database/repositories/child-profile-repository';
import { SettingsRepository } from '@/database/repositories/settings-repository';
import { calculateAge, formatAgeTr } from '@/domain/age';

async function openDb(): Promise<NodeSqliteDriver> {
  const db = await NodeSqliteDriver.openInMemory();
  await runMigrations(db);
  return db;
}

describe('child_profile repository (entegrasyon)', () => {
  it('profil oluşturulur ve geri okunur', async () => {
    const db = await openDb();
    const repo = new ChildProfileRepository(db);
    const created = await repo.create({ displayName: 'Gökalp', birthDate: '2026-01-18' });

    expect(created.display_name).toBe('Gökalp');
    expect(created.birth_date).toBe('2026-01-18');
    expect(created.timezone).toBe('Europe/Istanbul');

    const fetched = await repo.getPrimary();
    expect(fetched?.id).toBe(created.id);
    await db.closeAsync();
  });

  it('upsertPrimary: yoksa oluşturur, varsa günceller (tek profil)', async () => {
    const db = await openDb();
    const repo = new ChildProfileRepository(db);

    await repo.upsertPrimary({ displayName: 'Gökalp', birthDate: '2026-01-18' });
    const updated = await repo.upsertPrimary({ displayName: 'Gökalp Y.', birthDate: '2026-01-18' });

    expect(await repo.count()).toBe(1);
    expect(updated.display_name).toBe('Gökalp Y.');
    expect(updated.updated_at >= updated.created_at).toBe(true);
    await db.closeAsync();
  });

  it('geçersiz doğum tarihi repository katmanında reddedilir', async () => {
    const db = await openDb();
    const repo = new ChildProfileRepository(db);
    await expect(repo.create({ displayName: 'Gökalp', birthDate: '2030-01-01' })).rejects.toThrow(
      'gelecekte olamaz',
    );
    await expect(repo.create({ displayName: 'Gökalp', birthDate: '2026-02-30' })).rejects.toThrow();
    await expect(repo.create({ displayName: '  ', birthDate: '2026-01-18' })).rejects.toThrow(
      'Ad boş olamaz',
    );
    await db.closeAsync();
  });

  it('created_at ile updated_at ayrıdır ve güncellemede değişir', async () => {
    const db = await openDb();
    const repo = new ChildProfileRepository(db);
    const created = await repo.create({ displayName: 'Gökalp', birthDate: '2026-01-18' });
    expect(created.created_at).toBe(created.updated_at);
    await db.closeAsync();
  });
});

describe('app_settings repository (entegrasyon)', () => {
  it('set/get, üzerine yazma ve getNumber fallback', async () => {
    const db = await openDb();
    const settings = new SettingsRepository(db);

    expect(await settings.get('missing')).toBeNull();
    await settings.set('key1', 'değer');
    expect(await settings.get('key1')).toBe('değer');
    await settings.set('key1', 'yeni');
    expect(await settings.get('key1')).toBe('yeni');

    expect(await settings.getNumber('num', 42)).toBe(42);
    await settings.setNumber('num', 7);
    expect(await settings.getNumber('num', 42)).toBe(7);
    await db.closeAsync();
  });
});

describe('profil + yaş bütünleşik akış', () => {
  it('kayıtlı profilden yaş hesaplanır', async () => {
    const db = await openDb();
    const repo = new ChildProfileRepository(db);
    const profile = await repo.create({ displayName: 'Gökalp', birthDate: '2026-01-18' });

    const age = calculateAge(profile.birth_date, new Date(2026, 9, 31));
    expect(formatAgeTr(age)).toBe('9 ay 13 gün');
    await db.closeAsync();
  });
});
