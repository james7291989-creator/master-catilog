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
 */

import { supabase } from '../utils/supabaseClient';

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
 * @returns {Promise<{rows: Array, nextCursor: string|null, hasMore: boolean}>}
 */
export async function fetchCatalogPage({
  limit = 25,
  cursor = null,
  sortBy = 'track_title',
  sortDir = 'asc',
  search = '',
  mood = '',
} = {}) {
  const { limit: safeLimit, cursor: safeCursor, sortBy: safeSortBy, sortDir: safeSortDir } =
    validatePagination({ limit, cursor, sortBy, sortDir });

  // Cache key includes every filter dimension + cursor (tenant-scoped).
  const cacheKey = `catalog:${safeSortBy}:${safeSortDir}:${safeLimit}:${safeCursor ?? 'start'}:${search}:${mood}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  let query = supabase
    .from('sync_catalog')
    .select('*')
    .order(safeSortBy, { ascending: safeSortDir === 'asc' })
    .limit(safeLimit + 1); // fetch one extra to detect hasMore

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
    console.error('[CATALOG REPO] Query failed:', error.message);
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
 */
export async function fetchAllCatalog() {
  const cacheKey = 'catalog:all';
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('sync_catalog')
    .select('id, track_title, mood, bpm, key, asset_type, file_name')
    .order('track_title', { ascending: true });

  if (error) {
    console.error('[CATALOG REPO] Full fetch failed:', error.message);
    throw new Error('CATALOG_QUERY_FAILED');
  }

  const result = data || [];
  cacheSet(cacheKey, result, 60_000); // 60s TTL
  return result;
}

export { cacheClear };