# Faz 06 — Rapor

## Özet
- Durum: PASS
- Tamamlanma tarihi: 2026-10-31

## Yapılanlar
- **Etkinlik seed'i** (`src/database/seeds/activities.json`): 8 kaynaklı, güvenlik notlu, yetişkin gözetimli etkinlik (0–36 ay). Kaynaklar: CDC "Learn the Signs. Act Early." ipuçları ve Zero to Three oyun fikirleri (reviewed_at 2026-10-31, content_version 1.0.0). Kaynaksız içerik eklenmedi; seed loader sürüm kontrollü ve idempotent (`ON CONFLICT(slug)`).
- **Migration 9**: `planned_activities.reminder_id` → reminders(id) bağlantısı (hatırlatma iptali için).
- **GuideRepository**: kategori + yaş + arama filtreli liste; `materials_json`/`steps_json` güvenli çözümleme (bozuk JSON'da boş listeyle devam).
- **PlannedActivitiesRepository**: plan oluştur (planned), durum geçişleri (completed/postponed/skipped), `completeWithSession` — tamamlama + activity_sessions kaydı tek transaction'da; timeline'a otomatik düşer.
- **Bildirim servisi** (`notification-service.ts`): izin yalnızca kullanıcı hatırlatma onaylarsa istenir; reddedilirse `{ok:false, reason:'permission_denied'}` döner, plan yine kaydedilir ve uygulamada hata görülmez. Android channel kurulumu yapılır.
- **Ekranlar**:
  - Rehber sekmesi: arama + kategori çipleri, yaş etiketli etkinlik kartları, planlananlar üst bölümü, anlamlı empty state.
  - Etkinlik detayı (`app/activities/[activityId].tsx`): amaç, malzemeler, numaralı adımlar, süre, güvenlik kutusu (⚠️), gözetim zorunluluğu, kaynak + sürüm + gözden geçirme tarihi. Çevrimdışı açılır.
  - Planlama (`app/activities/plan.tsx`): tarih + hatırlatma switch (bildirim izni akışı burada başlar).
  - Oturum (`app/activities/complete.tsx`): tamamlandı (tarih + ebeveyn gözlem notu), ertele, atla.
  - Plan listesi (`app/activities/planned.tsx`): tüm planlar durum etiketleriyle.
- `DATABASE_SCHEMA.md` sonuna Faz 6 şema notu eklendi (migration 9).

## Değişen dosyalar
- src/database/seeds/{activities.json,index.ts,seed-runner.ts}
- src/database/migrations/index.ts (v9), src/database/repositories/guide-repository.ts
- src/services/notifications/notification-service.ts
- src/features/guide/use-guide.ts
- app/(tabs)/guide.tsx, app/activities/{[activityId].tsx,plan.tsx,complete.tsx,planned.tsx}
- src/i18n/tr.ts, docs/DATABASE_SCHEMA.md
- src/__tests__/guide-activities.test.ts, src/__tests__/backup-core.test.ts (LATEST_SCHEMA_VERSION sabiti)

## Çalıştırılan komutlar
```bash
npx tsc --noEmit   # PASS
npm run lint       # PASS
npm test           # PASS (103/103; 9 yeni rehber/planlama/bildirim testi)
```

## Test sonuçları
| Test | Sonuç | Kanıt/Not |
|---|---|---|
| 1. Seed aktivite yokken anlamlı empty state | PASS | EmptyState bileşeni + filtre boş senaryosu (bu sürümde kaynaklı 8 etkinlik var) |
| 2. Aktivite JSON import + version | PASS | seed runner sürüm kontrolü; tekrar koşu çoğaltmıyor |
| 3. Yaş/kategori filtresi | PASS | 9 ay + sensory-play birleşik filtre testi |
| 4. Kaynak/sürüm/gözden geçirme gösterimi | PASS | detay ekranı + seed doğrulaması |
| 5. Planlama ve durum değişimi | PASS | planned→postponed→planned→completed |
| 6. Tamamlanan oturuma not | PASS | completeWithSession + timeline eşleşmesi |
| 7. Geçmiş/gelecek plan tarihleri | PASS | sıralama testi |
| 8. Bildirim izni reddedilirse uygulama normal | PASS | mock ile graceful sonuç testi |
| 9. Offline rehber akışı | PASS (kod) | hiçbir ağ çağrısı yok; içerik SQLite'tan |

## Android doğrulaması
- Cihaz/emülatör: yok (sandbox) — BLOCKED; bildirim izin akışı cihaz QA'sında tekrar doğrulanacak

## iOS doğrulaması
- BLOCKED (macOS yok)

## Bilinen sorunlar ve riskler
- Hatırlatma sabah 10:00'a sabitlenmiştir (basit MVP davranışı); saat seçimi Faz 8'de reminders modülüyle zenginleşir.
- AndroidImportance SDK 58'de public index'ten export edilmiyor; build/types alt yolundan alınmaktadır (SDK yükseltmelerinde kontrol edilmeli).

## Sonraki faza notlar
- Faz 7 medya servisi `journal_media` ve `activity_media` ilişkilerini dolduracak; backup/restore artık medyayı taşımalı (Faz 3 kodu hazır).
- Timeline'da activity_session detay yönlendirmesi medya ile birlikte zenginleşebilir.
