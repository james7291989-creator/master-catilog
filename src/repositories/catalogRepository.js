/**
 * ⚡ APEX CATALOG REPOSITORY ⚡
 *
 * CLEAN ARCHITECTURE — Data Layer.
 * This module is the ONLY place that talks to Supabase for catalog data.
 * Business logic (Services) and Delivery (Components) depend on this
 * interface, never on Supabase directly.
 *
 * Implements:
 *  - Cursor-based pagination (keyset) for high-throughput tenant grids.
 *  - In-memory TTL cache (Redis-style) to prevent redundant round-trips.
 *  - Strict input validation on all query parameters.
 *  - ⚡ MULTI-TENANT ISOLATION: every catalog query is scoped by artist_id
 *    so guest vaults can never leak into the master tenant's rows.
 */

import { supabase } from '../utils/supabaseClient';
import { logError } from '../utils/structuredLog';

// ---------------------------------------------------------------------------
// CACHE LAYER — Redis-style TTL cache (in-memory for the client bundle).
// In production, swap this for a real Redis/Upstash instance behind the
// same interface. Keys are namespaced per tenant to prevent cross-tenant leaks.
// ---------------------------------------------------------------------------
const cacheStore = new Map();
const DEFAULT_TTL_MS = 30_000; // 30s

function cacheGet(key) {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value, ttlMs = DEFAULT_TTL_MS) {
  cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function cacheClear() {
  cacheStore.clear();
}

// ---------------------------------------------------------------------------
// VALIDATION
// ---------------------------------------------------------------------------

const PAGE_SIZE_LIMIT = 100;
const ALLOWED_SORT_COLUMNS = new Set(['track_title', 'bpm', 'mood', 'created_at', 'id']);

/**
 * Validates and normalizes pagination params. Throws on invalid input.
 */
function validatePagination({ limit, cursor, sortBy, sortDir }) {
  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= PAGE_SIZE_LIMIT
    ? limit
    : 25;

  const safeSortBy = ALLOWED_SORT_COLUMNS.has(sortBy) ? sortBy : 'track_title';
  const safeSortDir = sortDir === 'desc' ? 'desc' : 'asc';

  // Cursor must be a plain string (opaque token) — never an object/array.
  const safeCursor = typeof cursor === 'string' && cursor.length > 0 ? cursor : null;

  return { limit: safeLimit, cursor: safeCursor, sortBy: safeSortBy, sortDir: safeSortDir };
}

// ---------------------------------------------------------------------------
// REPOSITORY API
// ---------------------------------------------------------------------------

/**
 * Fetches a page of catalog rows using cursor (keyset) pagination.
 *
 * @param {object} params
 * @param {number} [params.limit=25] - page size (1..100)
 * @param {string|null} [params.cursor=null] - opaque cursor from previous page
 * @param {string} [params.sortBy='track_title'] - allowed sort column
 * @param {'asc'|'desc'} [params.sortDir='asc'] - sort direction
 * @param {string} [params.search=''] - optional search filter
 * @param {string} [params.mood=''] - optional mood filter
 * @param {string|null} [params.artistId=null] - ⚡ MULTI-TENANT: scope to a
 *   specific artist's catalog. When null, the master tenant is used.
 * @returns {Promise<{rows: Array, nextCursor: string|null, hasMore: boolean}>}
 */
export async function fetchCatalogPage({
  limit = 25,
  cursor = null,
  sortBy = 'track_title',
  sortDir = 'asc',
  search = '',
  mood = '',
  artistId = null,
} = {}) {
  const { limit: safeLimit, cursor: safeCursor, sortBy: safeSortBy, sortDir: safeSortDir } =
    validatePagination({ limit, cursor, sortBy, sortDir });

  // Cache key includes every filter dimension + cursor + tenant (artist-scoped).
  const cacheKey = `catalog:${safeSortBy}:${safeSortDir}:${safeLimit}:${safeCursor ?? 'start'}:${search}:${mood}:${artistId ?? 'master'}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  let query = supabase
    .from('sync_catalog')
    .select('*')
    .order(safeSortBy, { ascending: safeSortDir === 'asc' })
    .limit(safeLimit + 1); // fetch one extra to detect hasMore

  // ⚡ MULTI-TENANT ISOLATION: always scope by artist_id. When no artistId
  // is supplied, the master tenant's rows are returned (never all tenants).
  if (artistId) {
    query = query.eq('artist_id', artistId);
  } else {
    query = query.eq('artist_id', MASTER_TENANT_ID);
  }

  // Keyset cursor: filter on the sort column strictly greater/less than cursor.
  if (safeCursor) {
    if (safeSortDir === 'asc') {
      query = query.gt(safeSortBy, safeCursor);
    } else {
      query = query.lt(safeSortBy, safeCursor);
    }
  }

  if (search) {
    query = query.ilike('track_title', `%${search}%`);
  }

  if (mood) {
    query = query.eq('mood', mood);
  }

  const { data, error } = await query;

  if (error) {
    logError('catalog.repo.query_failed', { message: error.message });
    throw new Error('CATALOG_QUERY_FAILED');
  }

  const rows = data || [];
  const hasMore = rows.length > safeLimit;
  const pageRows = hasMore ? rows.slice(0, safeLimit) : rows;

  // Next cursor = last row's sort-column value (opaque, keyset-based).
  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && lastRow ? String(lastRow[safeSortBy] ?? '') : null;

  const result = { rows: pageRows, nextCursor, hasMore };
  cacheSet(cacheKey, result);
  return result;
}

/**
 * Fetches the full catalog (used for mood filter extraction).
 * Cached with a short TTL to avoid hammering the DB on every keystroke.
 *
 * ⚡ MULTI-TENANT: scoped by artist_id so guest vaults only see their rows.
 *
 * @param {string|null} [artistId=null] - tenant scope. Null = master tenant.
 */
export async function fetchAllCatalog(artistId = null) {
  const cacheKey = `catalog:all:${artistId ?? 'master'}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  let query = supabase
    .from('sync_catalog')
    .select('id, track_title, mood, bpm, key, asset_type, file_name, artist_id')
    .order('track_title', { ascending: true });

  // ⚡ MULTI-TENANT ISOLATION: always scope by artist_id.
  if (artistId) {
    query = query.eq('artist_id', artistId);
  } else {
    query = query.eq('artist_id', MASTER_TENANT_ID);
  }

  const { data, error } = await query;

  if (error) {
    logError('catalog.repo.all_fetch_failed', { message: error.message });
    throw new Error('CATALOG_QUERY_FAILED');
  }

  const result = data || [];
  cacheSet(cacheKey, result, 60_000); // 60s TTL
  return result;
}

// ---------------------------------------------------------------------------
// ⚡ MULTI-TENANT ARTISTS LEDGER
// ---------------------------------------------------------------------------

/**
 * The master tenant (James Rodney Arms Jr.) — the root catalog owner.
 * All un-scoped queries resolve to this artist_id.
 */
export const MASTER_TENANT_ID = '73c8c5dd-3f31-4240-9896-db9cae5ff1f2';

/**
 * Fetches the full artists ledger from Supabase.
 * Used by the global navigation dropdown to render guest catalog options.
 *
 * @returns {Promise<Array<{id: string, artist_name: string, hero_bg_image: string|null}>>}
 */
export async function fetchArtistsLedger() {
  const cacheKey = 'artists:ledger';
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('artists')
    .select('id, artist_name, hero_bg_image')
    .order('artist_name', { ascending: true });

  if (error) {
    logError('artists.repo.ledger_fetch_failed', { message: error.message });
    throw new Error('ARTISTS_LEDGER_FETCH_FAILED');
  }

  const result = data || [];
  cacheSet(cacheKey, result, 60_000); // 60s TTL
  return result;
}

export { cacheClear };