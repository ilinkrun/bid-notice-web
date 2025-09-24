import { Suspense } from 'react';
import NoticeTableSkeleton from '@/components/notices/NoticeTableSkeleton';
import { Metadata } from 'next';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import '@/app/themes.css';
import { redirect } from 'next/navigation';
import ServicePageClient from './ServicePageClient';

interface PageProps {
  params: Promise<{}>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const GET_NARA_NOTICES_BY_CLASSIFICATION = gql`
  query GetNaraNoticesByClassification($pubPrcrmntClsfcNm: String, $gap: Int, $limit: Int) {
    naraNoticesByClassification(pubPrcrmntClsfcNm: $pubPrcrmntClsfcNm, gap: $gap, limit: $limit) {
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
      srvceDivNm
      ppswGnrlSrvceYn
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

async function getNaraServiceNotices(gap: number, limit: number = 100) {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_NARA_NOTICES_BY_CLASSIFICATION,
      variables: {
        pubPrcrmntClsfcNm: '용역',
        gap,
        limit
      },
      fetchPolicy: 'no-cache'
    });

    return data.naraNoticesByClassification.map((notice: any) => ({
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
      용역구분명: notice.srvceDivNm,
      조달청일반용역여부: notice.ppswGnrlSrvceYn,
      지역: notice.region || '미지정',
      등록: notice.registration || notice.rgstDt || '',
      // 호환성을 위한 영어 필드
      title: notice.bidNtceNm || notice.title,
      orgName: notice.ntceInsttNm || notice.dminsttNm || notice.orgName || '미지정',
      postedAt: notice.bidNtceDt || notice.postedAt || notice.rgstDt,
      detailUrl: notice.bidNtceDtlUrl || notice.bidNtceUrl || notice.detailUrl || '',
      region: notice.region || '미지정',
      category: '용역'
    }));
  } catch (error) {
    console.error('Failed to fetch Nara service notices:', error);
    throw new Error('나라장터 용역 공고 데이터를 불러오는데 실패했습니다.');
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const title = `나라장터 공고(용역)`;

    return {
      title: `${title} | ILMAC BID`,
      description: `나라장터(조달청) 용역 관련 입찰공고 목록입니다.`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '나라장터 공고(용역) | ILMAC BID',
      description: '나라장터(조달청) 용역 관련 입찰공고 목록입니다.',
    };
  }
}

export default async function ServicePage({ params, searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);

  // gap 파라미터가 없으면 리디렉션
  if (!resolvedSearchParams.gap) {
    redirect(`/notices/nara/service?gap=${process.env.NEXT_PUBLIC_DAY_GAP || '1'}`);
  }

  try {
    const gap = parseInt(resolvedSearchParams.gap as string || process.env.NEXT_PUBLIC_DAY_GAP || '1', 10);
    const sort = resolvedSearchParams.sort as string || '';
    const order = resolvedSearchParams.order as string || 'asc';
    const limit = parseInt(resolvedSearchParams.limit as string || '100', 10);

    const notices = await getNaraServiceNotices(gap, limit);

    return (
      <div>
        <Suspense fallback={<NoticeTableSkeleton />}>
          <ServicePageClient
            notices={notices}
            gap={gap}
            sort={sort}
            order={order}
            limit={limit}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error in ServicePage:', error);
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