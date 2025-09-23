'use client';

import { useState, useEffect } from 'react';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { PageContainer } from '@/components/shared/PageContainer';
import Link from 'next/link';

interface NaraNoticeDetail {
  id: string;
  bidNtceNo: string;
  bidNtceOrd?: string;
  reNtceYn?: string;
  rgstTyNm?: string;
  ntceKindNm?: string;
  intrbidYn?: string;
  bidNtceDt?: string;
  refNo?: string;
  bidNtceNm: string;
  ntceInsttCd?: string;
  ntceInsttNm?: string;
  dminsttCd?: string;
  dminsttNm?: string;
  bidMethdNm?: string;
  cntrctCnclsMthdNm?: string;
  ntceInsttOfclNm?: string;
  ntceInsttOfclTelNo?: string;
  ntceInsttOfclEmailAdrs?: string;
  exctvNm?: string;
  bidQlfctRgstDt?: string;
  cmmnSpldmdAgrmntRcptdocMethd?: string;
  cmmnSpldmdAgrmntClseDt?: string;
  cmmnSpldmdCorpRgnLmtYn?: string;
  bidBeginDt?: string;
  bidClseDt?: string;
  opengDt?: string;
  ntceSpecDocUrl1?: string;
  ntceSpecDocUrl2?: string;
  ntceSpecDocUrl3?: string;
  ntceSpecDocUrl4?: string;
  ntceSpecDocUrl5?: string;
  rbidPermsnYn?: string;
  pqApplDocRcptMthdNm?: string;
  pqApplDocRcptDt?: string;
  tpEvalApplMthdNm?: string;
  tpEvalApplClseDt?: string;
  jntcontrctDutyRgnNm1?: string;
  jntcontrctDutyRgnNm2?: string;
  jntcontrctDutyRgnNm3?: string;
  rgnDutyJntcontrctRt?: string;
  dtlsBidYn?: string;
  bidPrtcptLmtYn?: string;
  prearngPrceDcsnMthdNm?: string;
  totPrdprcNum?: string;
  drwtPrdprcNum?: string;
  asignBdgtAmt?: number;
  presmptPrce?: number;
  opengPlce?: string;
  dcmtgOprtnDt?: string;
  dcmtgOprtnPlce?: string;
  bidNtceDtlUrl?: string;
  bidNtceUrl?: string;
  bidPrtcptFeePaymntYn?: string;
  bidPrtcptFee?: number;
  bidGrntymnyPaymntYn?: string;
  crdtrNm?: string;
  ppswGnrlSrvceYn?: string;
  srvceDivNm?: string;
  prdctClsfcLmtYn?: string;
  mnfctYn?: string;
  purchsObjPrdctList?: string;
  untyNtceNo?: string;
  cmmnSpldmdMethdCd?: string;
  cmmnSpldmdMethdNm?: string;
  stdNtceDocUrl?: string;
  brffcBidprcPermsnYn?: string;
  dsgntCmptYn?: string;
  arsltCmptYn?: string;
  pqEvalYn?: string;
  tpEvalYn?: string;
  ntceDscrptYn?: string;
  rsrvtnPrceReMkngMthdNm?: string;
  arsltApplDocRcptMthdNm?: string;
  arsltReqstdocRcptDt?: string;
  orderPlanUntyNo?: string;
  sucsfbidLwltRate?: number;
  rgstDt?: string;
  bfSpecRgstNo?: string;
  infoBizYn?: string;
  sucsfbidMthdCd?: string;
  sucsfbidMthdNm?: string;
  chgDt?: string;
  dminsttOfclEmailAdrs?: string;
  indstrytyLmtYn?: string;
  chgNtceRsn?: string;
  rbidOpengDt?: string;
  VAT?: number;
  indutyVAT?: number;
  rgnLmtBidLocplcJdgmBssCd?: string;
  rgnLmtBidLocplcJdgmBssNm?: string;
  pubPrcrmntLrgClsfcNm?: string;
  pubPrcrmntMidClsfcNm?: string;
  pubPrcrmntClsfcNo?: string;
  pubPrcrmntClsfcNm?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NaraDetailClientProps {
  notice: NaraNoticeDetail;
}

export default function NaraDetailClient({ notice }: NaraDetailClientProps) {
  const { finishLoading } = useUnifiedLoading();

  useEffect(() => {
    if (notice) {
      console.log(`[NaraDetailClient] 공고 상세 데이터 로딩 완료: ${notice.bidNtceNo}`);
      setTimeout(() => {
        finishLoading();
      }, 100);
    }
  }, [notice, finishLoading]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('ko-KR');
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const getStatusBadge = () => {
    const now = new Date();
    const closeDate = notice.bidClseDt ? new Date(notice.bidClseDt) : null;
    const openDate = notice.opengDt ? new Date(notice.opengDt) : null;

    if (closeDate && closeDate < now) {
      if (openDate && openDate < now) {
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">개찰완료</span>;
      }
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">입찰마감</span>;
    } else if (closeDate && closeDate > now) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">입찰진행중</span>;
    }
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">상태미정</span>;
  };

  // 문서 URL들을 배열로 정리
  const docUrls = [
    notice.ntceSpecDocUrl1,
    notice.ntceSpecDocUrl2,
    notice.ntceSpecDocUrl3,
    notice.ntceSpecDocUrl4,
    notice.ntceSpecDocUrl5
  ].filter(url => url && url !== '추후제공예정');

  return (
    <PageContainer>
      <div className="nara-detail">
        {/* 브레드크럼 */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/notices" className="hover:text-gray-700">공고</Link></li>
            <li className="before:content-['>'] before:mx-2">
              <Link href="/notices/nara" className="hover:text-gray-700">나라장터</Link>
            </li>
            <li className="before:content-['>'] before:mx-2 text-gray-900">
              {notice.bidNtceNo}
            </li>
          </ol>
        </nav>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{notice.bidNtceNm}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>공고번호: {notice.bidNtceNo}</span>
                {notice.bidNtceOrd && <span>차수: {notice.bidNtceOrd}</span>}
                {getStatusBadge()}
              </div>
            </div>
            <div className="ml-4">
              {(notice.bidNtceDtlUrl || notice.bidNtceUrl) && (
                <a
                  href={notice.bidNtceDtlUrl || notice.bidNtceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  원본 공고 보기
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">공고기관</label>
                  <p className="mt-1 text-sm text-gray-900">{notice.ntceInsttNm || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">수요기관</label>
                  <p className="mt-1 text-sm text-gray-900">{notice.dminsttNm || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">공고종류</label>
                  <p className="mt-1 text-sm text-gray-900">{notice.ntceKindNm || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">등록유형</label>
                  <p className="mt-1 text-sm text-gray-900">{notice.rgstTyNm || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">입찰방식</label>
                  <p className="mt-1 text-sm text-gray-900">{notice.bidMethdNm || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">계약체결방법</label>
                  <p className="mt-1 text-sm text-gray-900">{notice.cntrctCnclsMthdNm || '-'}</p>
                </div>
              </div>
            </div>

            {/* 일정 정보 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">일정 정보</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">공고일시</span>
                  <span className="text-sm text-gray-900">{formatDate(notice.bidNtceDt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">입찰개시일시</span>
                  <span className="text-sm text-gray-900">{formatDate(notice.bidBeginDt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">입찰마감일시</span>
                  <span className="text-sm text-gray-900 font-semibold">{formatDate(notice.bidClseDt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">개찰일시</span>
                  <span className="text-sm text-gray-900">{formatDate(notice.opengDt)}</span>
                </div>
                {notice.bidQlfctRgstDt && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">입찰참가자격등록마감</span>
                    <span className="text-sm text-gray-900">{formatDate(notice.bidQlfctRgstDt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 금액 정보 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">금액 정보</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">배정예산금액</span>
                  <span className="text-sm text-gray-900 font-semibold">{formatAmount(notice.asignBdgtAmt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">추정가격</span>
                  <span className="text-sm text-gray-900">{formatAmount(notice.presmptPrce)}</span>
                </div>
                {notice.VAT && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">부가가치세</span>
                    <span className="text-sm text-gray-900">{formatAmount(notice.VAT)}</span>
                  </div>
                )}
                {notice.bidPrtcptFee && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">입찰참가수수료</span>
                    <span className="text-sm text-gray-900">{formatAmount(notice.bidPrtcptFee)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 첨부문서 */}
            {docUrls.length > 0 && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">첨부문서</h2>
                <div className="space-y-2">
                  {docUrls.map((url, index) => (
                    <div key={index} className="flex items-center">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        📎 공고규격서 {index + 1}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 담당자 정보 */}
            {(notice.ntceInsttOfclNm || notice.ntceInsttOfclTelNo || notice.ntceInsttOfclEmailAdrs) && (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">담당자 정보</h2>
                <div className="space-y-3">
                  {notice.ntceInsttOfclNm && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">담당자명</label>
                      <p className="mt-1 text-sm text-gray-900">{notice.ntceInsttOfclNm}</p>
                    </div>
                  )}
                  {notice.ntceInsttOfclTelNo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">전화번호</label>
                      <p className="mt-1 text-sm text-gray-900">{notice.ntceInsttOfclTelNo}</p>
                    </div>
                  )}
                  {notice.ntceInsttOfclEmailAdrs && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">이메일</label>
                      <p className="mt-1 text-sm text-gray-900">{notice.ntceInsttOfclEmailAdrs}</p>
                    </div>
                  )}
                  {notice.exctvNm && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">집행관</label>
                      <p className="mt-1 text-sm text-gray-900">{notice.exctvNm}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 분류 정보 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">분류 정보</h2>
              <div className="space-y-3">
                {notice.pubPrcrmntLrgClsfcNm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">공공조달대분류</label>
                    <p className="mt-1 text-sm text-gray-900">{notice.pubPrcrmntLrgClsfcNm}</p>
                  </div>
                )}
                {notice.pubPrcrmntMidClsfcNm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">공공조달중분류</label>
                    <p className="mt-1 text-sm text-gray-900">{notice.pubPrcrmntMidClsfcNm}</p>
                  </div>
                )}
                {notice.pubPrcrmntClsfcNm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">공공조달분류</label>
                    <p className="mt-1 text-sm text-gray-900">{notice.pubPrcrmntClsfcNm}</p>
                  </div>
                )}
                {notice.srvceDivNm && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">용역구분</label>
                    <p className="mt-1 text-sm text-gray-900">{notice.srvceDivNm}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 기타 정보 */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">기타 정보</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">국제입찰여부</span>
                  <span className="text-gray-900">{notice.intrbidYn === 'Y' ? '예' : '아니오'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">재공고여부</span>
                  <span className="text-gray-900">{notice.reNtceYn === 'Y' ? '예' : '아니오'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">재입찰허용여부</span>
                  <span className="text-gray-900">{notice.rbidPermsnYn === 'Y' ? '예' : '아니오'}</span>
                </div>
                {notice.opengPlce && (
                  <div className="flex justify-between">
                    <span className="text-gray-700">개찰장소</span>
                    <span className="text-gray-900">{notice.opengPlce}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}