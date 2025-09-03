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
  Edit3, 
  CheckSquare,
  Building,
  Calendar,
  User
} from 'lucide-react';

interface Bid {
  mid: string;
  nid: string;
  title: string;
  status: string;
  started_at: string;
  ended_at: string;
  memo?: string;
  orgName: string;
  postedAt: string;
  detail: string;
  category: string;
  region: string;
}

interface BidDetailViewProps {
  bid: Bid;
}

export default function BidDetailView({ bid }: BidDetailViewProps) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [createProject, setCreateProject] = useState(false);
  const [pm, setPm] = useState('');
  const [giveupReason, setGiveupReason] = useState('');

  const statusOptions = [
    { value: '응찰', label: '응찰' },
    { value: '낙찰', label: '낙찰' },
    { value: '패찰', label: '패찰' },
    { value: '포기', label: '포기' }
  ];

  const renderDynamicFields = () => {
    if (!selectedStatus) return null;

    switch (selectedStatus) {
      case '응찰':
        return (
          <div className="grid gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid gap-2">
              <Label htmlFor="bidAmount">응찰가</Label>
              <Input
                id="bidAmount"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="응찰가를 입력하세요"
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
      case '낙찰':
        return (
          <div className="grid gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createProject"
                checked={createProject}
                onCheckedChange={setCreateProject}
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

  const handleStatusChange = () => {
    // TODO: Implement status change logic
    console.log('Status change:', {
      selectedStatus,
      bidAmount,
      memo,
      createProject,
      pm,
      giveupReason
    });
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
              {bid.detail && (
                <div className="flex flex-col gap-1 pt-2 border-t">
                  <span className="text-sm text-gray-500">상세 정보</span>
                  <span className="text-sm">{bid.detail}</span>
                </div>
              )}
              {/* 스크랩 실패 정보 - 수동 다운로드 알림 */}
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-sm text-yellow-800">
                  📥 스크랩 실패 시 수동 다운로드가 필요합니다
                </span>
              </div>
            </div>
          </div>

          {/* 입찰 상세정보 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" />
              <h3 className="font-semibold">입찰 상세정보</h3>
            </div>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">입찰 개시 시간</span>
                  <span className="font-medium">{bid.started_at || '정보 없음'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">입찰 종료 시간</span>
                  <span className="font-medium">{bid.ended_at || '정보 없음'}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">입찰 종류</span>
                  <span className="font-medium">전자입찰</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">제출 서류</span>
                  <span className="font-medium">입찰서, 사업계획서</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">입찰 보증금</span>
                  <span className="font-medium">추정가격의 5%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">개찰 방식</span>
                  <span className="font-medium">공개경쟁입찰</span>
                </div>
              </div>
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
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4" />
              <h3 className="font-semibold">공고 문서</h3>
            </div>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">입찰공고문.pdf</span>
                    <span className="text-sm text-gray-500">(1.2MB)</span>
                  </div>
                  <Button variant="outline" size="sm">
                    다운로드
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">설계도서.zip</span>
                    <span className="text-sm text-gray-500">(15.7MB)</span>
                  </div>
                  <Button variant="outline" size="sm">
                    다운로드
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">입찰설명서.pdf</span>
                    <span className="text-sm text-gray-500">(850KB)</span>
                  </div>
                  <Button variant="outline" size="sm">
                    다운로드
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-500 pt-2 border-t">
                총 3개 파일 • 마지막 업데이트: {bid.postedAt?.split('T')[0]}
              </div>
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
                    onCheckedChange={() => setSelectedStatus(option.value)}
                  />
                  <Label htmlFor={`status-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
            
            {renderDynamicFields()}

            {selectedStatus && (
              <div className="flex justify-end pt-4">
                <Button onClick={handleStatusChange}>
                  단계 변경
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}