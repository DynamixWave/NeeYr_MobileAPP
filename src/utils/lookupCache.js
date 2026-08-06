import AsyncStorage from '@react-native-async-storage/async-storage';
import ENDPOINTS from '../endpoint/endpoints';

export const CACHE_KEYS = {
  CATEGORIES: '@neeyr/cache/categories',
  REGIONS: '@neeyr/cache/regions',
  CITIES: '@neeyr/cache/cities',
  PROFILE: '@neeyr/cache/profile',
};

const extractArray = (resData) => {
  if (Array.isArray(resData)) return resData;
  if (resData && Array.isArray(resData.results)) return resData.results;
  if (resData && Array.isArray(resData.data)) return resData.data;
  return [];
};

/** Stable content stamp used as updated_at (API has no updated_at field). */
const listStamp = (items) => {
  const list = Array.isArray(items) ? items : [];
  const parts = list.map((item) => {
    const id = item?.id ?? '';
    const name = item?.name ?? item?.title ?? '';
    const region = item?.region ?? '';
    const icon = item?.icon ?? '';
    return `${id}:${name}:${region}:${icon}`;
  });
  return `${list.length}|${parts.join(';')}`;
};

const profileStamp = (profile) => {
  const owner = profile?.owner || profile || {};
  const user = owner?.user || profile?.user || {};
  return [
    owner.id || '',
    owner.business_name || '',
    owner.phone_number || '',
    owner.logo || '',
    owner.is_verified ? '1' : '0',
    owner.plan_expires_at || '',
    owner.current_plan || '',
    user.id || '',
    user.username || '',
    user.email || '',
    user.last_login || '',
    user.is_owner ? '1' : '0',
  ].join('|');
};

const readCache = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.data === undefined || !parsed.updated_at) return null;
    return parsed;
  } catch (e) {
    console.warn('Cache read failed:', key, e);
    return null;
  }
};

const writeCache = async (key, data, updated_at) => {
  const payload = {
    data,
    updated_at,
    cached_at: new Date().toISOString(),
  };
  await AsyncStorage.setItem(key, JSON.stringify(payload));
  return payload;
};

/**
 * Fetch all pages from a paginated DRF list endpoint.
 */
const fetchAllPages = async (baseUrl, headers = {}) => {
  const pageSize = 100;
  let url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}page_size=${pageSize}`;
  const all = [];
  let guard = 0;

  while (url && guard < 50) {
    guard += 1;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    });
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json?.detail || json?.error || `Request failed (${response.status})`);
    }
    all.push(...extractArray(json));
    url = json?.next || null;
  }

  return all;
};

/**
 * Stale-while-revalidate cache:
 * 1) return cached data immediately via onCacheHit (if any)
 * 2) fetch fresh data and compute updated_at stamp
 * 3) only rewrite AsyncStorage when stamp differs
 */
const getCachedResource = async ({
  key,
  fetchFresh,
  buildStamp,
  forceRefresh = false,
  onCacheHit,
}) => {
  const cached = await readCache(key);

  if (cached?.data != null && !forceRefresh && typeof onCacheHit === 'function') {
    onCacheHit(cached.data, cached);
  }

  // If we have cache and aren't forcing network, still revalidate;
  // callers that only want cache can use peekCache.
  let freshData;
  try {
    freshData = await fetchFresh();
  } catch (networkError) {
    if (cached?.data != null) {
      console.warn(`Using stale cache for ${key} after network error:`, networkError?.message);
      return {
        data: cached.data,
        updated_at: cached.updated_at,
        cached_at: cached.cached_at,
        fromCache: true,
        refreshed: false,
        networkError: true,
      };
    }
    throw networkError;
  }

  const freshStamp = buildStamp(freshData);

  if (cached && cached.updated_at === freshStamp) {
    return {
      data: cached.data,
      updated_at: cached.updated_at,
      cached_at: cached.cached_at,
      fromCache: true,
      refreshed: false,
    };
  }

  const saved = await writeCache(key, freshData, freshStamp);
  return {
    data: freshData,
    updated_at: saved.updated_at,
    cached_at: saved.cached_at,
    fromCache: false,
    refreshed: true,
  };
};

export const peekCache = async (key) => readCache(key);

export const invalidateCache = async (...keys) => {
  const list = keys.length ? keys : Object.values(CACHE_KEYS);
  await AsyncStorage.multiRemove(list);
};

export const invalidateProfileCache = async () => {
  await AsyncStorage.removeItem(CACHE_KEYS.PROFILE);
};

export const getCategories = async (options = {}) =>
  getCachedResource({
    key: CACHE_KEYS.CATEGORIES,
    fetchFresh: () => fetchAllPages(ENDPOINTS.CATEGORIES),
    buildStamp: listStamp,
    ...options,
  });

export const getRegions = async (options = {}) =>
  getCachedResource({
    key: CACHE_KEYS.REGIONS,
    fetchFresh: () => fetchAllPages(ENDPOINTS.REGIONS),
    buildStamp: listStamp,
    ...options,
  });

export const getCities = async (options = {}) =>
  getCachedResource({
    key: CACHE_KEYS.CITIES,
    fetchFresh: () => fetchAllPages(ENDPOINTS.CITIES),
    buildStamp: listStamp,
    ...options,
  });

/**
 * Profile requires Authorization header.
 * Cache is cleared on logout / profile mutations.
 */
export const getProfile = async (authHeader, options = {}) => {
  if (!authHeader) {
    throw new Error('Missing auth token for profile');
  }

  return getCachedResource({
    key: CACHE_KEYS.PROFILE,
    fetchFresh: async () => {
      let response = await fetch(ENDPOINTS.PROFILE, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: authHeader,
        },
      });

      // JWT fallback if token was stored without Bearer prefix handling upstream
      if (response.status === 401 && !String(authHeader).startsWith('Bearer ')) {
        const bearer = authHeader.includes(' ')
          ? authHeader
          : `Bearer ${authHeader}`;
        const retry = await fetch(ENDPOINTS.PROFILE, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: bearer,
          },
        });
        if (retry.ok) {
          response = retry;
        }
      }

      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data?.detail || data?.error || 'Failed to fetch profile');
        err.status = response.status;
        err.data = data;
        throw err;
      }
      return data;
    },
    buildStamp: profileStamp,
    ...options,
  });
};

/**
 * After a successful profile create/update, replace cache with new payload.
 */
export const setProfileCache = async (profileData) => {
  if (!profileData) {
    await invalidateProfileCache();
    return null;
  }
  return writeCache(CACHE_KEYS.PROFILE, profileData, profileStamp(profileData));
};

export default {
  CACHE_KEYS,
  getCategories,
  getRegions,
  getCities,
  getProfile,
  setProfileCache,
  invalidateCache,
  invalidateProfileCache,
  peekCache,
};
