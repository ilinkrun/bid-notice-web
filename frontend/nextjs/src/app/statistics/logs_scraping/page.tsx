import { Metadata } from 'next';
import { LogScrapingStatisticsTable } from '@/components/statistics/LogScrapingStatisticsTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { PageContainer } from '@/components/shared/PageContainer';

export const metadata: Metadata = {
  title: '스크래핑 로그 통계 | ILMAC BID',
  description: '스크래핑 로그 통계를 확인합니다.',
};

const GET_LOG_SCRAPINGS = gql`
  query GetLogScrapings($gap: Int!) {
    logsScrapingAll(gap: $gap) {
      time
      scrapedCount
      orgName
      insertedCount
      errorCode
      errorMessage
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
    return data.logsScrapingAll;
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
    <PageContainer title="스크래핑 로그 통계">
      <div className="statistics-cell">
        <ApolloWrapper>
          <LogScrapingStatisticsTable
            initialData={logScrapings}
            defaultGap={validGap.toString()}
          />
        </ApolloWrapper>
      </div>
    </PageContainer>
  );
}