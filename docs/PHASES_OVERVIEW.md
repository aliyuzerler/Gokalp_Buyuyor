# Faz Planı

Her faz için `IMPLEMENTATION_PROMPT.md` ve `TEST_PROMPT.md` bulunur. Sırayı koru; bir faz test edilmeden sonrakine geçme.

| Faz | Başlık | Teslimat |
|---|---|---|
| 00 | Repo ve Expo başlangıcı | Çalışan Expo + TypeScript iskeleti |
| 01 | Tema, navigasyon ve onboarding | Sıcak tasarım sistemi, sekmeler, Gökalp profili akışı |
| 02 | SQLite ve profil | Migration altyapısı, repository, profil ve yaş hesaplama |
| 03 | Manuel yedekleme | Şifresiz ZIP export/restore ve bütünlük kontrolü |
| 04 | Günlük ve zaman çizelgesi | Günlük CRUD, etiket/favori, timeline |
| 05 | Gelişim ve beceri gözlemi | Alanlar, beceriler, tarihli gözlemler |
| 06 | Rehber ve etkinlik yönetimi | Yerel etkinlik kütüphanesi, planlama ve oturum |
| 07 | Medya arşivi | Fotoğraf/video seçme, uygulama alanına kopyalama ve kayıt bağlama |
| 08 | İlgi alanları, arama ve hatırlatmalar | Kişisel ilgi alanı, filtreler, yerel bildirimler |
| 09 | Bütünleştirme ve yayın hazırlığı | Erişilebilirlik, performans, regresyon, Android/iOS QA |

## Faz kapısı

Bir fazın test raporu ve `PHASE_REPORT.md` tamamlanmadan sonraki faz başlamaz. Fazda iOS testi için macOS bulunmuyorsa bu açıkça blocker/untested olarak kaydedilir; başarılıymış gibi işaretlenmez.
