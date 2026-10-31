# Teknik Mimari

## 1. Mimari biçim

Local-first, offline-first, tek kullanıcı, tek profil. Sunucu ve ağ tabanlı veri akışı yoktur.

```text
React Native UI (Expo Router)
        |
Feature Hooks / View Models
        |
Use Cases / Application Services
        |
Repositories / Domain Services
        |
SQLite (expo-sqlite) ---- App-private media files
        |
Backup Service (SQLite consistent snapshot + media copy + manifest)
        |
Platform Export Picker (Android SAF / iOS Files & Share Sheet)
```

## 2. Önerilen dizin yapısı

```text
app/
  (tabs)/index.tsx
  (tabs)/journal.tsx
  (tabs)/development.tsx
  (tabs)/guide.tsx
  (tabs)/archive.tsx
  onboarding/
  journal/
  skills/
  activities/
  settings/
src/
  components/
  theme/
  features/
    profile/
    journal/
    timeline/
    development/
    skills/
    guide/
    activities/
    interests/
    media/
    backup/
  database/
    db.ts
    migrations/
    repositories/
    seeds/
  domain/
  services/
  hooks/
  utils/
  i18n/
assets/
  fonts/
  icons/
  illustrations/
```

## 3. Katman kuralları

- UI bileşeni SQL yazmaz.
- Ekranlar feature hook/view model çağırır.
- Use-case iş kuralını yönetir.
- Repository SQL sorgularını kapsüller.
- DB bağlantısı uygulamada tek yönetilen instance olur.
- Migration'lar sıralı ve idempotent kontrol edilen sürümlerdir.
- Seed içerikleri yalnızca ilk kurulumda/seed version değişiminde eklenir.
- Kalıcı kaynak SQLite; global state kalıcı veri deposu değildir.

## 4. Depolama yolları

Uygulama özel alanı altında:

```text
app-data/
  gokalp.sqlite
  media/
    images/YYYY/MM/<uuid>.<ext>
    videos/YYYY/MM/<uuid>.<ext>
  backup-staging/
  restore-staging/
```

DB yalnızca `relative_path` saklar. Mutlak path çalışma anında app document directory ile birleştirilir.

## 5. Zaman ve yaş

- Doğum tarihi: `YYYY-MM-DD` tarih-only.
- Olay tarihi: `YYYY-MM-DD` veya gerekiyorsa timezone offset içeren ISO timestamp.
- created_at/updated_at: ISO 8601 UTC timestamp.
- Gösterim timezone: Europe/Istanbul varsayılanı.
- Yaş hesaplaması takvim yılı/ayı/günü ile yapılır. 30 gün = 1 ay yaklaşımı yoktur.
- Gebelik haftası, tıbbi ölçüm gibi alanlar MVP'de toplanmaz.

## 6. Performans

- Liste ekranları sayfalama veya limit kullanır.
- Büyük medya dosyaları JS belleğine tek seferde yüklenmez.
- Thumbnail ayrı üretilir ve cache'lenebilir; orijinal dosya saklanır.
- DB indeksleri tarih ve foreign key alanlarına eklenir.
- SQLite transaction gerektiren çoklu işlemler tek transaction'da yürütülür.

## 7. Hata ve veri bütünlüğü

- Kullanıcıya Türkçe ve eyleme dönük hata mesajı.
- Teknik hata logları yerel geliştirme loglarıdır; uzaktaki servise gönderilmez.
- Dosya yazımı başarısızsa DB kaydı oluşturulmaz veya işlem geri alınır.
- Silmede dosya/DB tutarlılığı kontrol edilir; artık dosya temizliği ayrı bakım görevidir.
- Backup/restore `docs/BACKUP_RESTORE.md` kurallarına uyar.

## 8. Platform notları

- Expo SDK ile uyumlu paket sürümleri `npx expo install` ile kurulur.
- Native modül gereksinimi olan özelliklerde Expo development build kullanılır.
- Android ve iOS dosya dışa aktarma UX'i ayrı uygulanır.
- iOS geliştirme derlemesi için macOS/Xcode veya desteklenen build ortamı gerekir.
