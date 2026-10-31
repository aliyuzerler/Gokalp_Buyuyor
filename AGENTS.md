# AGENTS.md — Gökalp Büyüyor

## 1. Ürün amacı

Gökalp Büyüyor, ebeveynin Gökalp'in 0–18 yaş arasındaki anılarını, günlük gözlemlerini, ilgi alanlarını, beceri gözlemlerini ve birlikte yapılan etkinlikleri yerel olarak kaydedip zaman içinde incelemesini sağlayan Türkçe mobil uygulamadır.

Bu uygulama klinik gelişim taraması, tıbbi teşhis, tedavi, gelişim geriliği tespiti veya çocuklar arası kıyaslama aracı değildir. Gözlem durumları yalnızca ebeveyn notlarıdır.

## 2. Kesin ürün kararları

- Android ve iOS desteklenir.
- React Native + Expo + TypeScript kullanılır.
- Uygulama local-first ve offline-first çalışır.
- Kalıcı uygulama verisi SQLite veritabanında saklanır.
- **Standart SQLite kullanılır; SQLCipher ve veritabanı şifrelemesi eklenmez.**
- Fotoğraf/video uygulamanın özel dosya alanına kopyalanır; dosya düzeyinde özel şifreleme yapılmaz.
- Uygulama PIN'i, biyometrik kilit, parola yöneticisi veya ek şifreleme katmanı MVP kapsamı dışındadır.
- Sunucu, kullanıcı hesabı, bulut senkronizasyonu, Supabase, Firebase, reklam, analytics ve remote AI yoktur.
- Yedekleme kullanıcı tarafından başlatılır. Veritabanı + medya + manifest içeren **şifresiz ZIP** oluşturulur.
- Kullanıcı bu ZIP'i Android dosya seçicisi/ paylaşım akışı veya iOS Files üzerinden dışarı aktarır ve harici diske manuel kopyalar.
- Yedekleme otomatik buluta yüklenmez. Yedeğin gizliliği ve saklanması kullanıcının sorumluluğundadır.
- Rehber ve etkinlik içerikleri uygulama içinde gelir; internet şartı yoktur.
- İlk sürümde tek çocuk profili bulunur. Veri modeli gereksiz yere tek profile sabitlenmez.
- İlk dil Türkçedir. Metinler i18n yapısına uygun tutulur.

## 3. Teknoloji kararları

- React Native, Expo, TypeScript.
- Expo Router ile navigasyon.
- Expo SQLite ile standart SQLite.
- Expo FileSystem ile uygulamaya özel dosya saklama ve dışa aktarma staging alanı.
- Expo ImagePicker/Camera ile medya seçimi.
- Expo Notifications ile yerel hatırlatmalar.
- Zod ile form, yedek manifesti ve içe aktarma doğrulaması.
- Kalıcı veri kaynağı SQLite'dır; Zustand/Context yalnızca geçici UI state içindir.
- Tarihler ISO 8601 biçiminde saklanır. Doğum tarihi `YYYY-MM-DD` tarih-only biçimindedir.
- Para birimi/ölçüm gibi özellikler yoksa gereksiz alan eklenmez.

Paket yüklerken Expo SDK uyumlu sürümleri `npx expo install` ile seç. Önce mevcut `package.json`, Expo SDK ve native proje durumunu incele. Sürüm numaralarını tahmin ederek uyumsuz bağımlılık kurma.

## 4. Mimari kurallar

- Ekranlar SQL sorgusu çalıştırmaz. UI → hook/use-case → repository → SQLite akışı kullanılır.
- SQLite erişimi tek yerde merkezileştirilir.
- Şema migration'ları numaralı, tekrarlanabilir ve test edilebilir olmalıdır.
- Her kayıtta `id`, `created_at`, `updated_at` alanları uygun olduğunda bulunur.
- Silme işlemleri ilişkili dosya/veri için tutarlı yürütülür. Kullanıcıya geri döndürülemez dosya silme öncesi açık onay gösterilir.
- Dosya yolları mutlak değil, uygulama medya köküne göre relative path olarak DB'de saklanır.
- Büyük video dosyaları JS belleğine bütünüyle okunmaz.
- Backup sırasında canlı SQLite dosyası, WAL açıkken körlemesine kopyalanmaz. Desteklenen SQLite backup/checkpoint/close yaklaşımı kullanılır ve test edilir.
- Restore önce geçici alana açılır; manifest, dosya listesi, şema sürümü ve DB bütünlüğü doğrulanır. Başarısızsa mevcut veri değiştirilmez.
- Yerel saat ve tarih gösterimi kullanıcı dostu olur; olay zamanı ile kaydın oluşturulma zamanı ayrıdır.

## 5. Tasarım kuralları

- Sıcak, doğal, sakin, aile günlüğü hissi.
- Kırık beyaz/krem ana zemin, toprak ve adaçayı tonları, yumuşak yüzeyler.
- Çocuk odaklı aşırı çizgi film dili yok; ebeveyn için premium ve sade.
- Büyük dokunma alanları, okunabilir metin, erişilebilir kontrast.
- Ana ekrandan hızlı not/anı ekleme en fazla 2–3 etkileşimde yapılabilmeli.
- Boş durumlar açıklayıcı ve teşvik edici olmalı; suçlayıcı dil kullanılmamalı.
- Beceri durumları puan veya başarı seviyesi gibi sunulmaz.

## 6. İçerik ve çocuk gelişimi güvenliği

- Uygulama teşhis koymaz ve klinik değerlendirme üretmez.
- Gelişim basamakları kesin son tarihler değildir; çocuklar arasında değişkenlik vurgulanır.
- Etkinliklerde yaşa uygun güvenlik uyarısı, yetişkin gözetimi ve boğulma/yaralanma riskleri dikkate alınır.
- Kaynak gösterilemeyen tıbbi/klinik iddialar yazılmaz.
- Acil sağlık, beslenme tedavisi, ilaç veya tanı tavsiyesi üretilmez.
- Rehber kaydında kaynak adı/URL, içerik sürümü ve gözden geçirme tarihi tutulur.

## 7. Skill dosyalarını kullanma

İlgili iş üzerinde çalışırken uygun skill dosyasını oku ve uygula:
- Ürün/kapsam: `skills/product-definition/SKILL.md`
- Expo/local-first: `skills/expo-local-first/SKILL.md`
- Yedekleme/restore: `skills/manual-backup/SKILL.md`
- Rehber/çocuk gelişimi içeriği: `skills/child-development-content/SKILL.md`

## 8. Geliştirme disiplini

- Bir seferde yalnızca istenen fazı uygula.
- Faz kapsamı dışına taşma. Sonraki faz için gerekli notları `docs/DECISIONS.md` veya faz raporuna yaz.
- Var olan çalışan kodu sebepsiz yere yeniden yazma.
- TODO yerine uygulanabilir kod yaz; mock/stub gerekiyorsa açıkça işaretle.
- Her faz sonunda ilgili `TEST_PROMPT.md` talimatlarını çalıştır ve `docs/phases/NN/PHASE_REPORT.md` oluştur.
- Testleri çalıştırmadan “tamamlandı” deme.
- Platforma özgü kod gerekiyorsa Android ve iOS davranışlarını ayrı doğrula.
- Hata halinde hatayı saklama; yeniden üretim adımı, kök neden ve çözüm yaz.
- Veri şeması değişikliğinde migration ve migration testi zorunludur.

## 9. Kod kalitesi

- TypeScript strict mode açık olmalı.
- `any` kullanımından kaçın; gerekirse gerekçelendir.
- İş mantığı ekran bileşenlerine gömülmez.
- Form girdileri doğrulanır.
- Kullanıcıya görünen metinler merkezi metin/i18n dosyalarında tutulur.
- Bileşenler küçük, tek sorumluluklu ve tekrar kullanılabilir olmalıdır.
- Hata durumları kullanıcıya Türkçe, teknik loglar geliştiriciye anlaşılır biçimde sunulur.

## 10. Definition of Done

Bir faz ancak:
1. Faz kapsamındaki özellikler çalışıyorsa,
2. Android derlemesi/çalışması doğrulanmışsa,
3. iOS derlemesi/çalışması mümkün olan ortamda doğrulanmış veya açıkça blocker raporlanmışsa,
4. İlgili birim/entegrasyon testleri geçmişse,
5. `docs/phases/NN/PHASE_REPORT.md` yazılmışsa,
6. Sonraki faz için bilinen riskler kaydedilmişse

tamamlanmış sayılır.
