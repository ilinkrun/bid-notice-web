'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ExternalLink
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
      <div className="grid gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
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
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 입찰 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            입찰 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 공고 상세정보 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <h3 className="font-semibold">공고 상세정보</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isEditingNoticeDetails) {
                    saveNoticeDetailsFields();
                  } else {
                    setIsEditingNoticeDetails(true);
                  }
                }}
                disabled={updatingDetails || detailsLoading}
              >
                {updatingDetails ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isEditingNoticeDetails ? '저장' : '편집'
                )}
              </Button>
            </div>
            <div className="border rounded-lg p-4 space-y-3">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span>공고 상세정보를 불러오는 중...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">공고명</span>
                    {isEditingNoticeDetails ? (
                      <Input
                        value={noticeDetailsFields.title || ''}
                        onChange={(e) => updateNoticeDetailsField('title', e.target.value)}
                        placeholder="공고명을 입력하세요"
                        className="font-medium"
                      />
                    ) : (
                      <span className="font-medium">{noticeDetailsFields.title || bid.title || '-'}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">공고번호</span>
                    {isEditingNoticeDetails ? (
                      <Input
                        value={noticeDetailsFields.notice_num || ''}
                        onChange={(e) => updateNoticeDetailsField('notice_num', e.target.value)}
                        placeholder="공고번호를 입력하세요"
                        className="font-medium"
                      />
                    ) : (
                      <span className="font-medium">{noticeDetailsFields.notice_num || '-'}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">담당부서</span>
                    {isEditingNoticeDetails ? (
                      <Input
                        value={noticeDetailsFields.org_dept || ''}
                        onChange={(e) => updateNoticeDetailsField('org_dept', e.target.value)}
                        placeholder="담당부서를 입력하세요"
                        className="font-medium"
                      />
                    ) : (
                      <span className="font-medium">{noticeDetailsFields.org_dept || bid.orgName || '-'}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">담당전화</span>
                    {isEditingNoticeDetails ? (
                      <Input
                        value={noticeDetailsFields.org_tel || ''}
                        onChange={(e) => updateNoticeDetailsField('org_tel', e.target.value)}
                        placeholder="담당전화를 입력하세요"
                        className="font-medium"
                      />
                    ) : (
                      <span className="font-medium">{noticeDetailsFields.org_tel || '-'}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">업무구분</span>
                    {isEditingNoticeDetails ? (
                      <Input
                        value={noticeDetailsFields.category || ''}
                        onChange={(e) => updateNoticeDetailsField('category', e.target.value)}
                        placeholder="업무구분을 입력하세요"
                        className="font-medium"
                      />
                    ) : (
                      <span className="font-medium">{noticeDetailsFields.category || bid.category || '-'}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">상세페이지</span>
                    {isEditingNoticeDetails ? (
                      <Input
                        value={noticeDetailsFields.detail_url || ''}
                        onChange={(e) => updateNoticeDetailsField('detail_url', e.target.value)}
                        placeholder="상세페이지 URL을 입력하세요"
                        className="font-medium"
                      />
                    ) : (
                      <div className="font-medium">
                        {noticeDetailsFields.detail_url ? (
                          <a
                            href={noticeDetailsFields.detail_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            상세페이지 링크
                          </a>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    )}
                  </div>
                  {(noticeDetailsFields.body_html || isEditingNoticeDetails) && (
                    <div className="col-span-1 md:col-span-2 flex flex-col gap-1">
                      <span className="text-sm text-gray-500">공고본문</span>
                      {isEditingNoticeDetails ? (
                        <Textarea
                          value={noticeDetailsFields.body_html || ''}
                          onChange={(e) => updateNoticeDetailsField('body_html', e.target.value)}
                          placeholder="공고본문을 입력하세요"
                          rows={4}
                          className="font-medium"
                        />
                      ) : (
                        <div className="font-medium max-h-32 overflow-y-auto text-sm bg-gray-50 p-3 rounded">
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
              {isEditingNoticeDetails && (
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingNoticeDetails(false);
                      // 원래 데이터로 복원
                      if (noticeDetailsData?.noticeDetails?.details) {
                        setNoticeDetailsFields(noticeDetailsData.noticeDetails.details);
                      }
                    }}
                  >
                    취소
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 입찰 상세정보 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <h3 className="font-semibold">입찰 상세정보</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isEditingNotice) {
                    saveNoticeFields();
                  } else {
                    setIsEditingNotice(true);
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  isEditingNotice ? '저장' : '편집'
                )}
              </Button>
            </div>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(noticeFields).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <span className="text-sm text-gray-500">{key}</span>
                    {isEditingNotice ? (
                      <Input
                        value={noticeFields[key] || ''}
                        onChange={(e) => updateNoticeField(key, e.target.value)}
                        placeholder={`${key}을(를) 입력하세요`}
                        className="font-medium"
                      />
                    ) : (
                      <span className="font-medium">{value || '정보 없음'}</span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 메모 필드 추가 */}
              <div className="border-t pt-4 mt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">메모</span>
                  {isEditingNotice ? (
                    <Textarea
                      value={progressMemo}
                      onChange={(e) => setProgressMemo(e.target.value)}
                      placeholder="메모를 입력하세요"
                      rows={3}
                      className="font-medium"
                    />
                  ) : (
                    <div className="font-medium p-3 bg-gray-50 rounded border min-h-[80px]">
                      {progressMemo || '메모가 없습니다.'}
                    </div>
                  )}
                </div>
              </div>
              
              {isEditingNotice && (
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingNotice(false);
                      // 원래 데이터로 복원
                      const bidDetail = detailData['입찰'] || {};
                      setNoticeFields(bidDetail);
                      setProgressMemo(extractProgressMemo());
                    }}
                  >
                    취소
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 입찰 문서 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            입찰 문서
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 공고 문서 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <h3 className="font-semibold">공고 문서</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingFiles(!isEditingFiles)}
                >
                  {isEditingFiles ? '저장' : '편집'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: 추가 기능 구현
                    alert('파일 추가 기능 구현 예정');
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  추가
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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
                  <Download className="w-4 h-4 mr-1" />
                  다운
                </Button>
              </div>
            </div>
            <div className="border rounded-lg p-4 space-y-3">
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
                              <FileText className="w-4 h-4 text-gray-500" />
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
                    <div className="text-sm text-gray-500">
                      총 {noticeFilesData.noticeFiles.total_count}개 파일 • 마지막 업데이트: {bid.postedAt?.split('T')[0]}
                    </div>
                    
                    {/* NAS 경로 표시 */}
                    {(() => {
                      const nasPath = noticeFilesData.noticeFiles.files.find((f: any) => f.down_folder)?.down_folder;
                      return nasPath ? (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-gray-700 mb-1">NAS 경로 (로컬 경로)</div>
                          <div className="text-sm text-gray-600 font-mono break-all">{nasPath}</div>
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
                      <span className="text-sm text-blue-800">
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
                <div className="text-center py-8 text-gray-500">
                  공고 문서가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 문서 작성 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Edit3 className="w-4 h-4" />
              <h3 className="font-semibold">문서 작성</h3>
            </div>
            <div className="border rounded-lg p-4 space-y-4">
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
              <div className="text-sm text-gray-500">
                입찰 마감일까지 모든 필수 서류를 제출해야 합니다.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 단계 변경 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            단계 변경
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {statusOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={selectedStatus === option.value}
                    onCheckedChange={() => {
                      setSelectedStatus(option.value);
                      loadStatusData(option.value);
                    }}
                  />
                  <Label htmlFor={`status-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
            
            {renderDynamicFields()}

            {selectedStatus && (
              <div className="flex justify-end pt-4">
                <Button onClick={handleStatusChange} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      처리 중...
                    </>
                  ) : (
                    '단계 변경'
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}