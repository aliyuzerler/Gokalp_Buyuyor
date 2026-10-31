# Faz 02 — SQLite, migration ve profil

## Uygulama promptu

Standart SQLite kullanan kalıcı veri katmanını oluştur. SQLCipher ekleme.

Yapılacaklar:
- `expo-sqlite` kurulumunu Expo SDK uyumlu yap.
- DB singleton/connection manager, migration runner ve repository pattern oluştur.
- `docs/DATABASE_SCHEMA.md` içindeki tabloları numaralı migration'lara böl. Hata toleransı ve foreign key açılışını uygula.
- Gerekli indeksleri ekle.
- Seed development areas ve rehber kategorilerini `templates/` JSON verisinden ekle; seed tekrar çalışınca çoğalmamalı.
- Child profile repository ve onboarding sonrası kalıcı profil kaydı.
- Doğum tarihinden takvim bazlı yaş hesaplama utility'si.
- Settings repository.
- DB version ve uygulama açılışında migration kontrolü.
- Tüm SQL parametreli olsun.
- Profil ekranında ad, doğum tarihi ve isteğe bağlı profil görseli alanı (görsel entegrasyonu Faz 7'de olabilir).

Bu fazda yedekleme yok; sonraki fazda yapılacak. Üründe tek Gökalp profili gösterilecek.

## Genel talimat

`AGENTS.md` kurallarına uy. Yalnızca bu fazı yap. Test edilmemiş davranışa tamamlandı deme. Faz raporunu oluştur ve dur.
