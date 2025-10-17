/**
 * Environment Configuration for Next.js
 *
 * Usage:
 * - Server-side: Access all env variables via process.env
 * - Client-side: Only NEXT_PUBLIC_* variables are accessible
 */

export const env = {
  // Server-side only (not exposed to browser)
  server: {
    mysql: {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DB_NAME || '',
    },
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || '',
      database: process.env.POSTGRES_DB_NAME || '',
    },
  },

  // Client-side (exposed to browser via NEXT_PUBLIC_ prefix)
  client: {
    backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || `http://localhost:${process.env.BE_NODEJS_PORT || '21021'}`,
    graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || `http://localhost:${process.env.API_GRAPHQL_PORT || '21023'}/graphql`,
    restApiUrl: process.env.NEXT_PUBLIC_REST_API_URL || `http://localhost:${process.env.API_REST_PORT || '21024'}`,
  },

  // Available on both server and client
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export default env;
