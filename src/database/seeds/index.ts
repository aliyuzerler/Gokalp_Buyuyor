import developmentAreasSeed from './development-areas.json';
import guideCategoriesSeed from './guide-categories.json';
import skillsSeed from './skills.json';
import activitiesSeed from './activities.json';

export type DevelopmentAreaSeed = {
  slug: string;
  title: string;
  description: string;
  sort_order: number;
};

export type GuideCategorySeed = {
  slug: string;
  title: string;
  description: string;
  sort_order: number;
};

export type ActivitySeed = {
  slug: string;
  category_slug: string;
  area_slug: string;
  title: string;
  summary: string;
  purpose: string;
  min_age_months: number;
  max_age_months: number;
  estimated_minutes: number;
  materials: string[];
  steps: string[];
  safety_notes: string;
  supervision_level: string;
  source_name: string;
  source_url: string;
  reviewed_at: string;
};

export type SkillSeed = {
  slug: string;
  area_slug: string;
  title: string;
  description: string;
  min_age_months: number;
  max_age_months: number;
};

export const SKILLS_SOURCE = {
  name: (skillsSeed as { source: { name: string; url: string; note: string } }).source.name,
  url: (skillsSeed as { source: { name: string; url: string; note: string } }).source.url,
  note: (skillsSeed as { source: { name: string; url: string; note: string } }).source.note,
} as const;

/**
 * Seed içerik sürümleri. İçerik değiştiğinde sürüm yükseltilir;
 * seed yalnızca sürüm değişiminde çalışır (idempotent).
 */
export const SEED_VERSIONS = {
  developmentAreas: '1.0.0',
  guideCategories: '1.0.0',
  skills: '1.0.0',
  activities: '1.0.0',
} as const;

export const DEVELOPMENT_AREAS_SEED = developmentAreasSeed as DevelopmentAreaSeed[];
export const GUIDE_CATEGORIES_SEED = guideCategoriesSeed as GuideCategorySeed[];
export const SKILLS_SEED = (
  skillsSeed as { content_version: string; skills: SkillSeed[] }
).skills;
export const ACTIVITIES_SEED = (
  activitiesSeed as { content_version: string; activities: ActivitySeed[] }
).activities;
