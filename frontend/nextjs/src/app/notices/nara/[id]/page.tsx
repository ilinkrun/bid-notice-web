import { Suspense } from 'react';
import { Metadata } from 'next';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { notFound } from 'next/navigation';
import '@/app/themes.css';
import NaraDetailClient from './NaraDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const GET_NARA_NOTICE_BY_ID = gql`
  query GetNaraNoticeById($id: ID!) {
    naraNoticeById(id: $id) {
      id
      bidNtceNo
      bidNtceOrd
      reNtceYn
      rgstTyNm
      ntceKindNm
      intrbidYn
      bidNtceDt
      refNo
      bidNtceNm
      ntceInsttCd
      ntceInsttNm
      dminsttCd
      dminsttNm
      bidMethdNm
      cntrctCnclsMthdNm
      ntceInsttOfclNm
      ntceInsttOfclTelNo
      ntceInsttOfclEmailAdrs
      exctvNm
      bidQlfctRgstDt
      cmmnSpldmdAgrmntRcptdocMethd
      cmmnSpldmdAgrmntClseDt
      cmmnSpldmdCorpRgnLmtYn
      bidBeginDt
      bidClseDt
      opengDt
      ntceSpecDocUrl1
      ntceSpecDocUrl2
      ntceSpecDocUrl3
      ntceSpecDocUrl4
      ntceSpecDocUrl5
      rbidPermsnYn
      pqApplDocRcptMthdNm
      pqApplDocRcptDt
      tpEvalApplMthdNm
      tpEvalApplClseDt
      jntcontrctDutyRgnNm1
      jntcontrctDutyRgnNm2
      jntcontrctDutyRgnNm3
      rgnDutyJntcontrctRt
      dtlsBidYn
      bidPrtcptLmtYn
      prearngPrceDcsnMthdNm
      totPrdprcNum
      drwtPrdprcNum
      asignBdgtAmt
      presmptPrce
      opengPlce
      dcmtgOprtnDt
      dcmtgOprtnPlce
      bidNtceDtlUrl
      bidNtceUrl
      bidPrtcptFeePaymntYn
      bidPrtcptFee
      bidGrntymnyPaymntYn
      crdtrNm
      ppswGnrlSrvceYn
      srvceDivNm
      prdctClsfcLmtYn
      mnfctYn
      purchsObjPrdctList
      untyNtceNo
      cmmnSpldmdMethdCd
      cmmnSpldmdMethdNm
      stdNtceDocUrl
      brffcBidprcPermsnYn
      dsgntCmptYn
      arsltCmptYn
      pqEvalYn
      tpEvalYn
      ntceDscrptYn
      rsrvtnPrceReMkngMthdNm
      arsltApplDocRcptMthdNm
      arsltReqstdocRcptDt
      orderPlanUntyNo
      sucsfbidLwltRate
      rgstDt
      bfSpecRgstNo
      infoBizYn
      sucsfbidMthdCd
      sucsfbidMthdNm
      chgDt
      dminsttOfclEmailAdrs
      indstrytyLmtYn
      chgNtceRsn
      rbidOpengDt
      VAT
      indutyVAT
      rgnLmtBidLocplcJdgmBssCd
      rgnLmtBidLocplcJdgmBssNm
      pubPrcrmntLrgClsfcNm
      pubPrcrmntMidClsfcNm
      pubPrcrmntClsfcNo
      pubPrcrmntClsfcNm
      createdAt
      updatedAt
    }
  }
`;

async function getNaraNoticeById(id: string) {
  try {
    const client = getClient();
    const { data } = await client.query({
      query: GET_NARA_NOTICE_BY_ID,
      variables: { id },
      fetchPolicy: 'no-cache'
    });

    return data.naraNoticeById;
  } catch (error) {
    console.error('Failed to fetch Nara notice:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await Promise.resolve(params);
    const notice = await getNaraNoticeById(resolvedParams.id);

    if (!notice) {
      return {
        title: '공고를 찾을 수 없습니다 | ILMAC BID',
        description: '요청하신 공고를 찾을 수 없습니다.',
      };
    }

    return {
      title: `${notice.bidNtceNm} | ILMAC BID`,
      description: `${notice.ntceInsttNm || notice.dminsttNm || '공고기관'} - ${notice.bidNtceNm}`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '나라장터 공고 상세 | ILMAC BID',
      description: '나라장터 입찰공고 상세 정보입니다.',
    };
  }
}

export default async function NaraDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const notice = await getNaraNoticeById(resolvedParams.id);

  if (!notice) {
    notFound();
  }

  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <NaraDetailClient notice={notice} />
      </Suspense>
    </div>
  );
}