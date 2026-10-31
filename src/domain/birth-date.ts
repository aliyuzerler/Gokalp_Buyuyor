import { z } from 'zod';

/**
 * Doğum tarihi kuralları:
 * - Biçim YYYY-MM-DD
 * - Gerçek takvim tarihi olmalı
 * - Gelecek tarih reddedilir
 * - Makul alt sınır (2010-01-01): 0–18 yaş hedefli ürün
 */
export const BIRTH_DATE_MIN = '2010-01-01';

export const BIRTH_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type BirthDateInput = {
  birthDate: string;
  /** Bugünün tarihi (test edilebilirlik için parametrik). */
  today?: Date;
  minDate?: string;
};

function toUtcMidnight(isoDate: string): Date | null {
  const [y, m, d] = isoDate.split('-').map((part) => Number.parseInt(part, 10));
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  // JavaScript Date taşan alanları sarar; geri dönüşüm orijinal girdiye eşit değilse geçersiz.
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

/**
 * Takvim bazlı doğum tarihi doğrulaması. Geçerli değilse Türkçe hata mesajı döner.
 */
export function validateBirthDate(input: BirthDateInput): { ok: true } | { ok: false; message: string } {
  const { birthDate, today = new Date(), minDate = BIRTH_DATE_MIN } = input;

  if (!BIRTH_DATE_REGEX.test(birthDate)) {
    return { ok: false, message: 'Doğum tarihi YYYY-MM-DD biçiminde olmalıdır (örn. 2026-01-18).' };
  }

  const parsed = toUtcMidnight(birthDate);
  if (!parsed) {
    return { ok: false, message: 'Girdiğiniz tarih gerçek bir takvim tarihi değil.' };
  }

  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (parsed.getTime() > todayUtc) {
    return { ok: false, message: 'Doğum tarihi gelecekte olamaz.' };
  }

  if (birthDate < minDate) {
    return { ok: false, message: 'Doğum tarihi çok eski görünüyor. Lütfen kontrol edin.' };
  }

  return { ok: true };
}

/**
 * Zod şeması: form doğrulaması tek doğruluk kaynağı.
 */
export function makeBirthDateSchema(today: Date, minDate: string = BIRTH_DATE_MIN) {
  return z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const result = validateBirthDate({ birthDate: value, today, minDate });
      if (!result.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message });
      }
    });
}

export type BirthDateSchema = ReturnType<typeof makeBirthDateSchema>;
