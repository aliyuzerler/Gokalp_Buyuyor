# Manuel Yedekleme ve Geri Yükleme

## 1. Ürün kararı

Kullanıcı özel güvenlik katmanı istemiyor. Bu nedenle yedek normal, şifresiz ZIP olacaktır. Yedek veritabanı ve fotoğraf/video dosyalarını içerir. Uygulama dosyayı internet üzerinden hiçbir yere göndermez. Kullanıcı dosyayı harici diske manuel kopyalar.

Yedek içeriği kişisel fotoğraf, video ve aile notları barındırabileceği için uygulama dışa aktarma öncesinde “Bu dosya şifrelenmez; güvenli bir yerde saklayın.” uyarısı gösterir. Uygulama ekstra parola veya şifreleme zorunluluğu getirmez.

## 2. Yedek yapısı

Dosya adı:
`Gokalp_Buyuyor_YYYY-MM-DD_HH-mm.gokalpbackup`

`.gokalpbackup` ZIP formatındaki dosyadır.

```text
backup.gokalpbackup
  manifest.json
  database/
    gokalp.sqlite
  media/
    images/...
    videos/...
  metadata/
    export-info.json
```

`manifest.json` örneği `examples/backup-manifest.example.json` içindedir.

Manifest en az şunları içerir:
- format name ve format version.
- app version.
- database schema version.
- export timestamp.
- her dosyanın relative path, byte size ve SHA-256 özeti.

SHA-256 yalnızca dosya bütünlüğü kontrolüdür; şifreleme değildir.

## 3. Yedek alma algoritması

1. Kullanıcı “Yedek oluştur” seçer.
2. Uygulama tahmini toplam boyutu ve şifresiz yedek uyarısını gösterir.
3. SQLite desteklenen tutarlı snapshot yöntemiyle staging'e alınır. WAL açıkken yalnızca ana `.sqlite` dosyasını kopyalama yapılmaz.
4. Medya dosyaları staging'e kopyalanır.
5. Tüm dosyalar için boyut ve SHA-256 hesaplanır.
6. Manifest oluşturulur.
7. İçerik ZIP'e yazılır.
8. ZIP yeniden açılarak central directory/entry kontrolü yapılır.
9. Platform dosya kaydetme/share API'si açılır.
10. Kullanıcının seçtiği Files/Downloads/harici depolama konumuna kopyalanır.
11. Başarı ve dosya adı gösterilir; staging temizlenir.

Not: SQLite'ın gerçek backup API'si kurulu `expo-sqlite` sürümünde desteklenmiyorsa güvenli bir yöntem seçilmelidir: transaction/backup desteği veya DB bağlantısını düzgün checkpoint + close edip dosyayı kopyalama. Sadece `.sqlite` ana dosyasını WAL aktifken kopyalamak kabul edilmez.

## 4. Geri yükleme algoritması

1. Kullanıcı dosya seçiciden `.gokalpbackup` seçer.
2. ZIP staging alanına açılır.
3. Absolute path, `../`, symlink ve beklenmeyen dosya yolları reddedilir.
4. Manifest formatı ve desteklenen sürüm doğrulanır.
5. Her dosya boyutu ve SHA-256 kontrol edilir.
6. SQLite `PRAGMA quick_check` ve schema version doğrulanır.
7. Restore öncesi mevcut veri geçici emniyet staging kopyasına alınır.
8. DB ve medya staging alanından uygulama alanına taşınır.
9. Repository/DB yeniden açılır; profil ve kayıt sayıları doğrulanır.
10. Başarıda geçici kopya uygun süre sonra temizlenir; başarısızlıkta önceki durum geri konur.

## 5. Uyumluluk

- Backup format version ile DB schema version ayrıdır.
- Eski backup formatı desteklenmiyorsa sessizce içe aktarma yapılmaz.
- Gelecek schema sürümünden gelen backup, eski uygulamada reddedilir.
- Restore mevcut veri üzerine birleştirme yapmaz; v1'de tam geri yükleme yapar ve kullanıcıdan açık onay ister.
- Restore başlamadan önce “Mevcut uygulama verileri bu yedekteki verilerle değiştirilecek.” mesajı gösterilir.

## 6. Manuel hard disk iş akışı

Android: sistem dosya kaydetme seçicisi (SAF/Create Document) veya uygun paylaşım hedefi.  
iOS: Files uygulamasına kaydetme veya sistem paylaşım sayfası. Kullanıcı daha sonra dosyayı USB/harici disk veya bilgisayara kopyalar.

Uygulama harici diskin bağlı olduğunu varsaymaz ve otomatik kopya yaptığını iddia etmez.

## 7. Testler

- Boş arşiv yedeği.
- Metin kayıtları içeren yedek.
- Fotoğraf ve büyük video içeren yedek.
- Aynı yedeği temiz kurulumda restore.
- Bozuk ZIP.
- Manifest eksik.
- Hash uyuşmazlığı.
- `../` path injection.
- Bilinmeyen schema version.
- Restore sırasında uygulamanın kapanması.
- Depolama alanı yetersizliği.
- Kullanıcı export picker'ı iptal eder.
- Eski veri restore hatası halinde korunur.
