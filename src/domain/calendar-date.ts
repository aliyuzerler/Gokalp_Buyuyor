/**
 * Takvim tarihi yardımcıları (YYYY-MM-DD).
 * Hem doğum tarihi hem olay tarihleri kullanır.
 */

export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Gerçek bir takvim tarihi mi (31 Şubat reddedilir, artık yıl desteklenir)? */
export function isRealCalendarDate(iso: string): boolean {
  if (!ISO_DATE_REGEX.test(iso)) return false;
  const [y, m, d] = iso.split('-').map((p) => Number.parseInt(p, 10));
  if (!y || !m || !d) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
  );
}

/** Tarih bugünden sonra mı (yerel takvim)? */
export function isAfterToday(iso: string, today: Date = new Date()): boolean {
  const [y, m, d] = iso.split('-').map((p) => Number.parseInt(p, 10));
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Date.UTC(y, m - 1, d) > todayUtc;
}

export type EventDateCheck = { ok: true } | { ok: false; message: string };

/**
 * Günlük/anı olay tarihi: gerçek takvim tarihi + gelecek olamaz. Geçmiş serbest.
 */
export function validateEventDate(iso: string, today: Date = new Date()): EventDateCheck {
  if (!ISO_DATE_REGEX.test(iso)) {
    return { ok: false, message: 'Tarih YYYY-MM-DD biçiminde olmalıdır.' };
  }
  if (!isRealCalendarDate(iso)) {
    return { ok: false, message: 'Girdiğiniz tarih gerçek bir takvim tarihi değil.' };
  }
  if (isAfterToday(iso, today)) {
    return { ok: false, message: 'Olay tarihi gelecekte olamaz.' };
  }
  return { ok: true };
}
