import { Metadata } from 'next';
import { LogScrapingStatisticsTable } from '@/components/statistics/LogScrapingStatisticsTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';

export const metadata: Metadata = {
  title: '스크래핑 로그 통계 | ILMAC BID',
  description: '스크래핑 로그 통계를 확인합니다.',
};

const GET_LOG_SCRAPINGS = gql`
  query GetLogScrapings($gap: Int!) {
    logScrapings(gap: $gap) {
      time
      scrapedCount
      orgName
      insertedCount
    }
  }
`;

interface LogScraping {
  time: string;
  scrapedCount: number;
  orgName: string;
  insertedCount: number;
}

async function getLogScrapings(gap: number = 2): Promise<LogScraping[]> {
  const client = getClient();
  try {
    const { data } = await client.query({
      query: GET_LOG_SCRAPINGS,
      variables: { gap },
      fetchPolicy: 'no-cache',
    });
    return data.logScrapings;
  } catch (error) {
    console.error('Failed to fetch log scrapings:', error);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LogScrapingStatisticsPage({ searchParams }: PageProps) {
  // gap 파라미터 처리
  const resolvedSearchParams = await searchParams;
  const gapParam = typeof resolvedSearchParams?.gap === 'string' ? resolvedSearchParams.gap : '2';
  const gap = parseInt(gapParam, 10);

  // 유효하지 않은 gap 값 처리
  const validGap = isNaN(gap) || gap < 1 ? 2 : gap;
  
  const logScrapings = await getLogScrapings(validGap);

  return (
    <div className="theme-default">
      <div className="container mx-auto">
      <h1 className="text-xl font-bold pt-1 pl-1">스크래핑 로그 통계</h1>
        <div className="statistics-cell">
          <ApolloWrapper>
            <LogScrapingStatisticsTable 
              initialData={logScrapings} 
              defaultGap={validGap.toString()} 
            />
          </ApolloWrapper>
        </div>
      </div>
    </div>
  );
}