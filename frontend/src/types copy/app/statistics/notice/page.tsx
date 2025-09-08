import { Metadata } from 'next';
import { NoticeStatisticsTable } from '@/components/statistics/NoticeStatisticsTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';

export const metadata: Metadata = {
  title: '입찰공고 통계 | ILMAC BID',
  description: '입찰공고 통계를 확인합니다.',
};

const GET_NOTICES_STATISTICS = gql`
  query GetNoticesStatistics($gap: Int!) {
    noticesStatistics(gap: $gap) {
      orgName
      postedAt
      category
      region
    }
  }
`;

type NoticeStatistics = any;

async function getNoticesStatistics(gap: number = 14): Promise<any[]> {
  const client = getClient();
  try {
    const { data } = await client.query({
      query: GET_NOTICES_STATISTICS,
      variables: { gap },
      fetchPolicy: 'no-cache',
    });
    return data.noticesStatistics;
  } catch (error) {
    console.error('Failed to fetch notices statistics:', error);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function NoticeStatisticsPage({ searchParams }: PageProps) {
  // searchParams를 await로 처리
  const params = await searchParams;
  
  // gap 파라미터 처리
  const gapParam = typeof params?.gap === 'string' ? params.gap : '14';
  const gap = parseInt(gapParam, 10);

  // 유효하지 않은 gap 값 처리
  const validGap = isNaN(gap) || gap < 1 ? 14 : gap;
  
  const noticesStatistics = await getNoticesStatistics(validGap);

  return (
    <div className="theme-default">
      <div className="container mx-auto">
        <h1 className="text-xl font-bold pt-1 pl-1">입찰공고 통계</h1>
        <div className="statistics-cell overflow-auto">
          <ApolloWrapper>
            <NoticeStatisticsTable 
              initialData={noticesStatistics} 
              defaultGap={validGap.toString()} 
            />
          </ApolloWrapper>
        </div>
      </div>
    </div>
  );
}
