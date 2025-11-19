import { PaidBlocksOptions } from './apiClient';

/**
 * Universal query proxy function for both SDK blocks and AI-generated blocks.
 *
 * This function handles:
 * 1. SDK blocks with fixed endpoints (invoices, payments, usage)
 * 2. AI-generated blocks with dynamic queryIds
 *
 * All filter parameters are optional - omit them to fetch all data.
 *
 * @param queryIdOrEndpoint - Either a queryId (UUID) for AI blocks, or endpoint name ('invoices', 'payments', 'usage') for SDK blocks
 * @param customerExternalId - Optional customer filter
 * @param agentExternalId - Optional agent filter
 * @param startDate - Optional start date (ISO format)
 * @param endDate - Optional end date (ISO format)
 * @param options - Optional configuration (baseUrl, headers)
 */
export const runPaidQuery = async (
  queryIdOrEndpoint: string,
  customerExternalId?: string,
  agentExternalId?: string,
  startDate?: string,
  endDate?: string,
  options?: PaidBlocksOptions,
): Promise<Response> => {
  // Detect if this is a UUID (AI-generated block) or endpoint name (SDK block)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(queryIdOrEndpoint);

  const baseUrl = options?.baseUrl;
  const isCustomBackend = !!baseUrl;

  let url: string;
  let method: string;
  const body: Record<string, string> = {};

  // Add filters to body (only if provided)
  if (customerExternalId) body.customerExternalId = customerExternalId;
  if (agentExternalId) body.agentExternalId = agentExternalId;
  if (startDate) body.startDate = startDate;
  if (endDate) body.endDate = endDate;

  if (isUUID) {
    // AI-generated block - use blocks query endpoint with POST + filters
    method = 'POST';
    if (isCustomBackend) {
      // Custom backend: {baseUrl}/blocks/query/{queryId}
      url = `${baseUrl}/blocks/query/${queryIdOrEndpoint}`;
    } else {
      // Next.js proxy: /api/blocks/query/{queryId}
      url = `/api/blocks/query/${queryIdOrEndpoint}`;
    }
  } else {
    // SDK block - use fixed endpoint with GET (backward compatible)
    method = 'GET';
    if (!customerExternalId) {
      throw new Error(`customerExternalId is required for SDK endpoint: ${queryIdOrEndpoint}`);
    }

    if (isCustomBackend) {
      // Custom backend: {baseUrl}/customers/{customerExternalId}/{endpoint}
      url = `${baseUrl}/customers/${customerExternalId}/${queryIdOrEndpoint}`;
    } else {
      // Next.js proxy: /api/{endpoint}/{customerExternalId}
      url = `/api/${queryIdOrEndpoint}/${customerExternalId}`;
    }
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...options?.headers,
    },
  };

  // Only add body and Content-Type for POST requests (AI blocks with filters)
  if (method === 'POST') {
    fetchOptions.headers = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };
    fetchOptions.body = JSON.stringify(body);
  }

  // Only use credentials: 'include' if no custom headers are provided
  if (!options?.headers) {
    fetchOptions.credentials = 'include';
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`Paid API error: ${response.status} ${response.statusText}`);
  }

  return response;
};
