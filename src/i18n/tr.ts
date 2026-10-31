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
  common: {
    next: 'Devam',
    back: 'Geri',
    done: 'Tamamla',
    save: 'Kaydet',
    cancel: 'Vazgeç',
    edit: 'Düzenle',
    delete: 'Sil',
    tryAgain: 'Tekrar dene',
    loading: 'Yükleniyor…',
    errorGeneric: 'Bir sorun oldu. Lütfen tekrar deneyin.',
  },
  home: {
    placeholder: 'Ana sayfa hazırlanıyor.',
    placeholderHint:
      'Bu ekranda hızlı not, anı, fotoğraf ekleme ve son kayıtlar yer alacak.',
    setupCta: 'Kurulumu başlat',
    greeting: 'bugün neler var?',
    setupPendingTitle: 'Önce Gökalp için profil oluşturalım',
    setupPendingDesc:
      'Ad ve doğum tarihini ekleyin; yaşa uygun içerikleri öyle gösterebiliriz.',
  },
  onboarding: {
    welcomeTitle: "Gökalp'in büyüme günlüğüne hoş geldiniz",
    welcomeBody:
      'Anılar, gözlemler, ilgi alanları ve birlikte yapılan etkinlikler tek bir kişisel arşivde toplanır. Verileriniz yalnızca bu telefonda kalır.',
    welcomeStep: '1 / 3',
    profileStep: '2 / 3',
    doneStep: '3 / 3',
    profileTitle: 'Çocuğunuzun profilini oluşturalım',
    profileNameLabel: 'Ad',
    profileNamePlaceholder: 'Gökalp',
    profileBirthLabel: 'Doğum tarihi',
    profileBirthHint: 'Biçim: YYYY-MM-DD (örn. 2026-01-18)',
    profileAvatarNote: 'Profil fotoğrafını sonra da ekleyebilirsiniz.',
    doneTitle: 'Her şey hazır!',
    doneSummaryPrefix: 'Profil:',
    doneCta: 'Ana sayfaya dön',
    nameRequired: 'Ad boş olamaz.',
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
