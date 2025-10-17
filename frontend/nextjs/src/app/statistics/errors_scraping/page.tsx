import { Metadata } from 'next';
import { ErrorScrapingStatisticsTable } from '@/components/statistics/ErrorScrapingStatisticsTable';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { PageContainer } from '@/components/shared/PageContainer';

export const metadata: Metadata = {
  title: '스크래핑 오류 통계 | ILMAC BID',
  description: '스크래핑 오류 통계를 확인합니다.',
};

const GET_ERROR_SCRAPINGS = gql`
  query GetErrorScrapings($gap: Int!) {
    logsErrorAll(gap: $gap) {
      id
      orgName
      errorMessage
      time
    }
  }
`;

interface ErrorScraping {
  id: string;
  orgName: string;
  errorMessage: string;
  time: string;
}

async function getErrorScrapings(gap: number = 7): Promise<ErrorScraping[]> {
  const client = getClient();
  try {
    const { data } = await client.query({
      query: GET_ERROR_SCRAPINGS,
      variables: { gap },
      fetchPolicy: 'no-cache',
    });
    return data.logsErrorAll;
  } catch (error) {
    console.error('Failed to fetch error scrapings:', error);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ErrorScrapingStatisticsPage({ searchParams }: PageProps) {
  // gap 파라미터 처리
  const resolvedSearchParams = await searchParams;
  const gapParam = typeof resolvedSearchParams?.gap === 'string' ? resolvedSearchParams.gap : '7';
  const gap = parseInt(gapParam, 10);

  // 유효하지 않은 gap 값 처리
  const validGap = isNaN(gap) || gap < 1 ? 7 : gap;

  // keyword 파라미터 처리
  const keyword = typeof resolvedSearchParams?.keyword === 'string' ? resolvedSearchParams.keyword : '';

  const errorScrapings = await getErrorScrapings(validGap);

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">스크래핑 오류 통계</h1>
      </div>
      <div className="statistics-cell">
        <ApolloWrapper>
          <ErrorScrapingStatisticsTable
            initialData={errorScrapings}
            defaultGap={validGap.toString()}
          />
        </ApolloWrapper>
      </div>
    </PageContainer>
  );
}
