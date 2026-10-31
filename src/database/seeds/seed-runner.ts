import type { DatabaseDriver } from '../types';
import { SettingsRepository } from '../repositories/settings-repository';
import { generateUuid } from '../../utils/uuid';
import { DEVELOPMENT_AREAS_SEED, GUIDE_CATEGORIES_SEED, SEED_VERSIONS } from './index';

const SETTING_DEVELOPMENT_AREAS = 'seed:development_areas:version';
const SETTING_GUIDE_CATEGORIES = 'seed:guide_categories:version';

export type SeedReport = {
  developmentAreasUpserted: number;
  guideCategoriesUpserted: number;
  developmentAreasRan: boolean;
  guideCategoriesRan: boolean;
};

/**
 * Seed içerikleri yalnızca ilk kurulumda veya içerik sürümü değiştiğinde uygulanır.
 * slug UNIQUE + ON CONFLICT güncellemesi sayesinde tekrar çalıştırma çoğalma yaratmaz.
 */
export async function runSeeds(db: DatabaseDriver): Promise<SeedReport> {
  const settings = new SettingsRepository(db);
  const report: SeedReport = {
    developmentAreasUpserted: 0,
    guideCategoriesUpserted: 0,
    developmentAreasRan: false,
    guideCategoriesRan: false,
  };

  const areasVersion = await settings.get(SETTING_DEVELOPMENT_AREAS);
  if (areasVersion !== SEED_VERSIONS.developmentAreas) {
    for (const area of DEVELOPMENT_AREAS_SEED) {
      await db.runAsync(
        `INSERT INTO development_areas (id, slug, title, description, sort_order, is_active)
         VALUES (
           COALESCE((SELECT id FROM development_areas WHERE slug = ?), ?),
           ?, ?, ?, ?, 1
         )
         ON CONFLICT(slug) DO UPDATE SET
           title = excluded.title,
           description = excluded.description,
           sort_order = excluded.sort_order`,
        [area.slug, generateUuid(), area.slug, area.title, area.description, area.sort_order],
      );
      report.developmentAreasUpserted += 1;
    }
    await settings.set(SETTING_DEVELOPMENT_AREAS, SEED_VERSIONS.developmentAreas);
    report.developmentAreasRan = true;
  }

  const categoriesVersion = await settings.get(SETTING_GUIDE_CATEGORIES);
  if (categoriesVersion !== SEED_VERSIONS.guideCategories) {
    for (const category of GUIDE_CATEGORIES_SEED) {
      await db.runAsync(
        `INSERT INTO guide_categories (id, slug, title, description, sort_order)
         VALUES (
           COALESCE((SELECT id FROM guide_categories WHERE slug = ?), ?),
           ?, ?, ?, ?
         )
         ON CONFLICT(slug) DO UPDATE SET
           title = excluded.title,
           description = excluded.description,
           sort_order = excluded.sort_order`,
        [category.slug, generateUuid(), category.slug, category.title, category.description, category.sort_order],
      );
      report.guideCategoriesUpserted += 1;
    }
    await settings.set(SETTING_GUIDE_CATEGORIES, SEED_VERSIONS.guideCategories);
    report.guideCategoriesRan = true;
  }

  return report;
}
