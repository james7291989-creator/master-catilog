/**
 * ⚡ APEX CATALOG SERVICE ⚡
 *
 * CLEAN ARCHITECTURE — Business Logic Layer.
 * Orchestrates catalog operations for the Delivery layer (components).
 * Depends only on the Repository interface — never on Supabase directly.
 *
 * Responsibilities:
 *  - Cursor-paginated catalog browsing
 *  - Mood extraction
 *  - Search/filter composition
 *  - Structured audit logging of every catalog access
 */

import { fetchCatalogPage, fetchAllCatalog } from '../repositories/catalogRepository';
import { logEvent } from '../utils/structuredLog';

/**
 * Returns a page of catalog rows with cursor pagination.
 * Wraps repository errors into a standardized API error contract.
 */
export async function getCatalogPage(params) {
  try {
    const result = await fetchCatalogPage(params);
    logEvent('catalog.page', {
      limit: params?.limit ?? 25,
      hasMore: result.hasMore,
      rows: result.rows.length,
    });
    return result;
  } catch (err) {
    logEvent('catalog.page.error', { message: err.message });
    throw new Error('CATALOG_SERVICE_UNAVAILABLE');
  }
}

/**
 * Returns the full catalog (for mood extraction).
 * Cached at the repository layer.
 */
export async function getCatalogAll() {
  try {
    const rows = await fetchAllCatalog();
    logEvent('catalog.all', { rows: rows.length });
    return rows;
  } catch (err) {
    logEvent('catalog.all.error', { message: err.message });
    throw new Error('CATALOG_SERVICE_UNAVAILABLE');
  }
}

/**
 * Extracts the unique mood list from the catalog.
 */
export async function getUniqueMoods() {
  const rows = await getCatalogAll();
  const moodSet = new Set();
  rows.forEach((row) => {
    const mood = row?.mood?.trim();
    if (mood && mood !== 'Multi-Genre') moodSet.add(mood);
  });
  return ['All', ...Array.from(moodSet).sort()];
}