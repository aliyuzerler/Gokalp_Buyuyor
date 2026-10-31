import { z } from 'zod';

import { isAfterToday, isRealCalendarDate, ISO_DATE_REGEX } from './calendar-date';
import { BIRTH_DATE_MIN } from './calendar-limits';

/**
 * Doğum tarihi kuralları:
 * - Biçim YYYY-MM-DD, gerçek takvim tarihi
 * - Gelecek tarih reddedilir
 * - Makul alt sınır (2010-01-01): 0–18 yaş hedefli ürün
 */
export { BIRTH_DATE_MIN };

export const BIRTH_DATE_REGEX = ISO_DATE_REGEX;

export type BirthDateInput = {
  birthDate: string;
  /** Bugünün tarihi (test edilebilirlik için parametrik). */
  today?: Date;
  minDate?: string;
};

/**
 * Takvim bazlı doğum tarihi doğrulaması. Geçerli değilse Türkçe hata mesajı döner.
 */
export function validateBirthDate(
  input: BirthDateInput,
): { ok: true } | { ok: false; message: string } {
  const { birthDate, today = new Date(), minDate = BIRTH_DATE_MIN } = input;

  if (!ISO_DATE_REGEX.test(birthDate)) {
    return { ok: false, message: 'Doğum tarihi YYYY-MM-DD biçiminde olmalıdır (örn. 2026-01-18).' };
  }
  if (!isRealCalendarDate(birthDate)) {
    return { ok: false, message: 'Girdiğiniz tarih gerçek bir takvim tarihi değil.' };
  }
  if (isAfterToday(birthDate, today)) {
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
  return z.string().trim().superRefine((value, ctx) => {
    const result = validateBirthDate({ birthDate: value, today, minDate });
    if (!result.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.message });
    }
  });
}

export type BirthDateSchema = ReturnType<typeof makeBirthDateSchema>;
