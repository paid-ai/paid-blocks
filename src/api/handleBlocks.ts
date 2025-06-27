type PaidEndpoint = 'invoices' | 'payments' | 'invoice-pdf' | 'usage';

interface Params {
  paidEndpoint: string;
  params: string[];
}

export function handleBlocks(apiBase?: string) {
  return async function GET(
    _request: Request,
    { params }: { params: Promise<Params> }
  ) {
    let resolvedParams: Params | undefined;
    try {
      const apiKey = process.env.PAID_API_KEY;
      
      if (!apiKey) {
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

      resolvedParams = await params;
      const paidEndpoint = resolvedParams.paidEndpoint as PaidEndpoint;
      const routeParams = resolvedParams.params || [];
      
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
          
          // Provide more specific error messages for PDF endpoint
          if (paidEndpoint === 'invoice-pdf' && response.status === 500) {
            errorMessage = 'PDF generation failed. The invoice may not be available for PDF download or there was an error generating the PDF.';
          }
        } catch (parseError) {
          if (paidEndpoint === 'invoice-pdf') {
            try {
              const errorText = await response.text();
              if (errorText) {
                errorMessage = errorText;
              }
            } catch (textError) {
              // Silently handle text parsing error
            }
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

      // Handle PDF responses differently
      if (paidEndpoint === 'invoice-pdf') {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/pdf')) {
          // If the response is a raw PDF, convert it to base64
          try {
            const pdfBuffer = await response.arrayBuffer();
            
            // Use browser-compatible base64 encoding with chunking for large files
            const uint8Array = new Uint8Array(pdfBuffer);
            let binaryString = '';
            
            // Process in chunks to avoid stack overflow for large files
            const chunkSize = 8192;
            for (let i = 0; i < uint8Array.length; i += chunkSize) {
              const chunk = uint8Array.slice(i, i + chunkSize);
              for (let j = 0; j < chunk.length; j++) {
                binaryString += String.fromCharCode(chunk[j]);
              }
            }
            
            const pdfBase64 = btoa(binaryString);
            
            const pdfData = {
              data: {
                pdfBytes: pdfBase64
              }
            };
            
            return new Response(
              JSON.stringify(pdfData),
              { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          } catch (conversionError) {
            return new Response(
              JSON.stringify({ error: 'Failed to process PDF data' }),
              { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        } else {
          // If the response is already JSON (expected format), return as is
          try {
            const data = await response.json();
            return new Response(
              JSON.stringify(data),
              { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          } catch (jsonError) {
            return new Response(
              JSON.stringify({ error: 'Invalid PDF response format' }),
              { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        }
      }

      // For non-PDF endpoints, handle as JSON
      const data = await response.json();
      return new Response(
        JSON.stringify(data),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      const endpointName = resolvedParams?.paidEndpoint || 'unknown';
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch ${endpointName} data`, 
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