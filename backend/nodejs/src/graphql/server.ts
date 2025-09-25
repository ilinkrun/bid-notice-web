import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { Application } from 'express';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

let apolloServer: ApolloServer | null = null;

export async function startGraphQLServer(app: Application) {
  if (apolloServer) {
    return apolloServer;
  }

  apolloServer = new ApolloServer({
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

  await apolloServer.start();

  // GraphQL endpoint 설정
  app.use('/graphql', expressMiddleware(apolloServer, {
    context: async ({ req, res }) => {
      return {
        req,
        res,
      };
    },
  }));

  console.log('GraphQL server initialized');
  return apolloServer;
}
