# UI/UX Tasarım Sistemi

## 1. Tasarım yönü

Sıcak, doğal, sakin, premium aile günlüğü. Ebeveyn odaklı; çocuk uygulaması gibi aşırı çizgi film estetiği kullanılmaz.

## 2. Renk token önerileri

```ts
export const colors = {
  background: '#F7F3EC',
  surface: '#FFFCF7',
  surfaceMuted: '#EEE7DC',
  text: '#3F3932',
  textMuted: '#81776B',
  primary: '#A77C5C',
  primaryDark: '#805A40',
  sage: '#879681',
  sageLight: '#E4EADF',
  clay: '#C58F78',
  border: '#E5DCCF',
  warning: '#B78345',
  danger: '#AD655D',
  white: '#FFFFFF',
};
```

## 3. Tipografi ve ölçüler

- Başlıklar: sade, yumuşak karakterli sistem fontu veya lisansı uygun yerel font.
- Gövde metni: okunabilir sistem sans-serif.
- 16 px temel gövde; küçük yardımcı metin 12–13 px altına düşmesin.
- Dokunma alanı en az 44–48 dp.
- Kart radius 16–22 dp; tutarlı spacing token'ları.
- Kontrast erişilebilir seviyede tutulur; açık zemin üstünde açık renk metin kullanma.

## 4. Navigasyon

Alt sekmeler:
1. Ana Sayfa
2. Günlük
3. Gelişim
4. Rehber
5. Arşiv

Ayarlar Arşiv içinden veya üst menüden erişilir.

## 5. Ekran haritası

```text
Onboarding
 ├─ Hoş geldin
 ├─ Gökalp profili (isim, doğum tarihi)
 └─ Ana sayfa

Ana Sayfa
 ├─ Hızlı not
 ├─ Anı ekle
 ├─ Fotoğraf ekle
 ├─ Son kayıtlar
 ├─ Planlanan etkinlikler
 └─ Yaşa uygun rehber önerisi

Günlük
 ├─ Günlük liste
 ├─ Kayıt oluştur/düzenle
 ├─ Kayıt detayı
 ├─ Medya galerisi
 └─ Filtreler

Gelişim
 ├─ Gelişim alanları
 ├─ Alan detayı
 ├─ Beceri listesi
 ├─ Beceri detayı
 └─ Gözlem oluştur/geçmişi

Rehber
 ├─ Rehber kategorileri
 ├─ Etkinlik listesi
 ├─ Etkinlik detayı
 ├─ Etkinlik planla
 └─ Etkinlik oturumu/gözlemi

Arşiv
 ├─ Zaman çizelgesi
 ├─ İlgi alanları
 ├─ Favoriler
 ├─ Arama
 ├─ Medya arşivi
 ├─ Yedek al
 ├─ Yedekten geri yükle
 └─ Ayarlar
```

## 6. Ana sayfa wireframe açıklaması

1. Üstte “Gökalp bugün …” ve güncel takvim yaşı.
2. Profil avatarı/fotoğrafı.
3. Dört hızlı eylem: Not, Anı, Fotoğraf, Gözlem.
4. “Son günlerde” zaman çizelgesi kartları.
5. “Birlikte deneyebilirsiniz” etkinlik kartı.
6. Planlanan etkinlikler.
7. Alt sekme navigasyonu.

## 7. UX yazım ilkeleri

- “Bugün bir şey kaydetmek ister misin?” gibi davetkâr dil.
- “Etkinliği tamamlayamadın” yerine “Daha sonra deneyebilirsin”.
- “Başarılı/başarısız” gelişim durumu yok.
- Her beceri gözlemi ebeveynin gördüğünü anlatır; çocuğa not vermez.
- Silme, geri yükleme ve yedek üzerine yazma işlemlerinde anlaşılır onay metni.

## 8. Empty/loading/error durumları

Her ana modül için:
- Boş durum illüstrasyonu + kısa açıklama + tek CTA.
- Yükleme göstergesi.
- Türkçe hata mesajı ve tekrar dene.
- Offline durumda gereksiz bağlantı uyarısı gösterme; çünkü temel akış offline tasarlanmıştır.
