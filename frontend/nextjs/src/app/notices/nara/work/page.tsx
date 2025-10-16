import { Suspense } from 'react';
import NoticeTableSkeleton from '@/components/notices/NoticeTableSkeleton';
import { Metadata } from 'next';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { Notice } from '@/types/notice';
import '@/app/themes.css';
import { redirect } from 'next/navigation';
import WorkPageClient from './WorkPageClient';
import { getNoticeDefaults } from '@/lib/utils/appSettings';

interface PageProps {
  params: Promise<{}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const GET_NARA_NOTICES_BY_CATEGORIES = gql`
  query GetNaraNoticesByCategories($categories: [String!]!, $gap: Int) {
    naraNoticesByCategories(categories: $categories, gap: $gap) {
      id
      bidNtceNo
      bidNtceNm
      ntceInsttNm
      dminsttNm
      bidNtceDt
      bidClseDt
      opengDt
      asignBdgtAmt
      presmptPrce
      bidNtceDtlUrl
      bidNtceUrl
      pubPrcrmntClsfcNm
      rgstDt
      title
      orgName
      postedAt
      detailUrl
      region
      registration
      category
    }
  }
`;

async function getNaraNoticesByCategories(categories: string[], gap: number): Promise<Notice[]> {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_NARA_NOTICES_BY_CATEGORIES,
      variables: { categories, gap },
      fetchPolicy: 'no-cache'
    });

    return data.naraNoticesByCategories.map((notice: any) => {
      // Format date to YYYY-mm-dd
      const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };

      return {
        id: notice.id,
        bidNtceNo: notice.bidNtceNo,
        제목: notice.bidNtceNm || notice.title,
        기관명: notice.ntceInsttNm || notice.dminsttNm || notice.orgName || '미지정',
        작성일: formatDate(notice.bidNtceDt || notice.postedAt || notice.rgstDt),
        상세페이지주소: notice.bidNtceDtlUrl || notice.bidNtceUrl || notice.detailUrl || '',
        category: notice.category || '공사점검',
        지역: notice.region || '미지정',
        // 호환성을 위한 영어 필드
        title: notice.bidNtceNm || notice.title,
        orgName: notice.ntceInsttNm || notice.dminsttNm || notice.orgName || '미지정',
        postedAt: formatDate(notice.bidNtceDt || notice.postedAt || notice.rgstDt),
        detailUrl: notice.bidNtceDtlUrl || notice.bidNtceUrl || notice.detailUrl || '',
        region: notice.region || '미지정'
      };
    });
  } catch (error) {
    console.error('Failed to fetch Nara notices:', error);
    throw new Error('나라장터 공고 데이터를 불러오는데 실패했습니다.');
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const title = `나라장터(업무)`;

    return {
      title: `${title} | ILMAC BID`,
      description: `나라장터 업무 관련 입찰공고 목록입니다.`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '나라장터(업무) | ILMAC BID',
      description: '나라장터 업무 관련 입찰공고 목록입니다.',
    };
  }
}

export default async function NaraWorkPage({ params, searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);

  // Get dynamic defaults from database
  const defaults = await getNoticeDefaults();
  const defaultCategories = defaults.categoryDefault; // Use full category list as default
  const defaultGap = defaults.gap;

  // gap 파라미터가 없으면 리디렉션
  if (!resolvedSearchParams.gap) {
    redirect(`/notices/nara/work?category=${defaultCategories}&gap=${defaultGap}`);
  }

  // category 파라미터가 없으면 기본값으로 리디렉션
  if (!resolvedSearchParams.category) {
    redirect(`/notices/nara/work?category=${defaultCategories}&gap=${resolvedSearchParams.gap}`);
  }

  try {
    const gap = parseInt(resolvedSearchParams.gap as string || defaultGap, 10);
    const sort = resolvedSearchParams.sort as string || '';
    const order = resolvedSearchParams.order as string || 'asc';

    // category 파라미터를 배열로 변환
    const categoryParam = resolvedSearchParams.category as string;
    const categories = categoryParam.split(',').map(cat => cat.trim());

    const notices = await getNaraNoticesByCategories(categories, gap);

    return (
      <div>
        <Suspense fallback={<NoticeTableSkeleton />}>
          <WorkPageClient
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
    console.error('Error in NaraWorkPage:', error);
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