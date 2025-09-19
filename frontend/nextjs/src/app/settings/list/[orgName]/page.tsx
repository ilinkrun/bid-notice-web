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

const GET_SETTING_LIST = gql`
  query GetSettingList($orgName: String) {
    settingList(orgName: $orgName) {
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
      region
      registration
      use
    }
  }
`;

interface PageProps {
  params: Promise<{ orgName: string }>;
}

export default function SettingsListOrgPage({ params }: PageProps) {
  const { navigate } = useUnifiedNavigation();
  const searchParams = useSearchParams();
  const { finishLoading, startLoading } = useUnifiedLoading();
  const [orgName, setOrgName] = useState<string>('');
  const [editableData, setEditableData] = useState<any>({});

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

  // 선택된 기관의 목록 설정 쿼리 (create mode가 아닐 때만)
  const { loading: loadingList, error: errorList, data: dataList } = useQuery(GET_SETTING_LIST, {
    client: getClient(),
    variables: { orgName: orgName },
    skip: !orgName || isCreateMode,
    fetchPolicy: 'cache-first',
    errorPolicy: 'all'
  });

  useEffect(() => {
    if (dataList) {
      console.log('GET_SETTING_LIST 완료:', dataList);
    }
  }, [dataList]);

  useEffect(() => {
    if (errorList) {
      console.error('GET_SETTING_LIST 에러:', errorList);
    }
  }, [errorList]);

  // GraphQL 쿼리 완료 또는 데이터 없음 시에만 로딩 해제 (Create Mode가 아닐 때만)
  useEffect(() => {
    if (!isCreateMode && !loadingList && (dataList !== undefined || errorList)) {
      finishLoading();
    }
  }, [isCreateMode, loadingList, dataList, errorList, finishLoading]);

  // 데이터가 로드되면 편집 가능한 데이터로 복사 (또는 create mode일 때 빈 데이터 설정)
  useEffect(() => {
    if (isCreateMode) {
      // create mode일 때 빈 데이터 설정
      setEditableData({
        orgName: '',
        detailUrl: '',
        iframe: '',
        rowXpath: '',
        paging: '',
        startPage: 1,
        endPage: 1,
        login: '',
        elements: [
          { key: '제목', xpath: '', target: '', callback: '' },
          { key: '상세페이지주소', xpath: '', target: '', callback: '' },
          { key: '작성일', xpath: '', target: '', callback: '' },
          { key: '작성자', xpath: '', target: '', callback: '' }
        ],
        region: '',
        registration: 0,
        use: 0
      });
      finishLoading();
    } else if (dataList?.settingList) {
      setEditableData(dataList.settingList);
    }
  }, [dataList, isCreateMode, finishLoading]);

  // 뒤로가기 핸들러
  const handleBack = () => {
    navigate('/settings/list');
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
  const updateEditableData = (field: string, value: string | boolean | number | any[]) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 저장 핸들러
  const handleSave = async () => {
    try {
      startLoading();

      console.log('저장할 데이터:', editableData);

      if (isCreateMode) {
        // 새로운 설정 생성
        const response = await apiClient.post(`/settings_notice_list`, {
          ...editableData,
          기관명: editableData.orgName,
          지역: editableData.region,
          등록: editableData.registration
        });

        if (response.status === 200 || response.status === 201) {
          alert('새로운 설정이 생성되었습니다.');
          navigate('/settings/list');
        }
      } else {
        // 기존 설정 업데이트
        const encodedOrgName = encodeURIComponent(orgName);
        const response = await apiClient.put(`/settings_notice_list/${encodedOrgName}`, {
          ...editableData,
          기관명: orgName,
          지역: editableData.region,
          등록: editableData.registration
        });

        if (response.status === 200) {
          alert('저장이 완료되었습니다.');
          handleViewMode();
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
  if (loadingList || (!orgName && !isNewMode)) {
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
                <CardTitle>목록페이지 스크랩 설정</CardTitle>
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
  if (errorList) {
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
            <p className="text-red-500">{errorList.message}</p>
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
                <CardTitle>{isCreateMode ? '새 설정 추가' : '목록페이지 스크랩 설정'}</CardTitle>
                <CardDescription>
                  {isCreateMode
                    ? '새로운 목록 스크랩 설정을 추가합니다'
                    : `${orgName} 목록 스크랩 설정 정보`
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
          {dataList?.settingList || isCreateMode ? (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium mb-2 block">기관명</Label>
                  {isEditMode || isCreateMode ? (
                    <Input
                      value={isCreateMode ? editableData.orgName || '' : orgName}
                      onChange={(e) => {
                        if (isCreateMode) {
                          updateEditableData('orgName', e.target.value);
                        } else {
                          setOrgName(e.target.value);
                        }
                      }}
                      className="text-black"
                    />
                  ) : (
                    <span className="text-gray-700">{orgName}</span>
                  )}
                </div>
                <div>
                  <Label className="text-base font-medium mb-2 block">상세 URL</Label>
                  {isEditMode || isCreateMode ? (
                    <Input
                      value={editableData.detailUrl || ''}
                      onChange={(e) => updateEditableData('detailUrl', e.target.value)}
                      className="text-black font-mono text-sm"
                    />
                  ) : (
                    <span className="font-mono text-sm text-gray-700">{dataList?.settingList?.detailUrl || ''}</span>
                  )}
                </div>
              </div>

              {/* 스크랩 설정 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium mb-2 block">행 XPath</Label>
                  {isEditMode || isCreateMode ? (
                    <Input
                      value={editableData.rowXpath || ''}
                      onChange={(e) => updateEditableData('rowXpath', e.target.value)}
                      className="text-black font-mono text-sm"
                    />
                  ) : (
                    <span className="font-mono text-sm text-gray-700">{dataList?.settingList?.rowXpath || ''}</span>
                  )}
                </div>
                <div>
                  <Label className="text-base font-medium mb-2 block">페이징</Label>
                  {isEditMode || isCreateMode ? (
                    <Input
                      value={editableData.paging || ''}
                      onChange={(e) => updateEditableData('paging', e.target.value)}
                      className="text-black font-mono text-sm"
                    />
                  ) : (
                    <span className="font-mono text-sm text-gray-700">{dataList?.settingList?.paging || ''}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-base font-medium mb-2 block">시작 페이지</Label>
                  {isEditMode || isCreateMode ? (
                    <Input
                      type="number"
                      value={editableData.startPage || ''}
                      onChange={(e) => updateEditableData('startPage', parseInt(e.target.value) || 0)}
                      className="text-black"
                    />
                  ) : (
                    <span className="text-gray-700">{dataList?.settingList?.startPage || 0}</span>
                  )}
                </div>
                <div>
                  <Label className="text-base font-medium mb-2 block">종료 페이지</Label>
                  {isEditMode || isCreateMode ? (
                    <Input
                      type="number"
                      value={editableData.endPage || ''}
                      onChange={(e) => updateEditableData('endPage', parseInt(e.target.value) || 0)}
                      className="text-black"
                    />
                  ) : (
                    <span className="text-gray-700">{dataList?.settingList?.endPage || 0}</span>
                  )}
                </div>
                <div>
                  <Label className="text-base font-medium mb-2 block">사용</Label>
                  {isEditMode || isCreateMode ? (
                    <select
                      value={editableData.use ? 'true' : 'false'}
                      onChange={(e) => updateEditableData('use', e.target.value === 'true')}
                      className="text-black border border-gray-300 rounded px-3 py-2 w-full"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <span className="text-gray-700">{String(dataList?.settingList?.use || false)}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-medium mb-2 block">지역</Label>
                  {isEditMode || isCreateMode ? (
                    <Input
                      value={editableData.region || ''}
                      onChange={(e) => updateEditableData('region', e.target.value)}
                      className="text-black"
                    />
                  ) : (
                    <span className="text-gray-700">{dataList?.settingList?.region || ''}</span>
                  )}
                </div>
                <div>
                  <Label className="text-base font-medium mb-2 block">등록</Label>
                  {isEditMode || isCreateMode ? (
                    <Input
                      value={editableData.registration || ''}
                      onChange={(e) => updateEditableData('registration', e.target.value)}
                      className="text-black"
                    />
                  ) : (
                    <span className="text-gray-700">{dataList?.settingList?.registration || ''}</span>
                  )}
                </div>
              </div>

              {/* 선택적 필드들 */}
              {(dataList?.settingList?.iframe || dataList?.settingList?.login || isEditMode || isCreateMode) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-medium mb-2 block">IFrame</Label>
                    {isEditMode || isCreateMode ? (
                      <Input
                        value={editableData.iframe || ''}
                        onChange={(e) => updateEditableData('iframe', e.target.value)}
                        className="text-black font-mono text-sm"
                      />
                    ) : (
                      <span className="font-mono text-sm text-gray-700">{dataList?.settingList?.iframe || 'N/A'}</span>
                    )}
                  </div>
                  <div>
                    <Label className="text-base font-medium mb-2 block">로그인</Label>
                    {isEditMode || isCreateMode ? (
                      <Input
                        value={editableData.login || ''}
                        onChange={(e) => updateEditableData('login', e.target.value)}
                        className="text-black font-mono text-sm"
                      />
                    ) : (
                      <span className="font-mono text-sm text-gray-700">{dataList?.settingList?.login || 'N/A'}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Elements 표시 */}
              {((dataList?.settingList?.elements && dataList.settingList.elements.length > 0) || isCreateMode) && (
                <div>
                  <Label className="text-base font-medium mb-2 block">요소 목록</Label>
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
                      {(dataList?.settingList?.elements || editableData.elements || []).map((element: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="w-20">
                            <span className="text-sm">{element.key}</span>
                          </TableCell>
                          <TableCell className="flex-1">
                            {isEditMode || isCreateMode ? (
                              <Input
                                value={element.xpath || ''}
                                onChange={(e) => {
                                  const newElements = [...(editableData.elements || dataList?.settingList?.elements || [])];
                                  newElements[index] = { ...newElements[index], xpath: e.target.value };
                                  updateEditableData('elements', newElements);
                                }}
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
                                onChange={(e) => {
                                  const newElements = [...(editableData.elements || dataList?.settingList?.elements || [])];
                                  newElements[index] = { ...newElements[index], target: e.target.value };
                                  updateEditableData('elements', newElements);
                                }}
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
                                onChange={(e) => {
                                  const newElements = [...(editableData.elements || dataList?.settingList?.elements || [])];
                                  newElements[index] = { ...newElements[index], callback: e.target.value };
                                  updateEditableData('elements', newElements);
                                }}
                                className="text-black text-sm"
                                style={{ width: '12rem' }}
                              />
                            ) : (
                              element.callback
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <p>데이터가 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}