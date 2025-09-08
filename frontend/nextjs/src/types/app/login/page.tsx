'use client';

import { LogIn } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';

export default function LoginPage() {
  const { navigate } = useUnifiedNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: 실제 로그인 API 호출 구현
      console.log('로그인 시도:', { email, password });
      
      // 임시로 2초 후 홈으로 리다이렉트
      await new Promise(resolve => setTimeout(resolve, 2000));
      navigate('/');
    } catch (error) {
      console.error('로그인 실패:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8  theme-default">
      <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 mb-6">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-indigo-700">
              현재 로그인 페이지는 개발 중입니다. 다음과 같은 기능이 제공될 예정입니다:
            </p>
            <ul className="mt-3 list-disc list-inside text-sm text-indigo-700">
              <li>이메일/비밀번호 로그인</li>
              <li>소셜 로그인 (Google, Kakao, Naver)</li>
              <li>비밀번호 찾기/회원가입/자동 로그인인</li>
              <li>사용자 권한별 페이지 접근/기능 제한</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md p-6 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">로그인</h2>
          <p className="mt-2 text-sm text-gray-600">
            서비스를 이용하기 위해 로그인해주세요.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* 이메일 입력 */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              이메일
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="example@example.com"
              />
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              비밀번호
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* 로그인 버튼 */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <LogIn className="h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </div>

          {/* 소셜 로그인 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  소셜 계정으로 로그인
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {/* 구글 로그인 */}
              <button
                type="button"
                disabled
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 opacity-50 cursor-not-allowed"
              >
                <span className="sr-only">구글 로그인</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
              </button>

              {/* 카카오 로그인 */}
              <button
                type="button"
                disabled
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 opacity-50 cursor-not-allowed"
              >
                <span className="sr-only">카카오 로그인</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12,3c-5.523,0-10,3.582-10,8c0,2.947,1.932,5.526,4.84,6.91L5.84,21.772C5.667,22.127,6.016,22.5,6.391,22.5c0.129,0,0.258-0.043,0.363-0.13l4.72-3.191c0.174,0.011,0.349,0.021,0.526,0.021c5.523,0,10-3.582,10-8S17.523,3,12,3z" />
                </svg>
              </button>

              {/* 네이버 로그인 */}
              <button
                type="button"
                disabled
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 opacity-50 cursor-not-allowed"
              >
                <span className="sr-only">네이버 로그인</span>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M16.273,12.845L7.376,0H0v24h7.726V11.155L16.624,24H24V0h-7.727V12.845z" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
