'use client';

import { useQuery, useMutation } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { List, FileText, Settings, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { DropdownSectionHeader, ButtonWithIcon } from '@/components/shared/FormComponents';
import { ScrappingSettingsLayout } from '@/components/settings/ScrappingSettingsLayout';

// GraphQL 쿼리들
const GET_SETTINGS_LIST = gql`
  query GetSettingsListByOid($oid: Int) {
    settingListByOid(oid: $oid) {
      oid
      orgName
      detailUrl
      iframe
      rowXpath
      paging
      startPage
      endPage
      login
      elements {
        key
        xpath
        target
        callback
      }
      orgRegion
      registration
      use
      companyInCharge
      orgMan
      exceptionRow
    }
  }
`;

const GET_SETTINGS_DETAIL = gql`
  query GetSettingsDetailByOid($oid: Int!) {
    settingsDetailByOid(oid: $oid) {
      oid
      orgName
      title
      bodyHtml
      fileName
      fileUrl
      preview
      noticeDiv
      noticeNum
      orgDept
      orgMan
      orgTel
      use
      sampleUrl
      down
    }
  }
`;

export default function ScrappingSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { navigate } = useUnifiedNavigation();
  const { startLoading, finishLoading } = useUnifiedLoading();

  const oid = parseInt(params.oid as string);

  // 드롭다운 상태 관리
  const [isListExpanded, setIsListExpanded] = useState(true);
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);

  // 목록 스크랩 설정 쿼리
  const { loading: loadingList, error: errorList, data: dataList } = useQuery(GET_SETTINGS_LIST, {
    client: getClient(),
    variables: { oid }
  });

  // 상세 스크랩 설정 쿼리
  const { loading: loadingDetail, error: errorDetail, data: dataDetail } = useQuery(GET_SETTINGS_DETAIL, {
    client: getClient(),
    variables: { oid }
  });

  // Handle data completion
  useEffect(() => {
    if (dataList && dataDetail) {
      console.log('스크랩 설정 데이터 로드 완료');
      finishLoading();
    }
  }, [dataList, dataDetail, finishLoading]);

  // Handle errors
  useEffect(() => {
    if (errorList || errorDetail) {
      console.error('스크랩 설정 데이터 로드 에러:', errorList || errorDetail);
      finishLoading();
    }
  }, [errorList, errorDetail, finishLoading]);

  const listSettings = dataList?.settingListByOid;
  const detailSettings = dataDetail?.settingsDetailByOid;

  // 로딩 중인 경우 스켈레톤 표시
  if (loadingList || loadingDetail) {
    return (
      <ScrappingSettingsLayout
        orgName={listSettings?.orgName || `OID: ${oid}`}
        isActive={false}
        region=""
      >
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </ScrappingSettingsLayout>
    );
  }

  // 에러 상태
  if (errorList || errorDetail) {
    return (
      <ScrappingSettingsLayout
        orgName={listSettings?.orgName || `OID: ${oid}`}
        isActive={false}
        region=""
      >
        <Card>
          <CardHeader>
            <CardTitle>오류 발생</CardTitle>
            <CardDescription>데이터를 불러오는 중 오류가 발생했습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{(errorList || errorDetail)?.message}</p>
          </CardContent>
        </Card>
      </ScrappingSettingsLayout>
    );
  }

  return (
    <ScrappingSettingsLayout
      orgName={listSettings?.orgName || `OID: ${oid}`}
      isActive={listSettings?.use}
      region={listSettings?.orgRegion}
    >
      <div className="space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-color-primary-foreground">스크랩 설정 관리</h1>
            <p className="text-color-primary-muted">목록 스크랩 설정과 상세 스크랩 설정을 관리합니다.</p>
          </div>
          <ButtonWithIcon
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => router.push('/settings')}
            className="text-color-primary-muted"
          >
            설정 목록으로
          </ButtonWithIcon>
        </div>

        {/* 목록 스크랩 설정 섹션 */}
        <div className="space-y-2">
          <DropdownSectionHeader
            title="목록 스크랩 설정"
            icon={<List className="w-5 h-5" />}
            isExpanded={isListExpanded}
            onToggle={() => setIsListExpanded(!isListExpanded)}
            accentColor="#3b82f6"
          />

          {isListExpanded && (
            <div className="border border-gray-200 rounded-lg p-4 ml-4">
              {listSettings ? (
                <div className="space-y-4">
                  {/* 기본 설정 표 */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium w-32">기관명</TableCell>
                          <TableCell>{listSettings.orgName}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">URL</TableCell>
                          <TableCell className="break-all">{listSettings.detailUrl}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">행 XPath</TableCell>
                          <TableCell className="font-mono text-sm">{listSettings.rowXpath}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">페이징</TableCell>
                          <TableCell className="font-mono text-sm">{listSettings.paging || '없음'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">페이지 범위</TableCell>
                          <TableCell>{listSettings.startPage} ~ {listSettings.endPage}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* 요소 설정 표 */}
                  {listSettings.elements && listSettings.elements.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>키</TableHead>
                            <TableHead>XPath</TableHead>
                            <TableHead>타겟</TableHead>
                            <TableHead>콜백</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {listSettings.elements.map((element: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{element.key}</TableCell>
                              <TableCell className="font-mono text-sm">{element.xpath}</TableCell>
                              <TableCell>{element.target || '-'}</TableCell>
                              <TableCell className="font-mono text-sm">{element.callback || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <ButtonWithIcon
                      icon={<Settings className="h-4 w-4" />}
                      onClick={() => router.push(`/settings/scrapping/${oid}/list`)}
                    >
                      목록 설정 편집
                    </ButtonWithIcon>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-color-primary-muted">목록 스크랩 설정이 없습니다.</p>
                  <ButtonWithIcon
                    icon={<Settings className="h-4 w-4" />}
                    onClick={() => router.push(`/settings/scrapping/${oid}/list`)}
                    className="mt-4"
                  >
                    목록 설정 추가
                  </ButtonWithIcon>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 상세 스크랩 설정 섹션 */}
        <div className="space-y-2">
          <DropdownSectionHeader
            title="상세 스크랩 설정"
            icon={<FileText className="w-5 h-5" />}
            isExpanded={isDetailExpanded}
            onToggle={() => setIsDetailExpanded(!isDetailExpanded)}
            accentColor="#10b981"
          />

          {isDetailExpanded && (
            <div className="border border-gray-200 rounded-lg p-4 ml-4">
              {detailSettings ? (
                <div className="space-y-4">
                  {/* 상세 설정 표 */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium w-32">기관명</TableCell>
                          <TableCell>{detailSettings.orgName}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">제목</TableCell>
                          <TableCell className="font-mono text-sm">{detailSettings.title}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">본문 HTML</TableCell>
                          <TableCell className="font-mono text-sm">{detailSettings.bodyHtml}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">파일명</TableCell>
                          <TableCell className="font-mono text-sm">{detailSettings.fileName || '없음'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">파일 URL</TableCell>
                          <TableCell className="font-mono text-sm">{detailSettings.fileUrl || '없음'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">샘플 URL</TableCell>
                          <TableCell className="break-all">{detailSettings.sampleUrl || '없음'}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end">
                    <ButtonWithIcon
                      icon={<Settings className="h-4 w-4" />}
                      onClick={() => router.push(`/settings/scrapping/${oid}/detail`)}
                    >
                      상세 설정 편집
                    </ButtonWithIcon>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-color-primary-muted">상세 스크랩 설정이 없습니다.</p>
                  <ButtonWithIcon
                    icon={<Settings className="h-4 w-4" />}
                    onClick={() => router.push(`/settings/scrapping/${oid}/detail`)}
                    className="mt-4"
                  >
                    상세 설정 추가
                  </ButtonWithIcon>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ScrappingSettingsLayout>
  );
}