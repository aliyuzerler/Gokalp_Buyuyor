# Faz 07 — Fotoğraf ve video arşivi

## Uygulama promptu

Fotoğraf/video seçme ve yerel kopyalama özelliğini uygula.

Yapılacaklar:
- Android/iOS system picker ile medya seçimi.
- Seçilen dosyayı app-private media path içine kopyala.
- DB'de relative_path, mime, size, dimensions, duration, captured_at metadata.
- Journal record ve activity session için medya ilişkilendirme.
- Thumbnail üretimi destekleniyorsa ekle; üretilemiyorsa kontrollü fallback göster.
- Dosya boyutu sınırı konfigüre edilebilir ve kullanıcıya açıklanır.
- Video işleme bellek dostu olmalı.
- Medya galerisi ve kayıt detayı medya görüntüleme.
- Silme akışında ilişki/asset/file tutarlılığı.
- Büyük medya import edilirken progress ve cancel.
- Kişisel gerçek fotoğrafları repo/test fixture'a ekleme.

## Genel talimat

`AGENTS.md` kurallarına uy. Yalnızca bu fazı yap. Test edilmemiş davranışa tamamlandı deme. Faz raporunu oluştur ve dur.
