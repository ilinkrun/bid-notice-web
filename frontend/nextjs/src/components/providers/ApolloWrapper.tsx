'use client';

import { ApolloProvider } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';

export default function ApolloWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = getClient();
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
} 