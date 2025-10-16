import { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';

export const metadata: Metadata = {
  title: '접속 로그 | ILMAC BID',
  description: '접속 통계',
};

export default function AccessLogsPage() {
  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="h-6 w-6 text-color-primary-foreground" />
        <h1 className="text-2xl font-bold text-color-primary-foreground">접속 로그</h1>
      </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400 dark:border-purple-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-purple-700 dark:text-purple-300">
                현재 접속 로그 페이지는 개발 중입니다. 곧 다음과 같은 기능이 제공될 예정입니다:
              </p>
              <ul className="mt-3 list-disc list-inside text-sm text-purple-700 dark:text-purple-300">
                <li>실시간 접속자 현황</li>
                <li>일별/시간대별 접속 통계</li>
                <li>사용자별 접속 기록</li>
                <li>페이지별 방문 통계</li>
                <li>접속 환경 분석 (브라우저, OS 등)</li>
              </ul>
            </div>
          </div>
        </div>
    </PageContainer>
  );
} 