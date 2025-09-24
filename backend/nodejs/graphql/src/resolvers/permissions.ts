import * as fs from 'fs';
import * as path from 'path';

const DATABASE_PATH = '/exposed/projects/bid-notice-web/database/json';
const PERMISSIONS_FILE = path.join(DATABASE_PATH, 'permissions.json');
const USERS_FILE = path.join(DATABASE_PATH, 'users.json');
const SESSIONS_FILE = path.join(DATABASE_PATH, 'sessions.json');

export interface Permission {
  id: string;
  role: string;
  name: string;
  description: string;
  allowedPages: string[];
  deniedPages: string[];
  permissions: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
    canAdmin: string[];
  };
}

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  department?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export interface PermissionInput {
  allowedPages: string[];
  deniedPages: string[];
  permissions: {
    canView: string[];
    canEdit: string[];
    canDelete: string[];
    canAdmin: string[];
  };
}

// JSON 파일 읽기/쓰기 유틸리티
const readJsonFile = <T>(filePath: string): T[] => {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T[];
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
};

const writeJsonFile = <T>(filePath: string, data: T[]): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
};

// 사용자 권한 확인
const getUserByToken = (token: string): User | null => {
  if (!token) return null;
  
  const sessions = readJsonFile<Session>(SESSIONS_FILE);
  const session = sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
  
  if (!session) return null;

  const users = readJsonFile<User>(USERS_FILE);
  return users.find(u => u.id === session.userId && u.isActive) || null;
};

// 경로 매칭 함수
const matchPath = (pattern: string, path: string): boolean => {
  // /** 패턴은 모든 경로에 매칭
  if (pattern === '/**') {
    return true;
  }
  
  // ** 와일드카드 처리
  if (pattern.includes('**')) {
    const basePattern = pattern.replace('/**', '');
    // 빈 base 패턴이면 모든 경로 매칭
    if (basePattern === '') {
      return true;
    }
    return path === basePattern || path.startsWith(basePattern + '/');
  }
  
  // * 와일드카드 처리
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(path);
  }
  
  // 정확한 매칭
  return pattern === path;
};

// 페이지 접근 권한 확인
const checkPageAccess = (userRole: string, requestPath: string): { hasAccess: boolean; message: string; redirectTo?: string } => {
  const permissions = readJsonFile<Permission>(PERMISSIONS_FILE);
  const rolePermission = permissions.find(p => p.role === userRole);
  
  if (!rolePermission) {
    return {
      hasAccess: false,
      message: '유효하지 않은 사용자 역할입니다.',
      redirectTo: '/login'
    };
  }

  // 명시적으로 거부된 페이지 확인
  const isDenied = rolePermission.deniedPages.some(pattern => matchPath(pattern, requestPath));
  if (isDenied) {
    return {
      hasAccess: false,
      message: '이 페이지에 접근할 권한이 없습니다.',
      redirectTo: userRole === 'guest' ? '/login' : '/'
    };
  }

  // 허용된 페이지 확인
  const isAllowed = rolePermission.allowedPages.some(pattern => matchPath(pattern, requestPath));
  if (isAllowed) {
    return {
      hasAccess: true,
      message: '접근이 허용되었습니다.'
    };
  }

  // 명시적으로 허용되지 않은 페이지
  return {
    hasAccess: false,
    message: '이 페이지에 접근할 권한이 없습니다.',
    redirectTo: userRole === 'guest' ? '/login' : '/'
  };
};

export const permissionsResolvers = {
  Query: {
    permissions: async () => {
      try {
        return readJsonFile<Permission>(PERMISSIONS_FILE);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }
    },

    permissionByRole: async (_: unknown, { role }: { role: string }) => {
      try {
        const permissions = readJsonFile<Permission>(PERMISSIONS_FILE);
        return permissions.find(p => p.role === role) || null;
      } catch (error) {
        console.error('Error fetching permission by role:', error);
        return null;
      }
    },

    checkPageAccess: async (_: unknown, { path, token }: { path: string; token?: string }) => {
      try {
        // 정적 파일과 업로드 파일은 항상 접근 허용
        const staticPaths = ['/uploads/', '/images/', '/_next/', '/api/', '/favicon'];
        const isStaticPath = staticPaths.some(staticPath => path.startsWith(staticPath)) ||
                            path.includes('.png') || path.includes('.jpg') || path.includes('.jpeg') ||
                            path.includes('.gif') || path.includes('.svg') || path.includes('.ico') ||
                            path.includes('.pdf') || path.includes('.xlsx') || path.includes('.docx');
        
        if (isStaticPath) {
          return {
            hasAccess: true,
            role: 'guest',
            message: '정적 파일 접근이 허용되었습니다.',
            redirectTo: null
          };
        }
        
        let userRole = 'guest';
        
        if (token) {
          const user = getUserByToken(token);
          if (user) {
            userRole = user.role;
          }
        }

        const result = checkPageAccess(userRole, path);
        
        return {
          hasAccess: result.hasAccess,
          role: userRole,
          message: result.message,
          redirectTo: result.redirectTo || null
        };
      } catch (error) {
        console.error('Error checking page access:', error);
        return {
          hasAccess: false,
          role: 'guest',
          message: '페이지 접근 권한 확인 중 오류가 발생했습니다.',
          redirectTo: '/login'
        };
      }
    },

    getUserPermissions: async (_: unknown, { token }: { token?: string }) => {
      try {
        let userRole = 'guest';
        
        if (token) {
          const user = getUserByToken(token);
          if (user) {
            userRole = user.role;
          }
        }

        const permissions = readJsonFile<Permission>(PERMISSIONS_FILE);
        return permissions.find(p => p.role === userRole) || null;
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        return null;
      }
    }
  },

  Mutation: {
    updateRolePermissions: async (_: unknown, { role, input }: { role: string; input: PermissionInput }) => {
      try {
        const permissions = readJsonFile<Permission>(PERMISSIONS_FILE);
        const permissionIndex = permissions.findIndex(p => p.role === role);
        
        if (permissionIndex === -1) {
          throw new Error('해당 역할의 권한을 찾을 수 없습니다.');
        }

        // 권한 업데이트
        permissions[permissionIndex] = {
          ...permissions[permissionIndex],
          allowedPages: input.allowedPages,
          deniedPages: input.deniedPages,
          permissions: input.permissions
        };

        writeJsonFile(PERMISSIONS_FILE, permissions);
        return permissions[permissionIndex];
      } catch (error) {
        console.error('Error updating role permissions:', error);
        throw new Error('권한 업데이트 중 오류가 발생했습니다.');
      }
    }
  }
};