/**
 * Environment configuration for ilmac-bid-web backend
 * Centralizes all environment variable access and provides defaults
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  server: {
    port: parseInt(process.env.BE_NODEJS_PORT || '11401'),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  graphql: {
    port: parseInt(process.env.API_GRAPHQL_PORT || '11401'),
    introspection: process.env.GRAPHQL_INTROSPECTION === 'true' || process.env.NODE_ENV !== 'production',
    playground: process.env.GRAPHQL_PLAYGROUND === 'true' || process.env.NODE_ENV !== 'production',
  },

  cors: {
    origin: process.env.CORS_ORIGIN === '*'
      ? true  // Allow all origins
      : process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(url => url.trim())
      : [
        'http://localhost:21026',
        'http://1.231.118.217:11501',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://bid.ilmaceng.com'
      ],
    credentials: process.env.CORS_ORIGIN === '*' ? false : true,
  },

  database: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DB_NAME || 'bid_notices',
  },

  frontend: {
    url: process.env.FE_NEXTJS_PORT
      ? `http://localhost:${process.env.FE_NEXTJS_PORT}`
      : 'http://localhost:11501',
  },
};

export default config;
