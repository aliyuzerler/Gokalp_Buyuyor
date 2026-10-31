# Android APK Derleme Notları (v1.0.0)

`android/` klasörü Expo CNG gereği gitignoredır (`npx expo prebuild -p android`
ile üretilir). v1.0.0 APK'sı şu kaynaklardan derlenmiştir:

- Node 24, JDK 21, Android SDK (compileSdk 37 / build-tools 37.0.0 / NDK 27.1.12297006)
- Gradle 9.4.1 (wrapper), AGP 9.2.1, Kotlin 2.2.10 (catalog) / RN 0.88.1 / Expo SDK 58
- `npx expo prebuild -p android` sonrası aşağıdaki ayarlamalar yapılmıştır.

## Kısıtlı derleme ortamı için ayarlar (android/gradle.properties)

Derleme 4 GB RAM / 10 GB diskli bir ortamda yapıldı; aşağıdaki değerler bu
ortama göre seçildi. Güçlü bir makinede R8 (minify) tekrar açılabilir.

```properties
org.gradle.jvmargs=-Xmx1536m -XX:MaxMetaspaceSize=512m
kotlin.daemon.jvmargs=-Xmx768m
org.gradle.workers.max=1
org.gradle.parallel=false
android.enableMinifyInReleaseBuilds=false
reactNativeArchitectures=armeabi-v7a,arm64-v8a
systemProp.org.gradle.internal.repository.max.retries=25
systemProp.org.gradle.internal.repository.initial.backoff=8000
```

Not: Metro bundle adımı için `NODE_OPTIONS=--max-old-space-size=1024` önerilir
(RN bundle görevine node heap sınırı düşük RAM'li ortamlarda OOM'u önler).

## Maven Central 429 (hız limiti) savunması

Depo zincirine, **yalnızca klasör varsa** devreye giren yerel bir Maven
deposu eklenmiştir (`android/build.gradle` + `android/settings.gradle`):

```groovy
def localMavenRepo = new File('/home/z/local-maven')
if (localMavenRepo.isDirectory()) { maven { url localMavenRepo } }
```

Bu klasör, hız limiti nedeniyle indirilemeyen POM/JAR'ların elle toplandığı
bölgedir. Başka makinelerde klasör olmadığından bu ayar etkisizdir.

## Kopya temizliği (alan yeniden gerekirse)

Ara ürünler güvenle silinebilir; yalnızca yeniden derleme süresi uzar:

- `android/app/build/intermediates/cxx` (C++ obj)
- `node_modules/*/android/build` (modül ara çıktıları)
- `$GRADLE_USER_HOME/caches/9.4.1/transforms` (transform cache)

`apk/Gokalp_Buyuyor-v1.0.0-release.apk` derlenen nihai çıktının kopyasıdır.
