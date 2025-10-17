import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { startGraphQLServer } from '@/graphql/server';
import config from '../env.config.js';

const app = express();
const PORT = config.server.port;

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start GraphQL server
startGraphQLServer(app).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Unified backend server ready at http://localhost:${PORT}`);
    console.log(`📊 GraphQL server ready at http://localhost:${PORT}/graphql`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});