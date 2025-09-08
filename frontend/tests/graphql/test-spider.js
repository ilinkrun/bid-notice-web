import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = 'http://localhost:11501/api/graphql';
const client = new GraphQLClient(GRAPHQL_ENDPOINT);

describe('Spider GraphQL Tests', () => {
  test('should test spider hello endpoint', async () => {
    const query = `
      query SpiderHello {
        spiderHello {
          message
        }
      }
    `;

    try {
      const data = await client.request(query);
      
      console.log('Spider hello response:', JSON.stringify(data, null, 2));
      assert.ok(data.spiderHello, 'Spider hello should be returned');
      assert.ok(data.spiderHello.message, 'Spider hello should have message');
    } catch (error) {
      console.error('Error testing spider hello:', error);
      throw error;
    }
  });

  test('should check fetch list for organization', async () => {
    const query = `
      query CheckFetchList($orgName: String!) {
        checkFetchList(orgName: $orgName) {
          orgName
          success
          errorCode
          errorMessage
          dataCount
          data
        }
      }
    `;

    try {
      const variables = { orgName: "강남구청" };
      const data = await client.request(query, variables);
      
      console.log('Check fetch list response:', JSON.stringify(data, null, 2));
      assert.ok(data.checkFetchList, 'Check fetch list result should be returned');
      assert.strictEqual(data.checkFetchList.orgName, "강남구청", 'Organization name should match');
      assert.ok(typeof data.checkFetchList.success === 'boolean', 'Success should be boolean');
      assert.ok(typeof data.checkFetchList.errorCode === 'number', 'Error code should be number');
      assert.ok(typeof data.checkFetchList.dataCount === 'number', 'Data count should be number');
    } catch (error) {
      console.error('Error testing check fetch list:', error);
      throw error;
    }
  });

  test('should test CSV data', async () => {
    const mutation = `
      mutation TestCsv($csvData: String!) {
        testCsv(csvData: $csvData)
      }
    `;

    try {
      const csvData = `기관명,url,rowXpath
강남구청,https://www.gangnam.go.kr,//table//tr
서초구청,https://www.seocho.go.kr,//div[@class='list']//li`;

      const variables = { csvData };
      const data = await client.request(mutation, variables);
      
      console.log('Test CSV response:', JSON.stringify(data, null, 2));
      assert.ok(data.testCsv, 'CSV test result should be returned');
    } catch (error) {
      console.error('Error testing CSV:', error);
      throw error;
    }
  });
});