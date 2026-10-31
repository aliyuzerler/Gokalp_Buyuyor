# Faz 02 — SQLite, migration ve profil

## Test promptu

Faz uygulamasından sonra aşağıdaki senaryoları çalıştır. Eksik test yaz, testleri çalıştır ve başarısız olanları düzelt. Sonra kapsam dışına taşmadan faz raporuna test sonuçlarını ekle.

- [ ] 1. İlk açılış DB ve tabloları oluşturuyor.
- [ ] 2. Migration ikinci çalıştırmada hata vermiyor.
- [ ] 3. Seed kategoriler tekrar tekrar çoğalmıyor.
- [ ] 4. Profil kaydı uygulama kapanıp açıldığında korunuyor.
- [ ] 5. Hatalı doğum tarihi reddediliyor.
- [ ] 6. Yaş hesabı 9 aylık örnek, ay sonu, 29 Şubat ve doğum günü sınırlarıyla unit test edildi.
- [ ] 7. Repository testleri CRUD ve foreign key davranışlarını doğruluyor.
- [ ] 8. `PRAGMA foreign_keys` açık ve schema version okunabiliyor.
- [ ] 9. Typecheck/lint ve Android smoke test geçiyor.

## Test raporu

`docs/phases/02/PHASE_REPORT.md` oluştur. Her madde için PASS/FAIL/BLOCKED ve kanıt/komut yaz. Sonraki faza geçme.
