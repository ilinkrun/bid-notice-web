'use client';

import React, { useEffect } from 'react';
import BidTable from '@/components/bids/BidTable';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';

// Mock 데이터
const mockBids = [
  {
    bid: 1,
    category: '공사점검',
    orgName: '서울시 중구청',
    title: '중구청 건물 안전점검 용역',
    region: '서울',
    started_at: '2024-03-15T09:00:00',
    nid: 1001
  },
  {
    bid: 2,
    category: '성능평가',
    orgName: '한국전력공사',
    title: '발전소 성능평가 및 진단 용역',
    region: '경기',
    started_at: '2024-03-20T10:00:00',
    nid: 1002
  },
  {
    bid: 3,
    category: '기타',
    orgName: '부산광역시',
    title: '부산항 시설물 점검 용역',
    region: '부산',
    started_at: '2024-03-25T11:00:00',
    nid: 1003
  }
];

export default function BidProgressPage() {
  const { finishLoading } = useUnifiedLoading();

  useEffect(() => {
    // 페이지가 완전히 렌더링된 후 로딩 완료
    const timer = setTimeout(() => {
      finishLoading();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [finishLoading]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          진행
        </h1>
        <p className="text-gray-600 mt-2">
          입찰 준비중인 공고 목록입니다. 응찰용 문서를 작성하고 입찰 단계를 관리하세요.
        </p>
      </div>
      
      <BidTable bids={mockBids} currentStatus="progress" />
    </div>
  );
}