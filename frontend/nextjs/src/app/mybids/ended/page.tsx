import { gql } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import MybidTable from '@/components/mybids/MybidTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import UnifiedDataLoadingWrapper from '@/components/shared/UnifiedDataLoadingWrapper';
import { PageContainer } from '@/components/shared/PageContainer';
import '@/app/themes.css';

const GET_COMPLETED_BIDS = gql`
  query GetCompletedBids {
    mybidsAll {
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
    const completedBids = result.data?.mybidsAll?.filter(bid =>
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
    <PageContainer>
      <div className="category-page statistics-cell">
        <ApolloWrapper>
          <UnifiedDataLoadingWrapper data={bids}>
            <MybidTable bids={bids} currentStatus="ended" />
          </UnifiedDataLoadingWrapper>
        </ApolloWrapper>
      </div>
    </PageContainer>
  );
}