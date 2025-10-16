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
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Building,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  ArrowLeft,
  Camera
} from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { ButtonWithIcon, ButtonWithColorIcon } from '@/components/shared/FormComponents';

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateUserProfile($token: String!, $input: UpdateUserInput!) {
    updateUserProfile(token: $token, input: $input) {
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
      success
      message
    }
  }
`;

const UPDATE_PASSWORD_MUTATION = gql`
  mutation UpdateUserPassword($token: String!, $currentPassword: String!, $newPassword: String!) {
    updateUserPassword(token: $token, currentPassword: $currentPassword, newPassword: $newPassword) {
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
      success
      message
    }
  }
`;

// 간단한 UserAvatar 컴포넌트
interface UserAvatarProps {
  user: {
    name: string;
    avatar?: string;
  };
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md' }) => {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-16 w-16 text-lg',
    lg: 'h-24 w-24 text-2xl'
  };

  // 아바타 이미지가 있으면 이미지 사용, 없으면 이니셜 사용
  if (user.avatar) {
    return (
      <div className={`rounded-full overflow-hidden ${sizeClasses[size]}`}>
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
                <div class="w-full h-full bg-primary text-primary-foreground flex items-center justify-center font-medium rounded-full ${sizeClasses[size]}">
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
    <div className={`rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium ${sizeClasses[size]}`}>
      {initials}
    </div>
  );
};

export default function ProfilePage() {
  const { user, token, login: authLogin, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 프로필 편집 상태
  const [profileData, setProfileData] = useState({
    name: '',
    department: ''
  });

  // 비밀번호 편집 상태
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [updateProfile] = useMutation(UPDATE_PROFILE_MUTATION, { client: getClient() });
  const [updatePassword] = useMutation(UPDATE_PASSWORD_MUTATION, { client: getClient() });

  // 로그인 확인
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // 사용자 정보로 초기화
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        department: user.department || ''
      });
    }
  }, [user]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
  };

  const handleProfileCancel = () => {
    if (user) {
      setProfileData({
        name: user.name || '',
        department: user.department || ''
      });
    }
    setIsEditingProfile(false);
  };

  const handleProfileSave = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const { data } = await updateProfile({
        variables: {
          token,
          input: {
            name: profileData.name,
            department: profileData.department
          }
        }
      });

      if (data.updateUserProfile.success) {
        // AuthContext 업데이트
        authLogin(data.updateUserProfile.user, token);
        showAlert('success', data.updateUserProfile.message);
        setIsEditingProfile(false);
      } else {
        showAlert('error', data.updateUserProfile.message);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showAlert('error', '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordEdit = () => {
    setIsEditingPassword(true);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditingPassword(false);
  };

  const handlePasswordSave = async () => {
    if (!token) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert('error', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showAlert('error', '새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await updatePassword({
        variables: {
          token,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }
      });

      if (data.updateUserPassword.success) {
        showAlert('success', data.updateUserPassword.message);
        setIsEditingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showAlert('error', data.updateUserPassword.message);
      }
    } catch (error) {
      console.error('Password update error:', error);
      showAlert('error', '비밀번호 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '없음';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'manager': return '매니저';
      case 'viewer': return '조회자';
      default: return '사용자';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'manager': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'viewer': return 'text-color-primary-foreground';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <ButtonWithIcon
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => router.back()}
            >
              뒤로가기
            </ButtonWithIcon>
            <h1 className="text-2xl font-bold text-color-primary-foreground">사용자 정보</h1>
          </div>
        </div>

        {/* 알림 */}
        {alert && (
          <Alert className={`mb-6 ${alert.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <AlertDescription className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* 아바타 정보 카드 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-color-primary-foreground">
                <Camera className="h-5 w-5" />
                프로필 아바타
              </CardTitle>
              <CardDescription className="text-color-primary-foreground">
                자동으로 생성된 아바타가 표시됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <UserAvatar user={user} size="lg" />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-color-primary-foreground">{user.name}</h3>
                  <p className="text-sm text-color-primary-muted">
                    {user.avatar ? '저장된 아바타' : '자동 생성된 아바타'}
                  </p>
                  {user.avatar && (
                    <p className="text-xs text-color-primary-muted mt-1">
                      {user.avatar}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 기본 정보 카드 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-color-primary-foreground">
                    <User className="h-5 w-5" />
                    기본 정보
                  </CardTitle>
                  <CardDescription className="text-color-primary-foreground">
                    계정의 기본 정보를 확인하고 수정할 수 있습니다.
                  </CardDescription>
                </div>
                {!isEditingProfile && (
                  <ButtonWithIcon
                    icon={<Edit className="h-4 w-4" />}
                    onClick={handleProfileEdit}
                  >
                    수정
                  </ButtonWithIcon>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 이메일 (읽기 전용) */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-color-primary-foreground">
                    <Mail className="h-4 w-4" />
                    이메일
                  </Label>
                  <Input value={user.email} disabled className="bg-color-primary-hovered text-color-primary-foreground border-color-primary-foreground" />
                </div>

                {/* 이름 */}
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2 mb-2 text-color-primary-foreground">
                    <User className="h-4 w-4" />
                    이름
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="이름을 입력하세요"
                      className="text-color-primary-foreground border-color-primary-foreground"
                    />
                  ) : (
                    <Input value={user.name} disabled className="bg-color-primary-hovered text-color-primary-foreground border-color-primary-foreground" />
                  )}
                </div>

                {/* 부서 */}
                <div>
                  <Label htmlFor="department" className="flex items-center gap-2 mb-2 text-color-primary-foreground">
                    <Building className="h-4 w-4" />
                    부서
                  </Label>
                  {isEditingProfile ? (
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="부서를 입력하세요"
                      className="text-color-primary-foreground border-color-primary-foreground"
                    />
                  ) : (
                    <Input value={user.department || '없음'} disabled className="bg-color-primary-hovered text-color-primary-foreground border-color-primary-foreground" />
                  )}
                </div>

                {/* 역할 (읽기 전용) */}
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-color-primary-foreground">
                    <Shield className="h-4 w-4" />
                    역할
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                      {getRoleName(user.role)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 편집 모드 버튼들 */}
              {isEditingProfile && (
                <div className="flex items-center justify-end gap-2 pt-4">
                  <ButtonWithColorIcon
                    icon={<X className="h-4 w-4" />}
                    onClick={handleProfileCancel}
                    disabled={isLoading}
                    color="tertiary"
                    mode="outline"
                  >
                    취소
                  </ButtonWithColorIcon>
                  <ButtonWithColorIcon
                    icon={<Save className="h-4 w-4" />}
                    onClick={handleProfileSave}
                    disabled={isLoading}
                    color="secondary"
                    mode="outline"
                  >
                    {isLoading ? '저장 중...' : '저장'}
                  </ButtonWithColorIcon>
                </div>
              )}

              <Separator />

              {/* 계정 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="flex items-center gap-2 mb-2 text-color-primary-foreground">
                    <Calendar className="h-4 w-4" />
                    가입일
                  </Label>
                  <Input value={formatDate(user.createdAt)} disabled className="bg-color-primary-hovered text-color-primary-foreground border-color-primary-foreground" />
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2 text-color-primary-foreground">
                    <Calendar className="h-4 w-4" />
                    마지막 로그인
                  </Label>
                  <Input value={formatDate(user.lastLoginAt)} disabled className="bg-color-primary-hovered text-color-primary-foreground border-color-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 비밀번호 변경 카드 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-color-primary-foreground">
                    <Shield className="h-5 w-5" />
                    비밀번호 변경
                  </CardTitle>
                  <CardDescription className="text-color-primary-foreground">
                    보안을 위해 정기적으로 비밀번호를 변경하세요.
                  </CardDescription>
                </div>
                {!isEditingPassword && (
                  <ButtonWithIcon
                    icon={<Edit className="h-4 w-4" />}
                    onClick={handlePasswordEdit}
                  >
                    수정
                  </ButtonWithIcon>
                )}
              </div>
            </CardHeader>
            {isEditingPassword && (
              <CardContent className="space-y-4">
                {/* 현재 비밀번호 */}
                <div>
                  <Label htmlFor="currentPassword" className="text-color-primary-foreground">현재 비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="현재 비밀번호를 입력하세요"
                      className="pr-10 text-color-primary-foreground border-color-primary-foreground"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4 text-color-primary-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-color-primary-muted" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 새 비밀번호 */}
                <div>
                  <Label htmlFor="newPassword" className="text-color-primary-foreground">새 비밀번호</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                      className="pr-10 text-color-primary-foreground border-color-primary-foreground"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4 text-color-primary-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-color-primary-muted" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 새 비밀번호 확인 */}
                <div>
                  <Label htmlFor="confirmPassword" className="text-color-primary-foreground">새 비밀번호 확인</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="새 비밀번호를 다시 입력하세요"
                      className="pr-10 text-color-primary-foreground border-color-primary-foreground"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4 text-color-primary-muted" />
                      ) : (
                        <Eye className="h-4 w-4 text-color-primary-muted" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 버튼들 */}
                <div className="flex items-center justify-end gap-2 pt-4">
                  <ButtonWithColorIcon
                    icon={<X className="h-4 w-4" />}
                    onClick={handlePasswordCancel}
                    disabled={isLoading}
                    color="tertiary"
                    mode="outline"
                  >
                    취소
                  </ButtonWithColorIcon>
                  <ButtonWithColorIcon
                    icon={<Save className="h-4 w-4" />}
                    onClick={handlePasswordSave}
                    disabled={isLoading}
                    color="secondary"
                    mode="outline"
                  >
                    {isLoading ? '변경 중...' : '비밀번호 변경'}
                  </ButtonWithColorIcon>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}