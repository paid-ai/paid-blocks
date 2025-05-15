import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { accountId: string } }
) {
  try {
    const apiKey = process.env.PAID_API_KEY;
    const apiBase = 'https://api.agentpaid.io';
    const { accountId } = params;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${apiBase}/api/organizations/${accountId}/customer/external/${accountId}`,
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
} 