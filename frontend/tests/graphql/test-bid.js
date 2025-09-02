import { test, describe } from 'node:test';
import assert from 'node:assert';
import { GraphQLClient } from 'graphql-request';

const GRAPHQL_ENDPOINT = 'http://localhost:11501/api/graphql';
const client = new GraphQLClient(GRAPHQL_ENDPOINT);

describe('Bid GraphQL Tests', () => {
  test('should fetch my bids', async () => {
    const query = `
      query GetMyBids {
        myBids {
          bid_id
          title
          org_name
          posted_date
          detail_url
          status
          bid_amount
          deposit_amount
        }
      }
    `;

    try {
      const data = await client.request(query);
      
      console.log('My bids response:', JSON.stringify(data, null, 2));
      assert.ok(data.myBids, 'My bids should be returned');
      assert.ok(Array.isArray(data.myBids), 'My bids should be an array');
      
      if (data.myBids.length > 0) {
        const bid = data.myBids[0];
        assert.ok(bid.bid_id, 'Bid should have bid_id');
        assert.ok(bid.title, 'Bid should have title');
        assert.ok(bid.org_name, 'Bid should have org_name');
      }
    } catch (error) {
      console.error('Error testing my bids:', error);
      throw error;
    }
  });

  test('should fetch bids by status', async () => {
    const query = `
      query GetBidsByStatus($status: String!) {
        bidsByStatus(status: $status) {
          bid_id
          title
          org_name
          posted_date
          detail_url
          status
          bid_amount
          deposit_amount
        }
      }
    `;

    try {
      const variables = { status: "진행중" };
      const data = await client.request(query, variables);
      
      console.log('Bids by status response:', JSON.stringify(data, null, 2));
      assert.ok(data.bidsByStatus, 'Bids by status should be returned');
      assert.ok(Array.isArray(data.bidsByStatus), 'Bids by status should be an array');
      
      if (data.bidsByStatus.length > 0) {
        const bid = data.bidsByStatus[0];
        assert.ok(bid.bid_id, 'Bid should have bid_id');
        assert.strictEqual(bid.status, "진행중", 'Bid status should match filter');
      }
    } catch (error) {
      console.error('Error testing bids by status:', error);
      throw error;
    }
  });

  test('should update bid status', async () => {
    const mutation = `
      mutation UpdateBidStatus($bidId: String!, $status: String!) {
        updateBidStatus(bidId: $bidId, status: $status) {
          success
          message
        }
      }
    `;

    try {
      const variables = {
        bidId: "test-bid-1",
        status: "참여완료"
      };
      const data = await client.request(mutation, variables);
      
      console.log('Update bid status response:', JSON.stringify(data, null, 2));
      assert.ok(data.updateBidStatus, 'Update result should be returned');
      assert.ok(typeof data.updateBidStatus.success === 'boolean', 'Success should be boolean');
    } catch (error) {
      console.error('Error testing bid status update:', error);
      throw error;
    }
  });
});