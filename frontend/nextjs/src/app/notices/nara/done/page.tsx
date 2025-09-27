import { Suspense } from 'react';
import NoticeTableSkeleton from '@/components/notices/NoticeTableSkeleton';
import { Metadata } from 'next';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { Notice } from '@/types/notice';
import '@/app/themes.css';
import { redirect } from 'next/navigation';
import DonePageClient from './DonePageClient';

interface PageProps {
  params: Promise<{}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const GET_DONE_NOTICES = gql`
  query GetDoneNotices($gap: Int) {
    doneNotices(gap: $gap) {
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

const GET_ACTIVE_CATEGORIES = gql`
  query GetActiveCategories {
    noticeCategoriesActive {
      category
    }
  }
`;

async function getDoneNotices(gap: number): Promise<Notice[]> {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_DONE_NOTICES,
      variables: { gap },
      fetchPolicy: 'no-cache'
    });

    return data.doneNotices.map((notice: any) => ({
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
    console.error('Failed to fetch done notices:', error);
    throw new Error('결과통보 공고 데이터를 불러오는데 실패했습니다.');
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const title = `나라장터 공고(결과통보)`;

    return {
      title: `${title} | ILMAC BID`,
      description: `입찰 결과통보 공고 목록입니다.`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '나라장터 공고(결과통보) | ILMAC BID',
      description: '입찰 결과통보 공고 목록입니다.',
    };
  }
}

async function getActiveCategories(): Promise<string> {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_ACTIVE_CATEGORIES,
      fetchPolicy: 'no-cache'
    });

    if (data?.noticeCategoriesActive) {
      const activeCategories = data.noticeCategoriesActive
        .map((item: any) => item.category)
        .filter((category: string) => category && category !== '무관' && category !== '제외')
        .join(',');
      return activeCategories || '공사점검,성능평가,정밀안전진단,정기안전점검,구조설계,구조감리,기타';
    }
    return '공사점검,성능평가,정밀안전진단,정기안전점검,구조설계,구조감리,기타';
  } catch (error) {
    console.error('Failed to fetch active categories:', error);
    return '공사점검,성능평가,정밀안전진단,정기안전점검,구조설계,구조감리,기타';
  }
}

export default async function NaraDonePage({ params, searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);

  // 활성 카테고리 가져오기
  const defaultCategories = await getActiveCategories();

  // gap 파라미터가 없으면 리디렉션 (결과통보 페이지는 기본값 7 사용)
  if (!resolvedSearchParams.gap) {
    redirect(`/notices/nara/done?category=${defaultCategories}&gap=7`);
  }

  // category 파라미터가 없으면 기본값으로 리디렉션
  if (!resolvedSearchParams.category) {
    redirect(`/notices/nara/done?category=${defaultCategories}&gap=${resolvedSearchParams.gap}`);
  }

  try {
    const gap = parseInt(resolvedSearchParams.gap as string || '7', 10);
    const sort = resolvedSearchParams.sort as string || '';
    const order = resolvedSearchParams.order as string || 'asc';

    // category 파라미터를 배열로 변환
    const categoryParam = resolvedSearchParams.category as string;
    const categories = categoryParam.split(',').map(cat => cat.trim());

    const notices = await getDoneNotices(gap);

    return (
      <div>
        <Suspense fallback={<NoticeTableSkeleton />}>
          <DonePageClient
            notices={notices}
            categories={categories}
            gap={gap}
            sort={sort}
            order={order}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error in NaraDonePage:', error);
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