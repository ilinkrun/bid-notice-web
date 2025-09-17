'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import {
  Settings,
  ListTodo,
  Star,
  BarChart2,
  Cog,
  User,
  BookmarkPlus,
  BookmarkCheck,
  Bookmark,
  Archive,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FolderKanban,
  Code,
  MessageSquare,
  BookOpen,
  ChevronDown,
  Menu,
  X,
  Clock,
  Target,
  Award,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const notices = [
  {
    title: '공사점검',
    href: '/notices/공사점검?gap=1',
    icon: BookmarkPlus,
  },
  {
    title: '성능평가',
    href: '/notices/성능평가?gap=1',
    icon: BookmarkPlus,
  },
  {
    title: '기타',
    href: '/notices/기타?gap=1',
    icon: BookmarkPlus,
  },
  {
    title: '관련없음',
    href: '/notices/무관?gap=1',
    icon: Bookmark,
  },
  {
    title: '제외',
    href: '/notices/제외?gap=1',
    icon: Archive,
  },
];

const bids = [
  {
    title: '진행(응찰전)',
    href: '/bids/progress',
    description: '입찰 준비중인 공고 목록',
    icon: Clock,
  },
  {
    title: '응찰(응찰후 종료전)',
    href: '/bids/bidding',
    description: '응찰 완료된 공고 목록',
    icon: Target,
  },
  {
    title: '종료(낙찰/패찰/포기)',
    href: '/bids/ended',
    description: '낙찰/패찰/포기된 공고 목록',
    icon: CheckCircle,
  },
];

const statistics = [
  {
    title: '입찰 공고 통계',
    href: '/statistics/notice',
    description: '기간별, 분류별 스크랩 완료 입찰 공고 통계',
    icon: BarChart2,
  },
  {
    title: '스크래핑 로그',
    href: '/statistics/logs_scraping',
    description: '스크래핑 로그',
    icon: FileSpreadsheet,
  },
  {
    title: '스크래핑 에러',
    href: '/statistics/errors_scraping',
    description: '스크래핑 에러',
    icon: FileSpreadsheet,
  },
  {
    title: '접속 로그',
    href: '/statistics/logs_access',
    description: '접속 통계',
    icon: AlertCircle,
  },
];

const channels = [
  {
    title: '공지 및 건의(개발)',
    href: '/channels/board/dev',
    description: '개발 관련 공지, 개선.수정 건의 및 요구사항',
    icon: Code,
  },
  {
    title: '공지 및 건의(운영)',
    href: '/channels/board/op',
    description: '운영(업무) 관련 공지, 기능 반영 및 요구 사항',
    icon: MessageSquare,
  },
  {
    title: '매뉴얼',
    href: '/channels/board/manual',
    description: '사이트 운영 지침 및 사용 설명서',
    icon: BookOpen,
  },
];

const settings = [
  {
    title: '스크랩 설정',
    href: '/settings/scrapping',
    description: '입찰공고 스크랩 설정 관리',
    icon: Settings,
  },
  {
    title: '업무구분 설정',
    href: '/settings/category',
    description: '카테고리(업무구분) 관리',
    icon: FolderKanban,
  },
  {
    title: '앱 기본값 설정',
    href: '/settings/default',
    description: '앱 기본 설정 관리',
    icon: Archive,
  }
];

interface DropdownMenuProps {
  label: string;
  icon: LucideIcon;
  items: Array<{
    title: string;
    href: string;
    description?: string;
    icon: LucideIcon;
  }>;
  align?: 'left' | 'center' | 'right';
  isMobile?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, icon: Icon, items, align = 'left', isMobile = false, setIsMobileMenuOpen }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { navigate } = useUnifiedNavigation();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isMobile) {
    return (
      <div className="w-full py-2 bg-white">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between w-full px-4 py-2 transition-colors bg-white",
            isOpen ? "bg-gray-100" : "hover:bg-gray-50"
          )}
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>
        {isOpen && (
          <div className="w-full bg-white py-2">
            {items.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  setIsOpen(false);
                  if (setIsMobileMenuOpen && isMobile) {
                    setIsMobileMenuOpen(false);
                  }
                  navigate(item.href);
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 transition-colors hover:bg-gray-100 w-full text-left",
                  pathname === item.href && "bg-gray-100"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 transition-colors",
          isOpen ? "bg-color-secondary-active" : "hover:bg-color-secondary-active/50"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>
      {isOpen && (
        <div className={cn(
          "absolute top-full mt-1 w-[400px] md:w-[500px] p-4 border bg-popover shadow-lg",
          align === 'left' && "left-0",
          align === 'center' && "left-1/2 -translate-x-1/2",
          align === 'right' && "right-0"
        )}>
          <div className="grid gap-4">
            {items.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  setIsOpen(false);
                  navigate(item.href);
                }}
                className={cn(
                  "flex items-start gap-4 transition-colors hover:bg-color-secondary-active/50 p-2 rounded-md w-full text-left",
                  pathname === item.href && "bg-color-secondary-active"
                )}
              >
                <item.icon className="h-5 w-5 mt-0.5" />
                <div>
                  <div className="font-medium">{item.title}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function Header({ isMobileMenuOpen, setIsMobileMenuOpen }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b /95 backdrop-blur supports-[backdrop-filter]:bg-color-primary-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold pl-3">ILE</span>
          </Link>
          <nav className="flex items-center gap-1 ml-12">
            <DropdownMenu label="공고 목록" icon={Star} items={notices} align="left" />
            <DropdownMenu label="입찰 관리" icon={Cog} items={bids} align="center" />
            <DropdownMenu label="통계" icon={BarChart2} items={statistics} align="center" />
            <DropdownMenu label="게시판" icon={MessageSquare} items={channels} align="center" />
            <DropdownMenu label="설정" icon={Settings} items={settings} align="right" />
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between md:justify-end">
          <Link href="/" className="flex items-center space-x-2 md:hidden pl-4">
            <span className="font-bold">ILE</span>
          </Link>
          <div className="flex items-center">
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-color-primary-muted-foreground transition-colors hover:text-primary mr-4"
            >
              <User className="h-4 w-4" />
              <span>로그인</span>
            </Link>
            <button
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 패널 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-14 bg-white z-50 md:hidden border-t">
          <nav className="container py-4 bg-white">
            <div className="flex flex-col divide-y bg-white">
              <DropdownMenu label="공고 목록" icon={Star} items={notices} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
              <DropdownMenu label="입찰 관리" icon={Cog} items={bids} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
              <DropdownMenu label="통계" icon={BarChart2} items={statistics} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
              <DropdownMenu label="게시판" icon={MessageSquare} items={channels} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
              <DropdownMenu label="설정" icon={Settings} items={settings} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
