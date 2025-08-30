'use client';

import React from 'react';
import BidTable from '@/components/bids/BidTable';

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

export default function BidFavoritesPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          즐겨찾기
        </h1>
        <p className="text-gray-600 mt-2">
          관심 공고 및 즐겨찾기를 관리합니다. 중요한 공고들을 빠르게 접근하고 모니터링하세요.
        </p>
      </div>
      
      <BidTable bids={mockBids} currentStatus="favorites" />
    </div>
  );
}