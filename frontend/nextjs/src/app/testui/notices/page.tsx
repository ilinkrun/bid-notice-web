'use client';

import { useState, useEffect } from 'react';
import NoticeTable from '@/components/notices/NoticeTable';
import { Notice } from '@/types/notice';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { PageContainer } from '@/components/shared/PageContainer';
import '../../themes.css';

// 더미 데이터
const dummyNotices: Notice[] = [
  {
    nid: '1',
    제목: '[서울특별시] AI 기반 스마트시티 구축 용역',
    기관명: '서울특별시청',
    작성일: '2025-01-15',
    상세페이지주소: 'https://example.com/notice/1',
    category: 'IT서비스',
    지역: '서울특별시',
    등록: '3',
    title: '[서울특별시] AI 기반 스마트시티 구축 용역',
    orgName: '서울특별시청',
    postedAt: '2025-01-15',
    detailUrl: 'https://example.com/notice/1',
    region: '서울특별시',
    registration: '3'
  },
  {
    nid: '2',
    제목: '[부산광역시] 클라우드 인프라 구축 사업',
    기관명: '부산광역시청',
    작성일: '2025-01-14',
    상세페이지주소: 'https://example.com/notice/2',
    category: 'IT서비스',
    지역: '부산광역시',
    등록: '5',
    title: '[부산광역시] 클라우드 인프라 구축 사업',
    orgName: '부산광역시청',
    postedAt: '2025-01-14',
    detailUrl: 'https://example.com/notice/2',
    region: '부산광역시',
    registration: '5'
  },
  {
    nid: '3',
    제목: '[대구광역시] 빅데이터 플랫폼 개발',
    기관명: '대구광역시청',
    작성일: '2025-01-13',
    상세페이지주소: 'https://example.com/notice/3',
    category: 'IT서비스',
    지역: '대구광역시',
    등록: '2',
    title: '[대구광역시] 빅데이터 플랫폼 개발',
    orgName: '대구광역시청',
    postedAt: '2025-01-13',
    detailUrl: 'https://example.com/notice/3',
    region: '대구광역시',
    registration: '2'
  },
  {
    nid: '4',
    제목: '[인천광역시] IoT 기반 환경모니터링 시스템',
    기관명: '인천광역시청',
    작성일: '2025-01-12',
    상세페이지주소: 'https://example.com/notice/4',
    category: 'IT서비스',
    지역: '인천광역시',
    등록: '4',
    title: '[인천광역시] IoT 기반 환경모니터링 시스템',
    orgName: '인천광역시청',
    postedAt: '2025-01-12',
    detailUrl: 'https://example.com/notice/4',
    region: '인천광역시',
    registration: '4'
  },
  {
    nid: '5',
    제목: '[광주광역시] 블록체인 기반 전자문서 시스템',
    기관명: '광주광역시청',
    작성일: '2025-01-11',
    상세페이지주소: 'https://example.com/notice/5',
    category: 'IT서비스',
    지역: '광주광역시',
    등록: '1',
    title: '[광주광역시] 블록체인 기반 전자문서 시스템',
    orgName: '광주광역시청',
    postedAt: '2025-01-11',
    detailUrl: 'https://example.com/notice/5',
    region: '광주광역시',
    registration: '1'
  },
  {
    nid: '6',
    제목: '[대전광역시] 메타버스 플랫폼 구축',
    기관명: '대전광역시청',
    작성일: '2025-01-10',
    상세페이지주소: 'https://example.com/notice/6',
    category: 'IT서비스',
    지역: '대전광역시',
    등록: '6',
    title: '[대전광역시] 메타버스 플랫폼 구축',
    orgName: '대전광역시청',
    postedAt: '2025-01-10',
    detailUrl: 'https://example.com/notice/6',
    region: '대전광역시',
    registration: '6'
  },
  {
    nid: '7',
    제목: '[울산광역시] 디지털 트윈 도시 모델링',
    기관명: '울산광역시청',
    작성일: '2025-01-09',
    상세페이지주소: 'https://example.com/notice/7',
    category: 'IT서비스',
    지역: '울산광역시',
    등록: '7',
    title: '[울산광역시] 디지털 트윈 도시 모델링',
    orgName: '울산광역시청',
    postedAt: '2025-01-09',
    detailUrl: 'https://example.com/notice/7',
    region: '울산광역시',
    registration: '7'
  },
  {
    nid: '8',
    제목: '[세종특별자치시] 스마트 교통관리 시스템',
    기관명: '세종특별자치시청',
    작성일: '2025-01-08',
    상세페이지주소: 'https://example.com/notice/8',
    category: 'IT서비스',
    지역: '세종특별자치시',
    등록: '8',
    title: '[세종특별자치시] 스마트 교통관리 시스템',
    orgName: '세종특별자치시청',
    postedAt: '2025-01-08',
    detailUrl: 'https://example.com/notice/8',
    region: '세종특별자치시',
    registration: '8'
  }
];

export default function TestNoticesPage() {
  const { finishLoading } = useUnifiedLoading();
  const [notices] = useState<Notice[]>(dummyNotices);

  useEffect(() => {
    // 더미 데이터 로딩 시뮬레이션
    const timer = setTimeout(() => {
      finishLoading();
    }, 100);

    return () => clearTimeout(timer);
  }, [finishLoading]);

  useEffect(() => {
    // 테스트 페이지에서는 테마를 리셋하여 기본 배경색 사용
    const root = document.documentElement;
    root.removeAttribute('data-primary-color');
  }, []);

  return (
    <div className="theme-test-light">
      <PageContainer>
        <div className="category-page statistics-cell">
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md" style={{ margin: '0 var(--container-padding-x) 1rem var(--container-padding-x)', padding: 'var(--container-padding-x)' }}>
            <h1 className="text-lg font-semibold text-blue-800 mb-2">
              🧪 UI 테스트 페이지 - 입찰공고 목록 (theme-test-light)
            </h1>
            <p className="text-blue-600 text-sm">
              이 페이지는 UI 테스트용으로 더미 데이터를 사용합니다.
            </p>
          </div>

          <NoticeTable
            notices={notices}
            currentCategory="IT서비스"
            gap={1}
          />
        </div>
      </PageContainer>
    </div>
  );
}