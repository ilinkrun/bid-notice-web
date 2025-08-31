import { Metadata } from 'next';
import { Archive } from 'lucide-react';

export const metadata: Metadata = {
  title: '앱 기본값 설정 | ILMAC BID',
  description: '앱 기본 설정 관리',
};

export default function DefaultSettingsPage() {
  return (
      <div className="container mx-auto theme-default">
      <h1 className="text-xl font-bold pt-1 pl-1">앱 기본값 설정</h1>
        <div className="bg-teal-50 border-l-4 border-teal-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-teal-700">
                현재 앱 기본값 설정 페이지는 개발 중입니다. 곧 다음과 같은 기능이 제공될 예정입니다:
              </p>
              <ul className="mt-3 list-disc list-inside text-sm text-teal-700">
                <li>언어 설정</li>
                <li>시간대 설정</li>
                <li>알림 기본 설정</li>
                <li>데이터 표시 형식 설정</li>
                <li>테마 설정</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  );
} 