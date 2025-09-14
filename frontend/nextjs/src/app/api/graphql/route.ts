import { NextRequest, NextResponse } from 'next/server';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:4000/graphql';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('GraphQL Proxy - Request:', body);
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('GraphQL Server Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'GraphQL server error', details: `${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('GraphQL Proxy - Response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('GraphQL Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'GraphQL endpoint - use POST method' }, { status: 405 });
}