# Kullanıcı Kılavuzu — Gökalp Büyüyor

Bu kılavuz, uygulamanın günlük kullanımını ve **telefon değişimi / silinme durumunda yedekten dönüş** akışını anlatır.

## 1. İlk kurulum

1. Uygulamayı açın; **Kurulumu başlat** ile Gökalp'in adını ve doğum tarihini (YYYY-MM-DD) girin.
2. Ana sayfa artık yaşını ("9 ay 13 gün" biçiminde) ve hızlı ekleme butonlarını gösterir.
3. Bilgileri sonra değiştirmek için: **Arşiv → Profil ve Ayarlar**.

## 2. Günlük kayıtları

- **Günlük** sekmesi → **＋ Yeni kayıt**. Tür seçin: Gözlem, Anı, İlk, Söz, Düşünce, Not.
- Olay tarihini geçmiş bir gün olarak girebilirsiniz (telefona sonradan hatırladıklarınızı ekleyebilirsiniz).
- Etiketler (örn. `banyo`, `baba`) ve gelişim alanı seçimi opsiyoneldir.
- Kayıt kartına dokununca detay açılır: favori yapma, düzenleme, silme (onaylı) ve **fotoğraf/video ekleme**.
- Arama ve filtreler: listenin üstündeki arama kutusu, tür/alan çipleri ve tarih aralığı birlikte kullanılabilir.

## 3. Gelişim gözlemleri

- **Gelişim** sekmesinde 10 alan vardır. Alan içinden beceri seçin.
- Beceri detayında **Gözlem ekle** ile tarih + durum ("Henüz denemedik / Birlikte deniyoruz / Bazen / Sıklıkla / Emin değilim") + not ekleyin.
- Her gözlem geçmişe **eklenir**; eski gözlemler asla silinmez. Puan veya değerlendirme yoktur.

## 4. Rehber ve etkinlikler

- **Rehber** sekmesinde yaşa ve kategoriye göre filtrelenen etkinlikler vardır (tamamı yerel içerik, internet gerekmez).
- Etkinlik detayında malzeme, adım, süre, **güvenlik notları** ve kaynak görürsünüz.
- **Etkinliği planla** ile tarih seçip isterseniz hatırlatma kurun (bildirim izni yalnızca bu adımda sorulur).
- Gün geldiğinde planı açıp **Tamamlandı** diyerek ebeveyn gözlem notu ve fotoğraf ekleyin; tamamlanan oturumlar zaman çizelgesine düşer.

## 5. Arşiv

- **Zaman çizelgesi**: günlük kayıtları, beceri gözlemleri ve etkinlik oturumları tek kronolojide.
- **İlgi alanları**: Gökalp'in merak ettiklerini siz tanımlarsınız (pasifleştirince veri korunur).
- **Medya arşivi**: uygulama içine kopyalanmış tüm fotoğraf/videolar.
- **Arşiv özeti**: yalnızca sayı ve tarih aralığı gibi betimleyici bilgi.

## 6. Yedek alma (ÖNEMLİ)

1. **Arşiv → Yedekleme ve Geri Yükleme → Yedek oluştur**.
2. Uygulama `Gokalp_Buyuyor_YYYY-MM-DD_HH-mm.gokalpbackup` dosyasını hazırlar ve paylaşım/klasör seçimini açar.
3. Dosyayı **Downloads'a veya Drive'a** kaydedin, ardından bilgisayar/harici diske **elle kopyalayın**.
4. ⚠️ **Bu dosya şifrelenmez** ve tüm anılarınızı içerir; güvenli bir yerde saklayın.

## 7. Telefon değişimi / uygulama silinmesi — yedekten dönüş

1. Yeni telefonda uygulamayı kurun (aynı sürüm veya daha yenisi).
2. **Arşiv → Yedekleme ve Geri Yükleme → Yedekten geri yükle**.
3. `.gokalpbackup` dosyasını seçin ve **"Evet, geri yükle"** ile onaylayın.
4. Uygulama dosyayı doğrular (manifest + SHA-256 + veritabanı bütünlüğü) ve **mevcut verilerin tamamını** yedektekiyle değiştirir (birleştirme yapmaz).
5. Doğrulama başarısızsa mevcut verinize **dokunulmaz**; hata mesajını okuyun.

## 8. Sık sorulanlar

- **İnternet gerekir mi?** Hayır. Tüm temel özellikler çevrimdışı çalışır.
- **Verilerim nerede?** Yalnızca telefonun uygulama özel alanında (veritabanı + medya klasörü).
- **Uygulamayı silersem ne olur?** Veriler de silinir. Düzenli yedek almanız önerilir (örn. ayda bir).
- **İkinci çocuk ekleyebilir miyim?** İlk sürüm tek profil içindir; veri modeli ileride genişlemeye uygundur.
