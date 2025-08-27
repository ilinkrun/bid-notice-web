import { gql } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NoticeStatisticsChart } from '@/components/statistics/NoticeStatisticsChart';
import { NoticeStatisticsTable } from '@/components/statistics/NoticeStatisticsTable';
import { AlertCircle } from 'lucide-react';
import { getClient } from '@/lib/api/graphqlClient';
import ApolloWrapper from '@/components/providers/ApolloWrapper';

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData($gap: Int!) {
    noticesStatistics(gap: $gap) {
      orgName
      postedAt
      category
      region
    }
    errorScrapings(gap: $gap) {
      orgNames
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

// 서버 컴포넌트에서 데이터 가져오기
async function getDashboardData() {
  try {
    const client = getClient();
    const result = await client.query({
      query: GET_DASHBOARD_DATA,
      variables: { gap: 10 },
      fetchPolicy: 'no-cache',
    });
    return result.data;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return null;
  }
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
    <div className="container mx-auto p-4 space-y-6 theme-default">
      <ApolloWrapper>
        {/* 최근 스크랩 에러 */}
        <Card className="m-1 rounded-none">
          <CardHeader>
            <CardTitle>최근 스크랩 에러</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {data?.errorScrapings
                ?.slice(0, 4)
                .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                .map((error, index) => (
                  <Alert key={index} variant="destructive" className="mb-0 rounded-none">
                    <AlertCircle className="h-4 w-4 hidden" />
                    <div className={`flex justify-between w-full ${index < 2 ? 'text-red-700' : 'text-orange-700'}`}>
                      <div className="text-left">{error.orgNames.join(', ')}</div>
                      <div className="text-right">{new Date(error.time).toLocaleString('ko-KR')}</div>
                    </div>
                  </Alert>
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
            <CardContent>
              {data?.noticesStatistics?.length > 0 && (
                <NoticeStatisticsTable
                  initialData={data.noticesStatistics}
                  defaultGap="10"
                  defaultType="region"
                  defaultViewType="chart"
                  hideControls={true}
                  hideTypeSelector={true}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* 알림 */}
        <div className="container px-8 py-6">
          <div className="grid gap-6 lg:grid-cols-4">
            {/* 공지사항 */}
            <Card className="m-1">
              <CardHeader>
                <CardTitle>공지사항</CardTitle>
              </CardHeader>
              <CardContent>
                {notices.map((notice, index) => (
                  <Alert key={index} variant="destructive" className="mb-0">
                    <AlertTitle>{notice.title}</AlertTitle>
                    <AlertDescription>{notice.description}</AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>

            {/* 최근 스크랩 */}
            <Card className="lg:col-span-2 m-1">
              <CardHeader>
                <CardTitle>최근 스크랩</CardTitle>
              </CardHeader>
              <CardContent>
                <p>최근 스크랩된 공고 목록이 표시됩니다.</p>
              </CardContent>
            </Card>

            {/* 최근 입찰 */}
            <Card className="lg:col-span-2 m-1">
              <CardHeader>
                <CardTitle>최근 입찰</CardTitle>
              </CardHeader>
              <CardContent>
                <p>최근 입찰 목록이 표시됩니다.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ApolloWrapper>
    </div>
  );
}
