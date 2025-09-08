'use client';

import { useQuery } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Edit } from 'lucide-react';
import { ScrappingSettingsLayout } from '@/components/settings/ScrappingSettingsLayout';

// GraphQL 쿼리 정의
const GET_SETTINGS_DETAIL = gql`
  query GetSettingsDetail($orgName: String!) {
    settingDetail(orgName: $orgName) {
      orgName
      elements {
        key
        xpath
        target
        callback
      }
    }
  }
`;

// 목록 설정에서 기본 정보를 가져오기 위한 쿼리
const GET_SETTINGS_LIST_BRIEF = gql`
  query GetSettingsListBrief($orgName: String) {
    settingList(orgName: $orgName) {
      region
      use
    }
  }
`;

export default function ScrappingDetailSettingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { navigate } = useUnifiedNavigation();
  const { finishLoading } = useUnifiedLoading();

  const orgName = decodeURIComponent(params.orgName as string);
  const mode = searchParams.get('mode');
  const isEditMode = mode === 'edit';

  // 상세 스크랩 설정 쿼리
  const { loading: loadingDetail, error: errorDetail, data: dataDetail } = useQuery(GET_SETTINGS_DETAIL, {
    client: getClient(),
    variables: { orgName },
    onCompleted: (data) => {
      console.log('GET_SETTINGS_DETAIL 완료:', data);
    },
    onError: (error) => {
      console.error('GET_SETTINGS_DETAIL 에러:', error);
    }
  });

  // 기본 정보 쿼리 (활성 상태, 지역 정보)
  const { loading: loadingList, data: dataList } = useQuery(GET_SETTINGS_LIST_BRIEF, {
    client: getClient(),
    variables: { orgName },
  });

  // GraphQL 쿼리 완료 감지
  useEffect(() => {
    if (!loadingDetail && !loadingList && (dataDetail !== undefined || errorDetail)) {
      finishLoading();
    }
  }, [loadingDetail, loadingList, dataDetail, errorDetail, finishLoading]);

  const handleEditMode = () => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('mode', 'edit');
    navigate(`${window.location.pathname}?${currentParams.toString()}`);
  };

  const detailSettings = dataDetail?.settingDetail;
  const listSettings = dataList?.settingList;

  // 로딩 상태
  if (loadingDetail || loadingList) {
    return (
      <ScrappingSettingsLayout 
        orgName={orgName} 
        isActive={false} 
        region=""
      >
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </ScrappingSettingsLayout>
    );
  }

  // 에러 상태
  if (errorDetail) {
    return (
      <ScrappingSettingsLayout 
        orgName={orgName} 
        isActive={listSettings?.use} 
        region={listSettings?.region}
      >
        <Card>
          <CardHeader>
            <CardTitle>오류 발생</CardTitle>
            <CardDescription>데이터를 불러오는 중 오류가 발생했습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{errorDetail.message}</p>
          </CardContent>
        </Card>
      </ScrappingSettingsLayout>
    );
  }

  return (
    <ScrappingSettingsLayout 
      orgName={orgName} 
      isActive={listSettings?.use} 
      region={listSettings?.region}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>상세 스크랩 설정</CardTitle>
              <CardDescription>입찰공고 상세 페이지 스크랩 설정</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEditMode}
            >
              <Edit className="h-4 w-4 mr-1" />
              편집
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {detailSettings && detailSettings.elements && detailSettings.elements.length > 0 ? (
            <div className="space-y-6">
              {/* 설정 개요 */}
              <div>
                <h4 className="text-sm font-medium mb-3">설정 개요</h4>
                <div className="text-sm text-muted-foreground">
                  <p>상세 페이지에서 추출할 데이터 항목들의 XPath 설정입니다.</p>
                  <p>총 <span className="font-medium text-foreground">{detailSettings.elements.length}개</span>의 엘리먼트가 설정되어 있습니다.</p>
                </div>
              </div>

              {/* 엘리먼트 설정 테이블 */}
              <div>
                <h4 className="text-sm font-medium mb-3">엘리먼트 설정</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">키</TableHead>
                        <TableHead>XPath</TableHead>
                        <TableHead className="w-24">타겟</TableHead>
                        <TableHead className="w-24">콜백</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailSettings.elements.map((element: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {element.key}
                            </span>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                              {element.xpath}
                            </code>
                          </TableCell>
                          <TableCell>
                            {element.target ? (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                {element.target}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {element.callback ? (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                {element.callback}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* 설정 가이드 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">설정 가이드</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>키:</strong> 데이터를 식별하는 고유 이름 (예: title, content, file_url)</li>
                  <li>• <strong>XPath:</strong> HTML에서 해당 데이터를 추출할 경로</li>
                  <li>• <strong>타겟:</strong> 추출할 속성 (text, href, src 등)</li>
                  <li>• <strong>콜백:</strong> 추출 후 적용할 변환 함수</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Edit className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-muted-foreground mb-2">상세 스크랩 설정이 없습니다.</p>
              <p className="text-sm text-muted-foreground mb-4">
                상세 페이지에서 추출할 데이터 항목들을 설정해보세요.
              </p>
              <Button 
                variant="outline" 
                onClick={handleEditMode}
              >
                설정 추가하기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </ScrappingSettingsLayout>
  );
}