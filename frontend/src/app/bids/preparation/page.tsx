'use client';

import React from 'react';
import BidTable from '@/components/bids/BidTable';

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

export default function BidPreparationPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          입찰 준비
        </h1>
        <p className="text-gray-600 mt-2">
          입찰 준비 단계의 공고들을 관리합니다. 입찰 문서 작성, 견적서 준비 등을 진행하세요.
        </p>
      </div>
      
      <BidTable bids={mockBids} currentStatus="preparation" />
    </div>
  );
}