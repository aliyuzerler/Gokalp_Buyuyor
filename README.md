# Gökalp Büyüyor

Gökalp'in 0–18 yaş arasındaki anılarını, günlük gözlemlerini, gelişim becerilerini, ilgi alanlarını ve birlikte yapılan etkinlikleri yerel olarak kaydedip arşivleyen kişisel mobil uygulamadır.

- **Platform:** Android + iOS (React Native + Expo + TypeScript)
- **Mimari:** Local-first / offline-first — sunucu, hesap, bulut, reklam, analitik yoktur
- **Depolama:** Uygulama özel alanında standart SQLite + medya dosyaları
- **Yedek:** Kullanıcı tarafından başlatılan şifresiz ZIP (`.gokalpbackup`), harici diske manuel kopyalanır
- **Ürün dili:** Türkçe

> Bu uygulama gelişim teşhisi koymaz, puanlama yapmaz ve çocukları karşılaştırmaz.
> Ürün kararları için `AGENTS.md`, `PROJECT_CONTEXT.md` ve `docs/PRD.md` tek doğruluk kaynağıdır.

## Geliştirme ortamı gereksinimleri

- Node.js 20+ (geliştirme 24.x ile yapıldı)
- npm 10+ (geliştirme 11.x ile yapıldı)
- Expo CLI (proje ile birlikte gelir, `npx expo` ile çalışır)
- Android derlemesi: JDK 17/21 + Android SDK (`expo prebuild` + Gradle)
- iOS derlemesi: macOS + Xcode (yalnızca macOS ortamında)

## Kurulum

```bash
npm install
```

Bağımlılık sürümleri Expo SDK ile uyumlu tutulmalıdır. Yeni paket eklerken:

```bash
npx expo install <paket>
```

## Çalıştırma

```bash
# Metro dev server + Expo Go / development build
npm start

# Android cihaz/emülatör
npm run android

# iOS simülatör (yalnızca macOS)
npm run ios

# Web önizleme (hızlı UI incelemesi için; SQLite/medya/bildirimler yalnızca native)
npm run web
```

Native modül gerektiren özellikler (SQLite, dosya sistemi, bildirim, kamera/medya, ZIP) Expo Go yerine **development build** ile doğrulanmalıdır:

```bash
npx expo prebuild -p android      # android/ klasörünü üretir (CNG)
npx expo run:android              # cihaza/emülatöre derleyip kurar
```

## Kalite komutları

```bash
npm run typecheck   # tsc --noEmit (strict)
npm run lint        # eslint (expo config)
npm run format      # prettier
npm run test        # jest (birim + entegrasyon + bileşen)
npm run doctor      # expo-doctor
```

## Proje yapısı

```text
app/                Expo Router ekranları ((tabs) + alt akışlar)
src/
  components/       Ortak UI bileşenleri
  theme/            Tasarım token'ları (docs/UI_UX.md)
  i18n/             Merkezi Türkçe metin kaynağı
  features/         Modül bazlı hook / use-case / view-model
  database/         DB bağlantısı, migration, repository, seed
  domain/           Saf iş mantığı (yaş hesabı, doğrulama)
  services/         Backup, medya, bildirim servisleri
  hooks/            Ortak React hook'ları
  utils/            Yardımcılar
docs/               PRD, mimari, şema, faz planı ve faz raporları
skills/ prompts/    Geliştirme disiplin dosyaları
templates/ examples/ Seed ve örnek JSON'lar
```

## Faz planı

Fazlar `docs/PHASES_OVERVIEW.md` içinde tanımlıdır (00–09). Her fazın
`docs/phases/NN/IMPLEMENTATION_PROMPT.md` ve `TEST_PROMPT.md` dosyaları vardır;
her faz sonunda `docs/phases/NN/PHASE_REPORT.md` yazılır.

## Sürüm 1.0.0 — Android APK

`apk/Gokalp_Buyuyor-v1.0.0-release.apk` (64,8 MB)

- Paket: `com.gokalp.buyuyor` · versionCode 1 · versionName 1.0.0
- ABI: `arm64-v8a` + `armeabi-v7a` (modern tüm Android telefonlar)
- minSdk 24 (Android 7.0) · targetSdk 36 · compileSdk 37 · Hermes etkin
- İmza: geliştirme (debug) anahtarı — kişisel kullanım içindir; mağaza için ayrı keystore gerekir
- Kurulum: APK'yı telefona kopyalayıp dosya yöneticisinden açın ("Bilinmeyen kaynaklara izin ver")

Derleme, bu depodaki kaynaklardan `expo prebuild` + `gradlew assembleRelease`
ile yapılmıştır; ekran görüntüleri `docs/screenshots/` klasöründedir.

## Ekran görüntüleri

`docs/screenshots/` klasöründe uygulamanın tüm ana akışlarından 19 adet
görüntü bulunur: onboarding (2), ana sayfa, kayıt oluşturma, günlük listesi,
kayıt detayı, gelişim alanları (2), beceri detayı + gözlem geçmişi (2),
rehber + etkinlik detayı + planlama (3), arşiv/zaman çizelgesi, ilgi alanları,
hatırlatmalar, medya arşivi, yedekleme ve çocuk profili.

## Yedekleme notu

Yedek dosyası (`Gokalp_Buyuyor_YYYY-MM-DD_HH-mm.gokalpbackup`) **şifrelenmez**
ve fotoğraf/video/kişisel notlar içerebilir. Uygulama dışa aktarmadan önce bu
uyarıyı gösterir; dosyayı güvenli bir yerde (ör. harici disk) saklamak
kullanıcının sorumluluğudur. Repoya kişisel veri/medya girilmez (`.
gitignore` kapsamındadır).
