# Faz 09 — Bütünleştirme, erişilebilirlik ve yayın hazırlığı

## Uygulama promptu

Tüm modülleri son kullanıcı akışında bütünleştir ve yayın öncesi QA yap.

Yapılacaklar:
- İlk kurulumdan yedek restore'a kadar uçtan uca smoke test.
- Accessibility label, font scaling, kontrast, dinamik font ve screen reader kontrolleri.
- Küçük Android telefon ve iPhone ekran boyutlarında layout.
- App background/foreground ve düşük bellek senaryoları.
- DB migration eski sürümden güncel sürüme test.
- Backup format version ve restore regresyon.
- Uygulama silinmesi/yeniden kurulumda yedekten geri dönüş kullanıcı dokümantasyonu.
- Offline doğrulama: airplane mode ile ana akışlar.
- Console warning ve unhandled promise temizliği.
- App config, icon, splash ve mağaza öncesi metinler.
- Privacy açıklaması: hesap/backend yok; yedek şifresizdir; kullanıcı manuel saklar.
- `README.md` ve kullanıcı kılavuzu son haline getir.
- Android release build. iOS release build yalnızca uygun macOS/Xcode ortamında.

## Genel talimat

`AGENTS.md` kurallarına uy. Yalnızca bu fazı yap. Test edilmemiş davranışa tamamlandı deme. Faz raporunu oluştur ve dur.
