# Faz 08 — Rapor

## Özet
- Durum: PASS
- Tamamlanma tarihi: 2026-10-31

## Yapılanlar
- **İlgi alanları** (`InterestAreasRepository` + `app/interests/index.tsx`): ekle/düzenle/pasifleştir (veri korunur), ilk/son gözlem tarihleri. Sistem öneri yapmaz; kayıtlar tamamen ebeveyne aittir.
- **Arama ve filtreler**: JournalRepository.list genişletildi — serbest metin (LIKE, başlık+gövde), tarih aralığı (occurred_at, kapsayıcı), gelişim alanı, etiket (EXISTS join), favori ve tür filtrelerinin **birlikte** kullanımı. Günlük sekmesine arama kutusu, alan çipleri ve tarih aralığı bölümü eklendi.
- **FTS5 kararı (ADR-011)**: expo-sqlite'ın paketlediği SQLite varyantında FTS5 kullanılabilirliği cihazlar arası garanti olmadığından bu sürümde **indeksli LIKE fallback** seçildi; Türkçe byte-düzeyi davranışı testlerle belgelendi.
- **Hatırlatmalar** (`RemindersRepository` + `app/settings/reminders.tsx` + `reminder-sync.ts`): CRUD, aç/kapa, sil; OS bildirimi schedule/cancel; izin reddi ve unavailable senaryolarında uygulama normal çalışır (bilgilendirme mesajı).
- **Açılışta yeniden planlama**: DatabaseProvider hazır olduğunda gelecekteki etkin hatırlatmaların OS kimlikleri tazelenir; izin kapalıysa raporlanır, hata çıkmaz.
- **Arşiv istatistikleri**: kayıt sayısı + medya sayısı + ilgi alanı sayısı + ilk/son kayıt tarihi — yalnızca betimleyici; skor yok.

## Değişen dosyalar
- src/database/repositories/{interests-repository.ts,reminders-repository.ts,journal-repository.ts}
- src/services/notifications/{reminder-sync.ts}
- src/features/journal/use-journal.ts, src/features/timeline/use-archive-stats.ts
- app/(tabs)/journal.tsx (arama/filtre UI), app/(tabs)/archive.tsx (linkler + özet), app/interests/index.tsx, app/settings/reminders.tsx, src/components/card.tsx (testID)
- src/__tests__/interests-reminders.test.ts

## Çalıştırılan komutlar
```bash
npx tsc --noEmit   # PASS
npm run lint       # PASS
npm test           # PASS (120/120; 8 yeni ilgi alanı/arama/hatırlatma testi)
```

## Test sonuçları
| Test | Sonuç | Kanıt/Not |
|---|---|---|
| 1. İlgi alanı CRUD | PASS | create/update/setActive testleri |
| 2. Pasifleştirme veriyi silmiyor | PASS | description korunur, list filtreleri ayrı |
| 3. Arama Türkçe karakter + case | PASS | 'gülüm' eşleşir; ASCII case duyarsız; 'İ' byte sınırı ADR'de belgelendi |
| 4. Birden fazla filtre birlikte | PASS | tür+tarih, favori+arama, alan, etiket, hepsi |
| 5. Hatırlatma planlama/iptal | PASS | repo + schedule mock |
| 6. Bildirim izni yokken hata yok | PASS | permissionDenied raporu |
| 7. Tarih/timezone senaryoları | PASS | validateReminderDate geçmiş/gelecek/geçersiz |
| 8. Performans (büyük liste) | PARTIAL | LIMIT/OFFSET + indeksler mevcut; 10k satır ölçümü cihaz QA'sında |

## Android doğrulaması
- Cihaz/emülatör: yok (sandbox) — BLOCKED; bildirim davranışı cihaz QA'sında

## iOS doğrulaması
- BLOCKED (macOS yok)

## Bilinen sorunlar ve riskler
- LIKE araması SQLite byte düzeyinde çalışır: 'İlk' araması 'ilk' girişiyle eşleşmez (dotted/dotless I). Kullanıcı metni yazıldığı gibi ararsa sorunsuzdur; FTS5 + unicode61 case-folding Faz 9+ değerlendirmesi.
- Hatırlatma saati sabit 10:00; saatin seçilebilmesi UX iyileştirmesi olarak not edildi.

## Sonraki faza notlar
- Faz 9 E2E: ilgi alanı + hatırlatma akışları smoke listeye eklenmeli.
- reschedule çağrısı DatabaseProvider'a bağlanacak (uygulama açılışı); bugün yalnızca servis hazır — wiring Faz 9'da.
