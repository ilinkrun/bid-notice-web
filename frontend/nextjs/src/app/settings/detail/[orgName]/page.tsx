'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Eye, Save } from 'lucide-react';
import { ButtonWithColorIcon } from '@/components/shared/FormComponents';
import { useSearchParams } from 'next/navigation';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { apiClient } from '@/lib/api/backendClient';

const GET_SETTING_DETAIL = gql`
  query GetSettingDetail($orgName: String!) {
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

interface PageProps {
  params: Promise<{ orgName: string }>;
}

export default function SettingDetailOrgPage({ params }: PageProps) {
  const { navigate } = useUnifiedNavigation();
  const searchParams = useSearchParams();
  const { finishLoading, startLoading } = useUnifiedLoading();
  const [orgName, setOrgName] = useState<string>('');
  const [editableData, setEditableData] = useState<any[]>([]);
  const [newOrgName, setNewOrgName] = useState<string>(''); // create mode용 기관명
  const [isNewMode, setIsNewMode] = useState(false);
  
  // 모드 확인
  const mode = searchParams.get('mode') || 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create' || isNewMode;

  // params 처리
  React.useEffect(() => {
    Promise.resolve(params).then((resolvedParams) => {
      const decodedOrgName = decodeURIComponent(resolvedParams.orgName);
      if (decodedOrgName === 'new') {
        setIsNewMode(true);
        setOrgName(''); // new일 때는 빈 문자열로 설정
      } else {
        setIsNewMode(false);
        setOrgName(decodedOrgName);
      }
    });
  }, [params]);

  // 선택된 기관의 상세 설정 쿼리 (create mode가 아닐 때만)
  const { loading: loadingDetail, error: errorDetail, data: dataDetail } = useQuery(GET_SETTING_DETAIL, {
    client: getClient(),
    variables: { orgName: orgName },
    skip: !orgName || isCreateMode,
    fetchPolicy: 'cache-first', // 캐시 정책 추가
    errorPolicy: 'all' // 에러가 있어도 부분 데이터 표시
  });

  useEffect(() => {
    if (dataDetail) {
      console.log('GET_SETTING_DETAIL 완료:', dataDetail);
    }
  }, [dataDetail]);

  useEffect(() => {
    if (errorDetail) {
      console.error('GET_SETTING_DETAIL 에러:', errorDetail);
    }
  }, [errorDetail]);

  // GraphQL 쿼리 완료 또는 데이터 없음 시에만 로딩 해제 (Create Mode가 아닐 때만)
  useEffect(() => {
    if (!isCreateMode && !loadingDetail && (dataDetail !== undefined || errorDetail)) {
      finishLoading();
    }
  }, [isCreateMode, loadingDetail, dataDetail, errorDetail, finishLoading]);

  // 데이터가 로드되면 편집 가능한 데이터로 복사 (또는 create mode일 때 빈 데이터 설정)
  useEffect(() => {
    if (isCreateMode) {
      // create mode일 때 빈 데이터 설정
      setEditableData([
        { key: '제목', xpath: '', target: '', callback: '' },
        { key: '본문', xpath: '', target: '', callback: '' },
        { key: '파일이름', xpath: '', target: '', callback: '' },
        { key: '파일주소', xpath: '', target: '', callback: '' },
        { key: '공고구분', xpath: '', target: '', callback: '' },
        { key: '공고번호', xpath: '', target: '', callback: '' },
        { key: '담당부서', xpath: '', target: '', callback: '' },
        { key: '담당자', xpath: '', target: '', callback: '' },
        { key: '연락처', xpath: '', target: '', callback: '' }
      ]);
      finishLoading();
    } else if (dataDetail?.settingDetail?.elements) {
      setEditableData([...dataDetail.settingDetail.elements]);
    }
  }, [dataDetail, isCreateMode, finishLoading]);

  // 뒤로가기 핸들러
  const handleBack = () => {
    navigate('/settings/detail');
  };

  // 편집 모드 전환
  const handleEditMode = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('mode', 'edit');
    navigate(currentUrl.pathname + '?' + currentUrl.searchParams.toString());
  };

  // 보기 모드 전환
  const handleViewMode = () => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('mode');
    navigate(currentUrl.pathname + (currentUrl.searchParams.toString() ? '?' + currentUrl.searchParams.toString() : ''));
  };

  // 편집 가능한 데이터 업데이트
  const updateEditableData = (index: number, field: string, value: string) => {
    setEditableData(prev => {
      const newData = [...prev];
      newData[index] = { ...newData[index], [field]: value };
      return newData;
    });
  };

  // 저장 핸들러
  const handleSave = async () => {
    try {
      startLoading();
      
      // XPath, Target, Callback을 '|-'로 병합
      const mergedData: any = {};
      
      editableData.forEach((element) => {
        let mergedValue = element.xpath || '';
        if (element.target) {
          mergedValue += '|-' + element.target;
        }
        if (element.callback) {
          mergedValue += (element.target ? '' : '|-') + '|-' + element.callback;
        }
        mergedData[element.key] = mergedValue;
      });

      console.log('저장할 데이터:', mergedData);
      
      if (isCreateMode) {
        // create mode: 기관명은 별도 state에서 가져옴
        if (!newOrgName) {
          alert('기관명을 입력해주세요.');
          finishLoading();
          return;
        }
        mergedData['기관명'] = newOrgName;
        
        // 새로운 설정 생성
        const response = await apiClient.post(`/settings_notice_detail`, mergedData);
        
        if (response.status === 200 || response.status === 201) {
          alert('새로운 설정이 생성되었습니다.');
          navigate('/settings/detail');
        }
      } else {
        // 기존 설정 업데이트
        mergedData['기관명'] = orgName;
        
        const encodedOrgName = encodeURIComponent(orgName);
        const response = await apiClient.put(`/settings_notice_detail/${encodedOrgName}`, mergedData);
        
        if (response.status === 200) {
          alert('저장이 완료되었습니다.');
          // 보기 모드로 전환
          handleViewMode();
          // 데이터 새로고침을 위해 페이지 리로드
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      finishLoading();
    }
  };

  // 로딩 상태 처리
  if (loadingDetail || (!orgName && !isNewMode)) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                목록으로
              </Button>
              <div>
                <CardTitle>상세페이지 스크랩 설정</CardTitle>
                <CardDescription>{orgName || '설정'} 정보를 불러오는 중...</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 에러 상태 처리
  if (errorDetail) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                목록으로
              </Button>
              <div>
                <CardTitle>오류 발생</CardTitle>
                <CardDescription>데이터를 불러오는 중 오류가 발생했습니다.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{errorDetail.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                목록으로
              </Button>
              <div>
                <CardTitle>{isCreateMode ? '새 설정 추가' : '상세페이지 스크랩 설정'}</CardTitle>
                <CardDescription>
                  {isCreateMode 
                    ? '새로운 상세페이지 스크랩 설정을 추가합니다' 
                    : `${orgName} 설정 상세 정보`
                  }
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCreateMode ? (
                <Button variant="default" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  생성
                </Button>
              ) : !isEditMode ? (
                <Button variant="outline" size="sm" onClick={handleEditMode}>
                  <Edit className="h-4 w-4 mr-1" />
                  편집
                </Button>
              ) : (
                <>
                  <ButtonWithColorIcon
                    icon={<Eye className="h-4 w-4" />}
                    onClick={handleViewMode}
                    color="tertiary"
                    mode="outline"
                    className="text-sm px-3 py-1"
                  >
                    보기
                  </ButtonWithColorIcon>
                  <ButtonWithColorIcon
                    icon={<Save className="h-4 w-4" />}
                    onClick={handleSave}
                    color="secondary"
                    mode="outline"
                    className="text-sm px-3 py-1"
                  >
                    저장
                  </ButtonWithColorIcon>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dataDetail?.settingDetail || isCreateMode ? (
            <div className="space-y-6">
              <div className="mb-4">
                {isEditMode || isCreateMode ? (
                  <div className="flex items-center gap-3">
                    <Label className="text-base font-medium">기관명:</Label>
                    <Input 
                      value={isCreateMode ? newOrgName : orgName} 
                      onChange={(e) => {
                        if (isCreateMode) {
                          setNewOrgName(e.target.value);
                        } else {
                          setOrgName(e.target.value);
                        }
                      }}
                      className="text-black w-48"
                      placeholder={isCreateMode ? "기관명을 입력하세요" : ""}
                    />
                  </div>
                ) : (
                  <Label className="text-base font-medium">기관명: <span className="font-normal text-gray-700">{orgName}</span></Label>
                )}
              </div>
              
              <div>
                <Label className="mb-2 block">요소 목록</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">키</TableHead>
                      <TableHead className="flex-1">XPath</TableHead>
                      <TableHead className="w-20">Target</TableHead>
                      <TableHead className="w-32">Callback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(isEditMode || isCreateMode ? editableData : dataDetail.settingDetail.elements)?.length > 0 ? (
                      (isEditMode || isCreateMode ? editableData : dataDetail.settingDetail.elements).map((element: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="w-20">
                            <span className="text-sm">{element.key}</span>
                          </TableCell>
                          <TableCell className="flex-1">
                            {isEditMode || isCreateMode ? (
                              <Input 
                                value={element.xpath || ''} 
                                onChange={(e) => updateEditableData(index, 'xpath', e.target.value)}
                                className="w-full font-mono text-xs text-black"
                              />
                            ) : (
                              <span className="font-mono text-sm">{element.xpath}</span>
                            )}
                          </TableCell>
                          <TableCell className="w-20">
                            {isEditMode || isCreateMode ? (
                              <Input 
                                value={element.target || ''} 
                                onChange={(e) => updateEditableData(index, 'target', e.target.value)}
                                className="text-black text-sm"
                                style={{ width: '8rem' }}
                              />
                            ) : (
                              element.target
                            )}
                          </TableCell>
                          <TableCell className="w-32">
                            {isEditMode || isCreateMode ? (
                              <Input 
                                value={element.callback || ''} 
                                onChange={(e) => updateEditableData(index, 'callback', e.target.value)}
                                className="text-black text-sm"
                                style={{ width: '12rem' }}
                              />
                            ) : (
                              element.callback
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          설정된 요소가 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <p>데이터가 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}