/** Günlük kayıt türleri — PRD 5.3. */
export const JOURNAL_ENTRY_TYPES = [
  'observation',
  'memory',
  'first_event',
  'quote',
  'reflection',
  'free_note',
] as const;

export type JournalEntryType = (typeof JOURNAL_ENTRY_TYPES)[number];

export const JOURNAL_ENTRY_TYPE_LABELS: Record<JournalEntryType, string> = {
  observation: 'Gözlem',
  memory: 'Anı',
  first_event: 'İlk',
  quote: 'Söz',
  reflection: 'Düşünce',
  free_note: 'Not',
};

export const SKILL_OBSERVATION_STATUSES = [
  'not_tried',
  'practicing',
  'sometimes',
  'often',
  'not_sure',
] as const;

export type SkillObservationStatus = (typeof SKILL_OBSERVATION_STATUSES)[number];

export const SKILL_OBSERVATION_STATUS_LABELS: Record<SkillObservationStatus, string> = {
  not_tried: 'Henüz denemedik',
  practicing: 'Birlikte deniyoruz',
  sometimes: 'Bazen gözlemliyorum',
  often: 'Sıklıkla gözlemliyorum',
  not_sure: 'Emin değilim',
};

export const PLANNED_ACTIVITY_STATUSES = ['planned', 'completed', 'postponed', 'skipped'] as const;

export type PlannedActivityStatus = (typeof PLANNED_ACTIVITY_STATUSES)[number];
