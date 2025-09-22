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
import { Edit, Eye, Save, HelpCircle, Settings, Puzzle, FileText, List } from 'lucide-react';
import { ButtonWithIcon, ButtonWithColorIcon, TabHeader, TabContainer } from '@/components/shared/FormComponents';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrappingSettingsLayout } from '@/components/settings/ScrappingSettingsLayout';
import { SectionWithGuide } from '@/components/shared/SectionWithGuide';

// GraphQL 쿼리 정의
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

// 기본 정보를 가져오기 위한 쿼리
const GET_SETTINGS_LIST_BRIEF = gql`
  query GetSettingsListBriefByOid($oid: Int!) {
    settingListByOid(oid: $oid) {
      region
      use
      orgName
    }
  }
`;

// GraphQL 뮤테이션 정의
const UPDATE_SETTINGS_DETAIL = gql`
  mutation UpsertSettingsDetailByOid($oid: Int!, $input: SettingsNoticeDetailInput!) {
    upsertSettingsDetailByOid(oid: $oid, input: $input) {
      oid
      orgName
      use
    }
  }
`;

export default function ScrappingDetailSettingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { navigate } = useUnifiedNavigation();
  const { startLoading, finishLoading } = useUnifiedLoading();

  const oid = parseInt(params.oid as string);
  const mode = searchParams.get('mode');
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view' || mode === null;

  // 편집 모드용 상태
  const [editData, setEditData] = useState({
    orgName: '',
    title: '',
    bodyHtml: '',
    fileName: '',
    fileUrl: '',
    preview: '',
    noticeDiv: '',
    noticeNum: '',
    orgDept: '',
    orgMan: '',
    orgTel: '',
    use: '',
    sampleUrl: '',
    down: ''
  });

  // 원본 데이터 저장
  const [originalData, setOriginalData] = useState({
    orgName: '',
    title: '',
    bodyHtml: '',
    fileName: '',
    fileUrl: '',
    preview: '',
    noticeDiv: '',
    noticeNum: '',
    orgDept: '',
    orgMan: '',
    orgTel: '',
    use: '',
    sampleUrl: '',
    down: ''
  });

  // 모달 상태
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);

  // 탭 상태
  const [activeSubTab, setActiveSubTab] = useState('all');

  // 상세 스크랩 설정 쿼리
  const { loading: loadingDetail, error: errorDetail, data: dataDetail } = useQuery(GET_SETTINGS_DETAIL, {
    client: getClient(),
    variables: { oid }
  });


  // 기본 정보 쿼리 (활성 상태, 지역 정보)
  const { loading: loadingList, data: dataList } = useQuery(GET_SETTINGS_LIST_BRIEF, {
    client: getClient(),
    variables: { oid },
  });

  // 로딩 완료 처리
  useEffect(() => {
    if (!loadingDetail && !loadingList) {
      finishLoading();
    }
  }, [loadingDetail, loadingList, finishLoading]);

  // 데이터 로드 시 편집 데이터 초기화
  useEffect(() => {
    if (dataDetail?.settingsDetailByOid) {
      const settings = dataDetail.settingsDetailByOid;
      const dataState = {
        orgName: settings.orgName || '',
        title: settings.title || '',
        bodyHtml: settings.bodyHtml || '',
        fileName: settings.fileName || '',
        fileUrl: settings.fileUrl || '',
        preview: settings.preview || '',
        noticeDiv: settings.noticeDiv || '',
        noticeNum: settings.noticeNum || '',
        orgDept: settings.orgDept || '',
        orgMan: settings.orgMan || '',
        orgTel: settings.orgTel || '',
        use: settings.use?.toString() || '',
        sampleUrl: settings.sampleUrl || '',
        down: settings.down?.toString() || ''
      };

      setEditData(dataState);
      setOriginalData(dataState);
    }
  }, [dataDetail]);

  // GraphQL 뮤테이션
  const [updateSettingsDetail] = useMutation(UPDATE_SETTINGS_DETAIL, {
    client: getClient()
  });

  const handleEditMode = () => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('mode', 'edit');
    navigate(`${window.location.pathname}?${currentParams.toString()}`);
  };

  const handleViewMode = () => {
    window.location.href = `/settings/scrapping/${oid}/detail`;
  };

  const detectChanges = () => {
    const changes: string[] = [];

    if (editData.title !== originalData.title) {
      changes.push(`- 제목 XPath가 '${editData.title || '설정 없음'}'로 변경됨`);
    }
    if (editData.bodyHtml !== originalData.bodyHtml) {
      changes.push(`- 본문 XPath가 '${editData.bodyHtml || '설정 없음'}'로 변경됨`);
    }
    if (editData.fileName !== originalData.fileName) {
      changes.push(`- 파일이름 XPath가 '${editData.fileName || '설정 없음'}'로 변경됨`);
    }
    if (editData.fileUrl !== originalData.fileUrl) {
      changes.push(`- 파일주소 XPath가 '${editData.fileUrl || '설정 없음'}'로 변경됨`);
    }
    if (editData.sampleUrl !== originalData.sampleUrl) {
      changes.push(`- 샘플 URL이 '${editData.sampleUrl || '없음'}'로 변경됨`);
    }

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
      await updateSettingsDetail({
        variables: {
          oid: oid,
          input: {
            orgName: editData.orgName,
            title: editData.title || null,
            bodyHtml: editData.bodyHtml || null,
            fileName: editData.fileName || null,
            fileUrl: editData.fileUrl || null,
            preview: editData.preview || null,
            noticeDiv: editData.noticeDiv || null,
            noticeNum: editData.noticeNum || null,
            orgDept: editData.orgDept || null,
            orgMan: editData.orgMan || null,
            orgTel: editData.orgTel || null,
            use: parseInt(editData.use) || 1,
            sampleUrl: editData.sampleUrl || null,
            down: parseInt(editData.down) || 1
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

  const detailSettings = dataDetail?.settingsDetailByOid;
  const listSettings = dataList?.settingListByOid;
  const orgName = listSettings?.orgName || detailSettings?.orgName || 'Unknown';

  // 새로운 플로우: 네비게이션 중이거나 Skeleton을 표시해야 하는 경우
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
      {/* 상세 스크래핑 설정 메인 섹션 */}
      <SectionWithGuide
        title="상세 스크래핑 설정"
        icon={<FileText className="w-5 h-5" />}
        accentColor="#6366f1"
        category="운영가이드"
        pageTitle={`${orgName} 상세 스크래핑 설정`}
      >
        <div className="space-y-0">
          {/* 서브탭 헤더 */}
          <TabHeader
            tabs={[
              {
                id: 'all',
                label: '전체 설정',
                icon: <List className="h-4 w-4" />
              },
              {
                id: 'basic',
                label: '기본 설정',
                icon: <Settings className="h-4 w-4" />
              },
              {
                id: 'elements',
                label: '요소 설정',
                icon: <Puzzle className="h-4 w-4" />
              }
            ]}
            activeTab={activeSubTab}
            onTabChange={setActiveSubTab}
          />

          {/* 탭 컨텐츠 */}
          <TabContainer className="p-0 mt-0">
            {detailSettings ? (
              <div>
                {/* 전체 설정 탭 */}
                {activeSubTab === 'all' && (
                  <div className="space-y-1">
                    {/* 기본 설정 */}
                    <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium w-24">
                              <span className="text-gray-500 text-sm">기관명</span>
                            </TableCell>
                            <TableCell className="break-all">
                              <Input
                                value={editData.orgName}
                                onChange={(e) => handleInputChange('orgName', e.target.value)}
                                className="w-full text-sm"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                disabled={!isEditMode}
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* 요소 설정 */}
                    <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                      <Table>
                        <TableBody>
                          {[
                            { key: '제목', field: 'title', target: 'text', callback: '' },
                            { key: '본문', field: 'bodyHtml', target: 'html', callback: '' },
                            { key: '파일이름', field: 'fileName', target: 'text', callback: '' },
                            { key: '파일주소', field: 'fileUrl', target: 'href', callback: '' },
                            { key: '미리보기', field: 'preview', target: 'text', callback: '' },
                            { key: '공고구분', field: 'noticeDiv', target: 'text', callback: '' },
                            { key: '공고번호', field: 'noticeNum', target: 'text', callback: '' },
                            { key: '담당부서', field: 'orgDept', target: 'text', callback: '' },
                            { key: '담당자', field: 'orgMan', target: 'text', callback: '' },
                            { key: '연락처', field: 'orgTel', target: 'text', callback: '' }
                          ].map((element, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium w-24">
                                <span className="text-gray-500 text-sm">{element.key}</span>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editData[element.field as keyof typeof editData] || ''}
                                  onChange={(e) => handleInputChange(element.field, e.target.value)}
                                  className="w-full text-sm font-mono"
                                  style={{ color: 'var(--color-primary-foreground)' }}
                                  disabled={!isEditMode}
                                  placeholder={`${element.key} XPath`}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell className="font-medium w-24">
                              <span className="text-gray-500 text-sm">샘플 URL</span>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editData.sampleUrl}
                                onChange={(e) => handleInputChange('sampleUrl', e.target.value)}
                                className="w-full text-sm"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                disabled={!isEditMode}
                                placeholder="테스트용 샘플 URL"
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* 기본 설정 탭 */}
                {activeSubTab === 'basic' && (
                  <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium w-24">
                            <span className="text-gray-500 text-sm">기관명</span>
                          </TableCell>
                          <TableCell className="break-all">
                            <Input
                              value={editData.orgName}
                              onChange={(e) => handleInputChange('orgName', e.target.value)}
                              className="w-full text-sm"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              disabled={!isEditMode}
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* 요소 설정 탭 */}
                {activeSubTab === 'elements' && (
                  <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                    <Table>
                      <TableBody>
                        {[
                          { key: '제목', field: 'title', target: 'text', callback: '' },
                          { key: '본문', field: 'bodyHtml', target: 'html', callback: '' },
                          { key: '파일이름', field: 'fileName', target: 'text', callback: '' },
                          { key: '파일주소', field: 'fileUrl', target: 'href', callback: '' },
                          { key: '미리보기', field: 'preview', target: 'text', callback: '' },
                          { key: '공고구분', field: 'noticeDiv', target: 'text', callback: '' },
                          { key: '공고번호', field: 'noticeNum', target: 'text', callback: '' },
                          { key: '담당부서', field: 'orgDept', target: 'text', callback: '' },
                          { key: '담당자', field: 'orgMan', target: 'text', callback: '' },
                          { key: '연락처', field: 'orgTel', target: 'text', callback: '' }
                        ].map((element, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium w-24">
                              <span className="text-gray-500 text-sm">{element.key}</span>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={editData[element.field as keyof typeof editData] || ''}
                                onChange={(e) => handleInputChange(element.field, e.target.value)}
                                className="w-full text-sm font-mono"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                disabled={!isEditMode}
                                placeholder={`${element.key} XPath`}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell className="font-medium w-24">
                            <span className="text-gray-500 text-sm">샘플 URL</span>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.sampleUrl}
                              onChange={(e) => handleInputChange('sampleUrl', e.target.value)}
                              className="w-full text-sm"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              disabled={!isEditMode}
                              placeholder="테스트용 샘플 URL"
                            />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-color-primary-muted-foreground">상세 스크래핑 설정이 없습니다.</p>
                <ButtonWithIcon
                  icon={<Edit className="h-4 w-4" />}
                  onClick={handleEditMode}
                  className="mt-4"
                >
                  설정 추가하기
                </ButtonWithIcon>
              </div>
            )}

            {/* 버튼 영역 - TabContainer 하단 우측 */}
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              {isEditMode ? (
                <>
                  <ButtonWithColorIcon
                    icon={<Eye className="w-4 h-4" />}
                    onClick={handleViewMode}
                    color="tertiary"
                    mode="outline"
                  >
                    보기
                  </ButtonWithColorIcon>
                  <ButtonWithColorIcon
                    icon={<Save className="w-4 h-4" />}
                    onClick={handleSave}
                    color="secondary"
                    mode="outline"
                  >
                    저장
                  </ButtonWithColorIcon>
                </>
              ) : (
                <ButtonWithIcon
                  icon={<Edit className="w-4 h-4" />}
                  onClick={handleEditMode}
                >
                  편집
                </ButtonWithIcon>
              )}
            </div>
          </TabContainer>
        </div>
      </SectionWithGuide>

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
                  <div className="p-3 rounded text-sm">
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