type PaidEndpoint = 'invoices' | 'payments' | 'invoice-pdf' | 'usage';

interface Params {
  paidEndpoint: string;
  params: string[];
}

export function handleBlocks(apiBase?: string) {
  return async function GET(
    _request: Request,
    { params }: { params: Params }
  ) {
    try {
      const apiKey = process.env.PAID_API_KEY;
      
      if (!apiKey) {
        console.log('handlePaidUnified - No API key found in environment variables');
        return new Response(
          JSON.stringify({ error: 'API key not configured. Please set PAID_API_KEY environment variable.' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (!apiBase) {
        apiBase = 'https://api.agentpaid.io';
      }

      const paidEndpoint = params.paidEndpoint as PaidEndpoint;
      const routeParams = params.params || [];
      
      let customerExternalId: string | undefined;
      let invoiceId: string | undefined;
      
      if (paidEndpoint === 'invoice-pdf') {
        invoiceId = routeParams[0];
      } else {
        customerExternalId = routeParams[0];
      }

      if ((paidEndpoint === 'invoices' || paidEndpoint === 'payments' || paidEndpoint === 'usage') && !customerExternalId) {
        return new Response(
          JSON.stringify({ error: 'customerExternalId is required for this endpoint' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (paidEndpoint === 'invoice-pdf' && !invoiceId) {
        return new Response(
          JSON.stringify({ error: 'invoiceId is required for invoice PDF endpoint' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      let url: string;
      switch (paidEndpoint) {
        case 'invoices':
          url = `${apiBase}/api/organizations/org/customer/external/${customerExternalId}/invoices`;
          break;
        case 'payments':
          url = `${apiBase}/api/organizations/org/customer/external/${customerExternalId}/payments`;
          break;
        case 'invoice-pdf':
          url = `${apiBase}/api/organizations/org/invoices/${invoiceId}/pdf`;
          break;
        case 'usage':
          url = `${apiBase}/api/organizations/org/customer/external/${customerExternalId}`;
          break;
        default:
          return new Response(
            JSON.stringify({ error: `Unknown endpoint: ${paidEndpoint}` }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          if (paidEndpoint === 'invoice-pdf') {
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage = errorText;
              }
            } catch (textError) {
              console.log(`handlePaidUnified - Could not parse error response for ${paidEndpoint}`);
            }
          } else {
            console.log(`handlePaidUnified - Could not parse error response as JSON for ${paidEndpoint}`);
          }
        }
        
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { 
            status: response.status,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify(data),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error(`Error in handlePaidUnified for ${params.paidEndpoint}:`, error);
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch ${params.paidEndpoint} data`, 
          details: error instanceof Error ? error.message : String(error)
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
} 