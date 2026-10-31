import { NodeSqliteDriver } from '@/database/drivers/node-driver';
import { runMigrations } from '@/database/migrations';
import { runSeeds } from '@/database/seeds/seed-runner';
import { JournalRepository } from '@/database/repositories/journal-repository';
import {
  InterestAreasRepository,
} from '@/database/repositories/interests-repository';
import {
  RemindersRepository,
  validateReminderDate,
} from '@/database/repositories/reminders-repository';
import { rescheduleRemindersOnStart } from '@/services/notifications/reminder-sync';
import { scheduleReminder } from '@/services/notifications/notification-service';
import * as Notifications from 'expo-notifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, canAskAgain: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notif-1'),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

async function openDb(): Promise<NodeSqliteDriver> {
  const db = await NodeSqliteDriver.openInMemory();
  await runMigrations(db);
  await runSeeds(db);
  return db;
}

describe('ilgi alanları', () => {
  it('CRUD doğru çalışır', async () => {
    const db = await openDb();
    const repo = new InterestAreasRepository(db);
    const created = await repo.create({
      title: 'Müzik',
      description: 'Müzik çalınca sallanıyor',
      firstObservedOn: '2026-08-01',
    });
    expect(created.is_active).toBe(1);

    const updated = await repo.update(created.id, { title: 'Müzik ve ritim' });
    expect(updated.title).toBe('Müzik ve ritim');
    expect(updated.first_observed_on).toBe('2026-08-01');

    await repo.setActive(created.id, false);
    const inactive = await repo.byId(created.id);
    expect(inactive?.is_active).toBe(0);
    // pasifleştirme veriyi silmez
    expect(inactive?.description).toBe('Müzik çalınca sallanıyor');

    expect(await repo.list()).toHaveLength(0);
    expect(await repo.list(true)).toHaveLength(1);
    await db.closeAsync();
  });

  it('boş başlık reddedilir', async () => {
    const db = await openDb();
    const repo = new InterestAreasRepository(db);
    await expect(repo.create({ title: '  ' })).rejects.toThrow('Başlık boş olamaz');
    await db.closeAsync();
  });
});

describe('günlük arama ve filtreler', () => {
  async function seedJournal(db: NodeSqliteDriver): Promise<Record<string, string>> {
    const repo = new JournalRepository(db);
    const e1 = await repo.create({
      entryType: 'memory',
      title: 'İlk piknik',
      body: 'Parkta gülümsüyordu.',
      occurredAt: '2026-05-10',
    });
    const e2 = await repo.create({
      entryType: 'quote',
      title: null,
      body: 'Ba ba ba diye söylüyordu.',
      occurredAt: '2026-07-22',
    });
    const e3 = await repo.create({
      entryType: 'observation',
      title: 'Emekleme denemesi',
      body: 'Geri geri gitti.',
      occurredAt: '2026-09-15',
    });
    await repo.setFavorite(e1.id, true);
    return { e1: e1.id, e2: e2.id, e3: e3.id };
  }

  it('Türkçe karakterli metin araması çalışır', async () => {
    const db = await openDb();
    await seedJournal(db);
    const repo = new JournalRepository(db);
    const found = await repo.list({ search: 'gülüm' });
    expect(found).toHaveLength(1);
    expect(found[0].title).toBe('İlk piknik');

    // ASCII büyük/küçük harf duyarsız
    const caseFound = await repo.list({ search: 'EMEKL' });
    expect(caseFound).toHaveLength(1);
    await db.closeAsync();
  });

  it('birden fazla filtre birlikte doğru çalışır', async () => {
    const db = await openDb();
    const ids = await seedJournal(db);
    const repo = new JournalRepository(db);

    // tür + tarih aralığı
    const combo = await repo.list({
      entryType: 'quote',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
    });
    expect(combo.map((e) => e.id)).toEqual([ids.e2]);

    // favori + arama
    const favSearch = await repo.list({ favoritesOnly: true, search: 'piknik' });
    expect(favSearch.map((e) => e.id)).toEqual([ids.e1]);

    // gelişim alanı filtresi
    const area = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM development_areas WHERE slug = 'motor'",
    );
    await repo.update(ids.e3, { areaId: area!.id });
    const byArea = await repo.list({ areaId: area!.id });
    expect(byArea.map((e) => e.id)).toEqual([ids.e3]);

    // etiket filtresi
    await repo.update(ids.e2, { tags: ['dil'] });
    const byTag = await repo.list({ tag: 'dil' });
    expect(byTag.map((e) => e.id)).toEqual([ids.e2]);

    // hepsi birlikte
    const all = await repo.list({
      search: 'ba',
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      tag: 'dil',
    });
    expect(all.map((e) => e.id)).toEqual([ids.e2]);
    await db.closeAsync();
  });
});

describe('hatırlatmalar', () => {
  it('planlanır, iptal edilir/silinir', async () => {
    const db = await openDb();
    const repo = new RemindersRepository(db);
    const at = new Date(Date.now() + 3600_000);
    const scheduled = await scheduleReminder({ title: 'Yedek al', body: 'medya', at });
    expect(scheduled.ok).toBe(true);
    const created = await repo.create({
      title: 'Yedek al',
      note: 'medya',
      scheduledAt: at,
      notificationId: scheduled.ok ? scheduled.notificationId : null,
    });
    expect(created.is_enabled).toBe(1);
    expect(created.notification_id).toBe('notif-1');

    await repo.setEnabled(created.id, false);
    expect((await repo.list()).length).toBe(0);
    expect((await repo.list(true)).length).toBe(1);

    await repo.remove(created.id);
    expect(await repo.byId(created.id)).toBeNull();
    await db.closeAsync();
  });

  it('geçmiş zaman reddedilir (saf doğrulama)', () => {
    const past = validateReminderDate(new Date(Date.now() - 60_000).toISOString());
    expect(past.ok).toBe(false);
    const future = validateReminderDate(new Date(Date.now() + 60_000).toISOString());
    expect(future.ok).toBe(true);
    const invalid = validateReminderDate('değil');
    expect(invalid.ok).toBe(false);
  });

  it('açılışta reschedule: gelecekteki hatırlatma yeniden planlanır', async () => {
    const db = await openDb();
    const repo = new RemindersRepository(db);
    await repo.create({
      title: 'Hatırlat 1',
      scheduledAt: new Date(Date.now() + 3600_000),
      notificationId: 'stale-id',
    });
    // mock: izin açık
    const report = await rescheduleRemindersOnStart(db);
    expect(report.checked).toBe(1);
    expect(report.rescheduled).toBe(1);

    const updated = await repo.list(true);
    expect(updated[0].notification_id).toBe('notif-1');
    await db.closeAsync();
  });

  it('izin reddedilirse uygulama hata vermez', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
      granted: false,
      canAskAgain: false,
    });
    const db = await openDb();
    const repo = new RemindersRepository(db);
    await repo.create({
      title: 'Hatırlat 2',
      scheduledAt: new Date(Date.now() + 3600_000),
      notificationId: null,
    });
    const report = await rescheduleRemindersOnStart(db);
    expect(report.permissionDenied).toBe(true);
    expect(report.rescheduled).toBe(0);
    await db.closeAsync();
  });
});
