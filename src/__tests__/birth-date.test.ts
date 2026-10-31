import { makeBirthDateSchema, validateBirthDate } from '@/domain/birth-date';

const TODAY = new Date(2026, 9, 31); // 2026-10-31

describe('doğum tarihi doğrulaması', () => {
  it('geçerli tarihi kabul eder (18.01.2026)', () => {
    expect(validateBirthDate({ birthDate: '2026-01-18', today: TODAY })).toEqual({ ok: true });
  });

  it('gelecek tarihi reddeder', () => {
    const result = validateBirthDate({ birthDate: '2026-11-01', today: TODAY });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('gelecekte olamaz');
  });

  it('bugünün tarihi kabul edilir', () => {
    expect(validateBirthDate({ birthDate: '2026-10-31', today: TODAY })).toEqual({ ok: true });
  });

  it('hatalı biçimi reddeder', () => {
    const r1 = validateBirthDate({ birthDate: '18.01.2026', today: TODAY });
    const r2 = validateBirthDate({ birthDate: '2026-1-18', today: TODAY });
    expect(r1.ok).toBe(false);
    expect(r2.ok).toBe(false);
  });

  it('gerçek olmayan takvim tarihini reddeder (31 Şubat)', () => {
    const result = validateBirthDate({ birthDate: '2026-02-31', today: TODAY });
    expect(result.ok).toBe(false);
  });

  it('artık yıl 29 Şubat kabul eder (2024)', () => {
    expect(validateBirthDate({ birthDate: '2024-02-29', today: TODAY })).toEqual({ ok: true });
  });

  it('artık yıl olmayan 29 Şubat reddeder (2025)', () => {
    const result = validateBirthDate({ birthDate: '2025-02-29', today: TODAY });
    expect(result.ok).toBe(false);
  });

  it('ay sonu 31. günü kabul eder', () => {
    expect(validateBirthDate({ birthDate: '2026-01-31', today: TODAY })).toEqual({ ok: true });
  });

  it('çok eski tarihi reddeder', () => {
    const result = validateBirthDate({ birthDate: '2009-12-31', today: TODAY });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain('çok eski');
  });

  it('zod şeması aynı kuralları uygular', () => {
    const schema = makeBirthDateSchema(TODAY);
    expect(schema.safeParse('2026-01-18').success).toBe(true);
    expect(schema.safeParse('2030-01-01').success).toBe(false);
    expect(schema.safeParse('31.12.2020').success).toBe(false);
  });
});
