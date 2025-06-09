export function handlePaidInvoicePdf(apiKey: string, apiBase?: string) {
    return async function GET(
      _: Request,
      { params }: { params: { invoiceId: string } }
    ) {
      try {
        if (!apiBase) {
            apiBase = 'https://api.agentpaid.io';
        }

        const { invoiceId } = params;
  
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: 'API key not configured' }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        const url = `${apiBase}/api/organizations/org/invoices/${invoiceId}/pdf`;
  
        const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          }
        );

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (parseError) {
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage = errorText;
              }
            } catch (textError) {
              console.log('handlePaidInvoicePdf - Could not parse error response');
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
        console.error('Error fetching invoice PDF:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch invoice PDF', 
            details: error instanceof Error ? error.message : String(error)
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }
  } 