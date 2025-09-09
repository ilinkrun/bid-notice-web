import { gql } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import BidTable from '@/components/bids/BidTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import UnifiedDataLoadingWrapper from '@/components/shared/UnifiedDataLoadingWrapper';
import '../../themes.css';

const GET_PROGRESS_BIDS = gql`
  query GetProgressBids {
    mybidsByStatus(status: "진행") {
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
      category
      region
    }
  }
`;

// 서버 컴포넌트에서 데이터 가져오기
async function getProgressBids() {
  try {
    const client = getClient();
    const result = await client.query({
      query: GET_PROGRESS_BIDS,
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    });
    return result.data?.mybidsByStatus || [];
  } catch (error) {
    console.error('Failed to fetch progress bids:', error);
    return [];
  }
}

export default async function BidProgressPage() {
  const bids = await getProgressBids();

  return (
    <div className="theme-etc">
      <ApolloWrapper>
        <UnifiedDataLoadingWrapper data={bids}>
          <BidTable bids={bids} currentStatus="progress" />
        </UnifiedDataLoadingWrapper>
      </ApolloWrapper>
    </div>
  );
}