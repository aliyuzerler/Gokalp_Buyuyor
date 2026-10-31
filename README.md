# Gökalp Büyüyor — ZCode Başlangıç Paketi

**Ürün:** Gökalp Büyüyor  
**Sürüm:** 1.1  
**Platform:** Android + iOS  
**Mimari:** Local-first / offline-first  
**Dil:** Türkçe (ilk sürüm)  
**Hedef kullanım:** 0–18 yaş

Bu paket, ZCode ile uygulamayı kontrollü ve faz faz geliştirmek için hazırlanmıştır. Önce proje klasörüne çıkarın, sonra `AGENTS.md` ve `prompts/START_HERE.md` dosyalarını ZCode'a verin.

## Ürün kararları

- Veriler yalnızca telefonun uygulamaya özel yerel alanında saklanır.
- Sunucu, kullanıcı hesabı, bulut senkronizasyonu, Firebase, Supabase, reklam ve analitik yoktur.
- SQLite kullanılır; **SQLCipher kullanılmaz**.
- Fotoğraf ve videolar uygulamanın özel medya klasörüne kopyalanır; dosya düzeyinde ekstra şifreleme yoktur.
- PIN, biyometrik kilit ve özel şifreleme katmanı ilk sürüm kapsamı dışındadır.
- Kullanıcı uygulama içinden manuel yedek oluşturur. Yedek normal, şifresiz ZIP dosyasıdır; kullanıcı bunu USB/Files üzerinden harici diske kopyalar.
- Uygulama temel işlevleri internet olmadan çalışır.
- Uygulama çocuk gelişimi teşhisi koymaz, gelişimi puanlamaz ve çocukları karşılaştırmaz.

## Teknoloji önerisi

- React Native + Expo (development build / prebuild gerektiğinde) + TypeScript
- Expo Router
- `expo-sqlite` (standart SQLite, migration katmanı)
- `expo-file-system` (özel medya ve yedek staging alanı)
- `expo-image-picker` ve/veya `expo-camera`
- `expo-notifications` (yerel bildirimler)
- Zustand veya React Context (yalnızca geçici UI state; kalıcı veri SQLite)
- Zod (girdi ve içe aktarma doğrulaması)
- Jest + React Native Testing Library + mümkünse Maestro/Detox E2E

Paket sürümlerini kurulum anında birbiriyle uyumlu Expo SDK sürümüne göre seçin. Rastgele `latest` sürümleri bir araya getirmeyin. Expo Go, native gereksinimlerde nihai doğrulama ortamı değildir; development build kullanın.

## Başlangıç

1. Bu ZIP'i yeni ve boş bir proje klasörüne çıkarın.
2. `AGENTS.md` dosyasını ZCode proje bağlamına ekleyin.
3. `prompts/START_HERE.md` içindeki başlangıç promptunu ZCode'a gönderin.
4. ZCode'un önce repo ve geliştirme ortamını incelemesini, sonra yalnızca Faz 0'ı yapmasını isteyin.
5. Fazları sırayla uygulayın. Her fazdan sonra ilgili `TEST_PROMPT.md` dosyasını çalıştırmadan sonraki faza geçmeyin.
6. Mimari kararı değiştirmek gerekiyorsa `docs/DECISIONS.md` dosyasına gerekçesiyle kaydedin.

## Paket yapısı

```text
AGENTS.md
README.md
PROJECT_CONTEXT.md
docs/
  PRD.md
  ARCHITECTURE.md
  DATABASE_SCHEMA.md
  UI_UX.md
  BACKUP_RESTORE.md
  CONTENT_GUIDELINES.md
  TEST_STRATEGY.md
  DECISIONS.md
  phases/00...09/
skills/
  product-definition/SKILL.md
  expo-local-first/SKILL.md
  manual-backup/SKILL.md
  child-development-content/SKILL.md
prompts/
  START_HERE.md
  PHASE_EXECUTION_TEMPLATE.md
templates/
  seed-development-areas.json
  seed-activities.json
  app-config.example.json
examples/
  backup-manifest.example.json
```

## Önemli kapsam sınırları

İlk sürümde yalnızca tek çocuk profili (Gökalp) desteklenir; veri modeli ileride genişlemeye uygun tasarlanır. Çoklu ebeveyn, ortak düzenleme, çevrimiçi hesap, AI servisi ve otomatik bulut yedeklemesi yoktur.

Bu paket kodun kendisi değil, ZCode için ürün/tasarım/uygulama/test talimatlarıdır. ZCode'un ürettiği kodu gerçek Android ve iOS cihazlarda test edin.
