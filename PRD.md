# Ürün Gereksinimleri (PRD)

**Ürün:** Gökalp Büyüyor  
**Sürüm:** 1.1  
**Platform:** Android + iOS  
**Hedef dönem:** 0–18 yaş  
**Ürün modeli:** Tek kullanıcı, local-first, offline-first

## 1. Vizyon

Gökalp'in büyürken keşfettiklerini, öğrendiklerini, ilgi alanlarını, aile anılarını ve ebeveyn gözlemlerini tek bir kişisel arşivde biriktirmek. Uygulama ebeveyne yaşa uygun etkinlik ve rehber içeriği sunar; çocuğu puanlamaz veya başka çocuklarla karşılaştırmaz.

## 2. Temel kullanıcı

Uygulamanın sahibi ebeveynidir. İlk sürüm tek telefon ve tek çocuk profili (Gökalp) için geliştirilir. Uygulamanın tam işlevi internet bağlantısı olmadan kullanılabilir.

## 3. Kesin ürün kararları

- Android + iOS.
- Türkçe ilk dil.
- React Native + Expo + TypeScript.
- Expo Router.
- Standart SQLite; SQLCipher yok.
- Uygulama özel dosya alanında medya; ekstra dosya şifreleme yok.
- Uygulama PIN'i/biyometrik kilit yok.
- Hesap, backend, bulut, senkronizasyon, Firebase, Supabase, analytics, reklam ve uzaktaki AI yok.
- Kullanıcı istediğinde veritabanı ve medyayı tek şifresiz ZIP yedek olarak dışarı aktarır.
- Yedek Android dosya seçici/SAF veya iOS Files paylaşım akışıyla dışarı verilir; kullanıcı harici diske manuel kopyalar.
- İlk sürümde şifreli yedek yok. UI bu davranışı açıkça söyler: “Bu yedek şifrelenmez. Güvenli bir yerde saklayın.”
- Restore içe aktarma öncesi mevcut veriyi silmeden doğrulama ve geçici staging yapar.

## 4. Ana navigasyon

Alt sekmeler:
1. Ana Sayfa
2. Günlük
3. Gelişim
4. Rehber
5. Arşiv

Ayarlar, profil ve yedekleme ana sayfa üst menüsü veya Arşiv/Ayarlar içinden erişilir.

## 5. Modüller

### 5.1 İlk kurulum ve profil
- Çocuk adı (varsayılan metin Gökalp; kullanıcı değiştirebilir).
- Doğum tarihi (zorunlu).
- İsteğe bağlı profil fotoğrafı.
- Saat dilimi varsayılan Europe/Istanbul.
- Yaş doğum tarihinden takvim hesabıyla hesaplanır; sabit 30 gün/ay yaklaşımı kullanılmaz.

### 5.2 Ana sayfa
- Profil selamlaması.
- Yaş: yıl/ay/gün veya ay/gün biçimi.
- Hızlı ekle: not, anı, fotoğraf, beceri gözlemi.
- Son günlük kayıtları.
- Devam eden/planlanan etkinlikler.
- Yaşa göre seçilmiş rehber önerisi.
- Veri yedekleme durumuna kısayol.

### 5.3 Günlük ve anılar
Kayıt türleri: observation, memory, first_event, quote, reflection, free_note.
Alanlar: başlık, içerik, olay tarihi, oluşturma zamanı, gelişim alanı, etiketler, favori, medya ekleri.
Kayıt tarihi ile oluşturma tarihi ayrı tutulur.

### 5.4 Zaman çizelgesi
Günlük kayıtları, beceri gözlemleri ve etkinlik oturumlarını tarih sırasıyla bir arada gösteren birleşik görünüm. Her olay türü kendi detay ekranına açılır.

### 5.5 Gelişim merkezi
İlk kategoriler:
- Motor beceriler.
- Dil ve iletişim.
- Bilişsel gelişim ve keşif.
- Sosyal-duygusal gelişim.
- Duyusal keşif.
- Günlük yaşam ve öz bakım.
- Yaratıcılık ve sanat.
- Öğrenme ve problem çözme.
- Sosyal yaşam ve sorumluluk.
- İlgi alanları ve hobiler.

Beceri gözlem durumları: Henüz denemedik, Birlikte deniyoruz, Bazen gözlemliyorum, Sıklıkla gözlemliyorum, Emin değilim. Bunlar puan/teşhis değildir. Her gözlem tarihli ve eklenebilir geçmiş kayıt olarak tutulur.

### 5.6 Rehber ve etkinlik kütüphanesi
Etkinlik kartı: başlık, açıklama, yaş alt/üst ay sınırı (0–216), alan, amaç, malzemeler, adımlar, tahmini süre, güvenlik notları, gözetim gereksinimi, kaynak, sürüm ve son gözden geçirme tarihi.
İçerik yerel seed JSON/SQLite verisidir. Uygulama internetten içerik indirmez.

### 5.7 Etkinlik planlama
Durumlar: planned, completed, postponed, skipped. Plan için yerel bildirim opsiyoneldir. Tamamlanan etkinlikte ebeveyn gözlemi ve medya bulunabilir.

### 5.8 İlgi alanları
Serbest ad, açıklama, ilk gözlem tarihi, son gözlem tarihi, durum ve ilişkili notlar. Sistem çocuğa sabit yetenek tanımlamaz.

### 5.9 Medya
Fotoğraf/video cihaz seçicisinden alınır ve uygulamanın özel dosya alanına kopyalanır. DB'de göreli yol tutulur. Desteklenen tür ve boyut kontrolleri yapılır. Büyük video belleğe bütünüyle yüklenmez.

### 5.10 Yedekleme ve geri yükleme
- Kullanıcı tarafından başlatılır.
- Çıktı: `Gokalp_Buyuyor_YYYY-MM-DD_HH-mm.gokalpbackup` (ZIP container; normal, şifresiz).
- İçerik: `manifest.json`, SQLite DB, media klasörü, backup metadata.
- Manifestte uygulama sürümü, DB schema version, oluşturulma zamanı, dosya listesi, byte boyutları ve SHA-256 bütünlük özeti bulunur.
- SHA-256 şifreleme değildir; bozulma tespiti içindir.
- Yedek iOS Files/Share Sheet veya Android SAF/Create Document ile kullanıcı tarafından seçilen konuma aktarılır.
- Yedek dışa aktarımında şifresiz olduğu açıkça gösterilir.
- Restore önce staging alanına açar, ZIP path traversal ve beklenmeyen dosya engelleri kontrol edilir, manifest ve hash doğrulanır, SQLite `quick_check` ve schema uyumluluğu kontrol edilir.
- Mevcut DB/media restore başarılı olana kadar silinmez. Restore öncesi mevcut durumu geçici emniyet kopyası oluşturulur.
- Yedek uyumsuzsa kullanıcıya anlaşılır hata gösterilir.

## 6. MVP öncelikleri

P0:
- İlk kurulum/profil.
- Ana sayfa.
- SQLite/migrations/repository.
- Günlük CRUD.
- Zaman çizelgesi.
- Gelişim alanı ve beceri gözlemi.
- Yerel rehber ve etkinlikler.
- Etkinlik planlama/geçmiş.
- Manuel şifresiz yedek ve restore.

P1:
- Fotoğraf/video.
- Arama/filtreleme.
- Hatırlatmalar.
- İlgi alanları.
- Aylık/yıllık özet.

## 7. Kapsam dışı

Bulut/sunucu, hesap, sync, multi-parent editing, multi-child profile UI, ücretlendirme, reklam, uzaktan AI, sosyal paylaşım, gelişim puanı, tıbbi teşhis, şifreli yedek, SQLCipher, özel medya şifrelemesi, PIN ve biyometrik kilit.

## 8. Kabul kriterleri

- Uygulama ilk açılışta çevrimdışı çalışır.
- Profil ve günlük kayıtları uygulama kapanıp açılınca korunur.
- Tarihi geçmişe dönük anı eklenebilir.
- Kayıtlar zaman çizelgesinde doğru sıralanır.
- Beceri geçmişi önceki gözlemleri silmez.
- Rehber yaş ve kategoriye göre filtrelenir.
- Medya uygulama klasörüne kopyalanır ve doğru kayıtla ilişkilendirilir.
- Şifresiz ZIP yedek alınır ve farklı kurulumda geri yüklenebilir.
- Hatalı yedek mevcut veriyi bozmaz.
- Uygulamanın hiçbir temel özelliği internet gerektirmez.
