import { z } from 'zod';

import { JOURNAL_ENTRY_TYPES } from './journal-types';
import { validateEventDate } from './calendar-date';

/** Kayıt türü doğrulaması. */
export const journalEntryTypeSchema = z.enum(JOURNAL_ENTRY_TYPES);

/**
 * Günlük kaydı girdisi. body zorunlu; başlık opsiyonel; olay tarihi
 * YYYY-MM-DD (geçmiş tarih serbest — PRD kabul kriteri).
 */
export const journalEntryInputSchema = z.object({
  entryType: journalEntryTypeSchema,
  title: z
    .string()
    .trim()
    .max(120)
    .transform((v) => (v.length === 0 ? null : v)),
  body: z
    .string()
    .trim()
    .min(1, 'Kayıt metni boş olamaz.'),
  occurredAt: z
    .string()
    .trim()
    .superRefine((value, ctx) => {
      const check = validateEventDate(value);
      if (!check.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: check.message });
      }
    }),
  areaId: z.string().min(1).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export type JournalEntryInput = z.input<typeof journalEntryInputSchema>;
export type JournalEntryParsedInput = z.output<typeof journalEntryInputSchema>;

export function parseJournalEntryInput(input: unknown) {
  return journalEntryInputSchema.safeParse(input);
}
