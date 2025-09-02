import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = 'http://localhost:11501/api/graphql';
const client = new GraphQLClient(GRAPHQL_ENDPOINT);

describe('Statistics GraphQL Tests', () => {
  test('should fetch log scraping statistics', async () => {
    const query = `
      query GetLogScrapings($gap: Int) {
        logScrapings(gap: $gap) {
          orgName
          scrapedCount
          lastScraped
        }
      }
    `;

    try {
      const variables = { gap: 30 };
      const data = await client.request(query, variables);
      
      console.log('Log scraping statistics response:', JSON.stringify(data, null, 2));
      assert.ok(data.logScrapings, 'Log scraping statistics should be returned');
      assert.ok(Array.isArray(data.logScrapings), 'Log scraping statistics should be an array');
      
      if (data.logScrapings.length > 0) {
        const log = data.logScrapings[0];
        assert.ok(log.orgName, 'Log should have orgName');
        assert.ok(typeof log.scrapedCount === 'number', 'Log should have numeric scrapedCount');
        assert.ok(log.lastScraped, 'Log should have lastScraped timestamp');
      }
    } catch (error) {
      console.error('Error testing log scraping statistics:', error);
      throw error;
    }
  });

  test('should fetch error scraping statistics', async () => {
    const query = `
      query GetErrorScrapings($gap: Int!) {
        errorScrapings(gap: $gap) {
          orgNames
          time
        }
      }
    `;

    try {
      const variables = { gap: 30 };
      const data = await client.request(query, variables);
      
      console.log('Error scraping statistics response:', JSON.stringify(data, null, 2));
      assert.ok(data.errorScrapings, 'Error scraping statistics should be returned');
      assert.ok(Array.isArray(data.errorScrapings), 'Error scraping statistics should be an array');
      
      if (data.errorScrapings.length > 0) {
        const error = data.errorScrapings[0];
        assert.ok(error.orgNames, 'Error should have orgNames');
        assert.ok(Array.isArray(error.orgNames), 'orgNames should be an array');
        assert.ok(error.time, 'Error should have time');
      }
    } catch (error) {
      console.error('Error testing error scraping statistics:', error);
      throw error;
    }
  });

  test('should fetch notice region statistics', async () => {
    const query = `
      query GetNoticeRegionStatistics($gap: Int) {
        noticeRegionStatistics(gap: $gap) {
          region
          noticeCount
        }
      }
    `;

    try {
      const variables = { gap: 30 };
      const data = await client.request(query, variables);
      
      console.log('Notice region statistics response:', JSON.stringify(data, null, 2));
      assert.ok(data.noticeRegionStatistics, 'Notice region statistics should be returned');
      assert.ok(Array.isArray(data.noticeRegionStatistics), 'Region statistics should be an array');
      
      if (data.noticeRegionStatistics.length > 0) {
        const stat = data.noticeRegionStatistics[0];
        assert.ok(stat.region, 'Statistics should have region');
        assert.ok(typeof stat.noticeCount === 'number', 'Statistics should have numeric noticeCount');
      }
    } catch (error) {
      console.error('Error testing notice region statistics:', error);
      throw error;
    }
  });
});