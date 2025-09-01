import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = 'http://localhost:11501/api/graphql';
const client = new GraphQLClient(GRAPHQL_ENDPOINT);

describe('MySQL GraphQL Tests', () => {
  test('should execute SQL query', async () => {
    const query = `
      query ExecuteSql($sql: String!) {
        executeSql(sql: $sql)
      }
    `;

    try {
      const variables = {
        sql: "SELECT COUNT(*) as total FROM notice_list LIMIT 1"
      };
      const data = await client.request(query, variables);
      
      console.log('Execute SQL response:', JSON.stringify(data, null, 2));
      assert.ok(data.executeSql, 'SQL execution result should be returned');
      assert.ok(Array.isArray(data.executeSql), 'SQL result should be an array');
    } catch (error) {
      console.error('Error testing SQL execution:', error);
      throw error;
    }
  });

  test('should search notices by weight', async () => {
    const mutation = `
      mutation SearchNoticesByWeight(
        $keywords: String!
        $nots: String!
        $minPoint: Float!
        $addWhere: String
        $baseSql: String
        $addSql: String
      ) {
        searchNoticesByWeight(
          keywords: $keywords
          nots: $nots
          minPoint: $minPoint
          addWhere: $addWhere
          baseSql: $baseSql
          addSql: $addSql
        ) {
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
        nots: "취소 중단",
        minPoint: 1.0,
        addWhere: "",
        baseSql: "SELECT `posted_date`, `org_name`, `title`, `detail_url` FROM notice_list",
        addSql: "ORDER BY `posted_date` DESC LIMIT 10"
      };
      const data = await client.request(mutation, variables);
      
      console.log('Search notices by weight response:', JSON.stringify(data, null, 2));
      assert.ok(data.searchNoticesByWeight, 'Weight search results should be returned');
      assert.ok(Array.isArray(data.searchNoticesByWeight), 'Search results should be an array');
      
      if (data.searchNoticesByWeight.length > 0) {
        const notice = data.searchNoticesByWeight[0];
        assert.ok(notice.nid, 'Notice should have nid');
        assert.ok(notice.title, 'Notice should have title');
        assert.ok(notice.orgName, 'Notice should have orgName');
      }
    } catch (error) {
      console.error('Error testing weight-based notice search:', error);
      throw error;
    }
  });
});