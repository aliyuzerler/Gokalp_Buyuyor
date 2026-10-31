# Test Stratejisi

## 1. Katmanlar

- Unit: tarih/yaş hesaplama, doğrulama, use-case, mapper, backup manifest.
- Repository/integration: SQLite CRUD, foreign keys, migration, transaction.
- Component: form, liste, boş/hata durumları, gezinme.
- E2E: onboarding, günlük, beceri gözlemi, etkinlik, backup/restore.
- Platform smoke: Android gerçek cihaz/emülatör; iOS simülatör/gerçek cihaz (build ortamı mevcutsa).

## 2. Kritik regresyon senaryoları

1. Uygulama yeniden açıldığında veriler kalır.
2. Doğum tarihi 29 Şubat ve ay sonu yaş hesabı test edilir.
3. Eski tarihli günlük eklenir ve doğru yerde görünür.
4. Beceri gözlemi geçmiş kayıtları silmez.
5. Seed içerikleri tekrar açılışta çoğalmaz.
6. Medya dosyası DB kaydıyla tutarlıdır.
7. Silinen kayda ait medya orphan kalmaz veya cleanup listesine eklenir.
8. Backup WAL açıkken tutarlı snapshot verir.
9. Backup restore yeni kuruluma taşınır.
10. Bozuk/zararlı ZIP mevcut veriyi değiştirmez.
11. Export iptal edilirse sahte başarı mesajı verilmez.
12. Offline modda tüm temel özellikler çalışır.

## 3. Test verisi

Gerçek çocuk verisi veya aile fotoğrafı test fixture'ı olarak repoya konmaz. Sentetik Gökalp kayıtları ve royalty-free/placeholder medya kullanılır.

## 4. Raporlama

Her faz sonunda `docs/phases/NN/PHASE_REPORT.md` oluştur:
- Yapılanlar.
- Değişen dosyalar.
- Çalıştırılan komutlar.
- Test sonuçları.
- Android/iOS durumu.
- Bilinen hatalar/riskler.
- Sonraki faza notlar.
