import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = 'http://localhost:11501/api/graphql';
const client = new GraphQLClient(GRAPHQL_ENDPOINT);

describe('Base GraphQL Tests', () => {
  test('should return health status', async () => {
    const query = `
      query HealthCheck {
        health
      }
    `;

    try {
      const data = await client.request(query);
      
      console.log('Health check response:', JSON.stringify(data, null, 2));
      assert.ok(data.health, 'Health status should be returned');
      assert.ok(typeof data.health === 'string', 'Health status should be a string');
    } catch (error) {
      console.error('Error testing health check:', error);
      throw error;
    }
  });

  test('should handle GraphQL introspection', async () => {
    const query = `
      query IntrospectionQuery {
        __schema {
          types {
            name
            kind
          }
        }
      }
    `;

    try {
      const data = await client.request(query);
      
      console.log('Schema introspection response received');
      assert.ok(data.__schema, 'Schema should be returned');
      assert.ok(data.__schema.types, 'Schema types should be returned');
      assert.ok(Array.isArray(data.__schema.types), 'Schema types should be an array');
      
      // Check for some expected types
      const typeNames = data.__schema.types.map(type => type.name);
      assert.ok(typeNames.includes('Query'), 'Query type should exist');
      assert.ok(typeNames.includes('Mutation'), 'Mutation type should exist');
      
      console.log(`Found ${data.__schema.types.length} schema types`);
    } catch (error) {
      console.error('Error testing GraphQL introspection:', error);
      throw error;
    }
  });

  test('should handle invalid queries gracefully', async () => {
    const invalidQuery = `
      query InvalidQuery {
        nonExistentField
      }
    `;

    try {
      await client.request(invalidQuery);
      assert.fail('Invalid query should have thrown an error');
    } catch (error) {
      console.log('Invalid query handled correctly with error:', error.message);
      assert.ok(error.message.includes('Cannot query field'), 'Error should mention invalid field');
    }
  });
});