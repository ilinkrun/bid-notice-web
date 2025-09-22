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
import { Edit, Eye, Save, ChevronLeft, HelpCircle, Settings, Puzzle, Wrench, List as ListIcon } from 'lucide-react';
import { ButtonWithIcon, ButtonWithColorIcon, TabHeader, TabContainer } from '@/components/shared/FormComponents';
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

// GraphQL 뮤테이션 정의
const UPDATE_SETTINGS_LIST = gql`
  mutation UpsertSettingsListByOid($oid: Int!, $input: SettingsListInput!) {
    upsertSettingsListByOid(oid: $oid, input: $input) {
      oid
      orgName
      detailUrl
      orgRegion
      registration
      use
    }
  }
`;

export default function ScrappingListSettingsPage() {
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
    exceptionRow: '',
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
    exceptionRow: '',
    elements: [] as any[]
  });

  // 모달 상태
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);

  // 탭 상태
  const [activeSubTab, setActiveSubTab] = useState('all');

  // 목록 스크래핑 설정 쿼리
  const { loading, error, data } = useQuery(GET_SETTINGS_LIST, {
    client: getClient(),
    variables: { oid }
  });

  // Handle data completion
  useEffect(() => {
    if (data) {
      console.log('GET_SETTINGS_LIST 완료:', data);
      finishLoading();
    }
  }, [data, finishLoading]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('GET_SETTINGS_LIST 에러:', error);
      finishLoading();
    }
  }, [error, finishLoading]);

  // 데이터 로드 시 편집 데이터 초기화
  useEffect(() => {
    if (data?.settingListByOid) {
      const settings = data.settingListByOid;
      const dataState = {
        orgName: settings.orgName || '',
        detailUrl: settings.detailUrl || '',
        paging: settings.paging || '',
        startPage: settings.startPage?.toString() || '',
        endPage: settings.endPage?.toString() || '',
        iframe: settings.iframe || '',
        rowXpath: settings.rowXpath || '',
        orgRegion: settings.orgRegion || '',
        use: settings.use?.toString() || '',
        orgMan: settings.orgMan || '',
        companyInCharge: settings.companyInCharge || '',
        exceptionRow: settings.exceptionRow || '',
        elements: settings.elements || []
      };
      
      setEditData(dataState);
      setOriginalData(dataState);
    }
  }, [data]);

  // GraphQL 뮤테이션
  const [updateSettingsList] = useMutation(UPDATE_SETTINGS_LIST, {
    client: getClient()
  });

  const handleEditMode = () => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('mode', 'edit');
    navigate(`${window.location.pathname}?${currentParams.toString()}`);
  };

  const handleViewMode = () => {
    window.location.href = `/settings/scrapping/${oid}/list`;
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
          oid: oid,
          input: {
            oid: oid,
            orgName: editData.orgName,
            detailUrl: editData.detailUrl,
            paging: editData.paging || null,
            startPage: parseInt(editData.startPage) || 1,
            endPage: parseInt(editData.endPage) || 1,
            iframe: editData.iframe || null,
            rowXpath: editData.rowXpath,
            elements: editData.elements,
            region: editData.orgRegion,
            registration: 1,
            use: parseInt(editData.use) || 1,
            companyInCharge: editData.companyInCharge,
            orgMan: editData.orgMan,
            exceptionRow: editData.exceptionRow || null
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

  const listSettings = data?.settingListByOid;

  // 로딩 중인 경우 스켈레톤 표시
  if (loading) {
    return (
      <ScrappingSettingsLayout 
        orgName={listSettings?.orgName || `OID: ${oid}`} 
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
            <p className="text-red-500">{error.message}</p>
          </CardContent>
        </Card>
      </ScrappingSettingsLayout>
    );
  }

  // 서브탭 구성
  const subTabs = [
    {
      id: 'all',
      label: '전체 설정',
      icon: <ListIcon className="h-4 w-4" />
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
    },
    {
      id: 'additional',
      label: '부가 설정',
      icon: <Wrench className="h-4 w-4" />
    }
  ];

  return (
    <ScrappingSettingsLayout
      orgName={listSettings?.orgName || `OID: ${oid}`}
      isActive={listSettings?.use}
      region={listSettings?.orgRegion}
    >
      <div className="space-y-0">
        {/* 서브탭 헤더 */}
        <TabHeader
          tabs={subTabs}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
        />

        {/* 탭 컨텐츠 */}
        <TabContainer className="p-0 mt-0">
          {listSettings ? (
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
                        <TableRow>
                          <TableCell className="font-medium w-24">
                            <span className="text-gray-500 text-sm">URL</span>
                          </TableCell>
                          <TableCell className="break-all">
                            <Input
                              value={editData.detailUrl}
                              onChange={(e) => handleInputChange('detailUrl', e.target.value)}
                              className="w-full text-sm"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              disabled={!isEditMode}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="text-gray-500 text-sm">페이징</span>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.paging}
                              onChange={(e) => handleInputChange('paging', e.target.value)}
                              className="w-full text-sm font-mono"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              placeholder="설정 없음"
                              disabled={!isEditMode}
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="text-gray-500 text-sm">시작 페이지</span>
                          </TableCell>
                          <TableCell className="flex items-center">
                            <div className="flex items-center" style={{ width: '160px' }}>
                              <Input
                                value={editData.startPage}
                                onChange={(e) => handleInputChange('startPage', e.target.value)}
                                className="w-20 text-sm"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                type="number"
                                disabled={!isEditMode}
                              />
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-500 text-sm" style={{ width: '80px' }}>종료 페이지</span>
                              <Input
                                value={editData.endPage}
                                onChange={(e) => handleInputChange('endPage', e.target.value)}
                                className="w-20 text-sm"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                type="number"
                                disabled={!isEditMode}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="text-gray-500 text-sm">iFrame</span>
                          </TableCell>
                          <TableCell className="flex items-center">
                            <div className="flex items-center" style={{ width: '160px' }}>
                              <Input
                                value={editData.iframe}
                                onChange={(e) => handleInputChange('iframe', e.target.value)}
                                className="w-32 text-sm"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                placeholder="없음"
                                disabled={!isEditMode}
                              />
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-500 text-sm" style={{ width: '80px' }}>제외항목</span>
                              <Input
                                value={editData.exceptionRow}
                                onChange={(e) => handleInputChange('exceptionRow', e.target.value)}
                                className="w-48 text-sm font-mono"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                placeholder="제외할 행 조건"
                                disabled={!isEditMode}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="text-gray-500 text-sm">행 XPath</span>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editData.rowXpath}
                              onChange={(e) => handleInputChange('rowXpath', e.target.value)}
                              className="w-full text-sm font-mono"
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
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-32 text-gray-500 text-sm">키</TableHead>
                          <TableHead className="text-gray-500 text-sm">Xpath</TableHead>
                          <TableHead className="w-24 text-gray-500 text-sm">타겟</TableHead>
                          <TableHead className="w-48 text-gray-500 text-sm">콜백</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(isEditMode ? editData.elements : listSettings.elements || []).length > 0 ? (
                          (isEditMode ? editData.elements : listSettings.elements || []).map((element: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                <span className="text-sm" style={{ color: 'var(--color-primary-foreground)' }}>{element.key}</span>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={element.xpath || ''}
                                  onChange={(e) => handleElementChange(index, 'xpath', e.target.value)}
                                  className="w-full text-sm font-mono"
                                  style={{ color: 'var(--color-primary-foreground)' }}
                                  disabled={!isEditMode}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={element.target || ''}
                                  onChange={(e) => handleElementChange(index, 'target', e.target.value)}
                                  className="w-full text-sm"
                                  style={{ color: 'var(--color-primary-foreground)' }}
                                  disabled={!isEditMode}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={element.callback || ''}
                                  onChange={(e) => handleElementChange(index, 'callback', e.target.value)}
                                  className="w-full text-sm font-mono"
                                  style={{ color: 'var(--color-primary-foreground)' }}
                                  disabled={!isEditMode}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-color-primary-muted-foreground">
                              요소 설정이 없습니다.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* 부가 설정 */}
                  <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="text-gray-500 text-sm">지역</span>
                          </TableCell>
                          <TableCell className="flex items-center">
                            <div className="flex items-center" style={{ width: '160px' }}>
                              <Input
                                value={editData.orgRegion}
                                onChange={(e) => handleInputChange('orgRegion', e.target.value)}
                                className="w-32 text-sm"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                disabled={!isEditMode}
                              />
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-500 text-sm" style={{ width: '80px' }}>사용</span>
                              <Input
                                value={editData.use}
                                onChange={(e) => handleInputChange('use', e.target.value)}
                                className="w-20 text-sm"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                disabled={!isEditMode}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="text-gray-500 text-sm">담당업체</span>
                          </TableCell>
                          <TableCell className="flex items-center">
                            <div className="flex items-center" style={{ width: '160px' }}>
                              <Input
                                value={editData.companyInCharge}
                                onChange={(e) => handleInputChange('companyInCharge', e.target.value)}
                                className="w-32 text-sm"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                disabled={!isEditMode}
                              />
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-500 text-sm" style={{ width: '80px' }}>담당자</span>
                              <Input
                                value={editData.orgMan}
                                onChange={(e) => handleInputChange('orgMan', e.target.value)}
                                className="w-32 text-sm"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                disabled={!isEditMode}
                              />
                            </div>
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
                      <TableRow>
                        <TableCell className="font-medium w-24">
                          <span className="text-gray-500 text-sm">URL</span>
                        </TableCell>
                        <TableCell className="break-all">
                          <Input
                            value={editData.detailUrl}
                            onChange={(e) => handleInputChange('detailUrl', e.target.value)}
                            className="w-full text-sm"
                            style={{ color: 'var(--color-primary-foreground)' }}
                            disabled={!isEditMode}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          <span className="text-gray-500 text-sm">페이징</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editData.paging}
                            onChange={(e) => handleInputChange('paging', e.target.value)}
                            className="w-full text-sm font-mono"
                            style={{ color: 'var(--color-primary-foreground)' }}
                            placeholder="설정 없음"
                            disabled={!isEditMode}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          <span className="text-gray-500 text-sm">시작 페이지</span>
                        </TableCell>
                        <TableCell className="flex items-center">
                          <div className="flex items-center" style={{ width: '160px' }}>
                            <Input
                              value={editData.startPage}
                              onChange={(e) => handleInputChange('startPage', e.target.value)}
                              className="w-20 text-sm"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              type="number"
                              disabled={!isEditMode}
                            />
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 text-sm" style={{ width: '80px' }}>종료 페이지</span>
                            <Input
                              value={editData.endPage}
                              onChange={(e) => handleInputChange('endPage', e.target.value)}
                              className="w-20 text-sm"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              type="number"
                              disabled={!isEditMode}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          <span className="text-gray-500 text-sm">iFrame</span>
                        </TableCell>
                        <TableCell className="flex items-center">
                          <div className="flex items-center" style={{ width: '160px' }}>
                            <Input
                              value={editData.iframe}
                              onChange={(e) => handleInputChange('iframe', e.target.value)}
                              className="w-32 text-sm"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              placeholder="없음"
                              disabled={!isEditMode}
                            />
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 text-sm" style={{ width: '80px' }}>제외항목</span>
                            <Input
                              value={editData.exceptionRow}
                              onChange={(e) => handleInputChange('exceptionRow', e.target.value)}
                              className="w-48 text-sm font-mono"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              placeholder="제외할 행 조건"
                              disabled={!isEditMode}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          <span className="text-gray-500 text-sm">행 XPath</span>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editData.rowXpath}
                            onChange={(e) => handleInputChange('rowXpath', e.target.value)}
                            className="w-full text-sm font-mono"
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
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32 text-gray-500 text-sm">키</TableHead>
                        <TableHead className="text-gray-500 text-sm">Xpath</TableHead>
                        <TableHead className="w-24 text-gray-500 text-sm">타겟</TableHead>
                        <TableHead className="w-48 text-gray-500 text-sm">콜백</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(isEditMode ? editData.elements : listSettings.elements || []).length > 0 ? (
                        (isEditMode ? editData.elements : listSettings.elements || []).map((element: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              <span className="text-sm" style={{ color: 'var(--color-primary-foreground)' }}>{element.key}</span>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={element.xpath || ''}
                                onChange={(e) => handleElementChange(index, 'xpath', e.target.value)}
                                className="w-full text-sm font-mono"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                disabled={!isEditMode}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={element.target || ''}
                                onChange={(e) => handleElementChange(index, 'target', e.target.value)}
                                className="w-full text-sm"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                disabled={!isEditMode}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                value={element.callback || ''}
                                onChange={(e) => handleElementChange(index, 'callback', e.target.value)}
                                className="w-full text-sm font-mono"
                                style={{ color: 'var(--color-primary-foreground)' }}
                                disabled={!isEditMode}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-color-primary-muted-foreground">
                            요소 설정이 없습니다.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* 부가 설정 탭 */}
              {activeSubTab === 'additional' && (
                <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          <span className="text-gray-500 text-sm">지역</span>
                        </TableCell>
                        <TableCell className="flex items-center">
                          <div className="flex items-center" style={{ width: '160px' }}>
                            <Input
                              value={editData.orgRegion}
                              onChange={(e) => handleInputChange('orgRegion', e.target.value)}
                              className="w-32 text-sm"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              disabled={!isEditMode}
                            />
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 text-sm" style={{ width: '80px' }}>사용</span>
                            <Input
                              value={editData.use}
                              onChange={(e) => handleInputChange('use', e.target.value)}
                              className="w-20 text-sm"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              disabled={!isEditMode}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          <span className="text-gray-500 text-sm">담당업체</span>
                        </TableCell>
                        <TableCell className="flex items-center">
                          <div className="flex items-center" style={{ width: '160px' }}>
                            <Input
                              value={editData.companyInCharge}
                              onChange={(e) => handleInputChange('companyInCharge', e.target.value)}
                              className="w-32 text-sm"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              disabled={!isEditMode}
                            />
                          </div>
                          <div className="flex items-center">
                            <span className="text-gray-500 text-sm" style={{ width: '80px' }}>담당자</span>
                            <Input
                              value={editData.orgMan}
                              onChange={(e) => handleInputChange('orgMan', e.target.value)}
                              className="w-32 text-sm"
                              style={{ color: 'var(--color-primary-foreground)' }}
                              disabled={!isEditMode}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-color-primary-muted-foreground">목록 스크래핑 설정이 없습니다.</p>
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
                  icon={<Eye className="h-4 w-4" />}
                  onClick={handleViewMode}
                  color="tertiary"
                  mode="outline"
                >
                  보기
                </ButtonWithColorIcon>
                <ButtonWithColorIcon
                  icon={<Save className="h-4 w-4" />}
                  onClick={handleSave}
                  color="secondary"
                  mode="outline"
                >
                  저장
                </ButtonWithColorIcon>
              </>
            ) : (
              <ButtonWithIcon
                icon={<Edit className="h-4 w-4" />}
                onClick={handleEditMode}
              >
                편집
              </ButtonWithIcon>
            )}
          </div>
        </TabContainer>
      </div>

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

      {/* 도움말 모달 */}
      <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">📖 입찰공고 목록 스크래핑 설정 가이드</DialogTitle>
            <DialogDescription>
              각 설정 항목에 대한 자세한 설명과 예시를 확인하세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 기본 설정 가이드 */}
            <div>
              <h3 className="text-base font-semibold text-blue-900 mb-3">📋 기본 설정</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">• URL</h4>
                  <p className="text-sm text-gray-600 ml-4">게시판 url</p>
                  <p className="text-sm text-blue-700 ml-4">- 페이지가 url에 있는 포함된 경우 'pgno=${'{i}'}'와 같이 '${'{i}'}'로 표시</p>
                  <p className="text-sm text-blue-700 ml-4">- 예: https://www.gangnam.go.kr/notice/list.do?mid=ID05_0402&pgno=${'{i}'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">• 페이징</h4>
                  <p className="text-sm text-gray-600 ml-4">페이지를 클릭으로 이동하는 경우, 해당 요소의 XPath</p>
                  <p className="text-sm text-blue-700 ml-4">- 예: //div[contains(@class, "pagination")]/span/a[contains(text(),"${'{i}'}")]</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">• 시작페이지 / 종료페이지</h4>
                  <p className="text-sm text-gray-600 ml-4">1회에 스크랩하는 페이지의 시작/종료 페이지 번호</p>
                  <p className="text-sm text-blue-700 ml-4">- 예: 1, 3</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">• iFrame</h4>
                  <p className="text-sm text-gray-600 ml-4">게시판이 iframe 내에 있는 경우 iframe 선택자</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">• 제외항목</h4>
                  <p className="text-sm text-gray-600 ml-4">스크랩에서 제외할 행의 조건</p>
                  <p className="text-sm text-blue-700 ml-4">- 예: td[1]/strong|-|-"공지" in rst</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">• 행 XPath</h4>
                  <p className="text-sm text-gray-600 ml-4">스크랩하는 게시판에서 1개의 공고 행의 XPath</p>
                  <p className="text-sm text-blue-700 ml-4">- 예: //*[@id="board"]/table/tbody/tr</p>
                </div>
              </div>
            </div>

            {/* 요소 설정 가이드 */}
            <div>
              <h3 className="text-base font-semibold text-blue-900 mb-3">🔧 요소 설정</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">• 키</h4>
                  <p className="text-sm text-gray-600 ml-4">요소의 이름</p>
                  <p className="text-sm text-blue-700 ml-4">- title: 제목</p>
                  <p className="text-sm text-blue-700 ml-4">- detail_url: 상세페이지 url</p>
                  <p className="text-sm text-blue-700 ml-4">- posted_date: 작성일</p>
                  <p className="text-sm text-blue-700 ml-4">- posted_by: 작성자</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">• XPath</h4>
                  <p className="text-sm text-gray-600 ml-4">목록 행 내에서의 상대 XPath</p>
                  <p className="text-sm text-blue-700 ml-4">- 예: td[4]/a</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">• 타겟</h4>
                  <p className="text-sm text-gray-600 ml-4">요소의 html 속성(text인 경우 빈값)</p>
                  <p className="text-sm text-blue-700 ml-4">- 예: href</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">• 콜백</h4>
                  <p className="text-sm text-gray-600 ml-4">XPath, 타겟으로 얻은 값(rst)을 수정하는 함수</p>
                  <p className="text-sm text-blue-700 ml-4">- 예: "https://www.gp.go.kr/portal/" + rst.split("/")[1]</p>
                </div>
              </div>
            </div>

            {/* 부가 설정 가이드 */}
            <div>
              <h3 className="text-base font-semibold text-blue-900 mb-3">⚙️ 부가 설정</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">• 지역</h4>
                  <p className="text-sm text-gray-600 ml-4">입찰 공고 관련 지역명(서울, 경기, 충남, 전국)</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">• 사용</h4>
                  <p className="text-sm text-gray-600 ml-4">스크랩 사용 여부(1: 사용, 0: 사용안함)</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">• 담당업체</h4>
                  <p className="text-sm text-gray-600 ml-4">'일맥', '링크', '일맥,링크'</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">• 담당자</h4>
                  <p className="text-sm text-gray-600 ml-4">관련 업무 담당자</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowHelpModal(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrappingSettingsLayout>
  );
}