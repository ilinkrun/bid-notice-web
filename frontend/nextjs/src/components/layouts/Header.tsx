'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMutation, useQuery } from '@apollo/client';
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
  Sun,
  Moon,
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

const GET_NOTICE_DEFAULTS = gql`
  query GetNoticeDefaults {
    gap: appSettingValue(area: "frontend", name: "notice_date_gap")
    categoryDefault: appSettingValue(area: "frontend", name: "category_view_default")
  }
`;

const createGovNotices = (gap: string = '5', categoryDefault: string = '공사점검,성능평가,정밀안전진단,정기안전점검,구조설계,구조감리,기타') => [
  {
    title: '업무',
    href: `/notices/gov/work?category=${categoryDefault}&gap=${gap}`,
    icon: BookmarkPlus,
    description: '공사점검, 성능평가, 기타 통합 페이지',
  },
  {
    title: '무관',
    href: `/notices/gov/irrelevant?gap=1`,
    icon: Bookmark,
  },
  {
    title: '제외',
    href: `/notices/gov/excluded?gap=${gap}`,
    icon: Archive,
  },
];

const createNaraNotices = (gap: string = '5', categoryDefault: string = '공사점검,성능평가,정밀안전진단,정기안전점검,구조설계,구조감리,기타') => [
  {
    title: '업무',
    href: `/notices/nara/work?category=${categoryDefault}&gap=${gap}`,
    icon: BookmarkPlus,
    description: '공사점검, 성능평가, 기타 통합 페이지',
  },
  {
    title: '무관',
    href: `/notices/nara/irrelevant?gap=${gap}`,
    icon: Bookmark,
  },
  {
    title: '제외',
    href: `/notices/nara/excluded?gap=${gap}`,
    icon: Archive,
  },
];


const govBids = [
  {
    title: '진행',
    href: '/mybids/gov/progress',
    description: '응찰 준비중인 입찰 목록',
    icon: Clock,
  },
  {
    title: '응찰',
    href: '/mybids/gov/bidding',
    description: '응찰한 공고(종료전) 목록',
    icon: Target,
  },
  {
    title: '종료',
    href: '/mybids/gov/ended',
    description: '낙찰/패찰/포기된 공고 목록',
    icon: CheckCircle,
  },
];

const naraBids = [
  {
    title: '진행',
    href: '/mybids/nara/progress',
    description: '응찰 준비중인 입찰 목록',
    icon: Clock,
  },
  {
    title: '응찰',
    href: '/mybids/nara/bidding',
    description: '응찰한 공고(종료전) 목록',
    icon: Target,
  },
  {
    title: '종료',
    href: '/mybids/nara/ended',
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

const boardChannels = [
  {
    title: '개발',
    href: '/channels/board/board_dev',
    description: '개발 관련 공지, 개선.수정 건의 및 요구사항',
    icon: Code,
  },
  {
    title: '운영',
    href: '/channels/board/board_op',
    description: '운영(업무) 관련 공지, 기능 반영 및 요구 사항',
    icon: MessageSquare,
  }
];

const docsChannels = [
  {
    title: '운영가이드',
    href: '/channels/docs/manual/op_guide',
    description: '운영 가이드',
    icon: BookOpen,
  },
  {
    title: '시스템가이드',
    href: '/channels/docs/manual/system_guide',
    description: '시스템 가이드 (비활성화)',
    icon: BookOpen,
    disabled: true,
  },
];

const favoriteChannels = [
  {
    title: '나라장터',
    href: '#',
    description: '나라장터 바로가기 (비활성화)',
    icon: BookOpen,
    disabled: true,
  },
  {
    title: 'NAS',
    href: '#',
    description: 'NAS 접속 (비활성화)',
    icon: BookOpen,
    disabled: true,
  },
];

const settings = [
  {
    title: '스크래핑 설정',
    href: '/settings/scrapping',
    description: '입찰공고 스크래핑 설정 관리',
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
    disabled?: boolean;
  }>;
  align?: 'left' | 'center' | 'right';
  isMobile?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

interface GroupedDropdownMenuProps {
  label: string;
  icon: LucideIcon;
  groups: Array<{
    label: string;
    items: Array<{
      title: string;
      href: string;
      description?: string;
      icon: LucideIcon;
      disabled?: boolean;
    }>;
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

  // Check if current path matches any of the dropdown items
  // Handle both exact matches and base path matches (ignoring query parameters)
  const isActive = items.some(item => {
    const itemPath = item.href.split('?')[0]; // Remove query parameters
    const decodedItemPath = decodeURIComponent(itemPath);
    const encodedItemPath = encodeURIComponent(itemPath);

    return pathname === item.href ||
      pathname === itemPath ||
      pathname === decodedItemPath ||
      pathname === encodedItemPath ||
      pathname.startsWith(itemPath + '/') ||
      pathname.startsWith(decodedItemPath + '/') ||
      pathname.startsWith(encodedItemPath + '/');
  }) || (label === '공고' && pathname.startsWith('/notices')) ||
    (label === '입찰' && pathname.startsWith('/mybids')) ||
    (label === '통계' && pathname.startsWith('/statistics')) ||
    (label === '채널' && pathname.startsWith('/channels')) ||
    (label === '설정' && pathname.startsWith('/settings'));

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
      <div className="w-full py-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between w-full px-4 py-2 transition-colors",
            isOpen ? "bg-color-primary-hovered" : "hover:bg-color-primary-hovered",
            isActive && "active"
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
          <div className="w-full py-2">
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
                  "flex items-center gap-2 px-6 py-2 transition-colors hover:bg-color-primary-hovered w-full text-left",
                  pathname === item.href && "bg-color-primary-hovered"
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
          isOpen ? "bg-color-primary-hovered" : "hover:bg-color-primary-hovered",
          isActive && "active"
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
          "absolute top-full mt-1 w-[400px] md:w-[500px] p-4 border shadow-lg z-[60]",
          "bg-color-primary-background text-color-primary-foreground",
          align === 'left' && "left-0",
          align === 'center' && "left-1/2 -translate-x-1/2",
          align === 'right' && "right-0"
        )}>
          <div className="grid gap-2">
            {items.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  setIsOpen(false);
                  navigate(item.href);
                }}
                className={cn(
                  "flex items-start gap-4 transition-colors hover:bg-color-primary-hovered p-2 rounded-md w-full text-left",
                  pathname === item.href && "bg-color-primary-hovered"
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

const GroupedDropdownMenu: React.FC<GroupedDropdownMenuProps> = ({ label, icon: Icon, groups, align = 'left', isMobile = false, setIsMobileMenuOpen }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { navigate } = useUnifiedNavigation();

  // Check if current path matches any of the dropdown items across all groups
  const isActive = groups.some(group =>
    group.items.some(item => {
      const itemPath = item.href.split('?')[0]; // Remove query parameters
      const decodedItemPath = decodeURIComponent(itemPath);
      const encodedItemPath = encodeURIComponent(itemPath);

      return pathname === item.href ||
        pathname === itemPath ||
        pathname === decodedItemPath ||
        pathname === encodedItemPath ||
        pathname.startsWith(itemPath + '/') ||
        pathname.startsWith(decodedItemPath + '/') ||
        pathname.startsWith(encodedItemPath + '/');
    })
  ) || (label === '공고' && pathname.startsWith('/notices'));

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
      <div className="w-full py-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between w-full px-4 py-2 transition-colors",
            isOpen ? "bg-color-primary-hovered" : "hover:bg-color-primary-hovered",
            isActive && "active"
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
          <div className="w-full py-2">
            {groups.map((group, groupIndex) => (
              <div key={group.label}>
                <div className="px-6 py-1 text-sm font-medium text-color-primary-muted">
                  {group.label}
                </div>
                {group.items.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => {
                      if (item.disabled) return;
                      setIsOpen(false);
                      if (setIsMobileMenuOpen && isMobile) {
                        setIsMobileMenuOpen(false);
                      }
                      navigate(item.href);
                    }}
                    disabled={item.disabled}
                    className={cn(
                      "flex items-center gap-2 px-8 py-2 transition-colors w-full text-left",
                      item.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-color-primary-hovered",
                      pathname === item.href && !item.disabled && "bg-color-primary-hovered"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </button>
                ))}
                {groupIndex < groups.length - 1 && (
                  <div className="mx-6 my-2 border-t border-color-primary-border" />
                )}
              </div>
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
          isOpen ? "bg-color-primary-hovered" : "hover:bg-color-primary-hovered",
          isActive && "active"
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
          "absolute top-full mt-1 w-[400px] md:w-[500px] p-4 border shadow-lg z-[60]",
          "bg-color-primary-background text-color-primary-foreground",
          align === 'left' && "left-0",
          align === 'center' && "left-1/2 -translate-x-1/2",
          align === 'right' && "right-0"
        )}>
          <div className="space-y-2">
            {groups.map((group, groupIndex) => (
              <div key={group.label}>
                <div className="mb-1 text-sm font-semibold text-color-primary-muted">
                  {group.label}
                </div>
                <div className="grid gap-1">
                  {group.items.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => {
                        if (item.disabled) return;
                        setIsOpen(false);
                        navigate(item.href);
                      }}
                      disabled={item.disabled}
                      className={cn(
                        "flex items-start gap-4 transition-colors p-2 rounded-md w-full text-left",
                        item.disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-color-primary-hovered",
                        pathname === item.href && !item.disabled && "bg-color-primary-hovered"
                      )}
                    >
                      <item.icon className="h-5 w-5 mt-0.5" />
                      <div>
                        <div className="font-medium">{item.title}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {groupIndex < groups.length - 1 && (
                  <div className="my-2 border-t border-color-primary-border" />
                )}
              </div>
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
                <div class="w-full h-full bg-primary text-color-primary-foreground flex items-center justify-center font-medium rounded-full">
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
      "rounded-full bg-primary text-color-primary-foreground flex items-center justify-center font-medium",
      sizeClasses
    )}>
      {initials}
    </div>
  );
};

// 테마 토글 버튼 컴포넌트
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "flex items-center justify-center p-2 rounded-full transition-colors",
        "hover:bg-color-primary-hovered"
      )}
      aria-label={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
};

// 사용자 드롭다운 메뉴 컴포넌트
const UserDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const { user, logout, token } = useAuth();
  const { navigate } = useUnifiedNavigation();
  const pathname = usePathname();

  // Check if current path is user-related
  const isActive = pathname === '/profile' || pathname === '/login';

  const [logoutMutation, { data: logoutData, error: logoutError }] = useMutation(LOGOUT_MUTATION, {
    client: getClient()
  });

  React.useEffect(() => {
    if (logoutData) {
      if (logoutData.logout.success) {
        logout();
        navigate('/login');
      }
    }
  }, [logoutData, logout, navigate]);

  React.useEffect(() => {
    if (logoutError) {
      console.error('Logout error:', logoutError);
      // 에러가 발생해도 클라이언트 측에서는 로그아웃 처리
      logout();
      navigate('/login');
    }
  }, [logoutError, logout, navigate]);

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
          isOpen ? "bg-color-primary-hovered" : "hover:bg-color-primary-hovered",
          isActive && "active"
        )}
      >
        <UserAvatar user={user} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 p-2 border shadow-lg rounded-md bg-color-primary-background text-color-primary-foreground z-[60]">
          {/* 사용자 정보 */}
          <div className="px-3 py-2 border-b mb-2">
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-sm text-color-primary-muted truncate">{user.email}</p>
                {user.department && (
                  <p className="text-xs text-color-primary-muted truncate">{user.department}</p>
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
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-color-primary-hovered rounded-md transition-colors"
            >
              <UserCircle className="h-4 w-4" />
              <span>사용자 정보</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-color-primary-hovered rounded-md transition-colors disabled:opacity-50"
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
  const pathname = usePathname();

  // 동적 기본값 로드
  const { data: noticeDefaults, loading: noticeDefaultsLoading } = useQuery(GET_NOTICE_DEFAULTS, {
    fetchPolicy: 'cache-first'
  });

  // 기본값이 로딩 중일 때는 기본값 사용
  const gap = noticeDefaults?.gap || '5';
  const categoryDefault = noticeDefaults?.categoryDefault || '공사점검,성능평가,정밀안전진단,정기안전점검,구조설계,구조감리,기타';

  // 동적으로 메뉴 생성
  const govNotices = createGovNotices(gap, categoryDefault);
  const naraNotices = createNaraNotices(gap, categoryDefault);

  return (
    <header className="sticky top-0 z-[60] w-full border-b bg-slate-200 dark:bg-slate-800 backdrop-blur supports-[backdrop-filter]:bg-slate-200/90 supports-[backdrop-filter]:dark:bg-slate-800/90">
      <div className="flex h-14 items-center" style={{ paddingLeft: 'var(--container-padding-x)', paddingRight: 'calc(var(--container-padding-x) - var(--scrollbar-width))' }}>
        <div className="mr-4 hidden md:flex">
          <Link href="/" className={cn("flex items-center space-x-2", pathname === '/' && "active")}>
            <span className="font-bold">IBW</span>
          </Link>
          <nav className="flex items-center gap-1 ml-12">
            {/* 공고 목록 - 모든 역할 접근 가능 */}
            <GroupedDropdownMenu
              label="공고"
              icon={Star}
              groups={[
                { label: '관공서', items: govNotices },
                { label: '나라장터', items: naraNotices }
              ]}
              align="left"
            />

            {/* 입찰 관리 - 로그인한 사용자만 */}
            <PermissionBoundary roles={['user', 'manager', 'admin']} showMessage={false}>
              <GroupedDropdownMenu
                label="입찰"
                icon={Cog}
                groups={[
                  { label: '관공서', items: govBids },
                  { label: '나라장터', items: naraBids }
                ]}
                align="center"
              />
            </PermissionBoundary>

            {/* 통계 - viewer 이상 */}
            <PermissionBoundary roles={['viewer', 'user', 'manager', 'admin']} showMessage={false}>
              <DropdownMenu label="통계" icon={BarChart2} items={statistics} align="center" />
            </PermissionBoundary>

            {/* 채널 - user 이상 */}
            <PermissionBoundary roles={['user', 'manager', 'admin']} showMessage={false}>
              <GroupedDropdownMenu
                label="채널"
                icon={MessageSquare}
                groups={[
                  { label: '게시판', items: boardChannels },
                  { label: '문서', items: docsChannels },
                  { label: '즐겨찾기', items: favoriteChannels }
                ]}
                align="center"
              />
            </PermissionBoundary>

            {/* 설정 - manager 이상 */}
            <PermissionBoundary roles={['manager', 'admin']} showMessage={false}>
              <DropdownMenu label="설정" icon={Settings} items={settings} align="right" />
            </PermissionBoundary>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between md:justify-end">
          <Link href="/" className={cn("flex items-center space-x-2 md:hidden", pathname === '/' && "active")}>
            <span className="font-bold">ILE</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* 로그인 상태에 따른 조건부 렌더링 */}
            {isAuthenticated ? (
              <div>
                <UserDropdown />
              </div>
            ) : (
              <Link
                href="/login"
                className={cn("flex items-center gap-2 text-sm font-medium text-color-primary-muted transition-colors hover:text-color-primary-foreground", pathname === '/login' && "active")}
              >
                <User className="h-4 w-4" />
                <span>로그인</span>
              </Link>
            )}
            {/* 테마 토글 버튼 */}
            <div>
              <ThemeToggle />
            </div>
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
        <div className="fixed inset-0 top-14 z-[70] md:hidden border-t bg-color-primary-background text-color-primary-foreground">
          <nav className="py-4" style={{ paddingLeft: 'var(--container-padding-x)', paddingRight: 'calc(var(--container-padding-x) - var(--scrollbar-width))' }}>
            {/* 모바일 사용자 정보 (로그인 상태일 때만) */}
            {isAuthenticated && (
              <div className="mb-4 p-4 rounded-lg bg-color-primary-background">
                <UserDropdown />
              </div>
            )}

            <div className="flex flex-col divide-y">
              {/* 공고 목록 - 모든 역할 접근 가능 */}
              <GroupedDropdownMenu
                label="공고 목록"
                icon={Star}
                groups={[
                  { label: '관공서', items: govNotices },
                  { label: '나라장터', items: naraNotices }
                ]}
                isMobile
                setIsMobileMenuOpen={setIsMobileMenuOpen}
              />

              {/* 입찰 관리 - 로그인한 사용자만 */}
              <PermissionBoundary roles={['user', 'manager', 'admin']} showMessage={false}>
                <GroupedDropdownMenu
                  label="입찰 관리"
                  icon={Cog}
                  groups={[
                    { label: '관공서', items: govBids },
                    { label: '나라장터', items: naraBids }
                  ]}
                  isMobile
                  setIsMobileMenuOpen={setIsMobileMenuOpen}
                />
              </PermissionBoundary>

              {/* 통계 - viewer 이상 */}
              <PermissionBoundary roles={['viewer', 'user', 'manager', 'admin']} showMessage={false}>
                <DropdownMenu label="통계" icon={BarChart2} items={statistics} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
              </PermissionBoundary>

              {/* 채널 - user 이상 */}
              <PermissionBoundary roles={['user', 'manager', 'admin']} showMessage={false}>
                <GroupedDropdownMenu
                  label="채널"
                  icon={MessageSquare}
                  groups={[
                    { label: '게시판', items: boardChannels },
                    { label: '문서', items: docsChannels },
                    { label: '즐겨찾기', items: favoriteChannels }
                  ]}
                  isMobile
                  setIsMobileMenuOpen={setIsMobileMenuOpen}
                />
              </PermissionBoundary>

              {/* 설정 - manager 이상 */}
              <PermissionBoundary roles={['manager', 'admin']} showMessage={false}>
                <DropdownMenu label="설정" icon={Settings} items={settings} isMobile setIsMobileMenuOpen={setIsMobileMenuOpen} />
              </PermissionBoundary>

              {/* 모바일 로그인 링크 (비로그인 상태일 때만) */}
              {!isAuthenticated && (
                <div className="py-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn("flex items-center gap-2 px-4 py-2 transition-colors hover:bg-color-primary-hovered w-full", pathname === '/login' && "active")}
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
