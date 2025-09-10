import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATABASE_PATH = '/exposed/projects/bid-notice-web/database/json';
const USERS_FILE = path.join(DATABASE_PATH, 'users.json');
const SESSIONS_FILE = path.join(DATABASE_PATH, 'sessions.json');
const AVATAR_DIR = '/exposed/projects/bid-notice-web/frontend/nextjs/public/images/avatars';

interface User {
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

interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  department?: string;
}

interface UpdateUserInput {
  name?: string;
  department?: string;
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

// 토큰 생성
const generateToken = (): string => {
  return uuidv4().replace(/-/g, '');
};

// 세션 만료 시간 (24시간)
const getExpiryTime = (): string => {
  const now = new Date();
  now.setHours(now.getHours() + 24);
  return now.toISOString();
};

// 사용자를 안전하게 반환 (비밀번호 제외)
const sanitizeUser = (user: User) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

// 사용자 이름의 이니셜 추출
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// 색상 생성 (이름 기반)
const getAvatarColor = (name: string): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#10AC84', '#FF6348', '#2E86DE', '#A55EEA', '#26DE81'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// SVG 아바타 생성
const generateAvatarSVG = (name: string): string => {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  
  return `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="${bgColor}" rx="50" ry="50"/>
    <text x="50" y="50" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
          text-anchor="middle" dominant-baseline="central" fill="white">${initials}</text>
  </svg>`;
};

// 아바타 파일 저장
const saveAvatarFile = (userId: string, svgContent: string): string => {
  try {
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(AVATAR_DIR)) {
      fs.mkdirSync(AVATAR_DIR, { recursive: true });
    }
    
    const fileName = `avatar_${userId}.svg`;
    const filePath = path.join(AVATAR_DIR, fileName);
    
    fs.writeFileSync(filePath, svgContent);
    
    return `/images/avatars/${fileName}`;
  } catch (error) {
    console.error('Error saving avatar file:', error);
    return '';
  }
};

// 사용자 아바타 생성 및 저장
const generateAndSaveAvatar = (user: User): string => {
  if (user.avatar) {
    return user.avatar; // 이미 아바타가 있으면 반환
  }
  
  const svgContent = generateAvatarSVG(user.name);
  const avatarUrl = saveAvatarFile(user.id, svgContent);
  
  if (avatarUrl) {
    // 사용자 정보 업데이트
    const users = readJsonFile<User>(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].avatar = avatarUrl;
      writeJsonFile(USERS_FILE, users);
    }
  }
  
  return avatarUrl;
};

export const authResolvers = {
  Query: {
    currentUser: async (_: unknown, { token }: { token: string }) => {
      try {
        const sessions = readJsonFile<Session>(SESSIONS_FILE);
        const session = sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
        
        if (!session) {
          return null;
        }

        const users = readJsonFile<User>(USERS_FILE);
        const user = users.find(u => u.id === session.userId && u.isActive);
        
        if (user) {
          // 아바타가 없으면 생성
          if (!user.avatar) {
            generateAndSaveAvatar(user);
            // 업데이트된 사용자 정보 다시 읽기
            const updatedUsers = readJsonFile<User>(USERS_FILE);
            const updatedUser = updatedUsers.find(u => u.id === session.userId);
            return updatedUser ? sanitizeUser(updatedUser) : null;
          }
          return sanitizeUser(user);
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
      }
    },

    validateToken: async (_: unknown, { token }: { token: string }) => {
      try {
        const sessions = readJsonFile<Session>(SESSIONS_FILE);
        const session = sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
        
        if (!session) {
          return {
            user: null,
            token: null,
            message: '유효하지 않은 토큰입니다.',
            success: false
          };
        }

        const users = readJsonFile<User>(USERS_FILE);
        const user = users.find(u => u.id === session.userId && u.isActive);
        
        if (!user) {
          return {
            user: null,
            token: null,
            message: '사용자를 찾을 수 없습니다.',
            success: false
          };
        }

        // 아바타가 없으면 생성
        if (!user.avatar) {
          generateAndSaveAvatar(user);
          // 업데이트된 사용자 정보 다시 읽기
          const updatedUsers = readJsonFile<User>(USERS_FILE);
          const updatedUser = updatedUsers.find(u => u.id === session.userId);
          if (updatedUser) {
            return {
              user: sanitizeUser(updatedUser),
              token,
              message: '유효한 토큰입니다.',
              success: true
            };
          }
        }

        return {
          user: sanitizeUser(user),
          token,
          message: '유효한 토큰입니다.',
          success: true
        };
      } catch (error) {
        console.error('Error validating token:', error);
        return {
          user: null,
          token: null,
          message: '토큰 검증 중 오류가 발생했습니다.',
          success: false
        };
      }
    }
  },

  Mutation: {
    login: async (_: unknown, { email, password }: { email: string; password: string }) => {
      try {
        const users = readJsonFile<User>(USERS_FILE);
        const user = users.find(u => u.email === email && u.password === password && u.isActive);
        
        if (!user) {
          return {
            user: null,
            token: null,
            message: '이메일 또는 비밀번호가 잘못되었습니다.',
            success: false
          };
        }

        // 세션 생성
        const token = generateToken();
        const sessions = readJsonFile<Session>(SESSIONS_FILE);
        const newSession: Session = {
          id: uuidv4(),
          userId: user.id,
          token,
          expiresAt: getExpiryTime(),
          createdAt: new Date().toISOString()
        };

        sessions.push(newSession);
        writeJsonFile(SESSIONS_FILE, sessions);

        // 마지막 로그인 시간 업데이트 및 아바타 생성
        const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
        
        // 아바타가 없으면 생성
        if (!updatedUser.avatar) {
          const avatarUrl = generateAndSaveAvatar(updatedUser);
          updatedUser.avatar = avatarUrl;
        }
        
        const updatedUsers = users.map(u => 
          u.id === user.id ? updatedUser : u
        );
        writeJsonFile(USERS_FILE, updatedUsers);

        return {
          user: sanitizeUser(updatedUser),
          token,
          message: '로그인에 성공했습니다.',
          success: true
        };
      } catch (error) {
        console.error('Error during login:', error);
        return {
          user: null,
          token: null,
          message: '로그인 중 오류가 발생했습니다.',
          success: false
        };
      }
    },

    logout: async (_: unknown, { token }: { token: string }) => {
      try {
        const sessions = readJsonFile<Session>(SESSIONS_FILE);
        const updatedSessions = sessions.filter(s => s.token !== token);
        writeJsonFile(SESSIONS_FILE, updatedSessions);

        return {
          user: null,
          token: null,
          message: '로그아웃되었습니다.',
          success: true
        };
      } catch (error) {
        console.error('Error during logout:', error);
        return {
          user: null,
          token: null,
          message: '로그아웃 중 오류가 발생했습니다.',
          success: false
        };
      }
    },

    register: async (_: unknown, { input }: { input: RegisterInput }) => {
      try {
        const users = readJsonFile<User>(USERS_FILE);
        
        // 이메일 중복 체크
        const existingUser = users.find(u => u.email === input.email);
        if (existingUser) {
          return {
            user: null,
            token: null,
            message: '이미 등록된 이메일입니다.',
            success: false
          };
        }

        // 새 사용자 생성
        const newUser: User = {
          id: uuidv4(),
          email: input.email,
          password: input.password,
          name: input.name,
          role: 'user',
          department: input.department || '',
          isActive: true,
          createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeJsonFile(USERS_FILE, users);

        return {
          user: sanitizeUser(newUser),
          token: null,
          message: '회원가입이 완료되었습니다. 로그인해주세요.',
          success: true
        };
      } catch (error) {
        console.error('Error during registration:', error);
        return {
          user: null,
          token: null,
          message: '회원가입 중 오류가 발생했습니다.',
          success: false
        };
      }
    },

    requestPasswordReset: async (_: unknown, { email }: { email: string }) => {
      try {
        const users = readJsonFile<User>(USERS_FILE);
        const user = users.find(u => u.email === email && u.isActive);
        
        if (!user) {
          return {
            user: null,
            token: null,
            message: '등록되지 않은 이메일입니다.',
            success: false
          };
        }

        // 실제로는 이메일을 보내야 하지만, 개발용으로는 토큰만 반환
        const resetToken = generateToken();
        
        return {
          user: null,
          token: resetToken,
          message: `비밀번호 재설정 토큰이 생성되었습니다: ${resetToken}`,
          success: true
        };
      } catch (error) {
        console.error('Error during password reset request:', error);
        return {
          user: null,
          token: null,
          message: '비밀번호 재설정 요청 중 오류가 발생했습니다.',
          success: false
        };
      }
    },

    resetPassword: async (_: unknown, { token, newPassword }: { token: string; newPassword: string }) => {
      try {
        // 개발용으로는 간단하게 구현
        // 실제로는 토큰을 별도 저장소에서 관리해야 함
        return {
          user: null,
          token: null,
          message: '비밀번호가 재설정되었습니다. (개발용 구현)',
          success: true
        };
      } catch (error) {
        console.error('Error during password reset:', error);
        return {
          user: null,
          token: null,
          message: '비밀번호 재설정 중 오류가 발생했습니다.',
          success: false
        };
      }
    },

    updateUserProfile: async (_: unknown, { token, input }: { token: string; input: UpdateUserInput }) => {
      try {
        const sessions = readJsonFile<Session>(SESSIONS_FILE);
        const session = sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
        
        if (!session) {
          return {
            user: null,
            token: null,
            message: '유효하지 않은 토큰입니다.',
            success: false
          };
        }

        const users = readJsonFile<User>(USERS_FILE);
        const userIndex = users.findIndex(u => u.id === session.userId && u.isActive);
        
        if (userIndex === -1) {
          return {
            user: null,
            token: null,
            message: '사용자를 찾을 수 없습니다.',
            success: false
          };
        }

        // 사용자 정보 업데이트
        if (input.name !== undefined) {
          users[userIndex].name = input.name;
        }
        if (input.department !== undefined) {
          users[userIndex].department = input.department;
        }

        writeJsonFile(USERS_FILE, users);

        return {
          user: sanitizeUser(users[userIndex]),
          token,
          message: '사용자 정보가 성공적으로 업데이트되었습니다.',
          success: true
        };
      } catch (error) {
        console.error('Error updating user profile:', error);
        return {
          user: null,
          token: null,
          message: '사용자 정보 업데이트 중 오류가 발생했습니다.',
          success: false
        };
      }
    },

    updateUserPassword: async (_: unknown, { token, currentPassword, newPassword }: { token: string; currentPassword: string; newPassword: string }) => {
      try {
        const sessions = readJsonFile<Session>(SESSIONS_FILE);
        const session = sessions.find(s => s.token === token && new Date(s.expiresAt) > new Date());
        
        if (!session) {
          return {
            user: null,
            token: null,
            message: '유효하지 않은 토큰입니다.',
            success: false
          };
        }

        const users = readJsonFile<User>(USERS_FILE);
        const userIndex = users.findIndex(u => u.id === session.userId && u.isActive);
        
        if (userIndex === -1) {
          return {
            user: null,
            token: null,
            message: '사용자를 찾을 수 없습니다.',
            success: false
          };
        }

        // 현재 비밀번호 확인
        if (users[userIndex].password !== currentPassword) {
          return {
            user: null,
            token: null,
            message: '현재 비밀번호가 일치하지 않습니다.',
            success: false
          };
        }

        // 비밀번호 업데이트
        users[userIndex].password = newPassword;
        writeJsonFile(USERS_FILE, users);

        return {
          user: sanitizeUser(users[userIndex]),
          token,
          message: '비밀번호가 성공적으로 변경되었습니다.',
          success: true
        };
      } catch (error) {
        console.error('Error updating user password:', error);
        return {
          user: null,
          token: null,
          message: '비밀번호 업데이트 중 오류가 발생했습니다.',
          success: false
        };
      }
    }
  }
};