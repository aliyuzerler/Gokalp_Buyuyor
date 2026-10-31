# Faz 03 — Manuel yedekleme ve geri yükleme

## Test promptu

Faz uygulamasından sonra aşağıdaki senaryoları çalıştır. Eksik test yaz, testleri çalıştır ve başarısız olanları düzelt. Sonra kapsam dışına taşmadan faz raporuna test sonuçlarını ekle.

- [ ] 1. Empty DB yedeği oluşturulabiliyor.
- [ ] 2. Yedek ZIP olarak açılabiliyor ve manifest doğru.
- [ ] 3. Manifest `encrypted:false`.
- [ ] 4. DB snapshot içindeki kayıtlar canlı DB ile aynı.
- [ ] 5. WAL açıkken snapshot bütünlüğü doğrulanıyor.
- [ ] 6. Yedek farklı temiz kurulumda restore ediliyor.
- [ ] 7. Restore sonrası profil ve schema version doğrulanıyor.
- [ ] 8. Bozuk ZIP, eksik manifest, hash mismatch, `../` path ve bilinmeyen schema testleri mevcut DB'yi değiştirmiyor.
- [ ] 9. Export kullanıcı tarafından iptal edildiğinde başarı mesajı gösterilmiyor.
- [ ] 10. Android dosya kaydetme akışı test edildi; iOS Files akışı macOS/iOS ortamında test edilmiş veya blocker yazılmış.
- [ ] 11. Şifresiz yedek uyarısı görünüyor; parola istemiyor.
- [ ] 12. Düşük disk alanı ve uygulama kapanması senaryosu ele alındı.

## Test raporu

`docs/phases/03/PHASE_REPORT.md` oluştur. Her madde için PASS/FAIL/BLOCKED ve kanıt/komut yaz. Sonraki faza geçme.
