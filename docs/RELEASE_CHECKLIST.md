# Yayın Kontrol Listesi — v1.0.0

## Derleme

- [x] `npm run typecheck` — strict, 0 hata
- [x] `npm run lint` — 0 sorun
- [x] `npm test` — 123/123 (birim + entegrasyon + E2E veri düzlemi)
- [x] `npx expo-doctor` — 20/20
- [ ] Android release APK (`gradlew assembleRelease`) — kullanıcı cihazında doğrulanacak (build sandbox'ta üretildi)
- [ ] Android gerçek cihaz smoke QA — kullanıcıda
- [ ] iOS build — macOS/Xcode gerekir (BLOCKED, raporlandı)

## Mağaza öncesi metinler

**Uygulama adı:** Gökalp Büyüyor
**Kısa açıklama (TR):** Gökalp'in anılarını, gelişim gözlemlerini ve etkinliklerini yerel arşivleyen kişisel aile günlüğü.
**Anahtar kelimeler:** bebek gelişim, aile günlüğü, anı arşivi, bebek anıları, çocuk gözlem
**Kategori:** Ebeveynlik / Yaşam Tarzı
**Gizlilik:** Veri toplamıyor; internet gerektirmez; sunucu/analitik/reklam yok. → `docs/GIZLILIK.md`

## Erişilebilirlik

- [x] Dokunma alanları ≥ 44–48dp (Button/ScreenHeader/çipler)
- [x] accessibilityRole/Label kritik kontrollerde (butonlar, çipler, medya)
- [x] Kontrast: koyu metin (#3F3932) krem zeminde; küçük metin #81776B ≥ 4.5:1
- [x] En küçük metin 13px; gövde 16px; font scaling sisteme bırakıldı
- [ ] Screen reader tam turu — cihaz QA'sında (TalkBack/VoiceOver)

## Regresyon senaryoları (TEST_STRATEGY.md)

- [x] Uygulama yeniden açıldığında veriler kalır (E2E: dosya DB yeniden açma)
- [x] 29 Şubat / ay sonu / doğum günü yaş hesapları (age.test.ts)
- [x] Eski tarihli günlük + timeline sırası (journal tests)
- [x] Beceri geçmişi silinmiyor (skills tests)
- [x] Seed tekrar açılışta çoğalmıyor (migrations/seeds tests)
- [x] Medya–DB tutarlılığı + orphan temizliği (media tests)
- [x] Backup WAL-tutarlı snapshot; bozuk ZIP mevcut veriyi değiştirmiyor (backup-core + e2e)
- [x] Eski şema restore → migration ileri sarma (e2e-integration)
- [x] Offline: hiçbir ağ çağrısı yok (kod incelemesi + bağımlılık denetimi)

## Bilinen sınırlar (v1.0.0)

1. iOS build doğrulaması yapılamadı (macOS yok) — blocker olarak kayıtlı.
2. Medya içe aktarmada ayrıntılı ilerleme çubuğu yok (expo-image-picker expose etmiyor); meşgul göstergesi var.
3. LIKE araması Türkçe İ/ı byte farkında tam eşleşme gerektirir (ADR-011); FTS5 cihaz doğrulamasından sonra değerlendirilecek.
4. Hatırlatma saati sabit 10:00; saat seçimi sonraki sürüm.
5. Tek çocuk profili; veri modeli çoklu profile hazır.
6. APK debug-anahtarla imzalıdır; mağaza imzası için ayrı keystore gerekir.

## Kullanıcı dokümantasyonu

- [x] `README.md` kurulum/çalıştırma
- [x] `docs/KULLANICI_KILAVUZU.md` (telefon değişimi/restore akışı dahil)
- [x] `docs/GIZLILIK.md`
- [x] `docs/BACKUP_RESTORE.md` (teknik)
