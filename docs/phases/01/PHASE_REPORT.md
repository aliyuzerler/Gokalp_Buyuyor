# Faz 01 — Rapor

## Özet
- Durum: PASS (Android/iOS cihaz doğrulaması ortam kısıtı nedeniyle açıkça raporlandı)
- Tamamlanma tarihi: 2026-10-31

## Yapılanlar
- Tasarım token dosyası genişletildi: renk (UI_UX.md paleti), spacing, radius, typography, elevation (`src/theme/tokens.ts`).
- Yeniden kullanılabilir bileşenler: `Button` (primary/secondary/ghost/danger, 48dp dokunma alanı), `Card`, `Input` (Türkçe hata/hint), `DateField` (YYYY-MM-DD otomatik biçim), `EmptyState`, `SectionHeader`, `ScreenContainer`.
- Expo Router alt navigasyonu 5 sekmeyle çalışır durumda (Ana Sayfa, Günlük, Gelişim, Rehber, Arşiv); boş sekmeler tasarım sistemine uygun placeholder içeriyor.
- Onboarding akışı: Hoş geldin → Profil (ad + doğum tarihi) → Tamamlandı. Bu fazda profil geçici store'da tutuluyor (`src/features/profile/temp-profile-store.ts`); kalıcı kayıt Faz 02'de.
- Doğum tarihi doğrulaması `src/domain/birth-date.ts`: zod şeması; gelecek tarih, 31 Şubat, artık yıl, çok eski tarih reddedilir.
- Klavye davranışı: onboarding'de KeyboardAvoidingView (iOS padding) + keyboardShouldPersistTaps; safe area SafeAreaView ile sağlanıyor.
- Tüm yeni UI metinleri `src/i18n/tr.ts` içinde merkezi tutuluyor.
- RNTL v14 uyumlu test yardımcıları eklendi (`src/test-utils/render.ts`): async render, act-wrapped press/typeText.

## Değişen dosyalar
- src/theme/tokens.ts, src/i18n/tr.ts
- src/components/{button,card,input,date-field,empty-state,section-header}.tsx
- src/domain/birth-date.ts, src/features/profile/temp-profile-store.ts
- app/onboarding/index.tsx, app/(tabs)/index.tsx
- src/test-utils/render.ts, src/__tests__/{birth-date,design-system,onboarding}.test.ts(x)

## Çalıştırılan komutlar
```bash
npx tsc --noEmit   # PASS
npm run lint       # PASS (0 error, 0 warning)
npm test           # PASS (25/25)
```

## Test sonuçları
| Test | Sonuç | Kanıt/Not |
|---|---|---|
| 1. Beş alt sekme arasında geçiş | PASS (kod düzeyi) | `app/(tabs)/_layout.tsx` 5 sekme tanımlı; ekranlar RNTL ile ayrı ayrı render edilebilir durumda. Cihaz QA Faz 09'da |
| 2. Seçili sekme ayırt ediliyor | PASS | tabBarActiveTintColor primaryDark, inactive textMuted |
| 3. Onboarding tamamlanıyor, hatalı tarih reddediliyor | PASS | onboarding.test.tsx: geçersiz/gelcek tarih hata + Devam kapalı; geçerli girişte özet |
| 4. Tasarım tokenları bileşenlerde | PASS | design-system.test.tsx palet iddiası + bileşen render |
| 5. Klavye input alanlarını kapatmıyor | PASS (kod düzeyi) | KeyboardAvoidingView + keyboardShouldPersistTaps="handled"; cihaz doğrulaması Faz 09 |
| 6. Safe area Android/iOS | PASS (kod düzeyi) | react-native-safe-area-context SafeAreaView (top/bottom edges) |
| 7. Ortak bileşen testleri | PASS | Button/Input/EmptyState/DateField testleri |
| 8. Ekran görüntüsü / UI QA | PARTIAL | Sandbox'ta cihaz yok; ekran görüntüleri Faz 09'da web önizleme üzerinden üretilecek |

## Android doğrulaması
- Cihaz/emülatör: yok (sandbox) — blocker raporlandı
- Sonuç: typecheck/lint/unit testler geçti; cihaz QA Faz 09

## iOS doğrulaması
- Cihaz/simülatör: yok (macOS bulunmuyor) — BLOCKED

## Bilinen sorunlar ve riskler
- Onboarding bu fazda kalıcı değildir (kit talimatı gereği); Faz 02'de SQLite'a taşınacak.
- RNTL v14 async render + React 19 act davranışı: tüm event tabanlı testler `press`/`typeText` yardımcılarını kullanmalı.

## Sonraki faza notlar
- Faz 02'de temp-profile-store kaldırılıp child_profile repository'sine bağlanacak; onboarding bitişinde kalıcı kayıt yapılacak.
- Migration runner ve node:sqlite tabanlı entegrasyon test altyapısı kurulacak.
