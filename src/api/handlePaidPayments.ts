export function handlePaidPayments(apiKey: string, apiBase?: string) {
    return async function GET(
      _: Request,
      { params }: { params: { accountExternalId: string } }
    ) {
      try {
        
        if (!apiBase) {
            apiBase = 'https://api.agentpaid.io';
        }

        const { accountExternalId } = params;
  
        if (!apiKey) {
          console.log('handlePaidPayments - No API key provided');
          return new Response(
            JSON.stringify({ error: 'API key not configured' }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        const url = `${apiBase}/api/organizations/org/customer/external/${accountExternalId}/payments`;

        const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
            },
          }
        );

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            // Try to read as JSON first
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (parseError) {
            // If JSON parsing fails, the body has been consumed, so we can't read it as text
            // Just use the HTTP status message
            console.log('handlePaidPayments - Could not parse error response as JSON');
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
        console.error('Error fetching payments:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch payments', 
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