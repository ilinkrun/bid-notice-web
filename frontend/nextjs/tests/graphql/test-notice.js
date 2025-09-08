import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = 'http://localhost:11501/api/graphql';
const client = new GraphQLClient(GRAPHQL_ENDPOINT);

describe('Notice GraphQL Tests', () => {
  test('should fetch notice list', async () => {
    const query = `
      query GetNoticeList($category: String, $gap: Int) {
        notices(category: $category, gap: $gap) {
          nid
          title
          orgName
          postedAt
          detailUrl
          category
          region
        }
      }
    `;

    try {
      const variables = { category: '', gap: 15 };
      const data = await client.request(query, variables);
      
      console.log('Notice list response:', JSON.stringify(data, null, 2));
      assert.ok(data.notices, 'Notices should be returned');
      assert.ok(Array.isArray(data.notices), 'Notices should be an array');
      
      if (data.notices.length > 0) {
        const notice = data.notices[0];
        assert.ok(notice.nid, 'Notice should have nid');
        assert.ok(notice.title, 'Notice should have title');
        assert.ok(notice.orgName, 'Notice should have orgName');
      }
    } catch (error) {
      console.error('Error testing notice list:', error);
      throw error;
    }
  });

  test('should fetch notice statistics', async () => {
    const query = `
      query GetNoticeStatistics($gap: Int) {
        noticesStatistics(gap: $gap) {
          orgName
          noticeCount
        }
      }
    `;

    try {
      const variables = { gap: 15 };
      const data = await client.request(query, variables);
      
      console.log('Notice statistics response:', JSON.stringify(data, null, 2));
      assert.ok(data.noticesStatistics, 'Notice statistics should be returned');
      assert.ok(Array.isArray(data.noticesStatistics), 'Notice statistics should be an array');
      
      if (data.noticesStatistics.length > 0) {
        const stat = data.noticesStatistics[0];
        assert.ok(stat.orgName, 'Statistics should have orgName');
        assert.ok(typeof stat.noticeCount === 'number', 'Statistics should have numeric noticeCount');
      }
    } catch (error) {
      console.error('Error testing notice statistics:', error);
      throw error;
    }
  });

  test('should search notices by keyword', async () => {
    const mutation = `
      mutation SearchNotices($keywords: String!, $nots: String!, $minPoint: Float!, $addWhere: String) {
        searchNotices(keywords: $keywords, nots: $nots, minPoint: $minPoint, addWhere: $addWhere) {
          nid
          title
          orgName
          postedAt
          detailUrl
          category
          region
        }
      }
    `;

    try {
      const variables = {
        keywords: "건설 공사",
        nots: "취소",
        minPoint: 0.5,
        addWhere: ""
      };
      const data = await client.request(mutation, variables);
      
      console.log('Search notices response:', JSON.stringify(data, null, 2));
      assert.ok(data.searchNotices, 'Search results should be returned');
      assert.ok(Array.isArray(data.searchNotices), 'Search results should be an array');
    } catch (error) {
      console.error('Error testing notice search:', error);
      throw error;
    }
  });
});