import type { DatabaseDriver } from '../types';
import { SettingsRepository } from '../repositories/settings-repository';
import { generateUuid } from '../../utils/uuid';
import { DEVELOPMENT_AREAS_SEED, GUIDE_CATEGORIES_SEED, SEED_VERSIONS, SKILLS_SEED, SKILLS_SOURCE } from './index';

const SETTING_DEVELOPMENT_AREAS = 'seed:development_areas:version';
const SETTING_GUIDE_CATEGORIES = 'seed:guide_categories:version';
const SETTING_SKILLS = 'seed:skills:version';

export type SeedReport = {
  developmentAreasUpserted: number;
  guideCategoriesUpserted: number;
  skillsUpserted: number;
  developmentAreasRan: boolean;
  guideCategoriesRan: boolean;
  skillsRan: boolean;
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
    skillsUpserted: 0,
    developmentAreasRan: false,
    guideCategoriesRan: false,
    skillsRan: false,
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

  const skillsVersion = await settings.get(SETTING_SKILLS);
  if (skillsVersion !== SEED_VERSIONS.skills) {
    // Beceri içerikleri yalnızca kaynaklı seed'den gelir (CONTENT_GUIDELINES.md).
    for (const skill of SKILLS_SEED) {
      await db.runAsync(
        `INSERT INTO skills (
           id, area_id, slug, title, description, min_age_months, max_age_months, sort_order,
           source_name, source_url, reviewed_at, content_version, is_active
         )
         SELECT COALESCE((SELECT s.id FROM skills s WHERE s.slug = ?), ?),
                a.id, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 1
         FROM development_areas a
         WHERE a.slug = ?
         ON CONFLICT(slug) DO UPDATE SET
           area_id = excluded.area_id,
           title = excluded.title,
           description = excluded.description,
           min_age_months = excluded.min_age_months,
           max_age_months = excluded.max_age_months,
           source_name = excluded.source_name,
           source_url = excluded.source_url,
           reviewed_at = excluded.reviewed_at,
           content_version = excluded.content_version`,
        [
          skill.slug,
          generateUuid(),
          skill.slug,
          skill.title,
          skill.description,
          skill.min_age_months,
          skill.max_age_months,
          SKILLS_SOURCE.name,
          SKILLS_SOURCE.url,
          '2026-10-31',
          SEED_VERSIONS.skills,
          skill.area_slug,
        ],
      );
      report.skillsUpserted += 1;
    }
    await settings.set(SETTING_SKILLS, SEED_VERSIONS.skills);
    report.skillsRan = true;
  }

  return report;
}
