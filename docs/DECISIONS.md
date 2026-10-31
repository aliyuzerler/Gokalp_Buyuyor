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
