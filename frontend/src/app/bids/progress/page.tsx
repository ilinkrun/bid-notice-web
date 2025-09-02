import { gql } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import BidTable from '@/components/bids/BidTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import UnifiedDataLoadingWrapper from '@/components/shared/UnifiedDataLoadingWrapper';

const GET_PROGRESS_BIDS = gql`
  query GetProgressBids {
    bidByStatus(status: "진행") {
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
async function getProgressBids() {
  try {
    const client = getClient();
    const result = await client.query({
      query: GET_PROGRESS_BIDS,
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    });
    return result.data?.bidByStatus || [];
  } catch (error) {
    console.error('Failed to fetch progress bids:', error);
    return [];
  }
}

export default async function BidProgressPage() {
  const bids = await getProgressBids();

  return (
    <div className="p-6">
      <ApolloWrapper>
        <UnifiedDataLoadingWrapper data={bids}>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              진행
            </h1>
            <p className="text-gray-600 mt-2">
              입찰 준비중인 공고 목록입니다. 응찰용 문서를 작성하고 입찰 단계를 관리하세요.
            </p>
          </div>

          <BidTable bids={bids} currentStatus="progress" />
        </UnifiedDataLoadingWrapper>
      </ApolloWrapper>
    </div>
  );
}