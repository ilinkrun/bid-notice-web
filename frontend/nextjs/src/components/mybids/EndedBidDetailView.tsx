'use client';

import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ButtonWithIcon, ButtonWithColorIcon, DropdownSectionHeader, TabHeader, TabContainer } from '@/components/shared/FormComponents';
import { SectionTitleHelp } from '@/components/shared/Help';
import { GuideSlide } from '@/components/shared/GuideSlide';
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
  HelpCircle,
  Target,
  BarChart3,
  Users,
  FileBarChart,
  Award,
  TrendingUp
} from 'lucide-react';
import { useMutation, gql } from '@apollo/client';
import { useRouter } from 'next/navigation';

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

interface EndedBidDetailViewProps {
  bid: Bid;
}

export default function EndedBidDetailView({ bid }: EndedBidDetailViewProps) {
  const router = useRouter();

  // Section expansion states
  const [isResultExpanded, setIsResultExpanded] = useState(true);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);

  // Guide states
  const [isResultGuideOpen, setIsResultGuideOpen] = useState(false);
  const [isAnalysisGuideOpen, setIsAnalysisGuideOpen] = useState(false);

  // 동적 타이틀 생성
  const pageTitle = "입찰 종료 상세";
  const resultSectionTitle = "입찰 결과";
  const analysisSectionTitle = "결과 분석";
  
  const resultGuideTitle = `[가이드]${pageTitle} > ${resultSectionTitle}`;
  const analysisGuideTitle = `[가이드]${pageTitle} > ${analysisSectionTitle}`;

  // Tab states
  const [analysisActiveTab, setAnalysisActiveTab] = useState('bids');

  // 기존 데이터 파싱
  const parseDetailData = () => {
    try {
      return bid.detail ? JSON.parse(bid.detail) : {};
    } catch (e) {
      console.error('Failed to parse detail:', e);
      return {};
    }
  };

  const detailData = parseDetailData();

  // 샘플 입찰 결과 데이터
  const sampleBidResults = [
    { rank: 1, company: '(주)일맥엔지니어링', bidAmount: '950,000,000', score: 95, isWinner: true },
    { rank: 2, company: '현대건설(주)', bidAmount: '980,000,000', score: 92, isWinner: false },
    { rank: 3, company: '삼성물산(주)', bidAmount: '1,020,000,000', score: 88, isWinner: false },
    { rank: 4, company: '대우건설(주)', bidAmount: '1,050,000,000', score: 85, isWinner: false },
    { rank: 5, company: '포스코건설(주)', bidAmount: '1,080,000,000', score: 82, isWinner: false }
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-5">
      {/* 페이지 헤더 */}
      <PageHeader
        title="입찰 종료 상세"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '나의 입찰', href: '/mybids' },
          { label: '종료', href: '/mybids/ended' },
          { label: bid.title, href: `/mybids/ended/${bid.nid}` }
        ]}
        helpTooltip="입찰 종료 상세 페이지 도움말"
        helpContent="종료된 입찰의 상세 결과 정보를 확인할 수 있습니다. 입찰 결과 요약, 업체별 응찰가, 경쟁업체 분석 등의 정보를 제공합니다."
      />

      {/* 입찰 결과 */}
      <div>
        <div className="flex items-center gap-2">
          <DropdownSectionHeader
            title="입찰 결과"
            icon={<Award className="w-5 h-5" />}
            isExpanded={isResultExpanded}
            onToggle={() => setIsResultExpanded(!isResultExpanded)}
            accentColor="#10b981"
          />
          <SectionTitleHelp
            title={resultGuideTitle}
            category="운영가이드"
            isOpen={isResultGuideOpen}
            onToggle={() => setIsResultGuideOpen(!isResultGuideOpen)}
          />
        </div>

        {/* 입찰 결과 업무 가이드 */}
        <GuideSlide
          isOpen={isResultGuideOpen}
          title={resultGuideTitle}
          category="운영가이드"
          defaultContent={
            <div className="space-y-2">
              <div className="text-sm text-green-700">
                <p>운영가이드가 없습니다</p>
              </div>
            </div>
          }
          className="bg-green-50 border-green-200"
        />

        {isResultExpanded && (
          <div className="mt-2 space-y-0">
            <TabContainer>
              <div className="space-y-6">
                {/* 결과 요약 카드 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Award className="w-4 h-4" />
                      입찰 결과
                    </div>
                    <p className={`text-lg font-bold ${bid.status === '낙찰' ? 'text-green-600' : 'text-red-600'}`}>
                      {bid.status}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Building className="w-4 h-4" />
                      발주기관
                    </div>
                    <p className="font-medium">{bid.orgName}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      종료일
                    </div>
                    <p className="font-medium">{bid.endedAt?.split('T')[0] || '정보 없음'}</p>
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Trophy className="w-4 h-4" />
                      최종 순위
                    </div>
                    <p className="font-medium text-lg">1위 (낙찰)</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Target className="w-4 h-4" />
                      낙찰 금액
                    </div>
                    <p className="font-medium text-lg">950,000,000원</p>
                  </div>
                </div>

                {/* 메모 */}
                {bid.memo && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">메모</h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{bid.memo}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabContainer>
          </div>
        )}
      </div>

      {/* 결과 분석 */}
      <div>
        <div className="flex items-center gap-2">
          <DropdownSectionHeader
            title="결과 분석"
            icon={<BarChart3 className="w-5 h-5" />}
            isExpanded={isAnalysisExpanded}
            onToggle={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
            accentColor="#8b5cf6"
          />
          <SectionTitleHelp
            title={analysisGuideTitle}
            category="운영가이드"
            isOpen={isAnalysisGuideOpen}
            onToggle={() => setIsAnalysisGuideOpen(!isAnalysisGuideOpen)}
          />
        </div>

        {/* 결과 분석 업무 가이드 */}
        <GuideSlide
          isOpen={isAnalysisGuideOpen}
          title={analysisGuideTitle}
          category="운영가이드"
          defaultContent={
            <div className="space-y-2">
              <div className="text-sm text-purple-700">
                <p>운영가이드가 없습니다</p>
              </div>
            </div>
          }
          className="bg-purple-50 border-purple-200"
        />

        {isAnalysisExpanded && (
          <div className="mt-2 space-y-0">
            <TabHeader
              tabs={[
                {
                  id: 'bids',
                  label: '업체별 응찰가',
                  icon: <Users className="w-4 h-4" />
                },
                {
                  id: 'trends',
                  label: '경쟁업체 입찰 추이',
                  icon: <TrendingUp className="w-4 h-4" />
                }
              ]}
              activeTab={analysisActiveTab}
              onTabChange={setAnalysisActiveTab}
            />

            {/* 업체별 응찰가 탭 */}
            {analysisActiveTab === 'bids' && (
              <div>
                <TabContainer>
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>순위</TableHead>
                          <TableHead>업체명</TableHead>
                          <TableHead>응찰금액</TableHead>
                          <TableHead>평가점수</TableHead>
                          <TableHead>결과</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sampleBidResults.map((result) => (
                          <TableRow key={result.rank} className={result.isWinner ? 'bg-green-50' : ''}>
                            <TableCell className="font-medium">{result.rank}위</TableCell>
                            <TableCell className="font-medium">{result.company}</TableCell>
                            <TableCell>{result.bidAmount}원</TableCell>
                            <TableCell>{result.score}점</TableCell>
                            <TableCell>
                              {result.isWinner ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium bg-green-100 text-green-800">
                                  <Trophy className="w-3 h-3" />
                                  낙찰
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700">
                                  <XCircle className="w-3 h-3" />
                                  패찰
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabContainer>
              </div>
            )}

            {/* 경쟁업체 입찰 추이 탭 */}
            {analysisActiveTab === 'trends' && (
              <div>
                <TabContainer>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-semibold">입찰 참여 현황</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">총 참여업체</span>
                            <span className="font-medium">5개사</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">평균 응찰가</span>
                            <span className="font-medium">1,016,000,000원</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">최저 응찰가</span>
                            <span className="font-medium">950,000,000원</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">최고 응찰가</span>
                            <span className="font-medium">1,080,000,000원</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-semibold">경쟁 분석</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">경쟁률</span>
                            <span className="font-medium">5:1</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">가격 경쟁도</span>
                            <span className="font-medium">높음</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">시장 예상가 대비</span>
                            <span className="font-medium text-green-600">5% 절약</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}