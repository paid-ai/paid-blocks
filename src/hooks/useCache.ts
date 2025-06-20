import { useCallback } from 'react';
import { dataCache, getCacheKey } from '../utils/cache';

export const useCache = () => {
  const clearAllCache = useCallback(() => {
    dataCache.clear();
  }, []);

  const clearCustomerCache = useCallback((customerId: string) => {
    dataCache.delete(getCacheKey.invoices(customerId));
    dataCache.delete(getCacheKey.payments(customerId));
    dataCache.delete(getCacheKey.usage(customerId));
  }, []);

  const clearInvoicePdfCache = useCallback((invoiceId: string) => {
    dataCache.delete(getCacheKey.invoicePdf(invoiceId));
  }, []);

  const refreshCustomerData = useCallback((customerId: string) => {
    clearCustomerCache(customerId);
    window.dispatchEvent(new CustomEvent('cache-refresh', { 
      detail: { customerId, type: 'customer' } 
    }));
  }, [clearCustomerCache]);

  const getCacheStats = useCallback(() => {
    return dataCache.getStats();
  }, []);

  const isCached = useCallback((key: string) => {
    return dataCache.has(key);
  }, []);

  return {
    clearAllCache,
    clearCustomerCache,
    clearInvoicePdfCache,
    refreshCustomerData,
    getCacheStats,
    isCached,
  };
}; 