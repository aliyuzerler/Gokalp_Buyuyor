# Faz 08 — İlgi alanları, arama, filtreler ve hatırlatmalar

## Uygulama promptu

Arşiv kullanımını ve geri dönüş sıklığını artıran ikincil modülleri uygula.

Yapılacaklar:
- Interest areas ekle/düzenle/pasifleştir.
- İlk ve son gözlem tarihleri.
- Günlük metin araması; SQLite FTS5 destek ve Expo build uyumunu doğrula. Destek sorunu olursa indeksli LIKE arama fallback.
- Tür, tarih, gelişim alanı, etiket ve favori filtreleri.
- Yerel reminder CRUD ve notification schedule/cancel.
- Bildirim izin reddi ve OS ayarlarından kapatma senaryoları.
- Hatırlatma uygulama açılışında yeniden schedule doğrulaması.
- Arşiv istatistikleri yalnızca kayıt sayısı ve tarih aralığı gibi betimleyici bilgi; gelişim skoru yok.

## Genel talimat

`AGENTS.md` kurallarına uy. Yalnızca bu fazı yap. Test edilmemiş davranışa tamamlandı deme. Faz raporunu oluştur ve dur.
