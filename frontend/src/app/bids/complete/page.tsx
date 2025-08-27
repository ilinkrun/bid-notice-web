'use client';

import React from 'react';
import BidTable from '@/components/bids/BidTable';

// Mock 데이터
const mockBids = [
  {
    bid: 6,
    category: '공사점검',
    orgName: '서초구청',
    title: '서초구 교량 안전점검 용역',
    region: '서울',
    started_at: '2024-02-10T10:00:00',
    nid: 1006
  },
  {
    bid: 7,
    category: '성능평가',
    orgName: '한국철도공사',
    title: '철도시설 성능평가 용역',
    region: '대전',
    started_at: '2024-02-15T11:00:00',
    nid: 1007
  }
];

export default function BidCompletePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          입찰 완료
        </h1>
        <p className="text-gray-600 mt-2">
          완료된 입찰 결과를 관리합니다. 낙찰/탈락 결과와 분석 정보를 확인하세요.
        </p>
      </div>
      
      <BidTable bids={mockBids} currentStatus="complete" />
    </div>
  );
}