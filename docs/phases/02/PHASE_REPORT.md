# Faz 02 — Rapor

## Özet
- Durum: PASS
- Tamamlanma tarihi: 2026-10-31

## Yapılanlar
- `expo-sqlite` SDK 58 uyumlu kuruldu; API yüzeyi paket tiplerinden doğrulandı (`openDatabaseAsync`, `runAsync/getAllAsync/getFirstAsync`, `withExclusiveTransactionAsync`, `closeAsync`).
- **DB sürücü soyutlaması** (`src/database/types.ts`): `DatabaseDriver` arayüzü + iki uygulama:
  - `ExpoDatabaseDriver` (uygulama, expo-sqlite)
  - `NodeSqliteDriver` (testler, `node:sqlite`) — aynı SQL, aynı migration.
- **Migration runner** (`src/database/migrations/index.ts`): 8 numaralı migration (app_settings, child_profile, development_areas/skills/skill_observations, journal/tags, media, guide, planned_activities/sessions, interests/reminders). Her biri `schema_migrations` kaydıyla transaction içinde uygulanır; `PRAGMA user_version` güncellenir. Idempotent.
- **Seed runner**: `templates/seed-development-areas.json` → 10 gelişim alanı; rehber kategorileri için 5 nötr kategori JSON'u eklendi (`docs/DECISIONS.md` ADR-007). Seed yalnızca sürüm değişiminde çalışır; `ON CONFLICT(slug) DO UPDATE` ile çoğalma engellenir.
- **Repository'ler**: `ChildProfileRepository` (create/getPrimary/update/upsertPrimary + zod row doğrulaması + Türkçe girdi hataları), `SettingsRepository` (get/set/getNumber), gelişim alanı okuma Faz 05'te.
- **Yaş hesabı** (`src/domain/age.ts`): takvim bazlı; 29 Şubat sıkıştırma kuralı, ay sonu kuralı, borçlanma; `formatAgeTr` gösterimi (0 yaş → "9 ay 13 gün").
- **DB açılış yöneticisi** (`db.ts` + `db-provider.tsx`): uygulama açılışında foreign_keys=ON + WAL + migration + seed; ready/loading/error gate'i Türkçe ekranla.
- **Onboarding kalıcı hale geldi**: bitişte profil SQLite'a yazılır (`temp-profile-store` kaldırıldı).
- **Profil ekranı** (`app/settings/profile.tsx`): ad, doğum tarihi, yaş gösterimi; profil fotoğrafı alanı Faz 07 için notlandırılmış placeholder.
- **Ana sayfa** DB'den selamlama + yaş gösterir; Arşiv sekmesine "Profil ve Ayarlar" bölümü eklendi.
- Tüm SQL parametreli (`?` placeholder); UI katmanı SQL içermez (UI → hook → repository).

## Değişen dosyalar
- src/database/{types.ts,db.ts,db-provider.tsx,migrations/index.ts,seeds/{index.ts,seed-runner.ts,development-areas.json,guide-categories.json,activities.json}}
- src/database/drivers/{expo-driver.ts,node-driver.ts}
- src/database/repositories/{child-profile-repository.ts,settings-repository.ts}
- src/domain/{age.ts,birth-date.ts}, src/utils/uuid.ts
- src/features/profile/use-profile.ts
- app/{_layout.tsx,onboarding/index.tsx,settings/profile.tsx,(tabs)/index.tsx,(tabs)/archive.tsx}
- src/components/{date-field.tsx,screen-header.tsx}, src/i18n/tr.ts
- src/__tests__/{age,migrations,profile-repository}.test.ts, src/__tests__/onboarding.test.tsx

## Çalıştırılan komutlar
```bash
npx tsc --noEmit   # PASS
npm run lint       # PASS (0 error, 0 warning)
npm test           # PASS (51/51; migration/repository/seed entegrasyon testleri node:sqlite ile)
```

## Test sonuçları
| Test | Sonuç | Kanıt/Not |
|---|---|---|
| 1. İlk açılış DB ve tabloları oluşturuyor | PASS | migrations.test.ts: 18 tablo `sqlite_master` ile doğrulandı |
| 2. Migration ikinci çalıştırmada hata vermiyor | PASS | ikinci koşuda `applied=[]` |
| 3. Seed kategoriler çoğalmıyor | PASS | 10 alan + 5 kategori; ikinci koşu `ran=false` |
| 4. Profil kapanıp açıldığında korunuyor | PASS (repository düzeyi) | upsert/getPrimary testleri; cihazda aç/kapa QA Faz 09 |
| 5. Hatalı doğum tarihi reddediliyor | PASS | repository + domain testleri (gelecek, 30 Şubat, boş ad) |
| 6. Yaş hesabı örnekleri | PASS | 9 ay, ay sonu, 29 Şubat (2024/2025), doğum günü, toplam gün |
| 7. Repository CRUD + FK | PASS | FK ihlali `rejects.toThrow` ile doğrulandı |
| 8. PRAGMA foreign_keys + user_version | PASS | `foreign_keys=1`, `user_version=8` |
| 9. Typecheck/lint + smoke | PASS | Tüm komutlar yeşil; Android cihaz smoke Faz 09 |

## Android doğrulaması
- Cihaz/emülatör: yok (sandbox) — BLOCKED açıkça raporlandı
- Sonuç: node:sqlite ile aynı SQL'in entegrasyon doğrulaması tamam

## iOS doğrulaması
- BLOCKED (macOS yok)

## Bilinen sorunlar ve riskler
- WAL modu açık; Faz 3 backup'ta checkpoint/uyumlu snapshot yaklaşımı zorunlu.
- Seed'de rehber kategorileri kitin templates'inde bulunmadığından nötr kategorik JSON oluşturuldu (ADR-007).

## Sonraki faza notlar
- Faz 3 backup: DB açıkken yalnızca ana dosyayı kopyalamak yasak; `wal_checkpoint(TRUNCATE)` + kısa kilit ya da connection close stratejisi uygulanacak.
- `media_assets`/`journal_media` şeması Faz 4/7'de kullanılmak üzere hazır.
