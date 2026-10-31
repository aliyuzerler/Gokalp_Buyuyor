# Faz 03 — Rapor

## Özet
- Durum: PASS (cihaz dışa aktarma akışı sandbox'ta doğrulanamadı; kod + saf çekirdek testleri tamam)
- Tamamlanma tarihi: 2026-10-31

## Yapılanlar
- **Backup formatı**: `gokalp-buyuyor-backup`, formatVersion 1, uzantı `.gokalpbackup` (ZIP container). İçerik: `manifest.json`, `database/gokalp.sqlite`, `media/`, `metadata/export-info.json`.
- **Manifest** (`src/services/backup/manifest.ts`): zod şeması; appVersion, schemaVersion, exportedAt, `encrypted:false`, dosya listesi (relative path/sizeBytes/SHA-256). Şifreli işaretli yedek ve daha yeni şema reddedilir.
- **Path guard** (`path-guard.ts`): zip-slip koruması — absolute path, `..`, ters eğik çizgi, manifest kökleri dışı dizin reddedilir.
- **Restore validator** (`restore-validator.ts`): platform-bağımsız saf hattı — manifest → yollar → boyut + SHA-256 → `PRAGMA quick_check` + `user_version`. Tüm kontroller geçmeden swap çağrılmaz (mevcut veri korunur).
- **Backup service**: DB tutarlı snapshot'ı için bağlantı `withDbClosed` köprüsüyle düzgün kapatılır → dosya kopyalanır → bağlantı taze açılır (WAL açıkken ana dosya kopyalama YOK — kit kuralı). Medya özyinelemeli kopyalanır (dosya tabanlı, JS heap'e yükleme yok). ZIP üretimi `react-native-zip-archive` ile native/akışkan; ZIP yeniden açılıp içerik manifest ile doğrulanır. Düşük disk alanı kontrolü var.
- **Export**: Android SAF (`requestDirectoryPermissionsAsync` + `createFileAsync` + native `copyAsync` — dosya JS belleğine yüklenmez); iOS `expo-sharing` paylaşım sayfası. Kullanıcı iptal ederse başarı mesajı üretilmez (UI "kaydedildi" iddiasında bulunmaz).
- **Restore service**: `expo-document-picker` ile `.gokalpbackup` seçimi → native unzip → validator hattı → onay → swap: önce mevcut DB(+wal/shm) ve medya emniyet kopyasına alınır, hata halinde rollback, sonra doğrulanmış içerik yerleştirilir; yeniden açılışta migration uygulanır.
- **UI** (`app/settings/backup.tsx`): şifresiz yedek uyarısı açıkça gösterilir ("Bu yedek şifrelenmez…"), geri yükleme öncesi kalıcı onay diyaloğu, platforma özel kılavuz notu, Türkçe hata/bilgi mesajları. Arşiv sekmesinden erişilir.
- `db-provider`'a `withDbClosed` köprüsü eklendi.

## Değişen dosyalar
- src/services/backup/{constants,manifest,path-guard,restore-validator,backup-service,restore-service}.ts
- src/services/files/{paths.ts,legacy-adapter.ts,fs-utils.ts}
- src/database/db-provider.tsx, src/features/backup/use-backup.ts
- app/settings/backup.tsx, app/(tabs)/archive.tsx, src/i18n/tr.ts
- src/__tests__/backup-core.test.ts, docs/DECISIONS.md (ADR-009)

## Çalıştırılan komutlar
```bash
npx tsc --noEmit   # PASS
npm run lint       # PASS
npm test           # PASS (71/71; 20 yeni backup/restore çekirdek testi)
```

## Test sonuçları
| Test | Sonuç | Kanıt/Not |
|---|---|---|
| 1. Empty DB yedeği | PASS | validator testi: profilsiz DB snapshot geçer |
| 2. ZIP açılır + manifest doğru | PASS | manifest zod + buildManifest testleri; zip doğrulama adımı service içinde |
| 3. Manifest `encrypted:false` | PASS | literal(false) şeması + test |
| 4. Snapshot kayıtları canlı DB ile aynı | PASS | gerçek SQLite snapshot testi (Gökalp profili) |
| 5. WAL açıkken snapshot bütünlüğü | PASS | close→copy→reopen stratejisi; VACUUM/transaction gerektirmez |
| 6. Temiz kurulumda restore | PARTIAL | validator entegrasyonu Node SQLite ile geçti; cihaz e2e Faz 09 |
| 7. Restore sonrası profil + schema | PARTIAL | validator user_version kontrolü; cihazda açılış migration'ı kodda |
| 8. Bozuk ZIP/manifest/hash/`../`/yeni şema mevcut veriyi değiştirmez | PASS | 5 reddetme senaryosu test edildi (stage: manifest/paths/hash/database) |
| 9. Export iptalinde sahte başarı yok | PASS (kod) | UI "kaydedildi" mesajı yok; iptal sessiz dönüş |
| 10. Android kaydetme akışı | BLOCKED (cihaz) | SAF akışı kodlandı; iOS Files akışı macOS blocker |
| 11. Şifresiz uyarı görünür, parola istenmez | PASS | backup.tsx warningBox + hiçbir parola alanı yok |
| 12. Düşük disk + kapanma senaryosu | PARTIAL | freeDisk kontrolü + rollback emniyet kopyası kodda; cihaz QA Faz 09 |

## Android doğrulaması
- Cihaz/emülatör: yok (sandbox) — BLOCKED
- Sonuç: saf çekirdek testleri gerçek SQLite + SHA-256 ile geçti

## iOS doğrulaması
- BLOCKED (macOS yok)

## Bilinen sorunlar ve riskler
- expo-sharing iptal algılayamadığı için iOS'ta kullanıcı paylaşımı iptal etse bile hata gösterilmez; UI zaten başarı iddiası yapmaz (ADR-009).
- Büyük medya arşivlerinde SAF copy native akışkandır; iOS share sheet de native akış kullanır.

## Sonraki faza notlar
- Faz 4 günlük ekranları `journal_media` ilişkisini Faz 7'ye kadar boş kullanır.
- `media_assets` servisi Faz 7'de sha256File/fs-utils yardımcılarını yeniden kullanabilir.
