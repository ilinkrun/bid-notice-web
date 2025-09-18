import { Suspense } from 'react';
import NoticeTableSkeleton from '@/components/notices/NoticeTableSkeleton';
import { Metadata } from 'next';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { Notice } from '@/types/notice';
import '../../../themes.css';
import { redirect } from 'next/navigation';
import CategoryPageClient from './CategoryPageClient';

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const GET_NOTICES_BY_CATEGORY = gql`
  query GetNoticesByCategory($category: String!, $gap: Int) {
    noticesByCategory(category: $category, gap: $gap) {
      nid
      title
      orgName
      region
      detailUrl
      category
      registration
      postedAt
    }
  }
`;

async function getNoticesByCategory(category: string, gap: number): Promise<Notice[]> {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_NOTICES_BY_CATEGORY,
      variables: { category, gap },
      fetchPolicy: 'no-cache'
    });

    return data.noticesByCategory.map((notice: any) => ({
      nid: notice.nid,
      제목: notice.title,
      기관명: notice.orgName,
      작성일: notice.postedAt,
      상세페이지주소: notice.detailUrl,
      category: notice.category,
      지역: notice.region || '미지정',
      등록: notice.registration || 0,
      // 호환성을 위한 영어 필드
      title: notice.title,
      orgName: notice.orgName,
      postedAt: notice.postedAt,
      detailUrl: notice.detailUrl,
      region: notice.region || '미지정',
      registration: String(notice.registration || 0)
    })) as Notice[];
  } catch (error) {
    console.error('Failed to fetch notices by category:', error);
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
    const sort = resolvedSearchParams.sort as string || '';
    const order = resolvedSearchParams.order as string || 'asc';
    const notices = await getNoticesByCategory(category, gap);

    return (
      <div>
        <Suspense fallback={<NoticeTableSkeleton />}>
          <CategoryPageClient
            notices={notices}
            category={category}
            gap={gap}
            sort={sort}
            order={order}
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