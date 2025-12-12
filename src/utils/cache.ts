interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
export const dataCache = new DataCache();

// Cache key generators
export const getCacheKey = {
  invoices: (accountId: string) => `invoices:${accountId}`,
  payments: (accountId: string) => `payments:${accountId}`,
  usage: (accountId: string) => `usage:${accountId}`,
  invoicePdf: (invoiceId: string) => `pdf:invoice:${invoiceId}`,
  creditBundles: (accountId: string) => `credit-bundles:${accountId}`,
  alertRules: (accountId: string) => `alert-rules:${accountId}`,
  planGroups: (accountId: string) => `plan-groups:${accountId}`,
};

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  DATA: 30 * 1000,          // 30 seconds for data
  PDF: 30 * 60 * 1000,      // 30 minutes for PDFs
  SHORT: 2 * 60 * 1000,     // 2 minutes for frequently changing data
  LONG: 15 * 60 * 1000,     // 15 minutes for stable data
};

// Cached fetch function
export async function cachedFetch<T>(
  url: string,
  cacheKey: string,
  ttl: number = CACHE_TTL.DATA
): Promise<T> {
  // Check cache first
  const cached = dataCache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Cache the result
  dataCache.set(cacheKey, data, ttl);
  
  return data;
}

// Cleanup interval - run every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    dataCache.cleanup();
  }, 10 * 60 * 1000);
  
  // Expose cache to window for debugging
  (window as any).dataCache = dataCache;
} 