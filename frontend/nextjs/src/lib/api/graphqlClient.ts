import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

let client: ApolloClient<object> | null = null;

export function getClient() {
  if (!client) {
    const uri = process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql';
    
    client = new ApolloClient({
      link: new HttpLink({
        uri,
        fetch: (uri, options) => {
          // 서버 컴포넌트에서 fetch를 사용할 수 있도록 설정
          return fetch(uri, {
            ...options,
            cache: 'no-store',
          });
        },
      }),
      cache: new InMemoryCache(),
      defaultOptions: {
        query: {
          fetchPolicy: 'no-cache',
        },
      },
    });
  }
  return client;
} 