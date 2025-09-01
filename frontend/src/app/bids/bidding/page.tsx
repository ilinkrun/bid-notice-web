'use client';

import React, { useEffect } from 'react';
import BidTable from '@/components/bids/BidTable';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';

// Mock 데이터
const mockBids = [
  {
    bid: 4,
    category: '공사점검',
    orgName: '강남구청',
    title: '강남구 도로 안전점검 용역',
    region: '서울',
    started_at: '2024-03-18T14:00:00',
    nid: 1004
  },
  {
    bid: 5,
    category: '성능평가',
    orgName: '한국가스공사',
    title: '가스시설 성능평가 용역',
    region: '인천',
    started_at: '2024-03-22T09:30:00',
    nid: 1005
  }
];

export default function BiddingPage() {
  const { finishLoading } = useUnifiedLoading();

  useEffect(() => {
    // 데이터 로딩 완료 후 UI 안정화를 위해 300ms 대기 후 로딩 스피너 제거
    const timer = setTimeout(() => {
      finishLoading();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [finishLoading]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          응찰
        </h1>
        <p className="text-gray-600 mt-2">
          응찰 완료된 공고 목록입니다. 입찰 결과를 추적하고 단계를 변경할 수 있습니다.
        </p>
      </div>
      
      <BidTable bids={mockBids} currentStatus="bidding" />
    </div>
  );
}