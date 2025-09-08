import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
      extensions: error.extensions,
    };
  },
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req, res) => {
    return {
      req,
      res,
    };
  },
});

export async function GET(request: NextRequest) {
  try {
    return await handler(request);
  } catch (error) {
    console.error('GraphQL GET Error:', error);
    return new Response(JSON.stringify({
      errors: [{ message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } }]
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await handler(request);
    // CORS 헤더 추가
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error('GraphQL POST Error:', error);
    return new Response(JSON.stringify({
      errors: [{ message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } }]
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
}

// OPTIONS 요청에 대한 처리 추가
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
