import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { startGraphQLServer } from '@/graphql/server';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
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