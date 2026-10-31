# SQLite Veri Modeli

İlk şema `user_version = 1` ile başlar. ZCode migration sistemi ile bu SQL'i migration dosyalarına bölecek; bu dokümanı tek migration dosyası olarak körlemesine yürütmeyecek.

## 1. İlişki özeti

- `child_profile` tek profil.
- `development_areas` → `skills` → `skill_observations`.
- `journal_entries` → `journal_entry_tags` / `journal_media`.
- `guide_categories` → `guide_activities`.
- `planned_activities` → `activity_sessions` → `activity_media`.
- `interest_areas`.
- `media_assets` dosya metadata tablosu.
- `reminders` yerel bildirim metadata'sı.

## 2. Örnek başlangıç SQL

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS child_profile (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  birth_date TEXT NOT NULL, -- YYYY-MM-DD
  timezone TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  profile_photo_media_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
```

## 3. Veri modelleme kuralları

- UUID v4 veya UUID v7 string primary key kullan; tutarlı ol.
- SQLite foreign_keys her bağlantıda açılır.
- Tarih alanları ISO biçimindedir.
- `materials_json` ve `steps_json` yalnızca yapılandırılmış içerik listeleri için kullanılır; sorgulanması gereken veriyi JSON'a gömme.
- Her repository parametreli SQL kullanır; string interpolation ile SQL birleştirme yok.
- Migration rollback stratejisi ve veri koruma planı her migration için yazılır.
- İçerik seed verisi uygulama kodundan ayrı JSON dosyalarında tutulur.

## 4. Şema değişiklikleri (migration geçmişi)

- v9: `planned_activities` tablosuna `reminder_id TEXT REFERENCES reminders(id)` eklendi (Faz 6 — planlı etkinlik hatırlatma bağlantısı).
