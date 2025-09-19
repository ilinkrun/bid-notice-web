import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import cors from 'cors';
import http from 'http';
import { typeDefs } from './schema/index.js';
import { resolvers } from './resolvers/index.js';
import { testConnection } from './lib/mysql.js';

interface MyContext {
  token?: string;
}

async function startServer() {
  // Test MySQL connection first
  console.log('🔗 Testing MySQL connection...');
  await testConnection();
  
  const app = express();
  const httpServer = http.createServer(app);

  // Enable CORS for all routes
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:11501',
      'http://1.231.118.217:11501',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://bid.ilmaceng.com'
    ],
    credentials: true,
  }));

  // Create Apollo Server
  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });

  await server.start();

  // Apply the Apollo GraphQL middleware
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.authorization }),
    }),
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  const PORT = process.env.PORT || 11401;
  const HOST = process.env.HOST || '0.0.0.0';

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT, host: HOST }, resolve));

  console.log(`🚀 GraphQL Server ready at:`);
  console.log(`   - http://localhost:${PORT}/graphql`);
  console.log(`   - http://1.231.118.217:${PORT}/graphql`);
  console.log(`🏥 Health check available at:`);
  console.log(`   - http://localhost:${PORT}/health`);
  console.log(`   - http://1.231.118.217:${PORT}/health`);
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});