import { dataCache, getCacheKey, CACHE_TTL } from './cache';

type PaidEndpoint = 'invoices' | 'payments' | 'usage' | 'invoice-pdf';

interface ApiClientOptions {
  paidEndpoint: PaidEndpoint;
  customerExternalId?: string;
  invoiceId?: string;
  baseUrl?: string;
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

export async function fetchPaidData({ paidEndpoint, customerExternalId, invoiceId, baseUrl }: ApiClientOptions) {
  let url: string;
  let cacheKey: string;
  let ttl: number;

  // Determine URL pattern based on whether baseUrl is provided
  // If baseUrl is provided, assume custom backend with REST API structure
  // If not, use default Next.js proxy pattern
  const isCustomBackend = !!baseUrl;

  if (paidEndpoint === 'invoice-pdf' && invoiceId) {
    if (isCustomBackend) {
      // Custom backend pattern: {baseUrl}/invoices/{invoiceId}/pdf
      url = `${baseUrl}/invoices/${invoiceId}/pdf`;
    } else {
      // Next.js proxy pattern: /api/invoice-pdf/{invoiceId}
      url = `/api/${paidEndpoint}/${invoiceId}`;
    }
    cacheKey = getCacheKey.invoicePdf(invoiceId);
    ttl = CACHE_TTL.PDF;
  } else if (customerExternalId) {
    if (isCustomBackend) {
      // Custom backend pattern: {baseUrl}/customers/{customerExternalId}/{endpoint}
      switch (paidEndpoint) {
        case 'invoices':
          url = `${baseUrl}/customers/${customerExternalId}/invoices`;
          break;
        case 'payments':
          url = `${baseUrl}/customers/${customerExternalId}/payments`;
          break;
        case 'usage':
          url = `${baseUrl}/customers/${customerExternalId}/usage`;
          break;
        default:
          throw new Error(`Unknown endpoint: ${paidEndpoint}`);
      }
    } else {
      // Next.js proxy pattern: /api/{endpoint}/{customerExternalId}
      url = `/api/${paidEndpoint}/${customerExternalId}`;
    }

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

  // Include credentials for custom backend to send cookies
  const fetchOptions: RequestInit = isCustomBackend ? { credentials: 'include' } : {};
  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw response;
  }

  const data = await response.json();

  dataCache.set(cacheKey, data, ttl);

  return new CachedResponse(data);
} 