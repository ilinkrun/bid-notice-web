import { gql } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import BidTable from '@/components/bids/BidTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import UnifiedDataLoadingWrapper from '@/components/shared/UnifiedDataLoadingWrapper';
import '../../themes.css';

const GET_COMPLETED_BIDS = gql`
  query GetCompletedBids {
    myBids {
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
async function getCompletedBids() {
  try {
    const client = getClient();
    const result = await client.query({
      query: GET_COMPLETED_BIDS,
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    });
    
    // status가 '포기', '낙찰', '패찰' 중 하나인 것만 필터링
    const completedStatuses = ['포기', '낙찰', '패찰'];
    const completedBids = result.data?.myBids?.filter(bid => 
      completedStatuses.includes(bid.status)
    ) || [];
    
    return completedBids;
  } catch (error) {
    console.error('Failed to fetch completed bids:', error);
    return [];
  }
}

export default async function EndedPage() {
  const bids = await getCompletedBids();

  return (
    <div className="theme-default">
      <ApolloWrapper>
        <UnifiedDataLoadingWrapper data={bids}>
          <BidTable bids={bids} currentStatus="ended" />
        </UnifiedDataLoadingWrapper>
      </ApolloWrapper>
    </div>
  );
}