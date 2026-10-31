import { calculateAge, formatAgeTr } from '@/domain/age';

/** Belirli tarihlerde hesap testleri (yerel saat). */
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d);

describe('takvim bazlı yaş hesabı', () => {
  it('9 aylık örnek: 18.01.2026 → 18.10.2026 = 9 ay 0 gün', () => {
    const age = calculateAge('2026-01-18', at(2026, 10, 18));
    expect(age).toMatchObject({ years: 0, months: 9, days: 0, totalMonths: 9 });
  });

  it('ay içinde gün eksiği: 18.01.2026 → 17.10.2026 = 8 ay 29 gün', () => {
    const age = calculateAge('2026-01-18', at(2026, 10, 17));
    expect(age).toMatchObject({ years: 0, months: 8, days: 29 });
  });

  it('ay sonu doğum: 31.01 → 28.02 = 1 ay 0 gün (ayyılı kısa aya sıkışır)', () => {
    const age = calculateAge('2026-01-31', at(2026, 2, 28));
    expect(age).toMatchObject({ years: 0, months: 1, days: 0 });
  });

  it('ay sonu doğum: 31.01 → 01.03 = 1 ay 1 gün', () => {
    const age = calculateAge('2026-01-31', at(2026, 3, 1));
    expect(age).toMatchObject({ years: 0, months: 1, days: 1 });
  });

  it('29 Şubat doğumlu: 29.02.2024 → 28.02.2025 = 12 ay (2. yıl ayyılı sıkışır)', () => {
    const age = calculateAge('2024-02-29', at(2025, 2, 28));
    expect(age).toMatchObject({ years: 1, months: 0, days: 0, totalMonths: 12 });
  });

  it('29 Şubat doğumlu: 29.02.2024 → 27.02.2025 = 11 ay 29 gün', () => {
    const age = calculateAge('2024-02-29', at(2025, 2, 27));
    expect(age).toMatchObject({ years: 0, months: 11, days: 29 });
  });

  it('doğum günü: 18.01.2026 → 18.01.2028 = 2 yıl 0 ay 0 gün', () => {
    const age = calculateAge('2026-01-18', at(2028, 1, 18));
    expect(age).toMatchObject({ years: 2, months: 0, days: 0, totalMonths: 24 });
  });

  it('doğum günü öncesi: 18.01.2026 → 17.01.2028 = 1 yıl 11 ay 30 gün', () => {
    const age = calculateAge('2026-01-18', at(2028, 1, 17));
    // 17 Ocak 2028 − 18 Ocak ayyılı öncesi: borçlanma ile 11 ay 30 gün
    expect(age).toMatchObject({ years: 1, months: 11, days: 30 });
  });

  it('doğum günü: aynı gün = 0 yaş', () => {
    const age = calculateAge('2026-10-31', at(2026, 10, 31));
    expect(age).toMatchObject({ years: 0, months: 0, days: 0, totalMonths: 0 });
  });

  it('toplam gün sayısı doğru (31 gün)', () => {
    const age = calculateAge('2026-01-18', at(2026, 2, 18));
    expect(age.totalDays).toBe(31);
  });

  it('formatAgeTr: 0 yaş için ay/gün, 1+ yaş için yıl/ay/gün', () => {
    expect(formatAgeTr(calculateAge('2026-01-18', at(2026, 10, 18)))).toBe('9 ay 0 gün');
    expect(formatAgeTr(calculateAge('2026-01-18', at(2028, 1, 18)))).toBe('2 yıl 0 ay 0 gün');
  });

  it('gerçek Gökalp senaryosu: 18.01.2026 doğum, 31.10.2026 itibarıyla', () => {
    const age = calculateAge('2026-01-18', at(2026, 10, 31));
    expect(age.totalMonths).toBe(9);
    expect(age.days).toBe(13);
    expect(formatAgeTr(age)).toBe('9 ay 13 gün');
  });
});
