'use client';

import { useState, useEffect } from 'react';
import NoticeTable from '@/components/providers/NoticeTable';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { PageContainer } from '@/components/shared/PageContainer';

interface NaraNotice {
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
  지역: string;
  등록: string;
  // 호환성 필드
  title: string;
  orgName: string;
  postedAt: string;
  detailUrl: string;
  region: string;
}

interface NaraPageClientProps {
  notices: NaraNotice[];
  gap: number;
  sort?: string;
  order?: string;
  limit?: number;
  offset?: number;
}

export default function NaraPageClient({
  notices,
  gap,
  sort,
  order,
  limit = 100,
  offset = 0
}: NaraPageClientProps) {
  const { finishLoading } = useUnifiedLoading();
  const [selectedNotices, setSelectedNotices] = useState<Set<string>>(new Set());

  // 공고 데이터 로딩 완료 감지
  useEffect(() => {
    if (notices !== undefined) {
      console.log(`[NaraPageClient] 데이터 로딩 완료: ${notices.length}개 공고`);
      // UI 렌더링이 완료되도록 짧은 지연 후 로딩 완료
      setTimeout(() => {
        finishLoading();
      }, 100);
    }
  }, [notices, finishLoading]);

  const handleSelectNotice = (noticeId: string) => {
    setSelectedNotices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noticeId)) {
        newSet.delete(noticeId);
      } else {
        newSet.add(noticeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedNotices.size === notices.length) {
      setSelectedNotices(new Set());
    } else {
      setSelectedNotices(new Set(notices.map(n => n.id)));
    }
  };

  // NoticeTable 컴포넌트와 호환되는 포맷으로 변환
  const formattedNotices = notices.map(notice => ({
    nid: notice.id,
    제목: notice.제목,
    기관명: notice.기관명,
    작성일: notice.작성일,
    상세페이지주소: notice.상세페이지주소,
    지역: notice.지역,
    등록: notice.등록,
    title: notice.title,
    orgName: notice.orgName,
    postedAt: notice.postedAt,
    detailUrl: notice.detailUrl,
    region: notice.region,
    registration: notice.등록
  }));

  return (
    <PageContainer>
      <div className="nara-page">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">나라장터 입찰공고</h1>
          <p className="text-sm text-gray-600">
            조달청 나라장터에서 수집된 입찰공고 목록입니다. (최근 {gap}일)
          </p>
        </div>

        {/* 통계 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">전체 공고</div>
            <div className="text-2xl font-semibold text-gray-900">{notices.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">선택된 공고</div>
            <div className="text-2xl font-semibold text-blue-600">{selectedNotices.size}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">오늘 마감</div>
            <div className="text-2xl font-semibold text-orange-600">
              {notices.filter(n => {
                if (!n.입찰마감일시) return false;
                const closeDate = new Date(n.입찰마감일시);
                const today = new Date();
                return closeDate.toDateString() === today.toDateString();
              }).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500">진행중</div>
            <div className="text-2xl font-semibold text-green-600">
              {notices.filter(n => {
                if (!n.입찰마감일시) return false;
                const closeDate = new Date(n.입찰마감일시);
                return closeDate > new Date();
              }).length}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        {selectedNotices.size > 0 && (
          <div className="mb-4 flex gap-2">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
            >
              {selectedNotices.size === notices.length ? '전체 선택 해제' : '전체 선택'}
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            >
              선택 항목 내보내기 ({selectedNotices.size})
            </button>
          </div>
        )}

        {/* 공고 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <NoticeTable
            notices={formattedNotices}
            gap={gap}
            sort={sort}
            order={order}
            isNaraPage={true}
          />
        </div>

        {/* 페이지네이션 */}
        {limit && (
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {offset + 1} - {Math.min(offset + limit, notices.length)} / 전체 {notices.length}개
            </div>
            <div className="flex gap-2">
              {offset > 0 && (
                <a
                  href={`?gap=${gap}&limit=${limit}&offset=${Math.max(0, offset - limit)}`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  이전
                </a>
              )}
              {notices.length === limit && (
                <a
                  href={`?gap=${gap}&limit=${limit}&offset=${offset + limit}`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                >
                  다음
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}