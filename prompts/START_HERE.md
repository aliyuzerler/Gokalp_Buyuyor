# ZCode Başlangıç Promptu

Bu repodaki `AGENTS.md`, `PROJECT_CONTEXT.md`, `docs/` ve ilgili `skills/**/SKILL.md` dosyalarını proje için tek doğruluk kaynağı olarak kabul et. ZCode ortamı skill discovery destekliyorsa bu skill dosyalarını projeye tanıt; desteklemiyorsa ilgili fazda doğrudan oku.

**Görev:** Gökalp Büyüyor adlı Android+iOS mobil uygulamasını fazlar halinde geliştireceğiz. Önce mevcut çalışma alanını incele ve Faz 0'ı uygula. Tüm fazları tek seferde uygulama.

## Sabit ürün kararları

- React Native + Expo + TypeScript.
- Expo Router.
- Türkçe ilk sürüm.
- Local-first/offline-first.
- Standart SQLite. SQLCipher yok.
- Ek dosya şifreleme yok.
- Uygulama PIN'i/biometrik kilit yok.
- Backend, cloud, account, sync, Supabase/Firebase yok.
- Medya uygulamanın özel dosya alanında tutulur.
- Kullanıcı manuel yedek alır: şifresiz ZIP, DB + media + manifest.
- Yedek kullanıcının seçtiği yere aktarılır; harici diske kopyalama kullanıcı tarafından yapılır.
- Ürün teşhis veya klinik gelişim puanlaması yapmaz.

## Çalışma biçimi

1. İlk olarak repo/çalışma alanının mevcut durumunu incele.
2. İşletim sistemi, Node, package manager, Java/Android SDK, Expo CLI ve iOS build olanağını raporla.
3. Mevcut dosyaları silme veya üzerine yazma. Yeni/var olan repo için güvenli plan yap.
4. `docs/phases/00/IMPLEMENTATION_PROMPT.md` içindeki işi uygula.
5. Sadece Faz 0'ı tamamla. Sonraki fazlara geçme.
6. Test komutlarını çalıştır ve `docs/phases/00/PHASE_REPORT.md` yaz.
7. Bir blocker varsa uydurma; açıkla ve güvenli alternatif öner.

## Beklenen çıktı

- Expo + TypeScript uygulama iskeleti.
- Expo Router kurulumu.
- Lint/format/typecheck/test komutları.
- README'de gerçek kurulum/çalıştırma adımları.
- `PHASE_REPORT.md`.

Başlamadan önce bana 5–10 maddelik kısa keşif raporu sun; ardından Faz 0'ı uygula. Faz 1'e geçme.
