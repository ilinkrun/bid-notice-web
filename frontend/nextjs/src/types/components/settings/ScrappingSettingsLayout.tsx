'use client';

import { useParams, usePathname } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, List, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrappingSettingsLayoutProps {
  children: React.ReactNode;
  orgName: string;
  isActive?: boolean;
  region?: string;
}

export function ScrappingSettingsLayout({ children, orgName }: ScrappingSettingsLayoutProps) {
  const { navigate } = useUnifiedNavigation();
  const pathname = usePathname();
  const params = useParams();
  
  const handleBackToList = () => {
    navigate('/settings/scrapping');
  };

  const handleTabClick = (tab: 'list' | 'detail') => {
    // oid 파라미터가 있으면 oid 기반으로, 없으면 orgName 기반으로 처리
    if (params.oid) {
      navigate(`/settings/scrapping/${params.oid}/${tab}`);
    } else {
      navigate(`/settings/scrapping/${encodeURIComponent(orgName)}/${tab}`);
    }
  };

  // 현재 활성 탭 확인
  const activeTab = pathname.endsWith('/list') ? 'list' : pathname.endsWith('/detail') ? 'detail' : 'list';

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-0">
        {/* 헤더 - 목록으로 버튼과 탭을 한 라인에 배치 */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            목록으로
          </Button>
          
          {/* 탭 네비게이션을 우측에 배치 */}
          <div className="flex">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => handleTabClick('list')}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm",
                  activeTab === 'list'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                )}
              >
                <List className="h-4 w-4" />
                목록 스크랩 설정
              </button>
              <button
                onClick={() => handleTabClick('detail')}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm",
                  activeTab === 'detail'
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                )}
              >
                <FileText className="h-4 w-4" />
                상세 스크랩 설정
              </button>
            </nav>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}