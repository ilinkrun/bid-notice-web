import { gql } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import MybidTable from '@/components/mybids/MybidTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import UnifiedDataLoadingWrapper from '@/components/shared/UnifiedDataLoadingWrapper';
import '../../themes.css';

const GET_BIDDING_BIDS = gql`
  query GetBiddingBids {
    mybidsByStatus(status: "응찰") {
      mid
      nid
      title
      status
      startedAt
      endedAt
      memo
      orgName
      postedAt
      detail
      detailUrl
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
    return result.data?.mybidsByStatus || [];
  } catch (error) {
    console.error('Failed to fetch bidding bids:', error);
    return [];
  }
}

export default async function BiddingPage() {
  const bids = await getBiddingBids();

  return (
    <div className="theme-etc">
      <ApolloWrapper>
        <UnifiedDataLoadingWrapper data={bids}>
          <MybidTable bids={bids} currentStatus="bidding" />
        </UnifiedDataLoadingWrapper>
      </ApolloWrapper>
    </div>
  );
}