'use client';

import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ButtonWithIcon, ButtonWithColorIcon, DropdownSectionHeader, TabHeader, TabContainer } from '@/components/shared/FormComponents';
import { SectionTitleHelp } from '@/components/shared/Help';
import { SectionWithGuide } from '@/components/shared/SectionWithGuide';
import { PageHeader } from '@/components/shared/PageHeader';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  FileText,
  Info,
  Clock,
  Edit3,
  CheckSquare,
  Building,
  Calendar,
  User,
  Loader2,
  Plus,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Trophy,
  XCircle,
  RefreshCw,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';

const UPDATE_MYBID = gql`
  mutation UpdateMyBid($input: MyBidUpdateInput!) {
    mybidUpdate(input: $input) {
      success
      message
      nid
      status
    }
  }
`;

const GET_NOTICE_FILES = gql`
  query GetNoticeFiles($nid: Int!) {
    noticeFiles(nid: $nid) {
      success
      nid
      files {
        file_name
        file_url
        down_folder
        source
        order
      }
      total_count
    }
  }
`;

const GET_NOTICE_DETAILS = gql`
  query GetNoticeDetails($nid: Int!) {
    noticeDetails(nid: $nid) {
      success
      nid
      details {
        title
        notice_num
        org_dept
        org_tel
        body_html
        detail_url
        category
      }
      message
    }
  }
`;

const UPDATE_NOTICE_DETAILS = gql`
  mutation UpdateNoticeDetails($nid: Int!, $input: NoticeDetailsInput!) {
    noticeDetailsUpdate(nid: $nid, input: $input) {
      success
      message
      nid
    }
  }
`;

interface Bid {
  mid: number;
  nid: number;
  title: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  memo?: string;
  orgName: string;
  postedAt: string;
  detail?: string;
  category?: string;
  region?: string;
}

interface BidDetailViewProps {
  bid: Bid;
}

export default function BidDetailView({ bid }: BidDetailViewProps) {
  const router = useRouter();
  const [updateMyBid, { loading }] = useMutation(UPDATE_MYBID);
  const { data: noticeFilesData, loading: filesLoading, refetch: refetchFiles } = useQuery(GET_NOTICE_FILES, {
    variables: { nid: bid.nid },
    errorPolicy: 'all'
  });
  
  const { data: noticeDetailsData, loading: detailsLoading, refetch: refetchDetails } = useQuery(GET_NOTICE_DETAILS, {
    variables: { nid: bid.nid },
    errorPolicy: 'all'
  });
  
  const [updateNoticeDetails, { loading: updatingDetails }] = useMutation(UPDATE_NOTICE_DETAILS);
  
  const [selectedStatus, setSelectedStatus] = useState('');
  const [memo, setMemo] = useState('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [noticeFields, setNoticeFields] = useState<Record<string, any>>({});
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [isEditingFiles, setIsEditingFiles] = useState(false);
  const [selectedDownloads, setSelectedDownloads] = useState<Set<string>>(new Set());
  const [isEditingNoticeDetails, setIsEditingNoticeDetails] = useState(false);
  const [noticeDetailsFields, setNoticeDetailsFields] = useState<Record<string, any>>({});
  const [progressMemo, setProgressMemo] = useState('');
  
  // 섹션 접힘/펼침 상태
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const [isDocumentExpanded, setIsDocumentExpanded] = useState(true);
  const [isStageExpanded, setIsStageExpanded] = useState(true);

  // 업무 가이드 표시 상태
  const [isInfoGuideOpen, setIsInfoGuideOpen] = useState(false);
  const [isDocumentGuideOpen, setIsDocumentGuideOpen] = useState(false);
  const [isStageGuideOpen, setIsStageGuideOpen] = useState(false);

  // 페이지 타이틀
  const pageTitle = "입찰 진행 상세";
  
  // 탭 상태
  const [infoActiveTab, setInfoActiveTab] = useState('notice');
  const [documentActiveTab, setDocumentActiveTab] = useState('files');
  const [stageActiveTab, setStageActiveTab] = useState('응찰');

  // 파일 뷰어 함수
  const openFileViewer = (fileName: string, fileUrl: string) => {
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    
    if (!fileUrl) {
      alert('파일 URL이 없습니다.');
      return;
    }

    // 파일 확장자에 따른 처리
    switch (fileExt) {
      case 'pdf':
        // PDF 뷰어 - Google Docs Viewer 사용하여 다운로드 방지
        const pdfViewerContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>PDF Viewer - ${fileName}</title>
            <meta charset="utf-8">
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                font-family: Arial, sans-serif;
              }
              .header {
                background: #f8f9fa;
                padding: 10px 20px;
                border-bottom: 1px solid #dee2e6;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .title {
                font-weight: bold;
                color: #495057;
              }
              .download-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                text-decoration: none;
                font-size: 14px;
              }
              .download-btn:hover {
                background: #0056b3;
              }
              .pdf-container {
                width: 100%;
                height: calc(100vh - 60px);
              }
              .pdf-frame {
                width: 100%;
                height: 100%;
                border: none;
              }
              .loading {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100%;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">📄 ${fileName}</div>
              <a href="${fileUrl}" target="_blank" class="download-btn">다운로드</a>
            </div>
            <div class="pdf-container">
              <div class="loading">PDF를 로드하는 중...</div>
              <iframe 
                src="https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true" 
                class="pdf-frame"
                onload="document.querySelector('.loading').style.display='none'; this.style.display='block'"
                style="display: none;">
              </iframe>
            </div>
          </body>
          </html>
        `;
        const pdfBlob = new Blob([pdfViewerContent], { type: 'text/html' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
        break;
      
      case 'xlsx':
      case 'xls':
        // Excel 파일 - Google Docs Viewer 사용
        const excelViewerContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Excel Viewer - ${fileName}</title>
            <meta charset="utf-8">
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                font-family: Arial, sans-serif;
              }
              .header {
                background: #f8f9fa;
                padding: 10px 20px;
                border-bottom: 1px solid #dee2e6;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .title {
                font-weight: bold;
                color: #495057;
              }
              .download-btn {
                background: #28a745;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                text-decoration: none;
                font-size: 14px;
              }
              .download-btn:hover {
                background: #1e7e34;
              }
              .excel-container {
                width: 100%;
                height: calc(100vh - 60px);
              }
              .excel-frame {
                width: 100%;
                height: 100%;
                border: none;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">📊 ${fileName}</div>
              <a href="${fileUrl}" target="_blank" class="download-btn">다운로드</a>
            </div>
            <div class="excel-container">
              <iframe src="https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true" class="excel-frame"></iframe>
            </div>
          </body>
          </html>
        `;
        const excelBlob = new Blob([excelViewerContent], { type: 'text/html' });
        const excelUrl = URL.createObjectURL(excelBlob);
        window.open(excelUrl, '_blank');
        break;
      
      case 'hwp':
      case 'hwpx':
        // HWP 파일 - 구현 중 메시지
        const hwpViewerContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>HWP Viewer</title>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0; 
                background-color: #f5f5f5;
              }
              .message { 
                text-align: center; 
                padding: 40px; 
                background: white; 
                border-radius: 8px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .file-name { 
                color: #666; 
                margin-top: 10px; 
                font-size: 14px; 
              }
            </style>
          </head>
          <body>
            <div class="message">
              <h2>📄 HWPX Viewer</h2>
              <p>hwpx viewer는 구현중입니다</p>
              <div class="file-name">${fileName}</div>
            </div>
          </body>
          </html>
        `;
        const hwpBlob = new Blob([hwpViewerContent], { type: 'text/html' });
        const hwpUrl = URL.createObjectURL(hwpBlob);
        window.open(hwpUrl, '_blank');
        break;
      
      case 'doc':
      case 'docx':
        // Word 파일 - Google Docs Viewer 사용
        const wordViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
        window.open(wordViewerUrl, '_blank');
        break;
      
      case 'ppt':
      case 'pptx':
        // PowerPoint 파일 - Google Docs Viewer 사용
        const pptViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
        window.open(pptViewerUrl, '_blank');
        break;
      
      default:
        // 기타 파일 - 기본 브라우저 처리
        window.open(fileUrl, '_blank');
        break;
    }
  };

  // 기존 데이터 파싱
  const parseDetailData = () => {
    try {
      return bid.detail ? JSON.parse(bid.detail) : {};
    } catch (e) {
      console.error('Failed to parse detail:', e);
      return {};
    }
  };

  const parseMemoData = () => {
    try {
      return bid.memo ? JSON.parse(bid.memo) : {};
    } catch (e) {
      console.error('Failed to parse memo:', e);
      return {};
    }
  };

  const detailData = parseDetailData();
  const memoData = parseMemoData();

  // 진행 메모 텍스트만 추출하는 헬퍼 함수
  const extractProgressMemo = () => {
    let progressMemoData = memoData['진행'] || '';
    
    // 만약 progressMemoData가 JSON 객체라면 텍스트만 추출
    if (typeof progressMemoData === 'object') {
      progressMemoData = progressMemoData['진행'] || '';
    }
    
    // 만약 JSON 문자열이라면 파싱해서 텍스트만 추출
    if (typeof progressMemoData === 'string' && progressMemoData.startsWith('{')) {
      try {
        const parsed = JSON.parse(progressMemoData);
        progressMemoData = parsed['진행'] || progressMemoData;
      } catch (e) {
        // JSON 파싱 실패시 원본 문자열 사용
        console.log('Failed to parse memo as JSON, using as text:', progressMemoData);
      }
    }
    
    return progressMemoData;
  };

  // 컴포넌트 마운트 시 입찰 데이터 로드
  React.useEffect(() => {
    const bidDetail = detailData['입찰'] || {};
    setNoticeFields(bidDetail);
  }, []);

  // 컴포넌트 마운트 시 진행 메모 로드
  React.useEffect(() => {
    setProgressMemo(extractProgressMemo());
  }, []);

  // 파일 데이터가 로드되면 다운로드 체크박스 초기화
  React.useEffect(() => {
    if (noticeFilesData?.noticeFiles?.files) {
      const newSelectedDownloads = new Set<string>();
      noticeFilesData.noticeFiles.files.forEach((file: any) => {
        // down_folder에 내용이 없는 경우: 체크됨, 있는 경우: 체크 안됨
        if (!file.down_folder || file.down_folder.trim() === '') {
          newSelectedDownloads.add(file.file_name);
        }
      });
      setSelectedDownloads(newSelectedDownloads);
    }
  }, [noticeFilesData]);

  // 공고 상세정보 데이터가 로드되면 필드 초기화
  React.useEffect(() => {
    if (noticeDetailsData?.noticeDetails?.details) {
      setNoticeDetailsFields(noticeDetailsData.noticeDetails.details);
    }
  }, [noticeDetailsData]);

  // 컴포넌트 마운트 시 기본 '응찰' 상태 데이터 로드
  React.useEffect(() => {
    setSelectedStatus('응찰');
    loadStatusData('응찰');
  }, []);

  // 선택된 상태가 변경될 때 기존 데이터로 폼 필드 초기화
  const loadStatusData = (status: string) => {
    const statusDetail = detailData[status] || {};
    const statusMemo = memoData[status] || '';
    
    setMemo(statusMemo);
    setDynamicFields(statusDetail);
  };

  // 동적 필드 값 업데이트
  const updateDynamicField = (key: string, value: any) => {
    setDynamicFields(prev => ({ ...prev, [key]: value }));
  };

  // 공고 필드 값 업데이트
  const updateNoticeField = (key: string, value: any) => {
    setNoticeFields(prev => ({ ...prev, [key]: value }));
  };

  // 입찰 정보 저장
  const saveNoticeFields = async () => {
    try {
      // 두 번의 API 호출로 분리: 먼저 입찰 detail 저장, 그다음 진행 memo 저장
      
      // 1. 입찰 상세정보 저장 (detail 필드를 '입찰' 상태로 저장)
      const { data: detailResult } = await updateMyBid({
        variables: {
          input: {
            nid: bid.nid,
            status: '입찰', // detail을 '입찰' 상태로 저장
            memo: null,
            detail: JSON.stringify(noticeFields) // noticeFields 자체를 저장
          }
        }
      });

      if (!detailResult?.mybidUpdate?.success) {
        throw new Error(detailResult?.mybidUpdate?.message || '입찰 정보 저장에 실패했습니다.');
      }

      // 2. 진행 메모 저장 (memo 필드를 '진행' 상태로 저장)
      const { data: memoResult } = await updateMyBid({
        variables: {
          input: {
            nid: bid.nid,
            status: '진행', // memo를 '진행' 상태로 저장
            memo: progressMemo,
            detail: null
          }
        }
      });

      if (!memoResult?.mybidUpdate?.success) {
        throw new Error(memoResult?.mybidUpdate?.message || '메모 저장에 실패했습니다.');
      }

      setIsEditingNotice(false);
      router.refresh();
    } catch (error) {
      console.error('입찰 정보 저장 중 오류 발생:', error);
      alert('입찰 정보 저장 중 오류가 발생했습니다.');
    }
  };

  // 공고 상세정보 필드 업데이트
  const updateNoticeDetailsField = (key: string, value: any) => {
    setNoticeDetailsFields(prev => ({ ...prev, [key]: value }));
  };

  // 공고 상세정보 저장
  const saveNoticeDetailsFields = async () => {
    try {
      // __typename 필드 제거 및 null 값 처리
      const cleanInput = Object.keys(noticeDetailsFields).reduce((acc, key) => {
        if (key !== '__typename') {
          acc[key] = noticeDetailsFields[key] || '';
        }
        return acc;
      }, {} as any);

      const { data } = await updateNoticeDetails({
        variables: {
          nid: bid.nid,
          input: cleanInput
        }
      });

      if (data?.noticeDetailsUpdate?.success) {
        setIsEditingNoticeDetails(false);
        refetchDetails();
        alert('공고 상세정보가 성공적으로 업데이트되었습니다.');
      } else {
        throw new Error(data?.noticeDetailsUpdate?.message || '공고 상세정보 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('공고 상세정보 저장 중 오류 발생:', error);
      alert('공고 상세정보 저장 중 오류가 발생했습니다.');
    }
  };

  const saveFilesData = () => {
    // TODO: 파일 데이터 저장 기능 구현
    alert('파일 저장 기능 구현 예정');
    setIsEditingFiles(false);
  };

  const statusOptions = [
    { value: '응찰', label: '응찰' },
    { value: '낙찰', label: '낙찰' },
    { value: '패찰', label: '패찰' },
    { value: '포기', label: '포기' }
  ];

  const renderDynamicFields = () => {
    if (!selectedStatus) return null;

    // 현재 상태에 대한 detail 데이터
    const statusDetail = detailData[selectedStatus] || {};
    
    return (
      <div className="grid gap-4 mt-4 p-4  rounded-lg">
        {/* 동적으로 detail 필드들 생성 */}
        {Object.entries(statusDetail).map(([key, value]) => (
          <div key={key} className="grid gap-2">
            <Label htmlFor={`field-${key}`}>{key}</Label>
            {key.includes('체크') || key.includes('생성') ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`field-${key}`}
                  checked={dynamicFields[key] === 'true' || dynamicFields[key] === true}
                  onCheckedChange={(checked) => updateDynamicField(key, checked ? 'true' : 'false')}
                />
                <Label htmlFor={`field-${key}`}>{key}</Label>
              </div>
            ) : (
              <Input
                id={`field-${key}`}
                value={dynamicFields[key] || ''}
                onChange={(e) => updateDynamicField(key, e.target.value)}
                placeholder={`${key}을(를) 입력하세요`}
              />
            )}
          </div>
        ))}
        
        {/* 메모 필드 */}
        <div className="grid gap-2">
          <Label htmlFor="memo">메모</Label>
          <Textarea
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모를 입력하세요"
            rows={3}
          />
        </div>
      </div>
    );
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      alert('단계를 선택해주세요.');
      return;
    }

    try {
      const { data } = await updateMyBid({
        variables: {
          input: {
            nid: bid.nid,
            status: selectedStatus,
            memo: memo || null,
            detail: Object.keys(dynamicFields).length > 0 ? JSON.stringify(dynamicFields) : null
          }
        }
      });

      if (data?.mybidUpdate?.success) {
        if (selectedStatus === '응찰') {
          // 응찰 성공 시 alert 없이 즉시 /mybids/bidding/[nid] 페이지로 이동
          router.push(`/mybids/bidding/${bid.nid}`);
        } else {
          alert(`단계가 '${selectedStatus}'로 변경되었습니다.`);
          // 페이지 새로고침하여 변경된 정보 반영
          router.refresh();
        }
      } else {
        throw new Error(data?.mybidUpdate?.message || '단계 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('단계 변경 중 오류 발생:', error);
      alert('단계 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      {/* 페이지 헤더 */}
      <PageHeader
        title="입찰 진행 상세"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '나의 입찰', href: '/mybids' },
          { label: '진행', href: '/mybids/progress' },
          { label: bid.title, href: `/mybids/progress/${bid.nid}` }
        ]}
        helpTooltip="입찰 진행 상세 페이지 도움말"
        helpContent="입찰 진행 중인 공고의 상세 정보를 확인하고 관리할 수 있습니다. 입찰 정보, 문서 관리, 단계 변경 등의 기능을 제공합니다."
      />

      {/* 입찰 정보 */}
      <div>
        <div className="flex items-center gap-2">
          <DropdownSectionHeader
            title="입찰 정보"
            icon={<Info className="w-5 h-5" />}
            isExpanded={isInfoExpanded}
            onToggle={() => setIsInfoExpanded(!isInfoExpanded)}
            accentColor="#6366f1"
          />
          <SectionTitleHelp
            isOpen={isInfoGuideOpen}
            onToggle={() => setIsInfoGuideOpen(!isInfoGuideOpen)}
          />
        </div>

        {/* 입찰 정보 업무 가이드 */}
        {isInfoGuideOpen && (
          <div className="mt-2 bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="max-w-full">
              <h4 className="font-semibold text-blue-800 mb-2">입찰 정보 업무 가이드</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p>• 공고 상세정보: 입찰 공고의 기본 정보를 확인하고 편집할 수 있습니다.</p>
                <p>• 입찰 상세정보: 입찰과 관련된 세부 사항을 입력하고 관리할 수 있습니다.</p>
                <p>• 편집 모드에서 정보를 수정한 후 반드시 저장 버튼을 클릭하여 변경사항을 적용하세요.</p>
              </div>
            </div>
          </div>
        )}

        {isInfoExpanded && (
          <div className="mt-2 space-y-0">
            {/* 탭 버튼 */}
            <TabHeader
              tabs={[
                {
                  id: 'notice',
                  label: '공고 상세정보',
                  icon: <FileText className="w-4 h-4" />
                },
                {
                  id: 'bid',
                  label: '입찰 상세정보',
                  icon: <Clock className="w-4 h-4" />
                }
              ]}
              activeTab={infoActiveTab}
              onTabChange={setInfoActiveTab}
            />
            
            {/* 공고 상세정보 탭 */}
            {infoActiveTab === 'notice' && (
              <div>
                <TabContainer>
                  {detailsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span>공고 상세정보를 불러오는 중...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* 공고명 */}
                      <div className="flex items-center">
                        <span className="text-sm w-20 flex-shrink-0 text-gray-500">공고명</span>
                        {isEditingNoticeDetails ? (
                          <Input
                            value={noticeDetailsFields.title || ''}
                            onChange={(e) => updateNoticeDetailsField('title', e.target.value)}
                            placeholder="공고명을 입력하세요"
                            className="flex-1" style={{color: 'var(--color-primary-foreground)'}}
                          />
                        ) : (
                          <span className="flex-1" style={{color: 'var(--color-primary-foreground)'}}>{noticeDetailsFields.title || bid.title || '-'}</span>
                        )}
                      </div>

                      {/* 공고번호 */}
                      <div className="flex items-center">
                        <span className="text-sm w-20 flex-shrink-0 text-gray-500">공고번호</span>
                        {isEditingNoticeDetails ? (
                          <Input
                            value={noticeDetailsFields.notice_num || ''}
                            onChange={(e) => updateNoticeDetailsField('notice_num', e.target.value)}
                            placeholder="공고번호를 입력하세요"
                            className="flex-1" style={{color: 'var(--color-primary-foreground)'}}
                          />
                        ) : (
                          <span className="flex-1" style={{color: 'var(--color-primary-foreground)'}}>{noticeDetailsFields.notice_num || '-'}</span>
                        )}
                      </div>

                      {/* 담당부서, 담당전화 */}
                      <div className="flex items-center">
                        <span className="text-sm w-20 flex-shrink-0 text-gray-500">담당부서</span>
                        {isEditingNoticeDetails ? (
                          <Input
                            value={noticeDetailsFields.org_dept || ''}
                            onChange={(e) => updateNoticeDetailsField('org_dept', e.target.value)}
                            placeholder="담당부서를 입력하세요"
                            className="w-40 mr-4" style={{color: 'var(--color-primary-foreground)'}}
                          />
                        ) : (
                          <span className="w-40 mr-4" style={{color: 'var(--color-primary-foreground)'}}>{noticeDetailsFields.org_dept || bid.orgName || '-'}</span>
                        )}
                        <span className="text-sm w-20 flex-shrink-0 text-gray-500">담당전화</span>
                        {isEditingNoticeDetails ? (
                          <Input
                            value={noticeDetailsFields.org_tel || ''}
                            onChange={(e) => updateNoticeDetailsField('org_tel', e.target.value)}
                            placeholder="담당전화를 입력하세요"
                            className="w-40" style={{color: 'var(--color-primary-foreground)'}}
                          />
                        ) : (
                          <span className="w-40" style={{color: 'var(--color-primary-foreground)'}}>{noticeDetailsFields.org_tel || '-'}</span>
                        )}
                      </div>

                      {/* 업무구분, 상세페이지 */}
                      <div className="flex items-center">
                        <span className="text-sm w-20 flex-shrink-0 text-gray-500">업무구분</span>
                        {isEditingNoticeDetails ? (
                          <Input
                            value={noticeDetailsFields.category || ''}
                            onChange={(e) => updateNoticeDetailsField('category', e.target.value)}
                            placeholder="업무구분을 입력하세요"
                            className="w-40 mr-4" style={{color: 'var(--color-primary-foreground)'}}
                          />
                        ) : (
                          <span className="w-40 mr-4" style={{color: 'var(--color-primary-foreground)'}}>{noticeDetailsFields.category || bid.category || '-'}</span>
                        )}
                        <span className="text-sm w-20 flex-shrink-0 text-gray-500">상세페이지</span>
                        {isEditingNoticeDetails ? (
                          <Input
                            value={noticeDetailsFields.detail_url || ''}
                            onChange={(e) => updateNoticeDetailsField('detail_url', e.target.value)}
                            placeholder="상세페이지 URL을 입력하세요"
                            className="w-40" style={{color: 'var(--color-primary-foreground)'}}
                          />
                        ) : (
                          <div className="w-40">
                            {noticeDetailsFields.detail_url ? (
                              <a
                                href={noticeDetailsFields.detail_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                style={{color: 'var(--color-primary-foreground)'}}
                              >
                                상세페이지 링크
                              </a>
                            ) : (
                              <span style={{color: 'var(--color-primary-foreground)'}}>-</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 공고본문 */}
                      {(noticeDetailsFields.body_html || isEditingNoticeDetails) && (
                        <div className="flex items-start">
                          <span className="text-sm w-20 flex-shrink-0 mt-2 text-gray-500">공고본문</span>
                          {isEditingNoticeDetails ? (
                            <Textarea
                              value={noticeDetailsFields.body_html || ''}
                              onChange={(e) => updateNoticeDetailsField('body_html', e.target.value)}
                              placeholder="공고본문을 입력하세요"
                              rows={4}
                              className="flex-1" style={{color: 'var(--color-primary-foreground)'}}
                            />
                          ) : (
                            <div className="flex-1 max-h-32 overflow-y-auto text-sm p-3 border rounded" style={{color: 'var(--color-primary-foreground)'}}>
                              {noticeDetailsFields.body_html ? (
                                <div dangerouslySetInnerHTML={{ __html: noticeDetailsFields.body_html }} />
                              ) : (
                                <span>-</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    {isEditingNoticeDetails ? (
                      <>
                        <ButtonWithColorIcon
                          icon={<span className="mr-2"><Edit3 className="h-4 w-4" /></span>}
                          color="tertiary"
                          mode="filled"
                          onClick={() => {
                            setIsEditingNoticeDetails(false);
                            // 원래 데이터로 복원
                            if (noticeDetailsData?.noticeDetails?.details) {
                              setNoticeDetailsFields(noticeDetailsData.noticeDetails.details);
                            }
                          }}
                        >
                          취소
                        </ButtonWithColorIcon>
                        <ButtonWithColorIcon
                          icon={<span className="mr-2"><CheckSquare className="h-4 w-4" /></span>}
                          color="secondary"
                          mode="active"
                          onClick={saveNoticeDetailsFields}
                          disabled={updatingDetails}
                        >
                          저장
                        </ButtonWithColorIcon>
                      </>
                    ) : (
                      <ButtonWithIcon
                        icon={<span className="mr-2"><Edit3 className="h-4 w-4" /></span>}
                        onClick={() => setIsEditingNoticeDetails(true)}
                      >
                        편집
                      </ButtonWithIcon>
                    )}
                  </div>
                </TabContainer>
              </div>
            )}

            {/* 입찰 상세정보 탭 */}
            {infoActiveTab === 'bid' && (
              <div>
                <TabContainer>
                  <div className="space-y-3">
                    {(() => {
                      const fields = Object.entries(noticeFields);
                      const rows: React.ReactElement[] = [];

                      // 2개씩 그룹화
                      for (let i = 0; i < fields.length; i += 2) {
                        const field1 = fields[i];
                        const field2 = fields[i + 1];

                        rows.push(
                          <div key={`row-${i}`} className="flex items-center">
                            {/* 첫 번째 필드 */}
                            <span className="text-sm flex-shrink-0 text-gray-500" style={{width: '100px', minWidth: '100px'}}>{field1[0]}</span>
                            {isEditingNotice ? (
                              <Input
                                value={noticeFields[field1[0]] || ''}
                                onChange={(e) => updateNoticeField(field1[0], e.target.value)}
                                placeholder={`${field1[0]}을(를) 입력하세요`}
                                className="w-40 mr-4" style={{color: 'var(--color-primary-foreground)'}}
                              />
                            ) : (
                              <span className="w-40 mr-4" style={{color: 'var(--color-primary-foreground)'}}>{field1[1] || '정보 없음'}</span>
                            )}

                            {/* 두 번째 필드 (있는 경우만) */}
                            {field2 && (
                              <>
                                <span className="text-sm flex-shrink-0 text-gray-500" style={{width: '100px', minWidth: '100px'}}>{field2[0]}</span>
                                {isEditingNotice ? (
                                  <Input
                                    value={noticeFields[field2[0]] || ''}
                                    onChange={(e) => updateNoticeField(field2[0], e.target.value)}
                                    placeholder={`${field2[0]}을(를) 입력하세요`}
                                    className="w-40" style={{color: 'var(--color-primary-foreground)'}}
                                  />
                                ) : (
                                  <span className="w-40" style={{color: 'var(--color-primary-foreground)'}}>{field2[1] || '정보 없음'}</span>
                                )}
                              </>
                            )}
                          </div>
                        );
                      }

                      return rows;
                    })()}
                  </div>
                  
                  {/* 메모 필드 */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-start">
                      <span className="text-sm flex-shrink-0 mt-2 text-gray-500" style={{width: '100px', minWidth: '100px'}}>메모</span>
                      {isEditingNotice ? (
                        <Textarea
                          value={progressMemo}
                          onChange={(e) => setProgressMemo(e.target.value)}
                          placeholder="메모를 입력하세요"
                          rows={3}
                          className="flex-1" style={{color: 'var(--color-primary-foreground)'}}
                        />
                      ) : (
                        <div className="flex-1 p-3 border rounded min-h-[80px]" style={{color: 'var(--color-primary-foreground)'}}>
                          {progressMemo || '메모가 없습니다.'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    {isEditingNotice ? (
                      <>
                        <ButtonWithColorIcon
                          icon={<span className="mr-2"><Edit3 className="h-4 w-4" /></span>}
                          color="tertiary"
                          mode="filled"
                          onClick={() => {
                            setIsEditingNotice(false);
                            // 원래 데이터로 복원
                            const bidDetail = detailData['입찰'] || {};
                            setNoticeFields(bidDetail);
                            setProgressMemo(extractProgressMemo());
                          }}
                        >
                          취소
                        </ButtonWithColorIcon>
                        <ButtonWithColorIcon
                          icon={<span className="mr-2"><CheckSquare className="h-4 w-4" /></span>}
                          color="secondary"
                          mode="active"
                          onClick={saveNoticeFields}
                          disabled={loading}
                        >
                          저장
                        </ButtonWithColorIcon>
                      </>
                    ) : (
                      <ButtonWithIcon
                        icon={<span className="mr-2"><Edit3 className="h-4 w-4" /></span>}
                        onClick={() => setIsEditingNotice(true)}
                      >
                        편집
                      </ButtonWithIcon>
                    )}
                  </div>
                </TabContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 입찰 문서 */}
      <SectionWithGuide
        title="입찰 문서"
        icon={<FileText className="w-5 h-5" />}
        accentColor="#10b981"
        category="운영가이드"
        pageTitle={pageTitle}
        isExpanded={isDocumentExpanded}
        onToggle={setIsDocumentExpanded}
      >
        <TabHeader
          tabs={[
            {
              id: 'files',
              label: '공고 문서',
              icon: <FileText className="w-4 h-4" />
            },
            {
              id: 'write',
              label: '문서 작성',
              icon: <Edit3 className="w-4 h-4" />
            }
          ]}
          activeTab={documentActiveTab}
          onTabChange={setDocumentActiveTab}
        />
            
            {/* 공고 문서 탭 */}
            {documentActiveTab === 'files' && (
              <TabContainer>
              {filesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="ml-2">파일 목록을 불러오는 중...</span>
                </div>
              ) : noticeFilesData?.noticeFiles?.files?.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-20">순번</TableHead>
                        <TableHead>파일</TableHead>
                        <TableHead className="text-center w-24">다운로드</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {noticeFilesData.noticeFiles.files.map((file: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="text-center font-medium">
                            {file.order || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-color-primary-muted-foreground" />
                              {isEditingFiles ? (
                                <Input
                                  value={file.file_name}
                                  onChange={(e) => {
                                    // TODO: 파일명 편집 기능 구현
                                  }}
                                  className="flex-1"
                                />
                              ) : (
                                <div className="flex-1">
                                  <button
                                    className="text-left text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                                    onClick={() => openFileViewer(file.file_name, file.file_url)}
                                    title="클릭하여 파일 뷰어 열기"
                                  >
                                    {file.file_name}
                                  </button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedDownloads.has(file.file_name)}
                              onCheckedChange={(checked) => {
                                const newSet = new Set(selectedDownloads);
                                if (checked) {
                                  newSet.add(file.file_name);
                                } else {
                                  newSet.delete(file.file_name);
                                }
                                setSelectedDownloads(newSet);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="pt-2 border-t space-y-3">
                    <div className="text-sm text-color-primary-muted-foreground">
                      총 {noticeFilesData.noticeFiles.total_count}개 파일 • 마지막 업데이트: {bid.postedAt?.split('T')[0]}
                    </div>
                    
                    {/* NAS 경로 표시 */}
                    {(() => {
                      const nasPath = noticeFilesData.noticeFiles.files.find((f: any) => f.down_folder)?.down_folder;
                      return nasPath ? (
                        <div className="p-3 rounded-lg">
                          <div className="text-sm font-medium text-color-primary-foreground mb-1">NAS 경로 (로컬 경로)</div>
                          <div className="text-sm text-color-primary-muted-foreground font-mono break-all">{nasPath}</div>
                        </div>
                      ) : null;
                    })()}
                    
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: NAS 파일 브라우저 구현
                          const nasPath = noticeFilesData.noticeFiles.files.find((f: any) => f.down_folder)?.down_folder;
                          if (nasPath) {
                            alert(`NAS 파일 브라우저 구현 예정\n경로: ${nasPath}`);
                          } else {
                            alert('로컬 파일 경로가 없습니다.');
                          }
                        }}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        NAS 파일 보기
                      </Button>
                    </div>
                  </div>
                  {selectedDownloads.size > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-sm text-blue-700 dark:text-blue-400">
                        {selectedDownloads.size}개 파일이 다운로드 대상으로 선택되었습니다.
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: 선택된 파일들 다운로드 기능 구현
                          alert('선택된 파일 다운로드 기능 구현 예정');
                        }}
                      >
                        선택 다운로드
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-color-primary-muted-foreground">
                  공고 문서가 없습니다.
                </div>
              )}
                  <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    <ButtonWithIcon
                      icon={<span className="mr-2">{isEditingFiles ? <CheckSquare className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}</span>}
                      onClick={() => {
                        if (isEditingFiles) {
                          saveFilesData();
                        } else {
                          setIsEditingFiles(!isEditingFiles);
                        }
                      }}
                    >
                      {isEditingFiles ? "저장" : "편집"}
                    </ButtonWithIcon>
                    <ButtonWithIcon
                      icon={<span className="mr-2"><Plus className="h-4 w-4" /></span>}
                      onClick={() => {
                        // TODO: 추가 기능 구현
                        alert('파일 추가 기능 구현 예정');
                      }}
                    >
                      추가
                    </ButtonWithIcon>
                    <ButtonWithIcon
                      icon={<span className="mr-2"><Download className="h-4 w-4" /></span>}
                      onClick={() => {
                        // TODO: 선택된 파일들 다운로드 기능 구현
                        if (selectedDownloads.size > 0) {
                          alert(`${selectedDownloads.size}개 파일 다운로드 기능 구현 예정`);
                        } else {
                          alert('다운로드할 파일을 선택해주세요.');
                        }
                      }}
                      disabled={selectedDownloads.size === 0}
                    >
                      다운
                    </ButtonWithIcon>
                  </div>
              </TabContainer>
            )}

            {/* 문서 작성 탭 */}
            {documentActiveTab === 'write' && (
              <TabContainer>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <FileText className="w-6 h-6" />
                  <span>입찰서 작성</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Edit3 className="w-6 h-6" />
                  <span>사업계획서 작성</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <FileText className="w-6 h-6" />
                  <span>기술제안서 작성</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Edit3 className="w-6 h-6" />
                  <span>파일 업로드</span>
                </Button>
              </div>
              <div className="text-sm text-color-primary-muted-foreground">
                입찰 마감일까지 모든 필수 서류를 제출해야 합니다.
              </div>
              </TabContainer>
            )}
      </SectionWithGuide>

      {/* 단계 변경 */}
      <div>
        <div className="flex items-center gap-2">
          <DropdownSectionHeader
            title="단계 변경"
            icon={<RefreshCw className="w-5 h-5" />}
            isExpanded={isStageExpanded}
            onToggle={() => setIsStageExpanded(!isStageExpanded)}
            accentColor="#f59e0b"
          />
          <SectionTitleHelp
            isOpen={isStageGuideOpen}
            onToggle={() => setIsStageGuideOpen(!isStageGuideOpen)}
          />
        </div>

        {/* 단계 변경 업무 가이드 */}
        {isStageGuideOpen && (
          <div className="mt-2 bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <div className="max-w-full">
              <h4 className="font-semibold text-orange-800 mb-2">단계 변경 업무 가이드</h4>
              <div className="text-sm text-orange-700 space-y-2">
                <p>• 응찰: 입찰 참여 단계로, 필요한 서류를 준비하고 제출합니다.</p>
                <p>• 포기: 다양한 사유로 입찰을 포기하는 경우 선택합니다.</p>
                <p>• 단계 변경 시 메모를 작성하여 변경 사유를 기록할 수 있습니다.</p>
              </div>
            </div>
          </div>
        )}

        {isStageExpanded && (
          <div className="mt-2 space-y-0">
            {/* 탭 버튼 */}
            <div className="flex border-b justify-between">
              <div className="flex">
                <button
                  className={`tab-button px-4 py-2 font-medium text-sm flex items-center gap-2 ${
                    stageActiveTab === '응찰'
                      ? 'active'
                      : 'text-color-primary-muted-foreground'
                  }`}
                  onClick={() => {
                    setStageActiveTab('응찰');
                    setSelectedStatus('응찰');
                    loadStatusData('응찰');
                  }}
                >
                  <CheckSquare className="w-4 h-4" />
                  응찰
                </button>
                <button
                  className={`tab-button px-4 py-2 font-medium text-sm flex items-center gap-2 ${
                    stageActiveTab === '포기'
                      ? 'active'
                      : 'text-color-primary-muted-foreground'
                  }`}
                  onClick={() => {
                    setStageActiveTab('포기');
                    setSelectedStatus('포기');
                    loadStatusData('포기');
                  }}
                >
                  <X className="w-4 h-4" />
                  포기
                </button>
              </div>
              <div className="flex">
                <button
                  className="tab-button px-4 py-2 font-medium text-sm flex items-center gap-2 text-color-primary-muted-foreground cursor-not-allowed opacity-50"
                  disabled
                >
                  <Trophy className="w-4 h-4" />
                  낙찰
                </button>
                <button
                  className="tab-button px-4 py-2 font-medium text-sm flex items-center gap-2 text-color-primary-muted-foreground cursor-not-allowed opacity-50"
                  disabled
                >
                  <XCircle className="w-4 h-4" />
                  패찰
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4" style={{borderColor: 'var(--color-primary-foreground)'}}>
              {renderDynamicFields()}

              {selectedStatus && (
                <div className="flex justify-end pt-4 border-t">
                  <ButtonWithIcon
                    icon={<span className="mr-2"><ArrowRight className="h-4 w-4" /></span>}
                    onClick={handleStatusChange}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        처리 중...
                      </>
                    ) : (
                      '단계 변경'
                    )}
                  </ButtonWithIcon>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}