'use client';

import React, { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ButtonWithIcon, ButtonWithColorIcon, DropdownSectionHeader, TabHeader, TabContainer } from '@/components/shared/FormComponents';
import { SectionTitleHelp } from '@/components/shared/Help';
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
  FileBarChart
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

  // Section expansion states
  const [isBidInfoExpanded, setIsBidInfoExpanded] = useState(true);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(true);
  const [isDocumentExpanded, setIsDocumentExpanded] = useState(true);
  const [isStageExpanded, setIsStageExpanded] = useState(true);

  // Guide states
  const [isBidInfoGuideOpen, setIsBidInfoGuideOpen] = useState(false);
  const [isAnalysisGuideOpen, setIsAnalysisGuideOpen] = useState(false);
  const [isDocumentGuideOpen, setIsDocumentGuideOpen] = useState(false);
  const [isStageGuideOpen, setIsStageGuideOpen] = useState(false);

  // Tab states
  const [bidInfoActiveTab, setBidInfoActiveTab] = useState('bidding');
  const [analysisActiveTab, setAnalysisActiveTab] = useState('companies');
  const [documentActiveTab, setDocumentActiveTab] = useState('bid');
  const [stageActiveTab, setStageActiveTab] = useState('낙찰');

  const [selectedStatus, setSelectedStatus] = useState('낙찰');
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

  // 컴포넌트 마운트 시 초기 상태 데이터 로드
  useEffect(() => {
    loadStatusData('낙찰');
  }, [bid.detail, bid.memo]); // bid 데이터가 변경될 때마다 재실행

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
    <div className="container mx-auto px-4 py-6 space-y-5">
      {/* 페이지 헤더 */}
      <PageHeader
        title="입찰 응찰 상세"
        breadcrumbs={[
          { label: '홈', href: '/' },
          { label: '나의 입찰', href: '/mybids' },
          { label: '응찰', href: '/mybids/bidding' },
          { label: bid.title, href: `/mybids/bidding/${bid.nid}` }
        ]}
        helpTooltip="입찰 응찰 상세 페이지 도움말"
        helpContent="응찰한 입찰의 상세 정보를 확인하고 관리할 수 있습니다. 응찰 정보, 입찰 분석, 관련 문서, 단계 변경 등의 기능을 제공합니다."
      />

      {/* 응찰 정보 */}
      <div>
        <div className="flex items-center gap-2">
          <DropdownSectionHeader
            title="응찰 정보"
            icon={<Target className="w-5 h-5" />}
            isExpanded={isBidInfoExpanded}
            onToggle={() => setIsBidInfoExpanded(!isBidInfoExpanded)}
            accentColor="#10b981"
          />
          <SectionTitleHelp
            isOpen={isBidInfoGuideOpen}
            onToggle={() => setIsBidInfoGuideOpen(!isBidInfoGuideOpen)}
          />
        </div>

        {/* 응찰 정보 업무 가이드 */}
        {isBidInfoGuideOpen && (
          <div className="mt-2 bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="max-w-full">
              <h4 className="font-semibold text-green-800 mb-2">응찰 정보 업무 가이드</h4>
              <div className="text-sm text-green-700 space-y-2">
                <p>• 응찰 상세정보: 응찰과 관련된 세부 사항을 입력하고 관리할 수 있습니다.</p>
                <p>• 입찰 상세정보: 입찰 공고의 기본 정보를 확인할 수 있습니다.</p>
                <p>• 공고 상세정보: 입찰 공고의 상세 내용을 확인할 수 있습니다.</p>
              </div>
            </div>
          </div>
        )}

        {isBidInfoExpanded && (
          <div className="mt-2 space-y-0">
            <TabHeader
              tabs={[
                {
                  id: 'bidding',
                  label: '응찰 상세정보',
                  icon: <Target className="w-4 h-4" />
                },
                {
                  id: 'bid',
                  label: '입찰 상세정보',
                  icon: <Info className="w-4 h-4" />
                },
                {
                  id: 'notice',
                  label: '공고 상세정보',
                  icon: <FileText className="w-4 h-4" />
                }
              ]}
              activeTab={bidInfoActiveTab}
              onTabChange={setBidInfoActiveTab}
            />

            {/* 응찰 상세정보 탭 */}
            {bidInfoActiveTab === 'bidding' && (
              <div>
                <TabContainer>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Building className="w-4 h-4" />
                          발주기관
                        </div>
                        <p className="font-medium">{bid.orgName}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          응찰 상태
                        </div>
                        <p className="font-medium">{bid.status}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Trophy className="w-4 h-4" />
                          분야
                        </div>
                        <p className="font-medium">{bid.category || '미분류'}</p>
                      </div>
                    </div>
                    {bid.memo && (
                      <div>
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

            {/* 입찰 상세정보 탭 */}
            {bidInfoActiveTab === 'bid' && (
              <div>
                <TabContainer>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-500">입찰 ID</span>
                        <span className="font-medium">{bid.nid}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-500">제목</span>
                        <span className="font-medium">{bid.title}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-500">응찰 시작</span>
                        <span className="font-medium">{bid.startedAt || '정보 없음'}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-500">응찰 마감</span>
                        <span className="font-medium">{bid.endedAt || '정보 없음'}</span>
                      </div>
                    </div>
                  </div>
                </TabContainer>
              </div>
            )}

            {/* 공고 상세정보 탭 */}
            {bidInfoActiveTab === 'notice' && (
              <div>
                <TabContainer>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-500">공고일</span>
                        <span className="font-medium">{bid.postedAt?.split('T')[0]}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-gray-500">지역</span>
                        <span className="font-medium">{bid.region || '정보 없음'}</span>
                      </div>
                    </div>
                  </div>
                </TabContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 입찰 분석 */}
      <div>
        <div className="flex items-center gap-2">
          <DropdownSectionHeader
            title="입찰 분석"
            icon={<BarChart3 className="w-5 h-5" />}
            isExpanded={isAnalysisExpanded}
            onToggle={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
            accentColor="#8b5cf6"
          />
          <SectionTitleHelp
            isOpen={isAnalysisGuideOpen}
            onToggle={() => setIsAnalysisGuideOpen(!isAnalysisGuideOpen)}
          />
        </div>

        {/* 입찰 분석 업무 가이드 */}
        {isAnalysisGuideOpen && (
          <div className="mt-2 bg-purple-50 border border-purple-200 p-4 rounded-lg">
            <div className="max-w-full">
              <h4 className="font-semibold text-purple-800 mb-2">입찰 분석 업무 가이드</h4>
              <div className="text-sm text-purple-700 space-y-2">
                <p>• 응찰업체 분석: 경쟁사 정보와 입찰 현황을 분석할 수 있습니다.</p>
                <p>• 용역내용 분석: 프로젝트 요구사항과 기술 분석을 확인할 수 있습니다.</p>
              </div>
            </div>
          </div>
        )}

        {isAnalysisExpanded && (
          <div className="mt-2 space-y-0">
            <TabHeader
              tabs={[
                {
                  id: 'companies',
                  label: '응찰업체 분석',
                  icon: <Users className="w-4 h-4" />
                },
                {
                  id: 'content',
                  label: '용역내용 분석',
                  icon: <FileBarChart className="w-4 h-4" />
                }
              ]}
              activeTab={analysisActiveTab}
              onTabChange={setAnalysisActiveTab}
            />

            {/* 응찰업체 분석 탭 */}
            {analysisActiveTab === 'companies' && (
              <div>
                <TabContainer>
                  <div className="space-y-4">
                    <p className="text-gray-500">응찰업체 분석 데이터를 불러오는 중...</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>업체명</TableHead>
                          <TableHead>응찰금액</TableHead>
                          <TableHead>평가점수</TableHead>
                          <TableHead>순위</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>예시 업체 1</TableCell>
                          <TableCell>1,000,000원</TableCell>
                          <TableCell>85점</TableCell>
                          <TableCell>1위</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>예시 업체 2</TableCell>
                          <TableCell>1,200,000원</TableCell>
                          <TableCell>80점</TableCell>
                          <TableCell>2위</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </TabContainer>
              </div>
            )}

            {/* 용역내용 분석 탭 */}
            {analysisActiveTab === 'content' && (
              <div>
                <TabContainer>
                  <div className="space-y-4">
                    <p className="text-gray-500">용역내용 분석 정보를 준비 중입니다.</p>
                  </div>
                </TabContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 관련 문서 */}
      <div>
        <div className="flex items-center gap-2">
          <DropdownSectionHeader
            title="관련 문서"
            icon={<FileText className="w-5 h-5" />}
            isExpanded={isDocumentExpanded}
            onToggle={() => setIsDocumentExpanded(!isDocumentExpanded)}
            accentColor="#f59e0b"
          />
          <SectionTitleHelp
            isOpen={isDocumentGuideOpen}
            onToggle={() => setIsDocumentGuideOpen(!isDocumentGuideOpen)}
          />
        </div>

        {/* 관련 문서 업무 가이드 */}
        {isDocumentGuideOpen && (
          <div className="mt-2 bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <div className="max-w-full">
              <h4 className="font-semibold text-amber-800 mb-2">관련 문서 업무 가이드</h4>
              <div className="text-sm text-amber-700 space-y-2">
                <p>• 응찰문서: 제출한 입찰서류들을 확인하고 다운로드할 수 있습니다.</p>
                <p>• 공고문서: 입찰 공고에 첨부된 문서들을 확인할 수 있습니다.</p>
              </div>
            </div>
          </div>
        )}

        {isDocumentExpanded && (
          <div className="mt-2 space-y-0">
            <TabHeader
              tabs={[
                {
                  id: 'bid',
                  label: '응찰문서',
                  icon: <FileText className="w-4 h-4" />
                },
                {
                  id: 'notice',
                  label: '공고문서',
                  icon: <FileText className="w-4 h-4" />
                }
              ]}
              activeTab={documentActiveTab}
              onTabChange={setDocumentActiveTab}
            />

            {/* 응찰문서 탭 */}
            {documentActiveTab === 'bid' && (
              <div>
                <TabContainer>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">제출된 입찰서.pdf</span>
                        <span className="text-sm text-gray-500">(응찰)</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        다운로드
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">사업계획서.pdf</span>
                        <span className="text-sm text-gray-500">(응찰)</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        다운로드
                      </Button>
                    </div>
                  </div>
                </TabContainer>
              </div>
            )}

            {/* 공고문서 탭 */}
            {documentActiveTab === 'notice' && (
              <div>
                <TabContainer>
                  <div className="space-y-3">
                    <p className="text-gray-500">공고 관련 문서를 불러오는 중...</p>
                  </div>
                </TabContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 단계 변경 */}
      <div>
        <div className="flex items-center gap-2">
          <DropdownSectionHeader
            title="단계 변경"
            icon={<RefreshCw className="w-5 h-5" />}
            isExpanded={isStageExpanded}
            onToggle={() => setIsStageExpanded(!isStageExpanded)}
            accentColor="#ef4444"
          />
          <SectionTitleHelp
            isOpen={isStageGuideOpen}
            onToggle={() => setIsStageGuideOpen(!isStageGuideOpen)}
          />
        </div>

        {/* 단계 변경 업무 가이드 */}
        {isStageGuideOpen && (
          <div className="mt-2 bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="max-w-full">
              <h4 className="font-semibold text-red-800 mb-2">단계 변경 업무 가이드</h4>
              <div className="text-sm text-red-700 space-y-2">
                <p>• 낙찰: 입찰에 성공한 경우 선택합니다.</p>
                <p>• 패찰: 입찰에 실패한 경우 선택합니다.</p>
                <p>• 포기: 입찰을 포기하는 경우 선택합니다.</p>
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
                    stageActiveTab === '낙찰'
                      ? 'active'
                      : 'text-color-primary-muted-foreground'
                  }`}
                  onClick={() => {
                    setStageActiveTab('낙찰');
                    setSelectedStatus('낙찰');
                    loadStatusData('낙찰');
                  }}
                >
                  <Trophy className="w-4 h-4" />
                  낙찰
                </button>
                <button
                  className={`tab-button px-4 py-2 font-medium text-sm flex items-center gap-2 ${
                    stageActiveTab === '패찰'
                      ? 'active'
                      : 'text-color-primary-muted-foreground'
                  }`}
                  onClick={() => {
                    setStageActiveTab('패찰');
                    setSelectedStatus('패찰');
                    loadStatusData('패찰');
                  }}
                >
                  <XCircle className="w-4 h-4" />
                  패찰
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