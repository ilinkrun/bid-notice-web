import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = 'http://localhost:11501/api/graphql';
const client = new GraphQLClient(GRAPHQL_ENDPOINT);

describe('Settings GraphQL Tests', () => {
  test('should fetch settings list', async () => {
    const query = `
      query GetSettingsList {
        settingsList {
          sn
          orgName
          url
          region
          registration
          creator
          memo
        }
      }
    `;

    try {
      const data = await client.request(query);
      
      console.log('Settings list response:', JSON.stringify(data, null, 2));
      assert.ok(data.settingsList, 'Settings list should be returned');
      assert.ok(Array.isArray(data.settingsList), 'Settings list should be an array');
      
      if (data.settingsList.length > 0) {
        const setting = data.settingsList[0];
        assert.ok(setting.sn, 'Setting should have sn');
        assert.ok(setting.orgName, 'Setting should have orgName');
        assert.ok(setting.url, 'Setting should have url');
      }
    } catch (error) {
      console.error('Error testing settings list:', error);
      throw error;
    }
  });

  test('should fetch settings categories', async () => {
    const query = `
      query GetSettingsCategories {
        settingsCategorys {
          sn
          keywords
          nots
          minPoint
          category
          creator
          memo
        }
      }
    `;

    try {
      const data = await client.request(query);
      
      console.log('Settings categories response:', JSON.stringify(data, null, 2));
      assert.ok(data.settingsCategorys, 'Settings categories should be returned');
      assert.ok(Array.isArray(data.settingsCategorys), 'Settings categories should be an array');
      
      if (data.settingsCategorys.length > 0) {
        const category = data.settingsCategorys[0];
        assert.ok(category.sn, 'Category should have sn');
        assert.ok(category.keywords, 'Category should have keywords');
        assert.ok(typeof category.minPoint === 'number', 'Category should have numeric minPoint');
      }
    } catch (error) {
      console.error('Error testing settings categories:', error);
      throw error;
    }
  });

  test('should perform category weight search', async () => {
    const mutation = `
      mutation CategoryWeightSearch($keywords: String!, $minPoint: Float!) {
        categoryWeightSearch(keywords: $keywords, minPoint: $minPoint) {
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
        keywords: "건설 공사 도로",
        minPoint: 1.0
      };
      const data = await client.request(mutation, variables);
      
      console.log('Category weight search response:', JSON.stringify(data, null, 2));
      assert.ok(data.categoryWeightSearch, 'Category weight search results should be returned');
      assert.ok(Array.isArray(data.categoryWeightSearch), 'Search results should be an array');
    } catch (error) {
      console.error('Error testing category weight search:', error);
      throw error;
    }
  });

  test('should parse keyword weights', async () => {
    const query = `
      query ParseKeywordWeights($keywordWeightStr: String!) {
        parseKeywordWeights(keywordWeightStr: $keywordWeightStr)
      }
    `;

    try {
      const variables = {
        keywordWeightStr: "건설:2.0,공사:1.5,도로:1.0"
      };
      const data = await client.request(query, variables);
      
      console.log('Parse keyword weights response:', JSON.stringify(data, null, 2));
      assert.ok(data.parseKeywordWeights, 'Parsed keyword weights should be returned');
      assert.ok(Array.isArray(data.parseKeywordWeights), 'Parsed weights should be an array');
    } catch (error) {
      console.error('Error testing keyword weight parsing:', error);
      throw error;
    }
  });
});