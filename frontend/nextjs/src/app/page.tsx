import { gql } from '@apollo/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NoticeStatisticsChart } from '@/components/statistics/NoticeStatisticsChart';
import { NoticeStatisticsTable } from '@/components/statistics/NoticeStatisticsTable';
import { AlertCircle, TrendingUp, FileText, AlertTriangle, Users } from 'lucide-react';
import { getClient } from '@/lib/api/graphqlClient';
import ApolloWrapper from '@/components/providers/ApolloWrapper';
import UnifiedDataLoadingWrapper from '@/components/shared/UnifiedDataLoadingWrapper';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { Separator } from '@/components/ui/separator';

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

const GET_NOTICE_CATEGORIES = gql`
  query GetNoticeCategories {
    noticeCategoriesActive {
      sn
      category
      keywords
      nots
      minPoint
      creator
      use
    }
  }
`;

const processNoticeStatistics = (notices: any[] = [], categoryLabels: string[] = ['공사점검', '성능평가', '기타']): any[] => {
  const groupedByDate = notices.reduce((acc: any, curr) => {
    const date = curr.postedAt.split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        dayOfWeek: new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' }),
        subtotal: 0,
        total: 0,
      };
      // 동적으로 카테고리 필드 초기화
      categoryLabels.forEach(category => {
        acc[date][category] = 0;
      });
    }

    // 카테고리별 카운트
    if (curr.category && categoryLabels.includes(curr.category)) {
      acc[date][curr.category]++;
    }

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
  let categories: any[] = [];
  
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

  try {
    const categoriesResult = await client.query({
      query: GET_NOTICE_CATEGORIES,
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    });
    categories = categoriesResult.data?.noticeCategoriesActive || [];
  } catch (error) {
    console.error('Failed to fetch notice categories:', error);
  }
  
  return {
    noticesStatistics,
    errorScrapings,
    categories
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
  
  // 카테고리 라벨 추출
  const categoryLabels = data?.categories?.map((cat: any) => cat.category) || ['공사점검', '성능평가', '기타'];
  const processedStatistics = data?.noticesStatistics ? processNoticeStatistics(data.noticesStatistics, categoryLabels) : [];

  // 통계 계산
  const totalNotices = data?.noticesStatistics?.length || 0;
  const totalErrors = data?.errorScrapings?.length || 0;
  const todayNotices = data?.noticesStatistics?.filter(notice => {
    const today = new Date().toDateString();
    const noticeDate = new Date(notice.postedAt).toDateString();
    return today === noticeDate;
  }).length || 0;

  const categoryStats = data?.noticesStatistics?.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {}) || {};

  // 첫 번째 카테고리 이름 (카드 제목용)
  const firstCategoryName = categoryLabels[0] || '공사점검';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">대시보드</h1>
          <p className="text-gray-600 dark:text-gray-400">입찰공고 시스템 현황을 한눈에 확인하세요</p>
        </div>

        <ApolloWrapper>
          <UnifiedDataLoadingWrapper data={data}>
            {/* 주요 지표 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title="총 공고 수"
                value={totalNotices.toLocaleString()}
                description="최근 10일간"
                icon={<FileText className="h-4 w-4" />}
                trend={{ value: 12, isPositive: true }}
              />
              <DashboardCard
                title="오늘 공고"
                value={todayNotices.toLocaleString()}
                description="오늘 수집된 공고"
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <DashboardCard
                title="스크랩 에러"
                value={totalErrors.toLocaleString()}
                description="최근 10일간"
                icon={<AlertTriangle className="h-4 w-4" />}
                trend={{ value: 5, isPositive: false }}
              />
              <DashboardCard
                title={firstCategoryName}
                value={(categoryStats[firstCategoryName] || 0).toLocaleString()}
                description={`${firstCategoryName} 공고`}
                icon={<Users className="h-4 w-4" />}
              />
            </div>

            {/* 차트 섹션 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 유형별 공고 통계 */}
              <DashboardCard
                title="유형별 공고 통계"
                value=""
                className="lg:col-span-2"
              >
                <div className="h-[400px] mt-4">
                  {processedStatistics.length > 0 && (
                    <NoticeStatisticsChart 
                      data={processedStatistics} 
                      type="category" 
                      categoryLabels={categoryLabels}
                    />
                  )}
                </div>
              </DashboardCard>
            </div>

            {/* 상세 정보 섹션 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 최근 스크랩 에러 */}
              <DashboardCard
                title="최근 스크랩 에러"
                value={`${Math.min(6, totalErrors)}개`}
                description="최신 에러 목록"
              >
                <div className="mt-4 space-y-3">
                  {data?.errorScrapings
                    ?.slice(0, 6)
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                    .map((error) => (
                      <div key={error.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="text-sm font-medium">
                          {new Date(error.time).toLocaleDateString('ko-KR')} {new Date(error.time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate ml-2">
                          {error.orgName || '에러없음'}
                        </div>
                      </div>
                    ))}
                  {totalErrors === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      최근 에러가 없습니다
                    </div>
                  )}
                </div>
              </DashboardCard>

              {/* 지역별 공고 통계 */}
              <DashboardCard
                title="지역별 공고 통계"
                value=""
                description="상위 지역별 분포"
              >
                <div className="mt-4 max-h-[400px] overflow-auto">
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
                </div>
              </DashboardCard>
            </div>
          </UnifiedDataLoadingWrapper>
        </ApolloWrapper>
      </div>
    </DashboardLayout>
  );
}
