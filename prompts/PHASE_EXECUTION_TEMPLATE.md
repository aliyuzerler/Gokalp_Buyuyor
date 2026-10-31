# Faz Uygulama Şablonu

Şu an yalnızca belirtilen fazın `IMPLEMENTATION_PROMPT.md` dosyasını uygula.

1. `AGENTS.md`, `PROJECT_CONTEXT.md`, ilgili docs ve önceki phase report dosyalarını oku.
2. Mevcut repo durumunu incele; önceki faz davranışlarını bozma.
3. İşi küçük adımlara ayır; ilgili kodu uygula.
4. Gerekli migration, seed, test ve belge güncellemelerini ekle.
5. İlgili `TEST_PROMPT.md` için test koşullarını hazırla; ancak implementation aşamasında faz dışına taşma.
6. Lint, typecheck ve testleri çalıştır.
7. `docs/phases/NN/PHASE_REPORT.md` dosyasını oluştur.
8. Sonraki fazı başlatma. Sonuç raporla ve dur.

Eksik ürün kararı varsa mevcut karar belgelerini esas al. Kullanıcıya tekrar sorulmadan ilerlenebilecek ayrıntılarda makul ve geri alınabilir teknik varsayım yap; varsayımı rapora yaz.
