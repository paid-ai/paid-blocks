import { dataCache, getCacheKey, CACHE_TTL } from './cache';

type PaidEndpoint = 'invoices' | 'payments' | 'usage' | 'invoice-pdf';

interface ApiClientOptions {
  paidEndpoint: PaidEndpoint;
  customerExternalId?: string;
  invoiceId?: string;
}

class CachedResponse {
  private data: any;
  
  constructor(data: any) {
    this.data = data;
  }
  
  get ok() {
    return true;
  }
  
  get status() {
    return 200;
  }
  
  get statusText() {
    return 'OK';
  }
  
  async json() {
    return this.data;
  }
}

export async function fetchPaidData({ paidEndpoint, customerExternalId, invoiceId }: ApiClientOptions) {
  let url: string;
  let cacheKey: string;
  let ttl: number;
  
  if (paidEndpoint === 'invoice-pdf' && invoiceId) {
    url = `/api/${paidEndpoint}/${invoiceId}`;
    cacheKey = getCacheKey.invoicePdf(invoiceId);
    ttl = CACHE_TTL.PDF;
  } else if (customerExternalId) {
    url = `/api/${paidEndpoint}/${customerExternalId}`;
    switch (paidEndpoint) {
      case 'invoices':
        cacheKey = getCacheKey.invoices(customerExternalId);
        break;
      case 'payments':
        cacheKey = getCacheKey.payments(customerExternalId);
        break;
      case 'usage':
        cacheKey = getCacheKey.usage(customerExternalId);
        break;
      default:
        throw new Error(`Unknown endpoint: ${paidEndpoint}`);
    }
    ttl = CACHE_TTL.DATA;
  } else {
    throw new Error('Missing required parameters');
  }

  const cached = dataCache.get(cacheKey);
  if (cached) {
    return new CachedResponse(cached);
  }

  const response = await fetch(url);
  
  if (!response.ok) {
    throw response;
  }

  const data = await response.json();
  
  dataCache.set(cacheKey, data, ttl);
  
  return new CachedResponse(data);
} 