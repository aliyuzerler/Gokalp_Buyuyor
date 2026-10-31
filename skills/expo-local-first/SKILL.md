# Skill: Expo Local-First Engineering

## Teknoloji

React Native + Expo + TypeScript + Expo Router + expo-sqlite.

## Kurallar

- Expo SDK uyumlu paketleri `npx expo install` ile ekle.
- Native modül gereken özellikte development build kullan.
- Kalıcı veriyi SQLite'ta tut; component/global state içine kalıcı kayıt gömme.
- DB işlemlerini repository katmanına al.
- Her schema değişikliğinde migration ve migration testi oluştur.
- SQL parametreli olmalı.
- Foreign key ve transaction kullan.
- Tarih ve timezone işlemlerini merkezi utility'de yap.
- Yaşı takvim bazlı hesapla; 30 gün/ay kullanma.
- Android ve iOS dosya/API davranışlarını ayrı doğrula.
- Temel işlevler internetsiz çalışmalı.

## Yasaklar

- Supabase/Firebase/backend ekleme.
- SQLCipher veya dosya şifrelemesi ekleme.
- Kullanıcı izni olmadan medya galerisine dosya yazma.
- SQL sorgularını UI içinde çalıştırma.
- Gelişim durumunu puan veya teşhis gibi sunma.
