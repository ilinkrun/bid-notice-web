import { gql } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import BidTable from '@/components/bids/BidTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import UnifiedDataLoadingWrapper from '@/components/shared/UnifiedDataLoadingWrapper';

const GET_BIDDING_BIDS = gql`
  query GetBiddingBids {
    bidByStatus(status: "응찰") {
      mid
      nid
      title
      status
      started_at
      ended_at
      memo
      orgName
      postedAt
      detail
      category
      region
    }
  }
`;

// 서버 컴포넌트에서 데이터 가져오기
async function getBiddingBids() {
  try {
    const client = getClient();
    const result = await client.query({
      query: GET_BIDDING_BIDS,
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    });
    return result.data?.bidByStatus || [];
  } catch (error) {
    console.error('Failed to fetch bidding bids:', error);
    return [];
  }
}

export default async function BiddingPage() {
  const bids = await getBiddingBids();

  return (
    <div className="p-6">
      <ApolloWrapper>
        <UnifiedDataLoadingWrapper data={bids}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              응찰
            </h1>
            <p className="text-gray-600 mt-2">
              응찰 진행중인 공고 목록입니다. 입찰 서류를 제출하고 결과를 기다리는 단계입니다.
            </p>
          </div>

          <BidTable bids={bids} currentStatus="bidding" />
        </UnifiedDataLoadingWrapper>
      </ApolloWrapper>
    </div>
  );
}