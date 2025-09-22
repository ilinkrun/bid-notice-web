'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useQuery, useMutation } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { gql } from '@apollo/client';
import { useEffect, useState } from 'react';
import { useUnifiedLoading } from '@/components/providers/UnifiedLoadingProvider';
import { SectionWithGuide } from '@/components/shared/SectionWithGuide';
import { ScrappingSettingsLayout } from '@/components/settings/ScrappingSettingsLayout';
import { List, FileText, Edit, Eye, Save, HelpCircle, Settings, Puzzle, Wrench, List as ListIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ButtonWithIcon, ButtonWithColorIcon, TabHeader, TabContainer } from '@/components/shared/FormComponents';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// GraphQL 쿼리 정의
const GET_BASIC_INFO = gql`
  query GetBasicInfo($oid: Int!) {
    settingListByOid(oid: $oid) {
      orgName
      orgRegion
      use
    }
  }
`;

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

const UPDATE_SETTINGS_DETAIL = gql`
  mutation UpsertSettingsDetailByOid($oid: Int!, $input: SettingsNoticeDetailInput!) {
    upsertSettingsDetailByOid(oid: $oid, input: $input) {
      oid
      orgName
      use
    }
  }
`;

export default function ScrappingSettingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { navigate } = useUnifiedNavigation();
  const { finishLoading } = useUnifiedLoading();

  const oid = parseInt(params.oid as string);
  const mode = searchParams.get('mode') || 'view';
  const isEditMode = mode === 'edit';

  // List settings state
  const [listEditData, setListEditData] = useState({
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

  // Detail settings state
  const [detailEditData, setDetailEditData] = useState({
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

  // Modal states
  const [showListSaveModal, setShowListSaveModal] = useState(false);
  const [showDetailSaveModal, setShowDetailSaveModal] = useState(false);
  const [listChanges, setListChanges] = useState<string[]>([]);
  const [detailChanges, setDetailChanges] = useState<string[]>([]);

  // Tab states
  const [activeListTab, setActiveListTab] = useState('all');
  const [activeDetailTab, setActiveDetailTab] = useState('all');

  // Get basic organization info
  const { loading, error, data } = useQuery(GET_BASIC_INFO, {
    client: getClient(),
    variables: { oid }
  });

  // Get list settings
  const { loading: listLoading, data: listData } = useQuery(GET_SETTINGS_LIST, {
    client: getClient(),
    variables: { oid }
  });

  // Get detail settings
  const { loading: detailLoading, data: detailData } = useQuery(GET_SETTINGS_DETAIL, {
    client: getClient(),
    variables: { oid }
  });

  // Mutations
  const [updateSettingsList] = useMutation(UPDATE_SETTINGS_LIST, { client: getClient() });
  const [updateSettingsDetail] = useMutation(UPDATE_SETTINGS_DETAIL, { client: getClient() });

  useEffect(() => {
    if (data || error) {
      finishLoading();
    }
  }, [data, error, finishLoading]);

  // Initialize list edit data
  useEffect(() => {
    if (listData?.settingListByOid) {
      const settings = listData.settingListByOid;
      setListEditData({
        orgName: settings.orgName || '',
        detailUrl: settings.detailUrl || '',
        paging: settings.paging || '',
        startPage: settings.startPage?.toString() || '1',
        endPage: settings.endPage?.toString() || '1',
        iframe: settings.iframe || '',
        rowXpath: settings.rowXpath || '',
        orgRegion: settings.orgRegion || '',
        use: settings.use?.toString() || '1',
        orgMan: settings.orgMan || '',
        companyInCharge: settings.companyInCharge || '',
        exceptionRow: settings.exceptionRow || '',
        elements: settings.elements || []
      });
    }
  }, [listData]);

  // Initialize detail edit data
  useEffect(() => {
    if (detailData?.settingsDetailByOid) {
      const settings = detailData.settingsDetailByOid;
      setDetailEditData({
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
        use: settings.use?.toString() || '1',
        sampleUrl: settings.sampleUrl || '',
        down: settings.down || ''
      });
    }
  }, [detailData]);

  const orgInfo = data?.settingListByOid;
  const orgName = orgInfo?.orgName || `Organization ${oid}`;

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

  const handleListInputChange = (field: string, value: string) => {
    setListEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDetailInputChange = (field: string, value: string) => {
    setDetailEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 편집 모드 전환 함수들
  const handleEditMode = () => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('mode', 'edit');
    navigate(`${window.location.pathname}?${currentParams.toString()}`);
  };

  const handleViewMode = () => {
    window.location.href = `/settings/scrapping/${oid}`;
  };

  const handleListElementChange = (index: number, field: string, value: string) => {
    setListEditData(prev => ({
      ...prev,
      elements: prev.elements.map((element, i) =>
        i === index ? { ...element, [field]: value } : element
      )
    }));
  };

  return (
    <ScrappingSettingsLayout
      orgName={orgName}
      isActive={orgInfo?.use === '사용'}
      region={orgInfo?.orgRegion || ''}
    >
      <div className="space-y-8">

        {/* 목록 스크래핑 설정 섹션 */}
        <SectionWithGuide
          title="목록 스크래핑 설정"
          icon={<List className="w-5 h-5" />}
          accentColor="#6366f1"
          category="운영가이드"
          pageTitle="스크래핑 설정"
        >
          <div className="space-y-0">
            {/* 서브탭 헤더 */}
            <TabHeader
              tabs={[
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
              ]}
              activeTab={activeListTab}
              onTabChange={setActiveListTab}
            />

            {/* 탭 컨텐츠 */}
            <TabContainer className="p-0 mt-0">
              {listData?.settingListByOid ? (
                <div>
                  {/* 전체 설정 탭 */}
                  {activeListTab === 'all' && (
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
                                  value={listEditData.orgName}
                                  onChange={(e) => handleListInputChange('orgName', e.target.value)}
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
                                  value={listEditData.detailUrl}
                                  onChange={(e) => handleListInputChange('detailUrl', e.target.value)}
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
                                  value={listEditData.paging}
                                  onChange={(e) => handleListInputChange('paging', e.target.value)}
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
                                    value={listEditData.startPage}
                                    onChange={(e) => handleListInputChange('startPage', e.target.value)}
                                    className="w-20 text-sm"
                                    style={{ color: 'var(--color-primary-foreground)' }}
                                    type="number"
                                    disabled={!isEditMode}
                                  />
                                </div>
                                <div className="flex items-center">
                                  <span className="text-gray-500 text-sm" style={{ width: '80px' }}>종료 페이지</span>
                                  <Input
                                    value={listEditData.endPage}
                                    onChange={(e) => handleListInputChange('endPage', e.target.value)}
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
                                    value={listEditData.iframe}
                                    onChange={(e) => handleListInputChange('iframe', e.target.value)}
                                    className="w-32 text-sm"
                                    style={{ color: 'var(--color-primary-foreground)' }}
                                    placeholder="없음"
                                    disabled={!isEditMode}
                                  />
                                </div>
                                <div className="flex items-center">
                                  <span className="text-gray-500 text-sm" style={{ width: '80px' }}>제외항목</span>
                                  <Input
                                    value={listEditData.exceptionRow}
                                    onChange={(e) => handleListInputChange('exceptionRow', e.target.value)}
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
                                  value={listEditData.rowXpath}
                                  onChange={(e) => handleListInputChange('rowXpath', e.target.value)}
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
                            {(isEditMode ? listEditData.elements : listData.settingListByOid.elements || []).length > 0 ? (
                              (isEditMode ? listEditData.elements : listData.settingListByOid.elements || []).map((element: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    <span className="text-sm" style={{ color: 'var(--color-primary-foreground)' }}>{element.key}</span>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={element.xpath || ''}
                                      onChange={(e) => handleListElementChange(index, 'xpath', e.target.value)}
                                      className="w-full text-sm font-mono"
                                      style={{ color: 'var(--color-primary-foreground)' }}
                                      disabled={!isEditMode}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={element.target || ''}
                                      onChange={(e) => handleListElementChange(index, 'target', e.target.value)}
                                      className="w-full text-sm"
                                      style={{ color: 'var(--color-primary-foreground)' }}
                                      disabled={!isEditMode}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={element.callback || ''}
                                      onChange={(e) => handleListElementChange(index, 'callback', e.target.value)}
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
                                    value={listEditData.orgRegion}
                                    onChange={(e) => handleListInputChange('orgRegion', e.target.value)}
                                    className="w-32 text-sm"
                                    style={{ color: 'var(--color-primary-foreground)' }}
                                    disabled={!isEditMode}
                                  />
                                </div>
                                <div className="flex items-center">
                                  <span className="text-gray-500 text-sm" style={{ width: '80px' }}>사용</span>
                                  <Input
                                    value={listEditData.use}
                                    onChange={(e) => handleListInputChange('use', e.target.value)}
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
                                    value={listEditData.companyInCharge}
                                    onChange={(e) => handleListInputChange('companyInCharge', e.target.value)}
                                    className="w-32 text-sm"
                                    style={{ color: 'var(--color-primary-foreground)' }}
                                    disabled={!isEditMode}
                                  />
                                </div>
                                <div className="flex items-center">
                                  <span className="text-gray-500 text-sm" style={{ width: '80px' }}>담당자</span>
                                  <Input
                                    value={listEditData.orgMan}
                                    onChange={(e) => handleListInputChange('orgMan', e.target.value)}
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
                  {activeListTab === 'basic' && (
                    <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium w-24">
                              <span className="text-gray-500 text-sm">기관명</span>
                            </TableCell>
                            <TableCell className="break-all">
                              <Input
                                value={listEditData.orgName}
                                onChange={(e) => handleListInputChange('orgName', e.target.value)}
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
                                value={listEditData.detailUrl}
                                onChange={(e) => handleListInputChange('detailUrl', e.target.value)}
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
                                value={listEditData.paging}
                                onChange={(e) => handleListInputChange('paging', e.target.value)}
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
                                  value={listEditData.startPage}
                                  onChange={(e) => handleListInputChange('startPage', e.target.value)}
                                  className="w-20 text-sm"
                                  style={{ color: 'var(--color-primary-foreground)' }}
                                  type="number"
                                  disabled={!isEditMode}
                                />
                              </div>
                              <div className="flex items-center">
                                <span className="text-gray-500 text-sm" style={{ width: '80px' }}>종료 페이지</span>
                                <Input
                                  value={listEditData.endPage}
                                  onChange={(e) => handleListInputChange('endPage', e.target.value)}
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
                                  value={listEditData.iframe}
                                  onChange={(e) => handleListInputChange('iframe', e.target.value)}
                                  className="w-32 text-sm"
                                  style={{ color: 'var(--color-primary-foreground)' }}
                                  placeholder="없음"
                                  disabled={!isEditMode}
                                />
                              </div>
                              <div className="flex items-center">
                                <span className="text-gray-500 text-sm" style={{ width: '80px' }}>제외항목</span>
                                <Input
                                  value={listEditData.exceptionRow}
                                  onChange={(e) => handleListInputChange('exceptionRow', e.target.value)}
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
                                value={listEditData.rowXpath}
                                onChange={(e) => handleListInputChange('rowXpath', e.target.value)}
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
                  {activeListTab === 'elements' && (
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
                          {(isEditMode ? listEditData.elements : listData.settingListByOid.elements || []).length > 0 ? (
                            (isEditMode ? listEditData.elements : listData.settingListByOid.elements || []).map((element: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  <span className="text-sm" style={{ color: 'var(--color-primary-foreground)' }}>{element.key}</span>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={element.xpath || ''}
                                    onChange={(e) => handleListElementChange(index, 'xpath', e.target.value)}
                                    className="w-full text-sm font-mono"
                                    style={{ color: 'var(--color-primary-foreground)' }}
                                    disabled={!isEditMode}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={element.target || ''}
                                    onChange={(e) => handleListElementChange(index, 'target', e.target.value)}
                                    className="w-full text-sm"
                                    style={{ color: 'var(--color-primary-foreground)' }}
                                    disabled={!isEditMode}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={element.callback || ''}
                                    onChange={(e) => handleListElementChange(index, 'callback', e.target.value)}
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
                  {activeListTab === 'additional' && (
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
                                  value={listEditData.orgRegion}
                                  onChange={(e) => handleListInputChange('orgRegion', e.target.value)}
                                  className="w-32 text-sm"
                                  style={{ color: 'var(--color-primary-foreground)' }}
                                  disabled={!isEditMode}
                                />
                              </div>
                              <div className="flex items-center">
                                <span className="text-gray-500 text-sm" style={{ width: '80px' }}>사용</span>
                                <Input
                                  value={listEditData.use}
                                  onChange={(e) => handleListInputChange('use', e.target.value)}
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
                                  value={listEditData.companyInCharge}
                                  onChange={(e) => handleListInputChange('companyInCharge', e.target.value)}
                                  className="w-32 text-sm"
                                  style={{ color: 'var(--color-primary-foreground)' }}
                                  disabled={!isEditMode}
                                />
                              </div>
                              <div className="flex items-center">
                                <span className="text-gray-500 text-sm" style={{ width: '80px' }}>담당자</span>
                                <Input
                                  value={listEditData.orgMan}
                                  onChange={(e) => handleListInputChange('orgMan', e.target.value)}
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
                      onClick={() => {}}
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
        </SectionWithGuide>

        {/* 상세 스크래핑 설정 섹션 */}
        <SectionWithGuide
          title="상세 스크래핑 설정"
          icon={<FileText className="w-5 h-5" />}
          accentColor="#6366f1"
          category="운영가이드"
          pageTitle="스크래핑 설정"
        >
          <div className="space-y-0">
            {/* 서브탭 헤더 */}
            <TabHeader
              tabs={[
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
                }
              ]}
              activeTab={activeDetailTab}
              onTabChange={setActiveDetailTab}
            />

            {/* 탭 컨텐츠 */}
            <TabContainer className="p-0 mt-0">
              {detailData?.settingsDetailByOid ? (
                <div>
                  {/* 전체 설정 탭 */}
                  {activeDetailTab === 'all' && (
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
                                  value={detailEditData.orgName}
                                  onChange={(e) => handleDetailInputChange('orgName', e.target.value)}
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
                                    value={detailEditData[element.field as keyof typeof detailEditData] || ''}
                                    onChange={(e) => handleDetailInputChange(element.field, e.target.value)}
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
                                  value={detailEditData.sampleUrl}
                                  onChange={(e) => handleDetailInputChange('sampleUrl', e.target.value)}
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
                  {activeDetailTab === 'basic' && (
                    <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'transparent' }}>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium w-24">
                              <span className="text-gray-500 text-sm">기관명</span>
                            </TableCell>
                            <TableCell className="break-all">
                              <Input
                                value={detailEditData.orgName}
                                onChange={(e) => handleDetailInputChange('orgName', e.target.value)}
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
                  {activeDetailTab === 'elements' && (
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
                                  value={detailEditData[element.field as keyof typeof detailEditData] || ''}
                                  onChange={(e) => handleDetailInputChange(element.field, e.target.value)}
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
                                value={detailEditData.sampleUrl}
                                onChange={(e) => handleDetailInputChange('sampleUrl', e.target.value)}
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
                      icon={<Eye className="h-4 w-4" />}
                      onClick={handleViewMode}
                      color="tertiary"
                      mode="outline"
                    >
                      보기
                    </ButtonWithColorIcon>
                    <ButtonWithColorIcon
                      icon={<Save className="h-4 w-4" />}
                      onClick={() => {}}
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
        </SectionWithGuide>
      </div>
    </ScrappingSettingsLayout>
  );
}