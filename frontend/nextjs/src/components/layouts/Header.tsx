'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionBoundary } from '@/components/auth/PermissionBoundary';
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
  LogOut,
  UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const LOGOUT_MUTATION = gql`
  mutation Logout($token: String!) {
    logout(token: $token) {
      success
      message
    }
  }
`;

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
    href: '/mybids/progress',
    description: '입찰 준비중인 공고 목록',
    icon: Clock,
  },
  {
    title: '응찰(응찰후 종료전)',
    href: '/mybids/bidding',
    description: '응찰 완료된 공고 목록',
    icon: Target,
  },
  {
    title: '종료(낙찰/패찰/포기)',
    href: '/mybids/ended',
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
          isOpen ? "bg-accent" : "hover:bg-accent/50"
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
                  "flex items-start gap-4 transition-colors hover:bg-accent/50 p-2 rounded-md w-full text-left",
                  pathname === item.href && "bg-accent"
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

// 사용자 아바타 컴포넌트
interface UserAvatarProps {
  user: {
    name: string;
    email: string;
    role: string;
    department?: string;
    avatar?: string;
  };
  size?: 'sm' | 'md';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'sm' }) => {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';

  // 아바타 이미지가 있으면 이미지 사용, 없으면 이니셜 사용
  if (user.avatar) {
    return (
      <div className={cn("rounded-full overflow-hidden", sizeClasses)}>
        <img 
          src={user.avatar} 
          alt={`${user.name}의 아바타`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // 이미지 로드 실패 시 이니셜로 대체
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full bg-primary text-primary-foreground flex items-center justify-center font-medium rounded-full">
                  ${initials}
                </div>
              `;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium",
      sizeClasses
    )}>
      {initials}
    </div>
  );
};

// 사용자 드롭다운 메뉴 컴포넌트
const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const { user, logout, token } = useAuth();
  const { navigate } = useUnifiedNavigation();

  const [logoutMutation] = useMutation(LOGOUT_MUTATION, { 
    client: getClient(),
    onCompleted: (data) => {
      if (data.logout.success) {
        logout();
        navigate('/login');
      }
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // 에러가 발생해도 클라이언트 측에서는 로그아웃 처리
      logout();
      navigate('/login');
    }
  });

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!token) return;
    
    setIsLoggingOut(true);
    try {
      await logoutMutation({ variables: { token } });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  const handleUserInfo = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-1 rounded-full transition-colors",
          isOpen ? "bg-accent" : "hover:bg-accent/50"
        )}
      >
        <UserAvatar user={user} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 p-2 border bg-popover shadow-lg rounded-md">
          {/* 사용자 정보 */}
          <div className="px-3 py-2 border-b mb-2">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                {user.department && (
                  <p className="text-xs text-muted-foreground truncate">{user.department}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    user.role === 'admin' 
                      ? "bg-red-100 text-red-800"
                      : user.role === 'manager'
                      ? "bg-blue-100 text-blue-800" 
                      : user.role === 'viewer'
                      ? "bg-gray-100 text-gray-800"
                      : "bg-green-100 text-green-800"
                  )}>
                    {user.role === 'admin' 
                      ? '관리자' 
                      : user.role === 'manager' 
                      ? '매니저'
                      : user.role === 'viewer'
                      ? '조회자'
                      : '사용자'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 메뉴 항목들 */}
          <div className="space-y-1">
            <button
              onClick={handleUserInfo}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent rounded-md transition-colors"
            >
              <UserCircle className="h-4 w-4" />
              <span>사용자 정보</span>
            </button>
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent rounded-md transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
            </button>
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
  const { isAuthenticated } = useAuth();
  const { hasRole } = usePermissions();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold pl-3">ILE</span>
          </Link>
          <nav className="flex items-center gap-1 ml-12">
            {/* 공고 목록 - 모든 역할 접근 가능 */}
            <DropdownMenu label="공고 목록" icon={Star} items={notices} align="left" />
            
            {/* 입찰 관리 - 로그인한 사용자만 */}
            <PermissionBoundary roles={['user', 'manager', 'admin']} showMessage={false}>
              <DropdownMenu label="입찰 관리" icon={Cog} items={bids} align="center" />
            </PermissionBoundary>
            
            {/* 통계 - viewer 이상 */}
            <PermissionBoundary roles={['viewer', 'user', 'manager', 'admin']} showMessage={false}>
              <DropdownMenu label="통계" icon={BarChart2} items={statistics} align="center" />
            </PermissionBoundary>
            
            {/* 게시판 - user 이상 */}
            <PermissionBoundary roles={['user', 'manager', 'admin']} showMessage={false}>
              <DropdownMenu label="게시판" icon={MessageSquare} items={channels} align="center" />
            </PermissionBoundary>
            
            {/* 설정 - manager 이상 */}
            <PermissionBoundary roles={['manager', 'admin']} showMessage={false}>
              <DropdownMenu label="설정" icon={Settings} items={settings} align="right" />
            </PermissionBoundary>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between md:justify-end">
          <Link href="/" className="flex items-center space-x-2 md:hidden pl-4">
            <span className="font-bold">ILE</span>
          </Link>
          <div className="flex items-center">
            {/* 로그인 상태에 따른 조건부 렌더링 */}
            {isAuthenticated ? (
              <div className="mr-4">
                <UserDropdown />
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary mr-4"
              >
                <User className="h-4 w-4" />
                <span>로그인</span>
              </Link>
            )}
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
            {/* 모바일 사용자 정보 (로그인 상태일 때만) */}
            {isAuthenticated && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <UserDropdown />
              </div>
            )}
            
            <div className="flex flex-col divide-y bg-white">
              {/* 공고 목록 - 모든 역할 접근 가능 */}
              <DropdownMenu label="공고 목록" icon={Star} items={notices} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
              
              {/* 입찰 관리 - 로그인한 사용자만 */}
              <PermissionBoundary roles={['user', 'manager', 'admin']} showMessage={false}>
                <DropdownMenu label="입찰 관리" icon={Cog} items={bids} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
              </PermissionBoundary>
              
              {/* 통계 - viewer 이상 */}
              <PermissionBoundary roles={['viewer', 'user', 'manager', 'admin']} showMessage={false}>
                <DropdownMenu label="통계" icon={BarChart2} items={statistics} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
              </PermissionBoundary>
              
              {/* 게시판 - user 이상 */}
              <PermissionBoundary roles={['user', 'manager', 'admin']} showMessage={false}>
                <DropdownMenu label="게시판" icon={MessageSquare} items={channels} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
              </PermissionBoundary>
              
              {/* 설정 - manager 이상 */}
              <PermissionBoundary roles={['manager', 'admin']} showMessage={false}>
                <DropdownMenu label="설정" icon={Settings} items={settings} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
              </PermissionBoundary>
              
              {/* 모바일 로그인 링크 (비로그인 상태일 때만) */}
              {!isAuthenticated && (
                <div className="py-2 bg-white">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 transition-colors hover:bg-gray-100 w-full"
                  >
                    <User className="h-4 w-4" />
                    <span>로그인</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
