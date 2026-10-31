/**
 * Takvim bazlı yaş hesabı.
 * 30 gün = 1 ay yaklaşımı KULLANILMAZ (AGENTS.md kuralı).
 */

export type CalendarAge = {
  years: number;
  months: number;
  /** years*12 + months */
  totalMonths: number;
  days: number;
  totalDays: number;
};

const MS_PER_DAY = 86_400_000;

function parseIsoDate(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map((p) => Number.parseInt(p, 10));
  return { y, m, d };
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Verilen ay için doğum günü "ayyılı" tarihi (29 Şubat kısa aylara sıkıştırılır). */
function clampedAnniversaryDay(birthDay: number, year: number, monthIndex: number): number {
  return Math.min(birthDay, daysInMonth(year, monthIndex));
}

/**
 * birthDate (YYYY-MM-DD) → on tarihine kadar takvim yaşı.
 * Tarihler yerel takvim mantığıyla (UTC öğle hilesiyle) hesaplanır; DST etkilenmez.
 */
export function calculateAge(birthDate: string, on: Date = new Date()): CalendarAge {
  const birth = parseIsoDate(birthDate);
  const now = {
    y: on.getFullYear(),
    m: on.getMonth(),
    d: on.getDate(),
  };

  // Tam gün sayısı (UTC öğle karşılaştırması)
  const birthUtc = Date.UTC(birth.y, birth.m - 1, birth.d, 12);
  const onUtc = Date.UTC(now.y, now.m, now.d, 12);
  const totalDays = Math.max(0, Math.round((onUtc - birthUtc) / MS_PER_DAY));

  // Aylar: her ayın "ayyılı" doğum günü o ayın gün sayısına sıkıştırılır.
  let months = (now.y - birth.y) * 12 + (now.m - (birth.m - 1));
  if (months > 0) {
    const anniversaryDay = clampedAnniversaryDay(birth.d, now.y, now.m);
    if (now.d < anniversaryDay) {
      months -= 1;
    }
  } else if (months < 0) {
    months = 0;
  }
  // Doğum gününden önceki aynı ay içindeyse (ör. doğum 31, bugün 15) 0'dan küçük olamaz.
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const restMonths = months % 12;

  // Günler: son ayyılından bu yana geçen gün.
  let anniversary = new Date(now.y, now.m, clampedAnniversaryDay(birth.d, now.y, now.m));
  if (anniversary.getTime() > on.getTime()) {
    // Son ayyılı bir önceki ayda ara.
    let year = now.y;
    let month = now.m - 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    anniversary = new Date(year, month, clampedAnniversaryDay(birth.d, year, month));
  }
  const days = Math.max(0, Math.round((onUtc - Date.UTC(anniversary.getFullYear(), anniversary.getMonth(), anniversary.getDate(), 12)) / MS_PER_DAY));

  return {
    years,
    months: restMonths,
    totalMonths: months,
    days,
    totalDays,
  };
}

/**
 * Yaş gösterimi: 0 yaş → "X ay Y gün"; 1+ yaş → "X yıl Y ay Z gün".
 */
export function formatAgeTr(age: CalendarAge): string {
  if (age.years === 0) {
    return `${age.totalMonths} ay ${age.days} gün`;
  }
  return `${age.years} yıl ${age.months} ay ${age.days} gün`;
}
