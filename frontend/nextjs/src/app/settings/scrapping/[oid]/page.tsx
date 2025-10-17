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
import { List, FileText, Edit, Eye, Save, HelpCircle, Settings, Puzzle, Wrench, List as ListIcon, TestTube } from 'lucide-react';
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
      isActive
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
      isActive
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
      isActive
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
      isActive
    }
  }
`;

const UPDATE_SETTINGS_DETAIL = gql`
  mutation UpsertSettingsDetailByOid($oid: Int!, $input: SettingsNoticeDetailInput!) {
    upsertSettingsDetailByOid(oid: $oid, input: $input) {
      oid
      orgName
      isActive
    }
  }
`;

const TEST_COLLECT_LIST = gql`
  mutation TestCollectListWithSettings($settings: SettingsNoticeListInput!) {
    collectListWithSettings(settings: $settings) {
      orgName
      errorCode
      errorMessage
      data {
        title
        detailUrl
        postedAt
        orgName
      }
    }
  }
`;

const TEST_COLLECT_DETAIL = gql`
  mutation TestCollectDetail($input: CollectDetailInput!) {
    collectDetail(input: $input) {
      success
      processed
      updated
      errors
      data {
        title
        bodyHtml
        fileName
        fileUrl
        noticeDiv
        noticeNum
        orgDept
        orgMan
        orgTel
        detailUrl
        orgName
      }
    }
  }
`;

export default function ScrappingSettingsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { navigate } = useUnifiedNavigation();
  const { finishLoading } = useUnifiedLoading();

  const oid = parseInt(params.oid as string);
  const isNewEntry = isNaN(oid); // 새로운 항목 추가인지 확인

  // 각 섹션별 독립적인 편집 모드 상태 (새 항목인 경우 기본적으로 편집 모드)
  const [isListEditMode, setIsListEditMode] = useState(isNewEntry);
  const [isDetailEditMode, setIsDetailEditMode] = useState(isNewEntry);

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
    isActive: '',
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
    isActive: '',
    sampleUrl: '',
    down: ''
  });

  // Modal states
  const [showListSaveModal, setShowListSaveModal] = useState(false);
  const [showDetailSaveModal, setShowDetailSaveModal] = useState(false);
  const [listChanges, setListChanges] = useState<string[]>([]);
  const [detailChanges, setDetailChanges] = useState<string[]>([]);

  // Test modal states
  const [showTestModal, setShowTestModal] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [testSettings, setTestSettings] = useState<any>(null);

  // Detail test modal states
  const [showDetailTestModal, setShowDetailTestModal] = useState(false);
  const [detailTestLoading, setDetailTestLoading] = useState(false);
  const [detailTestResults, setDetailTestResults] = useState<any>(null);
  const [detailTestSettings, setDetailTestSettings] = useState<any>(null);

  // Tab states
  const [activeListTab, setActiveListTab] = useState('all');
  const [activeDetailTab, setActiveDetailTab] = useState('all');

  // Get basic organization info
  const { loading, error, data } = useQuery(GET_BASIC_INFO, {
    client: getClient(),
    variables: { oid },
    skip: isNewEntry // 새 항목인 경우 쿼리 건너뛰기
  });

  // Get list settings
  const { loading: listLoading, data: listData } = useQuery(GET_SETTINGS_LIST, {
    client: getClient(),
    variables: { oid },
    skip: isNewEntry // 새 항목인 경우 쿼리 건너뛰기
  });

  // Get detail settings
  const { loading: detailLoading, data: detailData, refetch: refetchDetailData } = useQuery(GET_SETTINGS_DETAIL, {
    client: getClient(),
    variables: { oid },
    skip: isNewEntry // 새 항목인 경우 쿼리 건너뛰기
  });

  // Mutations
  const [updateSettingsList] = useMutation(UPDATE_SETTINGS_LIST, { client: getClient() });
  const [updateSettingsDetail] = useMutation(UPDATE_SETTINGS_DETAIL, { client: getClient() });
  const [testCollectList] = useMutation(TEST_COLLECT_LIST, { client: getClient() });
  const [testCollectDetail] = useMutation(TEST_COLLECT_DETAIL, { client: getClient() });

  useEffect(() => {
    if (data || error) {
      finishLoading();
    }
  }, [data, error, finishLoading]);

  // Initialize list edit data
  useEffect(() => {
    // 목록 설정 데이터가 있든 없든 항상 빈 폼을 표시하도록 초기화
    const settings = listData?.settingListByOid;
    const orgName = isNewEntry ? '' : (data?.settingListByOid?.orgName || `Organization ${oid}`);

    // 기본 elements 구조 생성
    const defaultElements = settings?.elements && settings.elements.length > 0
      ? settings.elements
      : [
          { key: '공고번호', xpath: '', target: 'text', callback: '' },
          { key: '분류', xpath: '', target: 'text', callback: '' },
          { key: '공고명', xpath: '', target: 'text', callback: '' },
          { key: '수요기관', xpath: '', target: 'text', callback: '' },
          { key: '계약방법', xpath: '', target: 'text', callback: '' },
          { key: '입찰마감일시', xpath: '', target: 'text', callback: '' },
          { key: '공고기관', xpath: '', target: 'text', callback: '' },
          { key: '링크', xpath: '', target: 'href', callback: '' },
        ];

    setListEditData({
      orgName: settings?.orgName || orgName,
      detailUrl: settings?.detailUrl || '',
      paging: settings?.paging || '',
      startPage: settings?.startPage?.toString() || '1',
      endPage: settings?.endPage?.toString() || '1',
      iframe: settings?.iframe || '',
      rowXpath: settings?.rowXpath || '',
      orgRegion: settings?.orgRegion || '',
      isActive: settings?.isActive?.toString() || '1',
      orgMan: settings?.orgMan || '',
      companyInCharge: settings?.companyInCharge || '',
      exceptionRow: settings?.exceptionRow || '',
      elements: defaultElements
    });
  }, [listData, data, oid, isNewEntry]);

  // Initialize detail edit data and create record if not exists
  useEffect(() => {
    const initializeDetailData = async () => {
      const settings = detailData?.settingsDetailByOid;
      const orgName = isNewEntry ? '' : (data?.settingListByOid?.orgName || `Organization ${oid}`);

      // 상세 설정이 없고 기본 정보가 있는 경우 자동으로 기본 레코드 생성 (새 항목이 아닌 경우만)
      if (!settings && data?.settingListByOid && !detailLoading && !isNewEntry) {
        try {
          console.log(`[DetailSettings] Creating default detail settings for oid: ${oid}, orgName: ${orgName}`);

          await updateSettingsDetail({
            variables: {
              oid,
              input: {
                orgName: orgName,
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
                isActive: 1,
                sampleUrl: '',
                down: ''
              }
            }
          });

          console.log(`[DetailSettings] Default detail settings created successfully for oid: ${oid}`);

          // 새로 생성된 데이터를 가져오기 위해 refetch
          await refetchDetailData();
        } catch (error) {
          console.error('Failed to create default detail settings:', error);
        }
      }

      setDetailEditData({
        orgName: settings?.orgName || orgName,
        title: settings?.title || '',
        bodyHtml: settings?.bodyHtml || '',
        fileName: settings?.fileName || '',
        fileUrl: settings?.fileUrl || '',
        preview: settings?.preview || '',
        noticeDiv: settings?.noticeDiv || '',
        noticeNum: settings?.noticeNum || '',
        orgDept: settings?.orgDept || '',
        orgMan: settings?.orgMan || '',
        orgTel: settings?.orgTel || '',
        isActive: settings?.isActive?.toString() || '1',
        sampleUrl: settings?.sampleUrl || '',
        down: settings?.down || ''
      });
    };

    initializeDetailData();
  }, [detailData, data, oid, detailLoading, updateSettingsDetail, refetchDetailData, isNewEntry]);

  const orgInfo = data?.settingListByOid;
  const orgName = isNewEntry ? '추가' : (orgInfo?.orgName || `Organization ${oid}`);

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

  // 목록 스크래핑 설정 편집 모드 전환 함수들
  const handleListEditMode = () => {
    setIsListEditMode(true);
  };

  const handleListViewMode = () => {
    setIsListEditMode(false);
  };

  // 상세 스크래핑 설정 편집 모드 전환 함수들
  const handleDetailEditMode = () => {
    setIsDetailEditMode(true);
  };

  const handleDetailViewMode = () => {
    setIsDetailEditMode(false);
  };

  const handleListElementChange = (index: number, field: string, value: string) => {
    setListEditData(prev => ({
      ...prev,
      elements: prev.elements.map((element, i) =>
        i === index ? { ...element, [field]: value } : element
      )
    }));
  };

  // Test function for collectListWithSettings
  const handleTestCollectList = async () => {
    setTestLoading(true);
    setTestResults(null);
    setTestSettings(null); // Reset settings
    setShowTestModal(true);

    try {
      // Helper function to format element value with |- separator
      const formatElementValue = (xpath: string, target: string = '', callback: string = '') => {
        if (!xpath || xpath.trim() === '') return undefined;

        let formatted = xpath.trim();

        // Only add target if it exists and is not empty
        if (target && target.trim() !== '') {
          formatted += `|-${target.trim()}`;

          // Only add callback if target exists and callback is not empty
          if (callback && callback.trim() !== '') {
            formatted += `|-${callback.trim()}`;
          }
        }

        return formatted;
      };

      // Debug: Log all available element keys
      console.log('Available elements:', listEditData.elements.map(e => ({ key: e.key, xpath: e.xpath, target: e.target, callback: e.callback })));

      // Find elements by key and format them properly (using actual DB keys)
      const titleElement = listEditData.elements.find(e => e.key === 'title');
      const linkElement = listEditData.elements.find(e => e.key === 'detail_url');
      const dateElement = listEditData.elements.find(e => e.key === 'posted_date');
      const orgElement = listEditData.elements.find(e => e.key === 'posted_by');

      console.log('Found elements:', {
        titleElement,
        linkElement,
        dateElement,
        orgElement
      });

      // Convert current form data to GraphQL input format
      const settings = {
        oid: oid || undefined,
        orgName: listEditData.orgName,
        url: listEditData.detailUrl, // Using detailUrl as main URL field
        iframe: listEditData.iframe || undefined,
        rowXpath: listEditData.rowXpath || undefined,
        paging: listEditData.paging || undefined,
        startPage: parseInt(listEditData.startPage) || 1,
        endPage: parseInt(listEditData.endPage) || 1,
        login: undefined,
        isActive: parseInt(listEditData.isActive) || 1,
        orgRegion: listEditData.orgRegion || undefined,
        registration: "1", // Always string as per schema
        // Format elements with |- separator for backend processing
        title: formatElementValue(
          titleElement?.xpath || '',
          titleElement?.target || '',
          titleElement?.callback || ''
        ),
        detailUrl: formatElementValue(
          linkElement?.xpath || '',
          linkElement?.target || '',
          linkElement?.callback || ''
        ),
        postedDate: formatElementValue(
          dateElement?.xpath || '',
          dateElement?.target || '',
          dateElement?.callback || ''
        ),
        postedBy: formatElementValue(
          orgElement?.xpath || '',
          orgElement?.target || '',
          orgElement?.callback || ''
        ),
        companyInCharge: listEditData.companyInCharge || undefined,
        orgMan: listEditData.orgMan || undefined,
        exceptionRow: listEditData.exceptionRow || undefined
      };

      console.log('Testing with settings:', settings);
      console.log('Element mapping:', {
        title: { element: titleElement, formatted: settings.title },
        detailUrl: { element: linkElement, formatted: settings.detailUrl },
        postedDate: { element: dateElement, formatted: settings.postedDate },
        postedBy: { element: orgElement, formatted: settings.postedBy }
      });
      console.log('Form data values:', {
        mainUrl: listEditData.detailUrl,
        orgName: listEditData.orgName,
        rowXpath: listEditData.rowXpath,
        elementsCount: listEditData.elements.length
      });

      // Store settings for modal display
      setTestSettings(settings);
      console.log('Settings stored for modal:', settings);

      const result = await testCollectList({
        variables: { settings }
      });

      // Log full result to browser console for debugging
      console.log('====== 스크래핑 테스트 결과 ======');
      console.log('전체 결과:', result);
      console.log('스크랩 데이터:', result.data.collectListWithSettings);
      console.log('데이터 개수:', result.data.collectListWithSettings?.data?.length || 0);
      if (result.data.collectListWithSettings?.data) {
        console.log('수집된 게시물 목록:');
        result.data.collectListWithSettings.data.forEach((item: any, index: number) => {
          console.log(`  ${index + 1}. ${item.title}`);
          console.log(`     - URL: ${item.detailUrl}`);
          console.log(`     - 날짜: ${item.postedAt}`);
          console.log(`     - 기관: ${item.orgName}`);
        });
      }
      console.log('===============================');

      setTestResults(result.data.collectListWithSettings);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({
        orgName: listEditData.orgName,
        errorCode: 999,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        data: []
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Test function for collectDetail
  const handleTestCollectDetail = async () => {
    setDetailTestLoading(true);
    setDetailTestResults(null);
    setDetailTestSettings(null);
    setShowDetailTestModal(true);

    try {
      // Store settings for modal display
      const settings = {
        orgName: detailEditData.orgName,
        sampleUrl: detailEditData.sampleUrl,
        title: detailEditData.title,
        bodyHtml: detailEditData.bodyHtml,
        fileName: detailEditData.fileName,
        fileUrl: detailEditData.fileUrl,
        preview: detailEditData.preview,
        noticeDiv: detailEditData.noticeDiv,
        noticeNum: detailEditData.noticeNum,
        orgDept: detailEditData.orgDept,
        orgMan: detailEditData.orgMan,
        orgTel: detailEditData.orgTel
      };

      setDetailTestSettings(settings);
      console.log('Detail test settings stored for modal:', settings);

      const result = await testCollectDetail({
        variables: {
          input: {
            orgName: detailEditData.orgName,
            sampleUrl: detailEditData.sampleUrl,
            // Use sampleUrl if available, otherwise use noticeId for NID-based collection
            noticeId: detailEditData.sampleUrl ? undefined : "1",
            title: detailEditData.title,
            bodyHtml: detailEditData.bodyHtml,
            fileName: detailEditData.fileName,
            fileUrl: detailEditData.fileUrl,
            preview: detailEditData.preview,
            noticeDiv: detailEditData.noticeDiv,
            noticeNum: detailEditData.noticeNum,
            orgDept: detailEditData.orgDept,
            orgMan: detailEditData.orgMan,
            orgTel: detailEditData.orgTel,
            limit: 1,
            dryRun: true,
            debug: true
          }
        }
      });

      setDetailTestResults(result.data.collectDetail);
    } catch (error) {
      console.error('Detail test failed:', error);
      setDetailTestResults({
        success: false,
        processed: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      setDetailTestLoading(false);
    }
  };

  return (
    <ScrappingSettingsLayout
      orgName={orgName}
      isActive={orgInfo?.isActive === 1}
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
          rightButton={
            <ButtonWithColorIcon
              icon={<TestTube className="h-4 w-4" />}
              onClick={handleTestCollectList}
              color="secondary"
              mode="outline"
              disabled={testLoading}
            >
              T
            </ButtonWithColorIcon>
          }
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
                                  disabled={!isListEditMode}
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
                                  disabled={!isListEditMode}
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
                                  disabled={!isListEditMode}
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
                                    disabled={!isListEditMode}
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
                                    disabled={!isListEditMode}
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
                                    disabled={!isListEditMode}
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
                                    disabled={!isListEditMode}
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
                                  disabled={!isListEditMode}
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
                            {listEditData.elements.length > 0 ? (
                              listEditData.elements.map((element: any, index: number) => (
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
                                      disabled={!isListEditMode}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={element.target || ''}
                                      onChange={(e) => handleListElementChange(index, 'target', e.target.value)}
                                      className="w-full text-sm"
                                      style={{ color: 'var(--color-primary-foreground)' }}
                                      disabled={!isListEditMode}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      value={element.callback || ''}
                                      onChange={(e) => handleListElementChange(index, 'callback', e.target.value)}
                                      className="w-full text-sm font-mono"
                                      style={{ color: 'var(--color-primary-foreground)' }}
                                      disabled={!isListEditMode}
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
                                    disabled={!isListEditMode}
                                  />
                                </div>
                                <div className="flex items-center">
                                  <span className="text-gray-500 text-sm" style={{ width: '80px' }}>사용</span>
                                  <Input
                                    value={listEditData.isActive}
                                    onChange={(e) => handleListInputChange('isActive', e.target.value)}
                                    className="w-20 text-sm"
                                    style={{ color: 'var(--color-primary-foreground)' }}
                                    disabled={!isListEditMode}
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
                                    disabled={!isListEditMode}
                                  />
                                </div>
                                <div className="flex items-center">
                                  <span className="text-gray-500 text-sm" style={{ width: '80px' }}>담당자</span>
                                  <Input
                                    value={listEditData.orgMan}
                                    onChange={(e) => handleListInputChange('orgMan', e.target.value)}
                                    className="w-32 text-sm"
                                    style={{ color: 'var(--color-primary-foreground)' }}
                                    disabled={!isListEditMode}
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
                                disabled={!isListEditMode}
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
                                disabled={!isListEditMode}
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
                                disabled={!isListEditMode}
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
                                  disabled={!isListEditMode}
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
                                  disabled={!isListEditMode}
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
                                  disabled={!isListEditMode}
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
                                  disabled={!isListEditMode}
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
                                disabled={!isListEditMode}
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
                          {listEditData.elements.length > 0 ? (
                            listEditData.elements.map((element: any, index: number) => (
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
                                    disabled={!isListEditMode}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={element.target || ''}
                                    onChange={(e) => handleListElementChange(index, 'target', e.target.value)}
                                    className="w-full text-sm"
                                    style={{ color: 'var(--color-primary-foreground)' }}
                                    disabled={!isListEditMode}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={element.callback || ''}
                                    onChange={(e) => handleListElementChange(index, 'callback', e.target.value)}
                                    className="w-full text-sm font-mono"
                                    style={{ color: 'var(--color-primary-foreground)' }}
                                    disabled={!isListEditMode}
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
                                  disabled={!isListEditMode}
                                />
                              </div>
                              <div className="flex items-center">
                                <span className="text-gray-500 text-sm" style={{ width: '80px' }}>사용</span>
                                <Input
                                  value={listEditData.isActive}
                                  onChange={(e) => handleListInputChange('isActive', e.target.value)}
                                  className="w-20 text-sm"
                                  style={{ color: 'var(--color-primary-foreground)' }}
                                  disabled={!isListEditMode}
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
                                  disabled={!isListEditMode}
                                />
                              </div>
                              <div className="flex items-center">
                                <span className="text-gray-500 text-sm" style={{ width: '80px' }}>담당자</span>
                                <Input
                                  value={listEditData.orgMan}
                                  onChange={(e) => handleListInputChange('orgMan', e.target.value)}
                                  className="w-32 text-sm"
                                  style={{ color: 'var(--color-primary-foreground)' }}
                                  disabled={!isListEditMode}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

              {/* 버튼 영역 - TabContainer 하단 우측 */}
              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                {isListEditMode ? (
                  <>
                    <ButtonWithColorIcon
                      icon={<Eye className="h-4 w-4" />}
                      onClick={handleListViewMode}
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
                    onClick={handleListEditMode}
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
          rightButton={
            <ButtonWithColorIcon
              icon={<TestTube className="h-4 w-4" />}
              onClick={handleTestCollectDetail}
              color="secondary"
              mode="outline"
              disabled={detailTestLoading}
            >
              T
            </ButtonWithColorIcon>
          }
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
                                  disabled={!isDetailEditMode}
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
                                    disabled={!isDetailEditMode}
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
                                  disabled={!isDetailEditMode}
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
                                disabled={!isDetailEditMode}
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
                                  disabled={!isDetailEditMode}
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
                                disabled={!isDetailEditMode}
                                placeholder="테스트용 샘플 URL"
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

              {/* 버튼 영역 - TabContainer 하단 우측 */}
              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                {isDetailEditMode ? (
                  <>
                    <ButtonWithColorIcon
                      icon={<Eye className="h-4 w-4" />}
                      onClick={handleDetailViewMode}
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
                    onClick={handleDetailEditMode}
                  >
                    편집
                  </ButtonWithIcon>
                )}
              </div>
            </TabContainer>
          </div>
        </SectionWithGuide>
      </div>

      {/* Test Results Modal */}
      <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              스크래핑 테스트 결과
            </DialogTitle>
            <DialogDescription>
              현재 설정으로 실행한 스크래핑 테스트 결과입니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Always show settings if available */}
            {testSettings && (
              <div className="border rounded-lg p-4 bg-blue-50/50">
                <h4 className="font-medium text-sm text-blue-700 mb-3">테스트 실행 설정</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-muted-foreground">기관명:</span>
                      <p className="mt-1">{testSettings.orgName || '미설정'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">URL:</span>
                      <p className="mt-1 break-all">{testSettings.url || '미설정'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">행 XPath:</span>
                      <p className="mt-1 font-mono text-xs bg-gray-100 dark:bg-gray-800 dark:text-gray-100 p-1 rounded">{testSettings.rowXpath || '미설정'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">페이지 범위:</span>
                      <p className="mt-1">{testSettings.startPage} ~ {testSettings.endPage}</p>
                    </div>
                  </div>

                  <div>
                    <span className="font-medium text-muted-foreground text-xs">요소 설정:</span>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">제목:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{testSettings.title || '미설정'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">상세 URL:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{testSettings.detailUrl || '미설정'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">게시일:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{testSettings.postedDate || '미설정'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">작성자:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{testSettings.postedBy || '미설정'}</p>
                      </div>
                    </div>
                  </div>

                  {testSettings.paging && (
                    <div>
                      <span className="font-medium text-muted-foreground text-xs">페이징:</span>
                      <p className="mt-1 font-mono text-xs bg-gray-100 dark:bg-gray-800 dark:text-gray-100 p-2 rounded">{testSettings.paging}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {testLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Skeleton className="h-6 w-48 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">테스트를 실행하고 있습니다...</p>
                </div>
              </div>
            ) : testResults ? (
              <>
                {/* Test Summary */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">기관명:</span>
                      <p className="mt-1">{testResults.orgName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">오류 코드:</span>
                      <p className={`mt-1 ${testResults.errorCode === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {testResults.errorCode}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">수집 건수:</span>
                      <p className="mt-1 font-semibold">{testResults.data?.length || 0}건</p>
                    </div>
                  </div>

                  {testResults.errorMessage && (
                    <div className="mt-4">
                      <span className="font-medium text-muted-foreground">오류 메시지:</span>
                      <p className="mt-1 text-red-600 text-sm bg-red-50 p-2 rounded">
                        {testResults.errorMessage}
                      </p>
                    </div>
                  )}
                </div>

                {/* Test Results Data */}
                {testResults.data && testResults.data.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>제목</TableHead>
                          <TableHead className="w-32">게시일</TableHead>
                          <TableHead className="w-48">상세 URL</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testResults.data.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">{index + 1}</TableCell>
                            <TableCell>
                              <div className="max-w-md">
                                <p className="text-sm truncate" title={item.title}>
                                  {item.title || '(제목 없음)'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {item.postedAt ? new Date(item.postedAt).toLocaleDateString('ko-KR') : '-'}
                            </TableCell>
                            <TableCell>
                              {item.detailUrl ? (
                                <a
                                  href={item.detailUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline truncate block max-w-48"
                                  title={item.detailUrl}
                                >
                                  {item.detailUrl}
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {testResults.data && testResults.data.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>수집된 데이터가 없습니다.</p>
                    <p className="text-sm mt-1">설정을 확인하고 다시 시도해주세요.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>테스트 결과가 없습니다.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestModal(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Test Results Modal */}
      <Dialog open={showDetailTestModal} onOpenChange={setShowDetailTestModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              상세 스크래핑 테스트 결과
            </DialogTitle>
            <DialogDescription>
              현재 설정으로 실행한 상세 스크래핑 테스트 결과입니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Always show settings if available */}
            {detailTestSettings && (
              <div className="border rounded-lg p-4 bg-green-50/50">
                <h4 className="font-medium text-sm text-green-700 mb-3">테스트 실행 설정</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-muted-foreground">기관명:</span>
                      <p className="mt-1">{detailTestSettings.orgName || '미설정'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">샘플 URL:</span>
                      <p className="mt-1 break-all">{detailTestSettings.sampleUrl || '미설정'}</p>
                    </div>
                  </div>

                  <div>
                    <span className="font-medium text-muted-foreground text-xs">요소 설정:</span>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">제목:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{detailTestSettings.title || '미설정'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">본문:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{detailTestSettings.bodyHtml || '미설정'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">파일이름:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{detailTestSettings.fileName || '미설정'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">파일주소:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{detailTestSettings.fileUrl || '미설정'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">공고구분:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{detailTestSettings.noticeDiv || '미설정'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">공고번호:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{detailTestSettings.noticeNum || '미설정'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">담당부서:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{detailTestSettings.orgDept || '미설정'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">담당자:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{detailTestSettings.orgMan || '미설정'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                        <span className="font-medium text-gray-600 dark:text-gray-400">연락처:</span>
                        <p className="font-mono text-xs mt-1 dark:text-gray-200">{detailTestSettings.orgTel || '미설정'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {detailTestLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Skeleton className="h-6 w-48 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">상세 테스트를 실행하고 있습니다...</p>
                </div>
              </div>
            ) : detailTestResults ? (
              <>
                {/* Test Summary */}
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">성공 여부:</span>
                      <p className={`mt-1 ${detailTestResults.success ? 'text-green-600' : 'text-red-600'}`}>
                        {detailTestResults.success ? '성공' : '실패'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">처리 건수:</span>
                      <p className="mt-1 font-semibold">{detailTestResults.processed || 0}건</p>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">업데이트 건수:</span>
                      <p className="mt-1 font-semibold">{detailTestResults.updated || 0}건</p>
                    </div>
                  </div>

                  {detailTestResults.errors && detailTestResults.errors.length > 0 && (
                    <div className="mt-4">
                      <span className="font-medium text-muted-foreground">오류 메시지:</span>
                      <div className="mt-1">
                        {detailTestResults.errors.map((error: string, index: number) => (
                          <p key={index} className="text-red-600 text-sm bg-red-50 p-2 rounded mb-1">
                            {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {!detailTestResults.success && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>상세 스크래핑 테스트가 실패했습니다.</p>
                    <p className="text-sm mt-1">설정을 확인하고 다시 시도해주세요.</p>
                  </div>
                )}

                {detailTestResults.success && detailTestResults.data && (
                  <>
                    <div className="text-center py-4 text-green-600">
                      <p className="font-medium">상세 스크래핑 테스트가 성공적으로 완료되었습니다!</p>
                      <p className="text-sm mt-1">설정이 올바르게 구성되었습니다.</p>
                    </div>

                    {/* 스크래핑된 데이터 표시 */}
                    <div className="border rounded-lg p-4 bg-green-50/50">
                      <h4 className="font-medium text-sm text-green-700 mb-3">스크래핑된 데이터</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          {detailTestResults.data.title && (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                              <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">제목:</span>
                              <p className="mt-1 text-sm dark:text-gray-200">{detailTestResults.data.title}</p>
                            </div>
                          )}

                          {detailTestResults.data.bodyHtml && (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                              <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">본문 HTML:</span>
                              <div className="mt-1 text-xs bg-gray-100 dark:bg-gray-900 dark:text-gray-300 p-2 rounded max-h-32 overflow-y-auto">
                                <pre className="whitespace-pre-wrap break-words">
                                  {detailTestResults.data.bodyHtml.length > 200
                                    ? detailTestResults.data.bodyHtml.substring(0, 200) + '...'
                                    : detailTestResults.data.bodyHtml}
                                </pre>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            {detailTestResults.data.noticeDiv && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                                <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">공고구분:</span>
                                <p className="mt-1 text-xs dark:text-gray-200">{detailTestResults.data.noticeDiv}</p>
                              </div>
                            )}

                            {detailTestResults.data.noticeNum && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                                <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">공고번호:</span>
                                <p className="mt-1 text-xs dark:text-gray-200">{detailTestResults.data.noticeNum}</p>
                              </div>
                            )}

                            {detailTestResults.data.orgDept && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                                <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">담당부서:</span>
                                <p className="mt-1 text-xs dark:text-gray-200">{detailTestResults.data.orgDept}</p>
                              </div>
                            )}

                            {detailTestResults.data.orgMan && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                                <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">담당자:</span>
                                <p className="mt-1 text-xs dark:text-gray-200">{detailTestResults.data.orgMan}</p>
                              </div>
                            )}

                            {detailTestResults.data.orgTel && (
                              <div className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700">
                                <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">연락처:</span>
                                <p className="mt-1 text-xs dark:text-gray-200">{detailTestResults.data.orgTel}</p>
                              </div>
                            )}
                          </div>

                          {(detailTestResults.data.fileName || detailTestResults.data.fileUrl) && (
                            <div className="bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700">
                              <span className="font-medium text-gray-600 dark:text-gray-400 text-sm">첨부파일:</span>
                              <div className="mt-1 space-y-1">
                                {detailTestResults.data.fileName && (
                                  <p className="text-xs dark:text-gray-200"><span className="font-medium">파일명:</span> {detailTestResults.data.fileName}</p>
                                )}
                                {detailTestResults.data.fileUrl && (
                                  <p className="text-xs dark:text-gray-200">
                                    <span className="font-medium">URL:</span>
                                    <a href={detailTestResults.data.fileUrl} target="_blank" rel="noopener noreferrer"
                                       className="text-blue-600 dark:text-blue-400 hover:underline ml-1 break-all">
                                      {detailTestResults.data.fileUrl}
                                    </a>
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {detailTestResults.success && !detailTestResults.data && (
                  <div className="text-center py-8 text-green-600">
                    <p className="font-medium">상세 스크래핑 테스트가 성공적으로 완료되었습니다!</p>
                    <p className="text-sm mt-1">설정이 올바르게 구성되었습니다.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>테스트 결과가 없습니다.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailTestModal(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </ScrappingSettingsLayout>
  );
}