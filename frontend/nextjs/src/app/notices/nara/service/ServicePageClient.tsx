'use client';

import { useState, useEffect } from 'react';
import NoticeTable from '@/components/providers/NoticeTable';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { PageContainer } from '@/components/shared/PageContainer';

interface ServiceNotice {
  id: string;
  bidNtceNo: string;
  제목: string;
  기관명: string;
  작성일: string;
  상세페이지주소: string;
  공고일시?: string;
  입찰마감일시?: string;
  개찰일시?: string;
  배정예산금액?: number;
  추정가격?: number;
  공공조달분류명?: string;
  용역구분명?: string;
  조달청일반용역여부?: string;
  지역: string;
  등록: string;
  category: string;
  // 호환성 필드
  title: string;
  orgName: string;
  postedAt: string;
  detailUrl: string;
  region: string;
}

interface ServicePageClientProps {
  notices: ServiceNotice[];
  gap: number;
  sort?: string;
  order?: string;
  limit?: number;
}

export default function ServicePageClient({
  notices,
  gap,
  sort,
  order,
  limit = 100
}: ServicePageClientProps) {
  const { finishLoading } = useUnifiedLoading();

  // 공고 데이터 로딩 완료 감지
  useEffect(() => {
    if (notices !== undefined) {
      console.log(`[ServicePageClient] 데이터 로딩 완료: ${notices.length}개 공고`);
      setTimeout(() => {
        finishLoading();
      }, 100);
    }
  }, [notices, finishLoading]);

  // 용역 유형별 통계
  const serviceStats = notices.reduce((acc, notice) => {
    const serviceType = notice.용역구분명 || '기타';
    acc[serviceType] = (acc[serviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 조달청 일반용역 vs 기타 용역
  const generalServiceCount = notices.filter(n => n.조달청일반용역여부 === 'Y').length;
  const otherServiceCount = notices.length - generalServiceCount;

  // NoticeTable 컴포넌트와 호환되는 포맷으로 변환
  const formattedNotices = notices.map(notice => ({
    nid: notice.id,
    제목: notice.제목,
    기관명: notice.기관명,
    작성일: notice.작성일,
    상세페이지주소: notice.상세페이지주소,
    지역: notice.지역,
    등록: notice.등록,
    category: notice.category,
    title: notice.title,
    orgName: notice.orgName,
    postedAt: notice.postedAt,
    detailUrl: notice.detailUrl,
    region: notice.region,
    registration: notice.등록
  }));

  return (
    <PageContainer>
      <div className="service-page">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">나라장터 용역 공고</h1>
          <p className="text-sm text-gray-600">
            조달청 나라장터에서 수집된 용역 관련 입찰공고 목록입니다. (최근 {gap}일)
          </p>
        </div>

        {/* 통계 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">전체 용역 공고</div>
            <div className="text-2xl font-semibold text-gray-900">{notices.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">조달청 일반용역</div>
            <div className="text-2xl font-semibold text-blue-600">{generalServiceCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">기타 용역</div>
            <div className="text-2xl font-semibold text-green-600">{otherServiceCount}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">용역 유형</div>
            <div className="text-2xl font-semibold text-purple-600">{Object.keys(serviceStats).length}</div>
          </div>
        </div>

        {/* 용역 유형별 분포 */}
        {Object.keys(serviceStats).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">용역 유형별 분포</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Object.entries(serviceStats)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="bg-gray-50 p-3 rounded-md text-center">
                    <div className="text-sm font-medium text-gray-900">{type}</div>
                    <div className="text-lg font-semibold text-blue-600">{count}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 공고 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <NoticeTable
            notices={formattedNotices}
            gap={gap}
            sort={sort}
            order={order}
            isServicePage={true}
            currentCategories={['용역']}
          />
        </div>
      </div>
    </PageContainer>
  );
}