import { NodeSqliteDriver } from '@/database/drivers/node-driver';
import { LATEST_SCHEMA_VERSION, runMigrations } from '@/database/migrations';
import { runSeeds } from '@/database/seeds/seed-runner';
import { ACTIVITIES_SEED } from '@/database/seeds/index';
import {
  GuideRepository,
  PlannedActivitiesRepository,
} from '@/database/repositories/guide-repository';
import { TimelineRepository } from '@/database/repositories/timeline-repository';

import { scheduleReminder } from '@/services/notifications/notification-service';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, canAskAgain: false }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
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

describe('etkinlik seed', () => {
  it('etkinlikler kategori ve alanlarla ilişkilendirilir, kaynak + güvenlik notu zorunlu', async () => {
    const db = await openDb();
    const rows = await db.getAllAsync<{
      slug: string;
      category_id: string | null;
      source_name: string | null;
      safety_notes: string;
      supervision: string;
      min: number;
      max: number;
    }>(
      `SELECT slug, category_id, source_name, safety_notes, adult_supervision AS supervision,
              min_age_months AS min, max_age_months AS max
       FROM guide_activities`,
    );
    expect(rows.length).toBe(ACTIVITIES_SEED.length);
    for (const row of rows) {
      expect(row.category_id).not.toBeNull();
      expect(row.source_name).not.toBeNull();
      expect(row.safety_notes.length).toBeGreaterThan(0);
      expect(row.supervision).toBe('required');
      expect(row.max).toBeLessThanOrEqual(216);
    }
    await db.closeAsync();
  });

  it('seed tekrar çalışınca etkinlikler çoğalmaz', async () => {
    const db = await openDb();
    await runSeeds(db);
    const count = await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM guide_activities',
    );
    expect(Number(count?.n)).toBe(ACTIVITIES_SEED.length);
    await db.closeAsync();
  });

  it('migration 9: reminder_id kolonu mevcut ve FK bağlı', async () => {
    const db = await openDb();
    const columns = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(planned_activities)",
    );
    expect(columns.map((c) => c.name)).toContain('reminder_id');
    const uv = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    expect(Number(uv?.user_version)).toBe(LATEST_SCHEMA_VERSION);
    await db.closeAsync();
  });
});

describe('guide repository', () => {
  it('kategori ve yaş filtresi birlikte çalışır', async () => {
    const db = await openDb();
    const repo = new GuideRepository(db);
    const all = await repo.listActivities({ ageMonths: 9 });
    expect(all.length).toBeGreaterThan(0);
    for (const a of all) {
      expect(a.min_age_months).toBeLessThanOrEqual(9);
      expect(a.max_age_months).toBeGreaterThanOrEqual(9);
    }
    const sensory = await repo.listActivities({ categorySlug: 'sensory-play', ageMonths: 9 });
    for (const a of sensory) {
      expect(a.category_title).toBe('Duyusal Oyunlar');
    }
    await db.closeAsync();
  });

  it('materials_json ve steps_json çözümlenir', async () => {
    const db = await openDb();
    const repo = new GuideRepository(db);
    const activity = await repo.activityBySlug('tummy-time-play');
    expect(activity).not.toBeNull();
    expect(activity!.materials.length).toBeGreaterThan(0);
    expect(activity!.steps.length).toBeGreaterThanOrEqual(4);
    expect(activity!.safety_notes).toContain('gözetiminiz');
    await db.closeAsync();
  });
});

describe('etkinlik planlama', () => {
  it('etkinlik planlanır ve durumları değişir', async () => {
    const db = await openDb();
    const planned = new PlannedActivitiesRepository(db);
    const guide = new GuideRepository(db);
    const activity = await guide.activityBySlug('book-time');

    const created = await planned.create({
      activityId: activity!.id,
      plannedFor: '2026-11-05',
    });
    expect(created.status).toBe('planned');

    await planned.updateStatus(created.id, 'postponed');
    const list = await planned.list('postponed');
    expect(list).toHaveLength(1);

    await planned.updateStatus(created.id, 'planned');
    const upcoming = await planned.list('planned');
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].planned_for).toBe('2026-11-05');
    await db.closeAsync();
  });

  it('tamamlanan etkinlik oturum oluşturur ve timeline\u2019a düşer', async () => {
    const db = await openDb();
    const planned = new PlannedActivitiesRepository(db);
    const timeline = new TimelineRepository(db);
    const guide = new GuideRepository(db);
    const activity = await guide.activityBySlug('peek-a-boo');

    const created = await planned.create({ activityId: activity!.id, plannedFor: '2026-10-20' });
    const { sessionId } = await planned.completeWithSession({
      plannedId: created.id,
      happenedAt: '2026-10-21',
      observationNote: 'Çok güldü, elleriyle örtüyü kendisi çekti.',
    });

    expect(sessionId).toBeTruthy();
    const completed = await planned.list('completed');
    expect(completed).toHaveLength(1);
    expect(completed[0].parent_note).toContain('Çok güldü');

    const items = await timeline.list();
    const sessionItem = items.find((i) => i.id === sessionId);
    expect(sessionItem).toBeDefined();
    expect(sessionItem!.kind).toBe('activity_session');
    expect(sessionItem!.preview).toContain('Çok güldü');
    await db.closeAsync();
  });

  it('geçmiş ve gelecek plan tarihi senaryoları ayrıştırılır', async () => {
    const db = await openDb();
    const planned = new PlannedActivitiesRepository(db);
    await planned.create({ customTitle: 'Eski plan', plannedFor: '2026-01-01' });
    await planned.create({ customTitle: 'Gelecek plan', plannedFor: '2027-06-01' });

    const all = await planned.list(null);
    expect(all).toHaveLength(2);
    // sıralama: tarihi olanlar önce, DESC
    expect(all[0].custom_title).toBe('Gelecek plan');
    expect(all[1].custom_title).toBe('Eski plan');
    await db.closeAsync();
  });
});

describe('bildirim servisi (izin reddi graceful)', () => {
  it('izin reddedilirse ok:false döner, hata fırlatmaz', async () => {
    const result = await scheduleReminder({
      title: 't',
      body: 'b',
      at: new Date(Date.now() + 60_000),
    });
    expect(result).toEqual({ ok: false, reason: 'permission_denied' });
  });
});
