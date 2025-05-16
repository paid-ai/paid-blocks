export function handlePaidUsage(apiKey: string) {
  return async function GET(
    request: Request,
    { params }: { params: { accountExternalId: string } }
  ) {
    try {
      const apiBase = 'https://api.agentpaid.io';
      const { accountExternalId } = params;

      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'API key not configured' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('apiKey', apiKey);
      console.log('accountExternalId', accountExternalId);

      const response = await fetch(
        `${apiBase}/api/organizations/org/customer/external/${accountExternalId}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
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
      console.error('Error fetching usage data:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch usage data' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
} 