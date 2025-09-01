'use client';

import React, { useEffect } from 'react';
import BidTable from '@/components/bids/BidTable';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';

// Mock 데이터
const mockBids = [
  {
    bid: 10,
    category: '기타',
    orgName: '경기도청',
    title: '도로시설물 점검 용역',
    region: '경기',
    started_at: '2024-03-10T14:00:00',
    nid: 1010
  }
];

export default function AbandonedPage() {
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
          포기
        </h1>
        <p className="text-gray-600 mt-2">
          포기한 공고 목록입니다. 필요에 따라 다른 단계로 변경할 수 있습니다.
        </p>
      </div>
      
      <BidTable bids={mockBids} currentStatus="abandoned" />
    </div>
  );
}