import * as fs from 'fs';
import * as path from 'path';
const DATABASE_PATH = '/exposed/projects/bid-notice-web/database/json';
const PERMISSIONS_FILE = path.join(DATABASE_PATH, 'permissions.json');
const USERS_FILE = path.join(DATABASE_PATH, 'users.json');
const SESSIONS_FILE = path.join(DATABASE_PATH, 'sessions.json');
// JSON 파일 읽기/쓰기 유틸리티
const readJsonFile = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
};
const writeJsonFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    catch (error) {
        console.error(`Error writing ${filePath}:`, error);
    }
};
// 사용자 권한 확인
const getUserByToken = (token) => {
    if (!token)
        return null;
    const sessions = readJsonFile(SESSIONS_FILE);
    const session = sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
    if (!session)
        return null;
    const users = readJsonFile(USERS_FILE);
    return users.find(u => u.id === session.userId && u.isActive) || null;
};
// 경로 매칭 함수
const matchPath = (pattern, path) => {
    // ** 와일드카드 처리
    if (pattern.includes('**')) {
        const basePattern = pattern.replace('/**', '');
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
const checkPageAccess = (userRole, requestPath) => {
    const permissions = readJsonFile(PERMISSIONS_FILE);
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
                return readJsonFile(PERMISSIONS_FILE);
            }
            catch (error) {
                console.error('Error fetching permissions:', error);
                return [];
            }
        },
        permissionByRole: async (_, { role }) => {
            try {
                const permissions = readJsonFile(PERMISSIONS_FILE);
                return permissions.find(p => p.role === role) || null;
            }
            catch (error) {
                console.error('Error fetching permission by role:', error);
                return null;
            }
        },
        checkPageAccess: async (_, { path, token }) => {
            try {
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
            }
            catch (error) {
                console.error('Error checking page access:', error);
                return {
                    hasAccess: false,
                    role: 'guest',
                    message: '페이지 접근 권한 확인 중 오류가 발생했습니다.',
                    redirectTo: '/login'
                };
            }
        },
        getUserPermissions: async (_, { token }) => {
            try {
                let userRole = 'guest';
                if (token) {
                    const user = getUserByToken(token);
                    if (user) {
                        userRole = user.role;
                    }
                }
                const permissions = readJsonFile(PERMISSIONS_FILE);
                return permissions.find(p => p.role === userRole) || null;
            }
            catch (error) {
                console.error('Error fetching user permissions:', error);
                return null;
            }
        }
    },
    Mutation: {
        updateRolePermissions: async (_, { role, input }) => {
            try {
                const permissions = readJsonFile(PERMISSIONS_FILE);
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
            }
            catch (error) {
                console.error('Error updating role permissions:', error);
                throw new Error('권한 업데이트 중 오류가 발생했습니다.');
            }
        }
    }
};
//# sourceMappingURL=permissions.js.map