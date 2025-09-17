import { gql } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NoticeStatisticsChart } from '@/components/statistics/NoticeStatisticsChart';
import { NoticeStatisticsTable } from '@/components/statistics/NoticeStatisticsTable';
import { AlertCircle } from 'lucide-react';
import { getClient } from '@/lib/api/graphqlClient';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import UnifiedDataLoadingWrapper from '@/components/shared/UnifiedDataLoadingWrapper';
import { PageContainer } from '@/components/shared/PageContainer';

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

const processNoticeStatistics = (notices: any[] = []): any[] => {
  const groupedByDate = notices.reduce((acc: any, curr) => {
    const date = curr.postedAt.split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        dayOfWeek: new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' }),
        construction: 0,
        performance: 0,
        etc: 0,
        subtotal: 0,
        total: 0,
      };
    }

    if (curr.category === '공사점검') acc[date].construction++;
    else if (curr.category === '성능평가') acc[date].performance++;
    else if (curr.category === '기타') acc[date].etc++;

    acc[date].subtotal++;
    acc[date].total++;

    return acc;
  }, {});

  // 최근 10일간의 데이터만 반환
  return Object.values(groupedByDate)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10);
};

interface ErrorScraping {
  id: string;
  orgName: string;
  errorMessage: string;
  time: string;
}

// 서버 컴포넌트에서 데이터 가져오기
async function getDashboardData() {
  const client = getClient();
  
  // 개별적으로 데이터 가져오기
  let noticesStatistics: any[] = [];
  let errorScrapings: ErrorScraping[] = [];
  
  try {
    const noticesResult = await client.query({
      query: GET_NOTICES_STATISTICS,
      variables: { gap: 10 },
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    });
    noticesStatistics = noticesResult.data?.noticesStatistics || [];
  } catch (error) {
    console.error('Failed to fetch notices statistics:', error);
  }
  
  try {
    const errorsResult = await client.query({
      query: GET_ERROR_SCRAPINGS,
      variables: { gap: 10 },
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    });
    errorScrapings = errorsResult.data?.logsErrorAll || [];
  } catch (error) {
    console.error('Failed to fetch error scrapings:', error);
  }
  
  return {
    noticesStatistics,
    errorScrapings
  };
}

// 공지사항 데이터
const notices = [
  {
    title: '시스템 업데이트 안내',
    description: '2023년 12월 15일 새벽 2시부터 4시까지 시스템 업데이트가 진행됩니다.',
  },
  {
    title: '신규 기능 안내',
    description: '입찰 공고 알림 기능이 추가되었습니다. 설정 메뉴에서 알림 설정을 확인하세요.',
  },
];

export default async function Home() {
  const data = await getDashboardData();
  const processedStatistics = data?.noticesStatistics ? processNoticeStatistics(data.noticesStatistics) : [];

  return (
    <PageContainer>
      <div className="space-y-6">
        <ApolloWrapper>
        <UnifiedDataLoadingWrapper data={data}>
        {/* 최근 스크랩 에러 */}
        <Card className="m-1 rounded-none">
          <CardHeader>
            <CardTitle>최근 스크랩 에러</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {data?.errorScrapings
                ?.slice(0, 6)
                .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                .map((error, index) => (
                  <div key={error.id} className="flex justify-between items-center p-2  border border-border rounded">
                    <div className="text-sm font-medium text-color-primary-muted-foreground">
                      {new Date(error.time).toLocaleDateString('ko-KR')} {new Date(error.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-sm text-color-primary-muted-foreground truncate ml-2">
                      {error.orgName || '에러없음'}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 유형별 통계 */}
          <Card className="lg:col-span-2 m-1 rounded-none">
            <CardHeader>
              <CardTitle>유형별 공고 통계</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              {processedStatistics.length > 0 && <NoticeStatisticsChart data={processedStatistics} type="category" />}
            </CardContent>
          </Card>

          {/* 지역별 통계 */}
          <Card className="lg:col-span-2 m-1 rounded-none">
            <CardHeader>
              <CardTitle>지역별 공고 통계</CardTitle>
            </CardHeader>
            <CardContent className="statistics-cell overflow-auto p-0">
              {data?.noticesStatistics?.length > 0 && (
                <NoticeStatisticsTable
                  initialData={data.noticesStatistics}
                  defaultGap="10"
                  defaultType="region"
                  defaultViewType="table"
                  hideControls={true}
                  hideTypeSelector={true}
                />
              )}
            </CardContent>
          </Card>
        </div>

        </UnifiedDataLoadingWrapper>
        </ApolloWrapper>
      </div>
    </PageContainer>
  );
}
