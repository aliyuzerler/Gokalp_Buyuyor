# Faz 06 — Rehber ve etkinlik yönetimi

## Uygulama promptu

Çevrimdışı ebeveyn rehberi ve etkinlik planlama modülünü uygula.

Yapılacaklar:
- Guide categories ve guide activities için seed loader.
- `templates/seed-activities.json` başlangıçta boş olabilir. Kaynaksız etkinlik doldurma.
- Aktivite listesi: yaş, kategori, gelişim alanı filtresi.
- Etkinlik detayında amaç, malzeme, adım, süre, güvenlik, gözetim ve kaynak göster.
- Etkinliği planla, tamamlandı, ertelendi, atlandı durumları.
- Tamamlanan etkinlik oturumu ve ebeveyn notu.
- Plan tarihi ve durumuna göre liste.
- Yerel bildirim altyapısının izin isteme akışını yalnızca kullanıcı hatırlatma oluşturduğunda başlat.
- Etkinlikler internet olmadan açılır.
- İçerik versiyonlama ve seed idempotency.

Rehber klinik tavsiye değildir. Gelişim aralığı kesin zorunlu hedef gibi sunulmaz.

## Genel talimat

`AGENTS.md` kurallarına uy. Yalnızca bu fazı yap. Test edilmemiş davranışa tamamlandı deme. Faz raporunu oluştur ve dur.
