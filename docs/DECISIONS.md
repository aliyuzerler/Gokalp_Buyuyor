# Architecture Decision Records (ADR)

## ADR-001: Local-first, no backend

**Karar:** Veri telefonda tutulur; hesap, sunucu ve senkronizasyon yoktur.  
**Gerekçe:** Tek ebeveynin kişisel arşivi; düşük işletim maliyeti ve offline çalışma.  
**Sonuç:** Veri kaybı riskini karşılamak için manuel yedek/restore zorunlu ürün özelliğidir.

## ADR-002: Standard SQLite, no SQLCipher

**Karar:** `expo-sqlite` standart SQLite kullanır.  
**Gerekçe:** Kullanıcı ekstra şifreleme istemiyor; uygulama kişisel telefonda çalışacak.  
**Sonuç:** DB dosyası teknik olarak şifreli değildir. Uygulamanın özel alanında saklanır.

## ADR-003: Unencrypted manual ZIP backup

**Karar:** Kullanıcı tarafından başlatılan şifresiz ZIP export/restore.  
**Gerekçe:** Kullanıcı yedeği kendisi harici diske kopyalayacak.  
**Sonuç:** Dışa aktarma öncesi kısa gizlilik uyarısı gösterilir; parola sorulmaz.

## ADR-004: No PIN / biometric app lock

**Karar:** Uygulama içi PIN ve biyometrik kilit MVP'de yoktur.  
**Gerekçe:** Kullanıcı ekstra erişim önlemi istemiyor.

## ADR-005: One child profile, 0–18 years

**Karar:** İlk sürümde Gökalp profili; içerik ve veri modeli 216 aya kadar.

## ADR-006: No AI/network service

**Karar:** İlk sürümde rehber içerikleri uygulama içinde gelir. Uzaktaki AI veya veri gönderen servis kullanılmaz.

## Değişiklik kuralı

Yeni mimari karar, mevcut ADR'ye gerekçesiz ters düşemez. Değişiklik gerekiyorsa yeni ADR ekle; eski kararı silme.

## ADR-007: Rehber kategorisi seed verisi

**Karar:** Kit templates'inde rehber kategorisi JSON'u bulunmadığı için 5 nötr kategori (`src/database/seeds/guide-categories.json`) uygulama içinde tanımlandı: Oyun ve Keşif, Dil ve Sohbet, Duyusal Oyunlar, Günlük Rutinler, Yaratıcı Etkinlikler.
**Gerekçe:** Faz 2 seed gereksinimi; kategoriler organizasyonel taksonomidir, klinik iddia içermez.
**Sonuç:** İçerik sürümü `SEED_VERSIONS.guideCategories` ile yönetilir; klinik içerik yalnızca kaynaklı şekilde Faz 6'da eklenir.

## ADR-008: DB sürücü soyutlaması ve test stratejisi

**Karar:** Repository'ler `DatabaseDriver` arayüzüne bağımlıdır; uygulama `ExpoDatabaseDriver` (expo-sqlite), testler `NodeSqliteDriver` (node:sqlite) kullanır.
**Gerekçe:** expo-sqlite Node ortamında çalışmaz; aynı SQL/migration'ın gerçek SQLite üzerinde entegrasyon testi gerekliliği (TEST_STRATEGY.md).
**Sonuç:** Migration ve CRUD testleri production SQL'iyle birebir koşar. Sürücü farkları (parametre bağlama, transaction) iki adaptörde ortak davranışa sabitlenmiştir.

## ADR-009: Yedek dışa aktarma akışı (SAF + paylaşım sayfası)

**Karar:** Android'de SAF klasör izni + native `copyAsync` ile dosya content-uri'ye kopyalanır; iOS'ta `expo-sharing` paylaşım sayfası kullanılır.
**Gerekçe:** Dosya JS belleğine yüklenmeden native kopya gerekir (büyük medya). SAF create-document akışı izin iptalinde güvenli çıkış sağlar; iOS'ta Files'a kaydetme paylaşım sayfasından yapılır.
**Sonuç:** Kullanıcı hedef konumu seçmeden uygulama başarı mesajı üretmez. İptal algılama iOS'ta mümkün olmadığından UI "kaydedildi" iddiasında bulunmaz; yalnızca "yedek hazır + paylaşım sayfasını kullanın" bilgisi gösterilir.

## ADR-010: DB tutarlı snapshot stratejisi

**Karar:** Yedek alımı için DB bağlantısı `withDbClosed` köprüsüyle düzgün kapatılır, dosya kopyalanır, bağlantı migration + seed kontrollü olarak yeniden açılır.
**Gerekçe:** expo-sqlite SDK 58'de SQLite online backup API'si sunmuyor; kit yalnızca ana dosyayı WAL açıkken kopyalamayı kabul etmiyor. Tek kullanıcılı üründe kısa kapanma penceresi kabul edilebilir.
**Sonuç:** Snapshot her zaman WAL-checkpoint'lenmiş tutarlı durumdadır; restore eski şemalı DB getirirse açılışta migration uygulanır.

## ADR-011: Arama stratejisi — LIKE fallback

**Karar:** Günlük metin araması bu sürümde indeksli LIKE sorgusuyla yapılır; FTS5 kullanılmaz.
**Gerekçe:** expo-sqlite'ın cihazlarda kullandığı SQLite derlemesinde FTS5 kullanılabilirliği garanti değildir; kit "destek sorunu olursa indeksli LIKE arama fallback"e izin verir.
**Sonuç:** ASCII'de case-insensitive; Türkçe İ/ı gibi byte-düzeyi farklılıklar yazıldığı gibi aranarak aşılır. FTS5 + unicode61, cihaz doğrulamasından sonra değerlendirilebilir.
