'use client';

import React, { useEffect } from 'react';
import BidTable from '@/components/bids/BidTable';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';

// Mock 데이터
const mockBids = [
  {
    bid: 8,
    category: '공사점검',
    orgName: '송파구청',
    title: '송파구 공공시설 안전점검 용역',
    region: '서울',
    started_at: '2024-03-28T15:00:00',
    nid: 1008
  },
  {
    bid: 9,
    category: '성능평가',
    orgName: '한국수자원공사',
    title: '댐 시설 성능평가 용역',
    region: '충북',
    started_at: '2024-03-30T13:00:00',
    nid: 1009
  }
];

export default function FailedPage() {
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
          패찰
        </h1>
        <p className="text-gray-600 mt-2">
          패찰된 공고 목록입니다. 입찰 결과를 분석하고 단계를 변경할 수 있습니다.
        </p>
      </div>
      
      <BidTable bids={mockBids} currentStatus="failed" />
    </div>
  );
}