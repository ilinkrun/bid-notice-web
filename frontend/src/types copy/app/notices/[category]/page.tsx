import { Suspense } from 'react';
import NoticeTableSkeleton from '@/components/notices/NoticeTableSkeleton';
import { Metadata } from 'next';
import { getClient } from '@/lib/api/restClient';
import { Notice } from '@/types/notice';
import '../../themes.css';
import { redirect } from 'next/navigation';
import CategoryPageClient from './CategoryPageClient';

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getNoticesByCategory(category: string, gap: number): Promise<Notice[]> {
  try {
    const response = await getClient().get<any[]>(`/notice_list/${encodeURIComponent(category)}?gap=${gap}`);
    
    // API 응답 데이터를 Notice 타입에 맞게 변환
    const notices = response.data.map((notice: any) => ({
      nid: notice.nid,
      제목: notice.title || notice.제목 || '',
      기관명: notice.org_name || notice.기관명 || '',
      작성일: notice.posted_date || notice.작성일 || '',
      상세페이지주소: notice.detail_url || notice.상세페이지주소 || '',
      category: notice.category || notice.카테고리 || '',
      지역: notice.org_region || notice.지역 || '미지정',
      등록: notice.registration || notice.등록 || 0,
      // 호환성을 위한 영어 필드도 설정
      title: notice.title || notice.제목,
      orgName: notice.org_name || notice.기관명,
      postedAt: notice.posted_date || notice.작성일,
      detailUrl: notice.detail_url || notice.상세페이지주소,
      region: notice.org_region || notice.지역 || '미지정',
      registration: String(notice.registration || notice.등록 || 0)
    })) as Notice[];
    
    return notices;
  } catch (error) {
    console.error('Failed to fetch notices:', error);
    throw new Error('공고 데이터를 불러오는데 실패했습니다.');
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await Promise.resolve(params);
    const category = decodeURIComponent(resolvedParams.category);
    const title = `${category} 입찰공고`;

    return {
      title: `${title} | ILMAC BID`,
      description: `${title} 목록입니다.`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '입찰공고 | ILMAC BID',
      description: '입찰공고 목록입니다.',
    };
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const category = decodeURIComponent(resolvedParams.category);
  
  // gap 파라미터가 없으면 리디렉션
  if (!resolvedSearchParams.gap) {
    redirect(`/notices/${category}?gap=${process.env.NEXT_PUBLIC_DAY_GAP || '1'}`);
  }

  try {
    const gap = parseInt(resolvedSearchParams.gap as string || process.env.NEXT_PUBLIC_DAY_GAP || '1', 10);
    const notices = await getNoticesByCategory(category, gap);

    return (
      <div>
        <Suspense fallback={<NoticeTableSkeleton />}>
          <CategoryPageClient 
            notices={notices}
            category={category}
            gap={gap}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error in CategoryPage:', error);
    return (
      <div className="container">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h2 className="text-red-800 text-lg font-semibold">오류가 발생했습니다</h2>
          <p className="text-red-600 mt-2">데이터를 불러오는 중 문제가 발생했습니다.</p>
          <p className="text-red-500 text-sm mt-1">{error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}</p>
        </div>
      </div>
    );
  }
} 