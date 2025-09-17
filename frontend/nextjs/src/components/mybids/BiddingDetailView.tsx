'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Info, 
  Clock, 
  CheckSquare,
  Building,
  Calendar,
  User,
  Target,
  CreditCard,
  Award,
  Loader2
} from 'lucide-react';
import { useMutation, gql } from '@apollo/client';
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

interface BiddingDetailViewProps {
  bid: Bid;
}

export default function BiddingDetailView({ bid }: BiddingDetailViewProps) {
  const router = useRouter();
  const [updateMyBid, { loading }] = useMutation(UPDATE_MYBID);
  
  const [selectedStatus, setSelectedStatus] = useState('');
  const [memo, setMemo] = useState('');
  const [dynamicFields, setDynamicFields] = useState<Record<string, any>>({});

  // 응찰을 제외한 상태 옵션들
  const statusOptions = [
    { value: '낙찰', label: '낙찰' },
    { value: '패찰', label: '패찰' },
    { value: '포기', label: '포기' }
  ];

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

  // detail이 JSON 문자열인 경우 파싱 (호환성을 위해 유지)
  let parsedDetail = {};
  if (bid.detail) {
    try {
      parsedDetail = JSON.parse(bid.detail);
    } catch (e) {
      console.error('Failed to parse detail:', e);
    }
  }

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
        alert(`단계가 '${selectedStatus}'로 변경되었습니다.`);
        // 페이지 새로고침하여 변경된 정보 반영
        router.refresh();
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
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            bid.status === '응찰' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'text-color-primary-muted-foreground'
          }`}>
            {bid.status}
          </span>
          <span className="text-sm text-color-primary-muted-foreground">입찰 ID: {bid.nid}</span>
        </div>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          입찰서 다운로드
        </Button>
      </div>

      {/* 입찰 정보 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            응찰 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-color-primary-muted-foreground">
                <Building className="w-4 h-4" />
                발주기관
              </div>
              <p className="font-medium">{bid.orgName}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-color-primary-muted-foreground">
                <Calendar className="w-4 h-4" />
                공고일
              </div>
              <p className="font-medium">{bid.postedAt?.split('T')[0]}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-color-primary-muted-foreground">
                <Award className="w-4 h-4" />
                분야
              </div>
              <p className="font-medium">{bid.category || '미분류'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 응찰 상세 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            응찰 상세
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.keys(parsedDetail).length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">입력 정보</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(parsedDetail).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <span className="text-sm text-color-primary-muted-foreground">{key}</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {bid.memo && (
            <div>
              <h4 className="font-semibold mb-2">메모</h4>
              <div className="p-3  rounded-lg">
                <p className="text-sm">{bid.memo}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-color-primary-muted-foreground">응찰 시작</span>
              <span className="font-medium">{bid.startedAt || '정보 없음'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-color-primary-muted-foreground">응찰 마감</span>
              <span className="font-medium">{bid.endedAt || '정보 없음'}</span>
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

      {/* 관련 문서 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            관련 문서
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3  rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-color-primary-muted-foreground" />
                <span className="font-medium">제출된 입찰서.pdf</span>
                <span className="text-sm text-color-primary-muted-foreground">(응찰)</span>
              </div>
              <Button variant="outline" size="sm">
                다운로드
              </Button>
            </div>
            <div className="flex items-center justify-between p-3  rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-color-primary-muted-foreground" />
                <span className="font-medium">사업계획서.pdf</span>
                <span className="text-sm text-color-primary-muted-foreground">(응찰)</span>
              </div>
              <Button variant="outline" size="sm">
                다운로드
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}