import developmentAreasSeed from './development-areas.json';
import guideCategoriesSeed from './guide-categories.json';

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

/**
 * Seed içerik sürümleri. İçerik değiştiğinde sürüm yükseltilir;
 * seed yalnızca sürüm değişiminde çalışır (idempotent).
 */
export const SEED_VERSIONS = {
  developmentAreas: '1.0.0',
  guideCategories: '1.0.0',
} as const;

export const DEVELOPMENT_AREAS_SEED = developmentAreasSeed as DevelopmentAreaSeed[];
export const GUIDE_CATEGORIES_SEED = guideCategoriesSeed as GuideCategorySeed[];
