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
  const [createProject, setCreateProject] = useState(false);
  const [pm, setPm] = useState('');
  const [giveupReason, setGiveupReason] = useState('');

  // 응찰을 제외한 상태 옵션들
  const statusOptions = [
    { value: '낙찰', label: '낙찰' },
    { value: '패찰', label: '패찰' },
    { value: '포기', label: '포기' }
  ];

  // detail이 JSON 문자열인 경우 파싱
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

    switch (selectedStatus) {
      case '낙찰':
        return (
          <div className="grid gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createProject"
                checked={createProject}
                onCheckedChange={(checked) => setCreateProject(checked === true)}
              />
              <Label htmlFor="createProject">프로젝트 생성</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pm">PM</Label>
              <Input
                id="pm"
                value={pm}
                onChange={(e) => setPm(e.target.value)}
                placeholder="PM을 입력하세요"
              />
            </div>
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
      case '패찰':
        return (
          <div className="grid gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
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
      case '포기':
        return (
          <div className="grid gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid gap-2">
              <Label htmlFor="giveupReason">포기 이유</Label>
              <Input
                id="giveupReason"
                value={giveupReason}
                onChange={(e) => setGiveupReason(e.target.value)}
                placeholder="포기 이유를 입력하세요"
              />
            </div>
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
      default:
        return null;
    }
  };

  const handleStatusChange = async () => {
    if (!selectedStatus) {
      alert('단계를 선택해주세요.');
      return;
    }

    try {
      // detail 객체 구성
      const detail: Record<string, string> = {};
      
      switch (selectedStatus) {
        case '낙찰':
          if (createProject) detail['프로젝트 생성'] = 'true';
          if (pm) detail['PM'] = pm;
          break;
        case '포기':
          if (giveupReason) detail['포기 이유'] = giveupReason;
          break;
      }

      const { data } = await updateMyBid({
        variables: {
          input: {
            nid: bid.nid,
            status: selectedStatus,
            memo: memo || null,
            detail: Object.keys(detail).length > 0 ? JSON.stringify(detail) : null
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
        <div>
          <h1 className="text-2xl font-bold mb-2">{bid.title}</h1>
          <div className="flex items-center gap-4">
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              bid.status === '응찰' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {bid.status}
            </span>
            <span className="text-sm text-gray-600">입찰 ID: {bid.nid}</span>
          </div>
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
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building className="w-4 h-4" />
                발주기관
              </div>
              <p className="font-medium">{bid.orgName}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                공고일
              </div>
              <p className="font-medium">{bid.postedAt?.split('T')[0]}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
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
                    <span className="text-sm text-gray-500">{key}</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {bid.memo && (
            <div>
              <h4 className="font-semibold mb-2">메모</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">{bid.memo}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">응찰 시작</span>
              <span className="font-medium">{bid.startedAt || '정보 없음'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-500">응찰 마감</span>
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
                    onCheckedChange={() => setSelectedStatus(option.value)}
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
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">제출된 입찰서.pdf</span>
                <span className="text-sm text-gray-500">(응찰)</span>
              </div>
              <Button variant="outline" size="sm">
                다운로드
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium">사업계획서.pdf</span>
                <span className="text-sm text-gray-500">(응찰)</span>
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