import { Suspense } from 'react';
import NoticeTableSkeleton from '@/components/notices/NoticeTableSkeleton';
import { Metadata } from 'next';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import '@/app/themes.css';
import { redirect } from 'next/navigation';
import NaraPageClient from './NaraPageClient';
import { getNoticeDefaults } from '@/lib/utils/appSettings';

interface PageProps {
  params: Promise<{}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const GET_NARA_NOTICES = gql`
  query GetNaraNotices($limit: Int, $offset: Int, $gap: Int) {
    naraNotices(limit: $limit, offset: $offset, gap: $gap) {
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
    }
  }
`;

async function getNaraNotices(gap: number, limit: number = 100, offset: number = 0) {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_NARA_NOTICES,
      variables: { gap, limit, offset },
      fetchPolicy: 'no-cache'
    });

    return data.naraNotices.map((notice: any) => ({
      id: notice.id,
      bidNtceNo: notice.bidNtceNo,
      제목: notice.bidNtceNm || notice.title,
      기관명: notice.ntceInsttNm || notice.dminsttNm || notice.orgName || '미지정',
      작성일: notice.bidNtceDt || notice.postedAt || notice.rgstDt,
      상세페이지주소: notice.bidNtceDtlUrl || notice.bidNtceUrl || notice.detailUrl || '',
      공고일시: notice.bidNtceDt,
      입찰마감일시: notice.bidClseDt,
      개찰일시: notice.opengDt,
      배정예산금액: notice.asignBdgtAmt,
      추정가격: notice.presmptPrce,
      공공조달분류명: notice.pubPrcrmntClsfcNm,
      지역: notice.region || '미지정',
      등록: notice.registration || notice.rgstDt || '',
      // 호환성을 위한 영어 필드
      title: notice.bidNtceNm || notice.title,
      orgName: notice.ntceInsttNm || notice.dminsttNm || notice.orgName || '미지정',
      postedAt: notice.bidNtceDt || notice.postedAt || notice.rgstDt,
      detailUrl: notice.bidNtceDtlUrl || notice.bidNtceUrl || notice.detailUrl || '',
      region: notice.region || '미지정'
    }));
  } catch (error) {
    console.error('Failed to fetch Nara notices:', error);
    throw new Error('나라장터 공고 데이터를 불러오는데 실패했습니다.');
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const title = `나라장터 공고`;

    return {
      title: `${title} | ILMAC BID`,
      description: `나라장터(조달청) 입찰공고 목록입니다.`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '나라장터 공고 | ILMAC BID',
      description: '나라장터(조달청) 입찰공고 목록입니다.',
    };
  }
}

export default async function NaraPage({ params, searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);

  // Get dynamic defaults from database
  const defaults = await getNoticeDefaults();
  const defaultGap = defaults.gap;

  // gap 파라미터가 없으면 리디렉션
  if (!resolvedSearchParams.gap) {
    redirect(`/notices/nara?gap=${defaultGap}`);
  }

  try {
    const gap = parseInt(resolvedSearchParams.gap as string || defaultGap, 10);
    const sort = resolvedSearchParams.sort as string || '';
    const order = resolvedSearchParams.order as string || 'asc';
    const limit = parseInt(resolvedSearchParams.limit as string || '100', 10);
    const offset = parseInt(resolvedSearchParams.offset as string || '0', 10);

    const notices = await getNaraNotices(gap, limit, offset);

    return (
      <div>
        <Suspense fallback={<NoticeTableSkeleton />}>
          <NaraPageClient
            notices={notices}
            gap={gap}
            sort={sort}
            order={order}
            limit={limit}
            offset={offset}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error in NaraPage:', error);
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