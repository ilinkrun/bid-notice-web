'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Key } from 'lucide-react';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      user {
        id
        email
        name
        role
        department
        avatar
        isActive
        createdAt
        lastLoginAt
      }
      token
      message
      success
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        name
        role
        department
        avatar
        isActive
        createdAt
      }
      message
      success
    }
  }
`;

const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email) {
      token
      message
      success
    }
  }
`;

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    department: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { login: authLogin } = useAuth();

  const [login] = useMutation(LOGIN_MUTATION, { client: getClient() });
  const [register] = useMutation(REGISTER_MUTATION, { client: getClient() });
  const [requestPasswordReset] = useMutation(REQUEST_PASSWORD_RESET_MUTATION, { client: getClient() });

  // 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await login({
        variables: {
          email: formData.email,
          password: formData.password
        }
      });

      if (data.login.success) {
        // AuthContext를 통한 로그인 처리
        authLogin(data.login.user, data.login.token);
        
        if (rememberMe) {
          localStorage.setItem('remember-email', formData.email);
        } else {
          localStorage.removeItem('remember-email');
        }

        showAlert('success', data.login.message);
        
        // 홈페이지로 리다이렉트
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        showAlert('error', data.login.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      showAlert('error', '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      showAlert('error', '비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await register({
        variables: {
          input: {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            department: formData.department
          }
        }
      });

      if (data.register.success) {
        showAlert('success', data.register.message);
        // 회원가입 성공 시 로그인 모드로 전환
        setTimeout(() => {
          setMode('login');
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        }, 2000);
      } else {
        showAlert('error', data.register.message);
      }
    } catch (error) {
      console.error('Register error:', error);
      showAlert('error', '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await requestPasswordReset({
        variables: {
          email: formData.email
        }
      });

      if (data.requestPasswordReset.success) {
        showAlert('success', data.requestPasswordReset.message);
      } else {
        showAlert('error', data.requestPasswordReset.message);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      showAlert('error', '비밀번호 재설정 요청 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 기억하기 불러오기
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remember-email');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const renderTestCredentials = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">테스트 계정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="font-medium">관리자:</span>
            <span className="text-muted-foreground">admin@ilmaceng.com / admin123</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">일반사용자:</span>
            <span className="text-muted-foreground">user@ilmaceng.com / user123</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">매니저:</span>
            <span className="text-muted-foreground">manager@ilmaceng.com / manager123</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">조회자:</span>
            <span className="text-muted-foreground">viewer@ilmaceng.com / viewer123</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* 로고 및 제목 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">ILMAC BID</h1>
          <h2 className="mt-6 text-2xl font-semibold text-gray-900">
            {mode === 'login' ? '로그인' : mode === 'register' ? '회원가입' : '비밀번호 찾기'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'login' 
              ? '계정에 로그인하세요' 
              : mode === 'register' 
              ? '새 계정을 만드세요'
              : '비밀번호를 재설정합니다'
            }
          </p>
        </div>

        {/* 테스트 계정 정보 (로그인 모드일 때만) */}
        {mode === 'login' && renderTestCredentials()}

        {/* 알림 */}
        {alert && (
          <Alert className={alert.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        {/* 로그인 폼 */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgotPassword}>
              <div className="space-y-4">
                {/* 이메일 */}
                <div>
                  <Label htmlFor="email">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      className="pl-10 text-black"
                      placeholder="이메일을 입력하세요"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>

                {/* 이름 (회원가입 시에만) */}
                {mode === 'register' && (
                  <div>
                    <Label htmlFor="name">이름</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        required
                        className="pl-10 text-black"
                        placeholder="이름을 입력하세요"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* 부서 (회원가입 시에만) */}
                {mode === 'register' && (
                  <div>
                    <Label htmlFor="department">부서</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="department"
                        type="text"
                        className="pl-10 text-black"
                        placeholder="부서를 입력하세요 (선택사항)"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* 비밀번호 (비밀번호 찾기 제외) */}
                {mode !== 'forgot' && (
                  <div>
                    <Label htmlFor="password">비밀번호</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="pl-10 pr-10 text-black"
                        placeholder="비밀번호를 입력하세요"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 비밀번호 확인 (회원가입 시에만) */}
                {mode === 'register' && (
                  <div>
                    <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="pl-10 pr-10 text-black"
                        placeholder="비밀번호를 다시 입력하세요"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 자동 로그인 (로그인 시에만) */}
                {mode === 'login' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="rememberMe" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label 
                      htmlFor="rememberMe" 
                      className="text-sm font-normal cursor-pointer"
                    >
                      이메일 기억하기
                    </Label>
                  </div>
                )}

                {/* 제출 버튼 */}
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>처리중...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {mode === 'login' ? (
                        <Lock className="h-4 w-4" />
                      ) : mode === 'register' ? (
                        <UserPlus className="h-4 w-4" />
                      ) : (
                        <Key className="h-4 w-4" />
                      )}
                      <span>
                        {mode === 'login' ? '로그인' : mode === 'register' ? '회원가입' : '재설정 요청'}
                      </span>
                    </div>
                  )}
                </Button>
              </div>
            </form>

            {/* 모드 전환 링크 */}
            <div className="mt-6 text-center space-y-2">
              {mode === 'login' ? (
                <>
                  <div>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-500"
                      onClick={() => setMode('register')}
                    >
                      계정이 없으신가요? 회원가입
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-500"
                      onClick={() => setMode('forgot')}
                    >
                      비밀번호를 잊으셨나요?
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-500"
                    onClick={() => setMode('login')}
                  >
                    이미 계정이 있으신가요? 로그인
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}