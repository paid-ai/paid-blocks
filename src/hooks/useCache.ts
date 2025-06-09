import { useCallback } from 'react';
import { dataCache, getCacheKey } from '../utils/cache';

export const useCache = () => {
  // Clear all cache
  const clearAllCache = useCallback(() => {
    dataCache.clear();
  }, []);

  // Clear cache for specific account
  const clearAccountCache = useCallback((accountId: string) => {
    dataCache.delete(getCacheKey.invoices(accountId));
    dataCache.delete(getCacheKey.payments(accountId));
    dataCache.delete(getCacheKey.usage(accountId));
  }, []);

  // Clear PDF cache for specific invoice
  const clearInvoicePdfCache = useCallback((invoiceId: string) => {
    dataCache.delete(getCacheKey.invoicePdf(invoiceId));
  }, []);

  // Force refresh data for account (clears cache and triggers refetch)
  const refreshAccountData = useCallback((accountId: string) => {
    clearAccountCache(accountId);
    // Trigger a custom event that components can listen to for refetching
    window.dispatchEvent(new CustomEvent('cache-refresh', { 
      detail: { accountId, type: 'account' } 
    }));
  }, [clearAccountCache]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return dataCache.getStats();
  }, []);

  // Check if data is cached
  const isCached = useCallback((key: string) => {
    return dataCache.has(key);
  }, []);

  return {
    clearAllCache,
    clearAccountCache,
    clearInvoicePdfCache,
    refreshAccountData,
    getCacheStats,
    isCached,
  };
}; 