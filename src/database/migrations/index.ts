import type { DatabaseDriver } from '../types';

/**
 * Numaralı migration'lar. docs/DATABASE_SCHEMA.md bu migration'lara bölünmüştür.
 * Her migration idempotent kurallarla (CREATE TABLE IF NOT EXISTS) yazılır ve
 * migration-runner tarafından tek transaction içinde uygulanır.
 */
export type Migration = {
  version: number;
  name: string;
  sql: string;
};

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'create-app-settings',
    sql: `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`,
  },
  {
    version: 2,
    name: 'create-child-profile',
    sql: `
CREATE TABLE IF NOT EXISTS child_profile (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  birth_date TEXT NOT NULL, -- YYYY-MM-DD
  timezone TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  profile_photo_media_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`,
  },
  {
    version: 3,
    name: 'create-development-areas-and-skills',
    sql: `
CREATE TABLE IF NOT EXISTS development_areas (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY NOT NULL,
  area_id TEXT NOT NULL REFERENCES development_areas(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  min_age_months INTEGER NOT NULL DEFAULT 0,
  max_age_months INTEGER NOT NULL DEFAULT 216,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_name TEXT,
  source_url TEXT,
  reviewed_at TEXT,
  content_version TEXT NOT NULL DEFAULT '1.0.0',
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS skill_observations (
  id TEXT PRIMARY KEY NOT NULL,
  skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE RESTRICT,
  observed_on TEXT NOT NULL, -- YYYY-MM-DD
  status TEXT NOT NULL CHECK(status IN ('not_tried','practicing','sometimes','often','not_sure')),
  note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_skill_obs_skill_date ON skill_observations(skill_id, observed_on DESC);
`,
  },
  {
    version: 4,
    name: 'create-journal',
    sql: `
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY NOT NULL,
  entry_type TEXT NOT NULL CHECK(entry_type IN ('observation','memory','first_event','quote','reflection','free_note')),
  title TEXT,
  body TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  area_id TEXT REFERENCES development_areas(id) ON DELETE SET NULL,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_journal_occurred ON journal_entries(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_type ON journal_entries(entry_type);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS journal_entry_tags (
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY(journal_entry_id, tag_id)
);
`,
  },
  {
    version: 5,
    name: 'create-media',
    sql: `
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY NOT NULL,
  media_type TEXT NOT NULL CHECK(media_type IN ('image','video')),
  relative_path TEXT NOT NULL UNIQUE,
  thumbnail_relative_path TEXT,
  original_name TEXT,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_ms INTEGER,
  captured_at TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS journal_media (
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  media_asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(journal_entry_id, media_asset_id)
);
`,
  },
  {
    version: 6,
    name: 'create-guide',
    sql: `
CREATE TABLE IF NOT EXISTS guide_categories (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS guide_activities (
  id TEXT PRIMARY KEY NOT NULL,
  category_id TEXT REFERENCES guide_categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  purpose TEXT,
  min_age_months INTEGER NOT NULL DEFAULT 0,
  max_age_months INTEGER NOT NULL DEFAULT 216,
  estimated_minutes INTEGER,
  materials_json TEXT NOT NULL DEFAULT '[]',
  steps_json TEXT NOT NULL DEFAULT '[]',
  safety_notes TEXT NOT NULL DEFAULT '',
  adult_supervision TEXT NOT NULL DEFAULT 'required',
  source_name TEXT,
  source_url TEXT,
  reviewed_at TEXT,
  content_version TEXT NOT NULL DEFAULT '1.0.0',
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_activities_age ON guide_activities(min_age_months, max_age_months);
`,
  },
  {
    version: 7,
    name: 'create-planned-activities',
    sql: `
CREATE TABLE IF NOT EXISTS planned_activities (
  id TEXT PRIMARY KEY NOT NULL,
  activity_id TEXT REFERENCES guide_activities(id) ON DELETE SET NULL,
  custom_title TEXT,
  planned_for TEXT,
  status TEXT NOT NULL CHECK(status IN ('planned','completed','postponed','skipped')),
  parent_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS activity_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  planned_activity_id TEXT REFERENCES planned_activities(id) ON DELETE SET NULL,
  activity_id TEXT REFERENCES guide_activities(id) ON DELETE SET NULL,
  happened_at TEXT NOT NULL,
  observation_note TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS activity_media (
  activity_session_id TEXT NOT NULL REFERENCES activity_sessions(id) ON DELETE CASCADE,
  media_asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(activity_session_id, media_asset_id)
);
`,
  },
  {
    version: 8,
    name: 'create-interests-and-reminders',
    sql: `
CREATE TABLE IF NOT EXISTS interest_areas (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  first_observed_on TEXT,
  last_observed_on TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  scheduled_at TEXT NOT NULL,
  notification_id TEXT,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`,
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export type MigrationReport = {
  applied: Migration[];
  currentVersion: number;
  latestVersion: number;
};

/**
 * Migration runner: eksik migration'ları sırayla ve tek transaction'da uygular.
 * Tekrar çalıştırılması güvenlidir (idempotent).
 */
export async function runMigrations(db: DatabaseDriver): Promise<MigrationReport> {
  await db.execAsync(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
`);

  const appliedRows = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_migrations',
  );
  const appliedVersions = new Set(appliedRows.map((r) => Number(r.version)));
  const now = new Date().toISOString();

  const applied: Migration[] = [];
  for (const migration of MIGRATIONS) {
    if (appliedVersions.has(migration.version)) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      await db.runAsync('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)', [
        migration.version,
        migration.name,
        now,
      ]);
    });
    applied.push(migration);
  }

  // user_version hızlı schema kontrolü için güncel tutulur (backup/restore doğrulaması).
  await db.execAsync(`PRAGMA user_version = ${LATEST_SCHEMA_VERSION}`);

  return {
    applied,
    currentVersion: LATEST_SCHEMA_VERSION,
    latestVersion: LATEST_SCHEMA_VERSION,
  };
}
