import { gql } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import BidTable from '@/components/bids/BidTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import UnifiedDataLoadingWrapper from '@/components/shared/UnifiedDataLoadingWrapper';

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
    <div className="p-6">
      <ApolloWrapper>
        <UnifiedDataLoadingWrapper data={bids}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              종료
            </h1>
            <p className="text-gray-600 mt-2">
              종료된 입찰 공고 목록입니다. 낙찰, 패찰, 포기된 입찰들을 확인할 수 있습니다.
            </p>
          </div>

          <BidTable bids={bids} currentStatus="ended" />
        </UnifiedDataLoadingWrapper>
      </ApolloWrapper>
    </div>
  );
}