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
import { Edit, Eye, Save, HelpCircle, Settings, Puzzle } from 'lucide-react';
import { ButtonWithIcon } from '@/components/shared/FormComponents';
import { SectionTitleHelp } from '@/components/shared/Help';
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
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);

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
      <div className="space-y-6">
        {/* 기본 설정 */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">기본 설정</h3>
          </div>
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
        </div>

        {/* 요소 설정 */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Puzzle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">요소 설정</h3>
          </div>
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

          {/* 버튼 영역을 내용 박스 우측하단에 배치 */}
          <div className="flex justify-end space-x-2 mt-6">
            {isEditMode ? (
              <>
                <ButtonWithIcon
                  variant="outline"
                  size="sm"
                  icon={<Eye className="w-4 h-4" />}
                  onClick={handleViewMode}
                >
                  보기
                </ButtonWithIcon>
                <ButtonWithIcon
                  variant="default"
                  size="sm"
                  icon={<Save className="w-4 h-4" />}
                  onClick={handleSave}
                >
                  저장
                </ButtonWithIcon>
              </>
            ) : (
              <ButtonWithIcon
                variant="outline"
                size="sm"
                icon={<Edit className="w-4 h-4" />}
                onClick={handleEditMode}
              >
                편집
              </ButtonWithIcon>
            )}
          </div>
        </div>
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
            <DialogTitle>입찰공고 상세 스크랩 설정 가이드</DialogTitle>
          </DialogHeader>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">작성 가이드</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>키:</strong> 데이터를 식별하는 고유 이름 (예: title, content, file_url)</li>
              <li>• <strong>XPath:</strong> HTML에서 해당 데이터를 추출할 경로</li>
              <li>• <strong>타겟:</strong> 추출할 속성 (text, href, src 등)</li>
              <li>• <strong>콜백:</strong> 추출 후 적용할 변환 함수</li>
            </ul>
          </div>

          <div className="space-y-6">
            {/* 기본 설정 가이드 */}
            <div>
              <h5 className="text-sm font-medium text-blue-900 mb-2">📋 기본 설정</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>기관명:</strong> 스크랩 대상 기관의 이름</li>
                <li className="ml-4 text-blue-700">- 예: 강북구청, 서울시청 등</li>
              </ul>
            </div>

            {/* 요소 설정 가이드 */}
            <div>
              <h5 className="text-sm font-medium text-blue-900 mb-2">🔧 요소 설정</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>제목:</strong> 공고 제목을 추출할 XPath</li>
                <li className="ml-4 text-blue-700">- 예: //h3[@class="title"]/text()</li>
                <li>• <strong>본문:</strong> 공고 본문을 추출할 XPath</li>
                <li className="ml-4 text-blue-700">- 예: //div[@class="content"]</li>
                <li>• <strong>파일이름:</strong> 첨부파일 이름을 추출할 XPath</li>
                <li className="ml-4 text-blue-700">- 예: //a[@class="file"]/text()</li>
                <li>• <strong>파일주소:</strong> 첨부파일 URL을 추출할 XPath</li>
                <li className="ml-4 text-blue-700">- 예: //a[@class="file"]/@href</li>
                <li>• <strong>미리보기:</strong> 미리보기 링크를 추출할 XPath</li>
                <li>• <strong>공고구분:</strong> 공고 유형을 추출할 XPath</li>
                <li className="ml-4 text-blue-700">- 예: //span[@class="category"]/text()</li>
                <li>• <strong>공고번호:</strong> 공고 번호를 추출할 XPath</li>
                <li>• <strong>담당부서:</strong> 담당 부서명을 추출할 XPath</li>
                <li>• <strong>담당자:</strong> 담당자명을 추출할 XPath</li>
                <li>• <strong>연락처:</strong> 연락처를 추출할 XPath</li>
                <li>• <strong>샘플 URL:</strong> 테스트용 상세 페이지 URL</li>
                <li className="ml-4 text-blue-700">- 실제 공고 페이지 URL을 입력하여 XPath 테스트에 사용</li>
              </ul>
            </div>

            {/* XPath 작성 가이드 */}
            <div>
              <h5 className="text-sm font-medium text-blue-900 mb-2">📝 XPath 작성 가이드</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>텍스트 추출:</strong> //element/text()</li>
                <li>• <strong>속성 추출:</strong> //element/@attribute</li>
                <li>• <strong>HTML 추출:</strong> //element (전체 HTML)</li>
                <li>• <strong>클래스 선택:</strong> //div[@class="classname"]</li>
                <li>• <strong>ID 선택:</strong> //div[@id="elementid"]</li>
                <li>• <strong>n번째 요소:</strong> (//element)[n]</li>
              </ul>
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