'use client';

import { useQuery } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Edit, Eye, Save, ChevronLeft, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrappingSettingsLayout } from '@/components/settings/ScrappingSettingsLayout';

// GraphQL 쿼리 정의
const GET_SETTINGS_LIST = gql`
  query GetSettingsList($orgName: String) {
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

// GraphQL 뮤테이션 정의
const UPDATE_SETTINGS_LIST = gql`
  mutation UpdateSettingsList($input: UpdateSettingsListInput!) {
    updateSettingsList(input: $input) {
      success
      message
    }
  }
`;

export default function ScrappingListSettingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { navigate } = useUnifiedNavigation();
  const { finishLoading } = useUnifiedLoading();

  const orgName = decodeURIComponent(params.orgName as string);
  const mode = searchParams.get('mode');
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view' || mode === null;

  // 편집 모드용 상태
  const [editData, setEditData] = useState({
    orgName: '',
    detailUrl: '',
    paging: '',
    startPage: '',
    endPage: '',
    iframe: '',
    rowXpath: '',
    orgRegion: '',
    use: '',
    orgMan: '',
    companyInCharge: '',
    elements: [] as any[]
  });

  // 원본 데이터 저장
  const [originalData, setOriginalData] = useState({
    orgName: '',
    detailUrl: '',
    paging: '',
    startPage: '',
    endPage: '',
    iframe: '',
    rowXpath: '',
    orgRegion: '',
    use: '',
    orgMan: '',
    companyInCharge: '',
    elements: [] as any[]
  });

  // 모달 상태
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);

  // 목록 스크랩 설정 쿼리
  const { loading, error, data } = useQuery(GET_SETTINGS_LIST, {
    client: getClient(),
    variables: { orgName },
    onCompleted: (data) => {
      console.log('GET_SETTINGS_LIST 완료:', data);
    },
    onError: (error) => {
      console.error('GET_SETTINGS_LIST 에러:', error);
    }
  });

  // GraphQL 쿼리 완료 감지
  useEffect(() => {
    if (!loading && (data !== undefined || error)) {
      finishLoading();
    }
  }, [loading, data, error, finishLoading]);

  // 데이터 로드 시 편집 데이터 초기화
  useEffect(() => {
    if (data?.settingList) {
      const settings = data.settingList;
      const dataState = {
        orgName: settings.orgName || '',
        detailUrl: settings.detailUrl || '',
        paging: settings.paging || '',
        startPage: settings.startPage?.toString() || '',
        endPage: settings.endPage?.toString() || '',
        iframe: settings.iframe || '',
        rowXpath: settings.rowXpath || '',
        orgRegion: settings.region || '',
        use: settings.use?.toString() || '',
        orgMan: settings.orgMan || '',
        companyInCharge: settings.companyInCharge || '',
        elements: settings.elements || []
      };
      
      setEditData(dataState);
      setOriginalData(dataState);
    }
  }, [data]);

  // GraphQL 뮤테이션
  const [updateSettingsList] = useMutation(UPDATE_SETTINGS_LIST, {
    client: getClient(),
    onCompleted: (data) => {
      console.log('저장 완료:', data);
    },
    onError: (error) => {
      console.error('저장 에러:', error);
    }
  });

  const handleEditMode = () => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('mode', 'edit');
    navigate(`${window.location.pathname}?${currentParams.toString()}`);
  };

  const handleViewMode = () => {
    window.location.href = `/settings/scrapping/${encodeURIComponent(orgName)}/list`;
  };

  const detectChanges = () => {
    const changes: string[] = [];

    // 기본 설정 변경 검사
    if (editData.detailUrl !== originalData.detailUrl) {
      changes.push(`- URL이 '${editData.detailUrl}'로 변경됨`);
    }
    if (editData.paging !== originalData.paging) {
      changes.push(`- 페이징이 '${editData.paging || '설정 없음'}'로 변경됨`);
    }
    if (editData.startPage !== originalData.startPage) {
      changes.push(`- 시작 페이지가 '${editData.startPage}'로 변경됨`);
    }
    if (editData.endPage !== originalData.endPage) {
      changes.push(`- 종료 페이지가 '${editData.endPage}'로 변경됨`);
    }
    if (editData.iframe !== originalData.iframe) {
      changes.push(`- iFrame이 '${editData.iframe || '없음'}'로 변경됨`);
    }
    if (editData.rowXpath !== originalData.rowXpath) {
      changes.push(`- 행 XPath가 '${editData.rowXpath}'로 변경됨`);
    }

    // 요소 설정 변경 검사
    editData.elements.forEach((element, index) => {
      const originalElement = originalData.elements[index];
      if (originalElement) {
        if (element.xpath !== originalElement.xpath || 
            element.target !== originalElement.target || 
            element.callback !== originalElement.callback) {
          changes.push(`- ${element.key}가 '${element.xpath}|${element.target || '-'}|${element.callback || '-'}'로 변경됨`);
        }
      }
    });

    return changes;
  };

  const handleSave = () => {
    const detectedChanges = detectChanges();
    if (detectedChanges.length === 0) {
      setChanges([]);
      setShowSaveModal(true);
    } else {
      setChanges(detectedChanges);
      setShowSaveModal(true);
    }
  };

  const handleConfirmSave = async () => {
    try {
      await updateSettingsList({
        variables: {
          input: {
            orgName: orgName,
            detailUrl: editData.detailUrl,
            paging: editData.paging || null,
            startPage: parseInt(editData.startPage) || 1,
            endPage: parseInt(editData.endPage) || 1,
            iframe: editData.iframe || null,
            rowXpath: editData.rowXpath,
            elements: editData.elements
          }
        }
      });
      
      setShowSaveModal(false);
      // 저장 후 view 모드로 전환
      handleViewMode();
    } catch (error) {
      console.error('저장 중 오류 발생:', error);
      setShowSaveModal(false);
    }
  };

  const handleCancelSave = () => {
    setShowSaveModal(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleElementChange = (index: number, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      elements: prev.elements.map((element, i) => 
        i === index ? { ...element, [field]: value } : element
      )
    }));
  };

  const listSettings = data?.settingList;

  // 로딩 상태
  if (loading) {
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
  if (error) {
    return (
      <ScrappingSettingsLayout 
        orgName={orgName} 
        isActive={false} 
        region=""
      >
        <Card>
          <CardHeader>
            <CardTitle>오류 발생</CardTitle>
            <CardDescription>데이터를 불러오는 중 오류가 발생했습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error.message}</p>
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
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">입찰공고 목록 스크랩 설정</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const guideElement = document.getElementById('settings-guide');
                  if (guideElement) {
                    guideElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                title="작성 가이드 보기"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            </div>
            <div className="flex space-x-2">
              {isEditMode ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleViewMode}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    보기
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    저장
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleEditMode}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  편집
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listSettings ? (
            <div className="space-y-6">
              {/* 기본 설정 */}
              <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3 text-pink-900">📋 기본 설정</h4>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium w-24">
                            <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">
                              기관명
                            </span>
                          </TableCell>
                          <TableCell className="break-all">
                            <Input
                              value={editData.orgName}
                              onChange={(e) => handleInputChange('orgName', e.target.value)}
                              className="w-full text-xs bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              disabled={!isEditMode}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium w-24">
                            <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">
                              URL
                            </span>
                          </TableCell>
                          <TableCell className="break-all">
                            <Input
                              value={editData.detailUrl}
                              onChange={(e) => handleInputChange('detailUrl', e.target.value)}
                              className="w-full text-xs bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              disabled={!isEditMode}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">
                              페이징
                            </span>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.paging}
                              onChange={(e) => handleInputChange('paging', e.target.value)}
                              className="w-full text-xs font-mono bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              placeholder="설정 없음"
                              disabled={!isEditMode}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">
                              시작 페이지
                            </span>
                          </TableCell>
                          <TableCell className="flex items-center space-x-6">
                            <Input
                              value={editData.startPage}
                              onChange={(e) => handleInputChange('startPage', e.target.value)}
                              className="w-20 text-xs bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              type="number"
                              disabled={!isEditMode}
                            />
                            <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">종료 페이지</span>
                            <Input
                              value={editData.endPage}
                              onChange={(e) => handleInputChange('endPage', e.target.value)}
                              className="w-20 text-xs bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              type="number"
                              disabled={!isEditMode}
                            />
                            <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">iFrame</span>
                            <Input
                              value={editData.iframe}
                              onChange={(e) => handleInputChange('iframe', e.target.value)}
                              className="w-32 text-xs bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              placeholder="없음"
                              disabled={!isEditMode}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">
                              행 XPath
                            </span>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.rowXpath}
                              onChange={(e) => handleInputChange('rowXpath', e.target.value)}
                              className="w-full text-xs font-mono bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              disabled={!isEditMode}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* 요소 설정 */}
                {listSettings.elements && listSettings.elements.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium mb-3 text-pink-900">🔧 요소 설정</h4>
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-32">키</TableHead>
                            <TableHead>Xpath</TableHead>
                            <TableHead className="w-24">타겟</TableHead>
                            <TableHead className="w-48">콜백</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(isEditMode ? editData.elements : listSettings.elements).map((element: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">
                                  {element.key}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={element.xpath || ''}
                                  onChange={(e) => handleElementChange(index, 'xpath', e.target.value)}
                                  className="w-full text-xs font-mono bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                                  disabled={!isEditMode}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={element.target || ''}
                                  onChange={(e) => handleElementChange(index, 'target', e.target.value)}
                                  className="w-full text-xs bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                                  disabled={!isEditMode}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={element.callback || ''}
                                  onChange={(e) => handleElementChange(index, 'callback', e.target.value)}
                                  className="w-full text-xs font-mono bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                                  disabled={!isEditMode}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                {/* 부가 설정 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3 text-pink-900">⚙️ 부가 설정</h4>
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">
                              지역
                            </span>
                          </TableCell>
                          <TableCell className="flex items-center space-x-6">
                            <Input
                              value={editData.orgRegion}
                              onChange={(e) => handleInputChange('orgRegion', e.target.value)}
                              className="w-32 text-xs bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              disabled={!isEditMode}
                            />
                            <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">사용</span>
                            <Input
                              value={editData.use}
                              onChange={(e) => handleInputChange('use', e.target.value)}
                              className="w-20 text-xs bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              disabled={!isEditMode}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">
                              담당업체
                            </span>
                          </TableCell>
                          <TableCell className="flex items-center space-x-6">
                            <Input
                              value={editData.companyInCharge}
                              onChange={(e) => handleInputChange('companyInCharge', e.target.value)}
                              className="w-32 text-xs bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              disabled={!isEditMode}
                            />
                            <span className="bg-transparent text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">담당자</span>
                            <Input
                              value={editData.orgMan}
                              onChange={(e) => handleInputChange('orgMan', e.target.value)}
                              className="w-32 text-xs bg-pink-25 text-pink-900 border-pink-200 focus:border-pink-400 focus:ring-pink-200"
                              disabled={!isEditMode}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

              {/* 설정 가이드 */}
              <div id="settings-guide" className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">설정 가이드</h4>
                
                {/* 기본 설정 가이드 */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">📋 기본 설정</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>URL:</strong> 게시판 url</li>
                    <li className="ml-4 text-blue-700">- 페이지가 url에 있는 포함된 경우 'pgno=$&#123;i&#125;'와 같이 '$&#123;i&#125;'로 표시</li>
                    <li className="ml-4 text-blue-700">- 예: https://www.gangnam.go.kr/notice/list.do?mid=ID05_0402&pgno=$&#123;i&#125;</li>
                    <li>• <strong>페이징:</strong> 페이지를 클릭으로 이동하는 경우, 해당 요소의 XPath</li>
                    <li className="ml-4 text-blue-700">- 예: //div[contains(@class, "pagination")]/span/a[contains(text(),"$&#123;i&#125;")]</li>
                    <li>• <strong>시작페이지:</strong> 1회에 스크랩하는 페이지의 시작 페이지 번호</li>
                    <li className="ml-4 text-blue-700">- 예: 1</li>
                    <li>• <strong>종료페이지:</strong> 1회에 스크랩하는 페이지의 종료 페이지 번호</li>
                    <li className="ml-4 text-blue-700">- 예: 3</li>
                    <li>• <strong>행 XPath:</strong> 스크랩하는 게시판에서 1개의 공고 행의 XPath</li>
                    <li className="ml-4 text-blue-700">- 예: //*[@id="board"]/table/tbody/tr</li>
                  </ul>
                </div>

                {/* 요소 설정 가이드 */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">🔧 요소 설정</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>키:</strong> 요소의 이름</li>
                    <li className="ml-4 text-blue-700">- title: 제목</li>
                    <li className="ml-4 text-blue-700">- detail_url: 상세페이지 url</li>
                    <li className="ml-4 text-blue-700">- posted_date: 작성일</li>
                    <li className="ml-4 text-blue-700">- posted_by: 작성자</li>
                    <li>• <strong>XPath:</strong> 목록 행 내에서의 상대 XPath</li>
                    <li className="ml-4 text-blue-700">- 예: td[4]/a</li>
                    <li>• <strong>타겟:</strong> 요소의 html 속성(text인 경우 빈값)</li>
                    <li className="ml-4 text-blue-700">- 예: href</li>
                    <li>• <strong>콜백:</strong> XPath, 타겟으로 얻은 값(rst)을 수정하는 함수</li>
                    <li className="ml-4 text-blue-700">- 예: "https://www.gp.go.kr/portal/" + rst.split("/")[1]</li>
                  </ul>
                </div>

                {/* 부가 설정 가이드 */}
                <div>
                  <h5 className="text-sm font-medium text-blue-900 mb-2">⚙️ 부가 설정</h5>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>지역:</strong> 입찰 공고 관련 지역명(서울, 경기, 충남, 전국)</li>
                    <li>• <strong>사용:</strong> 스크랩 사용 여부(1: 사용, 0: 사용안함)</li>
                    <li>• <strong>담당업체:</strong> '일맥', '링크', '일맥,링크'</li>
                    <li>• <strong>담당자:</strong> 관련 업무 담당자</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">목록 스크랩 설정이 없습니다.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleEditMode}
              >
                설정 추가하기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 저장 확인 모달 */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {changes.length === 0 ? "변경 사항 없음" : "변경 사항 확인"}
            </DialogTitle>
            <DialogDescription>
              {changes.length === 0 ? (
                "변경된 값이 없습니다."
              ) : (
                <div className="space-y-2">
                  <p>다음 항목들이 변경되었습니다:</p>
                  <div className="bg-muted p-3 rounded text-sm">
                    {changes.map((change, index) => (
                      <div key={index}>{change}</div>
                    ))}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {changes.length === 0 ? (
              <Button onClick={handleCancelSave}>
                닫기
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancelSave}>
                  취소
                </Button>
                <Button onClick={handleConfirmSave}>
                  저장
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrappingSettingsLayout>
  );
}