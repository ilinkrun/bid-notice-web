import { Suspense } from 'react';
import NoticeTableSkeleton from '@/components/notices/NoticeTableSkeleton';
import { Metadata } from 'next';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { Notice } from '@/types/notice';
import '@/app/themes.css';
import { redirect } from 'next/navigation';
import ExcludedPageClient from './ExcludedPageClient';

interface PageProps {
  params: Promise<{}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const GET_EXCLUDED_NARA_NOTICES = gql`
  query GetExcludedNaraNotices($gap: Int) {
    excludedNaraNotices(gap: $gap) {
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
      is_selected
    }
  }
`;

async function getExcludedNaraNotices(gap: number): Promise<Notice[]> {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_EXCLUDED_NARA_NOTICES,
      variables: { gap },
      fetchPolicy: 'no-cache'
    });

    return data.excludedNaraNotices.map((notice: any) => {
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
        category: notice.category || '제외',
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
    const title = `나라장터(제외)`;

    return {
      title: `${title} | ILMAC BID`,
      description: `나라장터 업무에서 제외된 입찰공고 목록입니다.`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '나라장터(제외) | ILMAC BID',
      description: '나라장터 업무에서 제외된 입찰공고 목록입니다.',
    };
  }
}

export default async function NaraExcludedPage({ params, searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);

  // gap 파라미터가 없으면 리디렉션
  if (!resolvedSearchParams.gap) {
    redirect(`/notices/nara/excluded?gap=${process.env.NEXT_PUBLIC_DAY_GAP || '1'}`);
  }

  try {
    const gap = parseInt(resolvedSearchParams.gap as string || process.env.NEXT_PUBLIC_DAY_GAP || '1', 10);
    const sort = resolvedSearchParams.sort as string || '';
    const order = resolvedSearchParams.order as string || 'asc';

    const notices = await getExcludedNaraNotices(gap);

    return (
      <div>
        <Suspense fallback={<NoticeTableSkeleton />}>
          <ExcludedPageClient
            notices={notices}
            category="제외"
            gap={gap}
            sort={sort}
            order={order}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error in NaraExcludedPage:', error);
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