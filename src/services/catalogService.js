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
 *  - ⚡ MULTI-TENANT: every operation is scoped by artistId so guest vaults
 *    are fully isolated from the master tenant's rows.
 */

import { fetchCatalogPage, fetchAllCatalog, fetchArtistsLedger } from '../repositories/catalogRepository';
import { logEvent } from '../utils/structuredLog';

/**
 * Returns a page of catalog rows with cursor pagination.
 * Wraps repository errors into a standardized API error contract.
 *
 * @param {object} params
 * @param {string|null} [params.artistId=null] - tenant scope (null = master).
 */
export async function getCatalogPage(params) {
  try {
    const result = await fetchCatalogPage(params);
    logEvent('catalog.page', {
      limit: params?.limit ?? 25,
      hasMore: result.hasMore,
      rows: result.rows.length,
      artistId: params?.artistId ?? 'master',
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
 *
 * @param {string|null} [artistId=null] - tenant scope (null = master).
 */
export async function getCatalogAll(artistId = null) {
  try {
    const rows = await fetchAllCatalog(artistId);
    logEvent('catalog.all', { rows: rows.length, artistId: artistId ?? 'master' });
    return rows;
  } catch (err) {
    logEvent('catalog.all.error', { message: err.message });
    throw new Error('CATALOG_SERVICE_UNAVAILABLE');
  }
}

/**
 * Extracts the unique mood list from the catalog.
 *
 * @param {string|null} [artistId=null] - tenant scope (null = master).
 */
export async function getUniqueMoods(artistId = null) {
  const rows = await getCatalogAll(artistId);
  const moodSet = new Set();
  rows.forEach((row) => {
    const mood = row?.mood?.trim();
    if (mood && mood !== 'Multi-Genre') moodSet.add(mood);
  });
  return ['All', ...Array.from(moodSet).sort()];
}

/**
 * ⚡ MULTI-TENANT ARTISTS LEDGER — fetches the full roster of artists
 * for the global navigation dropdown.
 *
 * @returns {Promise<Array<{id: string, artist_name: string, hero_bg_image: string|null}>>}
 */
export async function getArtistsLedger() {
  try {
    const rows = await fetchArtistsLedger();
    logEvent('artists.ledger', { rows: rows.length });
    return rows;
  } catch (err) {
    logEvent('artists.ledger.error', { message: err.message });
    throw new Error('ARTISTS_SERVICE_UNAVAILABLE');
  }
}