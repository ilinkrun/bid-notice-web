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
      }
      total_count
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
  
  const [selectedStatus, setSelectedStatus] = useState('');
  const [memo, setMemo] = useState('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});
  const [noticeFields, setNoticeFields] = useState<Record<string, any>>({});
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [isEditingFiles, setIsEditingFiles] = useState(false);
  const [selectedDownloads, setSelectedDownloads] = useState<Set<string>>(new Set());

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

  // 컴포넌트 마운트 시 공고 데이터 로드
  React.useEffect(() => {
    const noticeDetail = detailData['공고'] || {};
    setNoticeFields(noticeDetail);
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

  // 공고 정보 저장
  const saveNoticeFields = async () => {
    try {
      const { data } = await updateMyBid({
        variables: {
          input: {
            nid: bid.nid,
            status: '공고',
            memo: null,
            detail: JSON.stringify(noticeFields)
          }
        }
      });

      if (data?.mybidUpdate?.success) {
        setIsEditingNotice(false);
        router.refresh();
      } else {
        throw new Error(data?.mybidUpdate?.message || '공고 정보 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('공고 정보 저장 중 오류 발생:', error);
      alert('공고 정보 저장 중 오류가 발생했습니다.');
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
      <h1 className="text-2xl font-bold">{bid.title}</h1>
      
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
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4" />
              <h3 className="font-semibold">공고 상세정보</h3>
            </div>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">공고명</span>
                  <span className="font-medium">{bid.title}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">공고일</span>
                  <span className="font-medium">{bid.postedAt?.split('T')[0]}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">담당기관</span>
                  <span className="font-medium">{bid.orgName}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">분야</span>
                  <span className="font-medium">{bid.category}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">지역</span>
                  <span className="font-medium">{bid.region}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">현재 상태</span>
                  <span className="font-medium">{bid.status}</span>
                </div>
              </div>
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
              {isEditingNotice && (
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingNotice(false);
                      // 원래 데이터로 복원
                      const noticeDetail = detailData['공고'] || {};
                      setNoticeFields(noticeDetail);
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
                        <TableHead>파일명</TableHead>
                        <TableHead>웹주소</TableHead>
                        <TableHead>로컬경로</TableHead>
                        <TableHead className="text-center">다운로드</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {noticeFilesData.noticeFiles.files.map((file: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-500" />
                              {isEditingFiles ? (
                                <Input
                                  value={file.file_name}
                                  onChange={(e) => {
                                    // TODO: 파일명 편집 기능 구현
                                  }}
                                  className="max-w-xs"
                                />
                              ) : (
                                <span>{file.file_name}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isEditingFiles ? (
                                <Input
                                  value={file.file_url}
                                  onChange={(e) => {
                                    // TODO: URL 편집 기능 구현
                                  }}
                                  className="max-w-xs"
                                />
                              ) : file.file_url ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-blue-600 truncate max-w-xs" title={file.file_url}>
                                    {file.file_url.substring(0, 50)}...
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(file.file_url, '_blank')}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isEditingFiles ? (
                              <Input
                                value={file.down_folder || ''}
                                onChange={(e) => {
                                  // TODO: 로컬경로 편집 기능 구현
                                }}
                                className="max-w-xs"
                                placeholder="로컬 경로"
                              />
                            ) : (
                              <span className="text-sm text-gray-600">
                                {file.down_folder || '-'}
                              </span>
                            )}
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
                  <div className="text-sm text-gray-500 pt-2 border-t">
                    총 {noticeFilesData.noticeFiles.total_count}개 파일 • 마지막 업데이트: {bid.postedAt?.split('T')[0]}
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