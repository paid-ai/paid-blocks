import { dataCache, getCacheKey, CACHE_TTL } from './cache';

type PaidEndpoint = 'invoices' | 'payments' | 'usage' | 'invoice-pdf' | 'pay-invoice' | 'credit-bundles' | 'alert-rules' | 'plan-groups';

export interface PaidBlocksOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

interface ApiClientOptions {
  paidEndpoint: PaidEndpoint;
  customerExternalId?: string;
  invoiceId?: string;
  body?: any;
  options?: PaidBlocksOptions;
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

export async function fetchPaidData({ paidEndpoint, customerExternalId, invoiceId, body, options }: ApiClientOptions) {
  let url: string;
  let cacheKey: string | null = null;
  let ttl: number = 0;
  let method: string = 'GET';

  // Determine URL pattern based on whether baseUrl is provided
  // If baseUrl is provided, assume custom backend with REST API structure
  // If not, use default Next.js proxy pattern
  const baseUrl = options?.baseUrl;
  const isCustomBackend = !!baseUrl;

  if (paidEndpoint === 'pay-invoice' && invoiceId) {
    method = 'POST';
    if (isCustomBackend) {
      // Custom backend pattern: {baseUrl}/payments/pay-invoice
      url = `${baseUrl}/payments/pay-invoice`;
    } else {
      // Next.js proxy pattern: /api/pay-invoice
      url = `/api/pay-invoice`;
    }
    // No caching for payment endpoints
  } else if (paidEndpoint === 'invoice-pdf' && invoiceId) {
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
        case 'credit-bundles':
          url = `${baseUrl}/customers/${customerExternalId}/credit-bundles`;
          break;
        case 'alert-rules':
          url = `${baseUrl}/customers/${customerExternalId}/alert-rules`;
          break;
        case 'plan-groups':
          url = `${baseUrl}/customers/${customerExternalId}/plan-groups`;
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
      case 'credit-bundles':
        cacheKey = getCacheKey.creditBundles(customerExternalId);
        break;
      case 'alert-rules':
        cacheKey = getCacheKey.alertRules(customerExternalId);
        break;
      case 'plan-groups':
        cacheKey = getCacheKey.planGroups(customerExternalId);
        break;
      default:
        throw new Error(`Unknown endpoint: ${paidEndpoint}`);
    }
    ttl = CACHE_TTL.DATA;
  } else {
    throw new Error('Missing required parameters');
  }

  // Only check cache for cacheable endpoints
  if (cacheKey) {
    const cached = dataCache.get(cacheKey);
    if (cached) {
      return new CachedResponse(cached);
    }
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method,
  };

  // Add body for POST requests
  if (body) {
    fetchOptions.body = JSON.stringify(body);
    fetchOptions.headers = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
  } else if (options?.headers) {
    fetchOptions.headers = options.headers;
  }

  // Only use credentials: 'include' if no custom headers are provided
  // When custom headers (like authorization) are provided, we don't need cookies
  if (isCustomBackend && !options?.headers) {
    fetchOptions.credentials = 'include';
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw response;
  }

  const data = await response.json();

  // Only cache GET requests
  if (method === 'GET' && cacheKey) {
    dataCache.set(cacheKey, data, ttl);
  }

  return new CachedResponse(data);
} 