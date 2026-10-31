# Faz 03 — Manuel yedekleme ve geri yükleme

## Uygulama promptu

Şifresiz manuel yedekleme ve restore özelliğini uygula. Kullanıcının isteği doğrultusunda parola, SQLCipher, medya şifreleme veya uygulama kilidi ekleme.

Yapılacaklar:
- Backup formatı `gokalp-buyuyor-backup`, formatVersion 1.
- Dosya uzantısı `.gokalpbackup`; ZIP container.
- İçerik: manifest.json, database/gokalp.sqlite, media/ altındaki dosyalar.
- İlk sürümde medya henüz yoksa boş media klasörüyle çalışabilsin.
- Manifest: appVersion, schemaVersion, exportedAt, encrypted:false, dosyaların relative path/size/SHA-256 listesi.
- SHA-256 yalnızca bütünlük kontrolüdür; yedek şifrelenmez.
- SQLite tutarlı snapshot al. WAL açıkken yalnızca ana DB dosyasını kopyalama. Kurulu `expo-sqlite` sürümünün gerçek API'sini ve SQLite backup/checkpoint yaklaşımını doğrula.
- ZIP üretimi büyük dosyaları JS belleğine bütünüyle yüklememeli. Expo SDK/RN ile uyumlu, Android+iOS destekli dosya tabanlı/streaming çözümü araştır; gerekiyorsa native dev build ihtiyacını belgeleyip kullan.
- Android SAF/Create Document; iOS Files/share export akışını uygula.
- Restore dosya seçicisi, staging, path traversal koruması, manifest/hash kontrolü, DB `quick_check`, schema version kontrolü, önceki veriyi geçici koruma ve rollback.
- Restore tam geri yüklemedir; merge yoktur. Kullanıcıdan açık onay al.
- UI'da yedek şifrelenmediğini söyle; ekstra parola sorma.
- `docs/BACKUP_RESTORE.md` gerçekleşen implementasyonla aynı kalsın.

Bu faz bitmeden kişisel gerçek anı/fotoğraf verisi girilmesini önermiyoruz.

## Genel talimat

`AGENTS.md` kurallarına uy. Yalnızca bu fazı yap. Test edilmemiş davranışa tamamlandı deme. Faz raporunu oluştur ve dur.
