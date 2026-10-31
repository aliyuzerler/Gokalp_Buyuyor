/**
 * Merkezi Türkçe metin kaynağı (tr-TR).
 * i18n yapısına uygun tutulur; yeni diller src/i18n altında eklenir.
 */
export const tr = {
  appName: 'Gökalp Büyüyor',
  tabs: {
    home: 'Ana Sayfa',
    journal: 'Günlük',
    development: 'Gelişim',
    guide: 'Rehber',
    archive: 'Arşiv',
  },
  home: {
    placeholder: 'Ana sayfa hazırlanıyor.',
    placeholderHint:
      'Bu ekranda hızlı not, anı, fotoğraf ekleme ve son kayıtlar yer alacak.',
  },
  journal: {
    placeholder: 'Günlük kayıtları burada listelenecek.',
  },
  development: {
    placeholder: 'Gelişim alanları ve beceri gözlemleri burada olacak.',
  },
  guide: {
    placeholder: 'Yaşa uygun etkinlik rehberi burada olacak.',
  },
  archive: {
    placeholder: 'Zaman çizelgesi, ilgi alanları, yedekleme ve ayarlar burada olacak.',
  },
} as const;

export type TranslationSource = typeof tr;
