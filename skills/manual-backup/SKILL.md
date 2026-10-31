# Skill: Manual Unencrypted Backup / Restore

## Sabit gereksinim

Yedek kullanıcının başlattığı şifresiz ZIP'tir. Şifre sorulmaz. Yedek kullanıcı tarafından harici diske manuel kopyalanır.

## Export

- DB tutarlı snapshot olmalı. WAL kullanılıyorsa yalnızca ana DB dosyasını canlı halde kopyalama.
- Media dosyalarını relative path ile arşive ekle.
- Manifest'te schema/format/app sürümü ve dosya SHA-256 değerleri bulunsun.
- SHA-256 şifreleme değildir; bozulma tespitidir.
- Arşivi export etmeden önce yeniden açıp doğrula.
- Android SAF ve iOS Files akışını destekle.
- İptal ve disk alanı hatalarını doğru ele al.

## Restore

- ZIP slip/path traversal engelle.
- Beklenen dosyalar dışında dosyaları reddet veya açıkça raporla.
- Manifest/hash/DB quick_check/schema sürümünü doğrula.
- Önce staging'e aç.
- Mevcut veriyi restore bitene kadar değiştirme.
- Hata halinde rollback yap.
- Restore öncesi mevcut verinin emniyet kopyasını oluştur.
- Restore işlemi mevcut verinin yerine geçer; merge yok.

## UX metni

“Bu yedek şifrelenmez. Fotoğraflar, videolar ve kişisel notlar içerir. Dosyayı güvenli bir yerde saklayın.”
