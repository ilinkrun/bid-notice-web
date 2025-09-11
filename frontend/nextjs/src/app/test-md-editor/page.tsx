'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// MDEditor 동적 임포트 - 오류 처리 개선
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').catch(() => {
    // import 실패시 fallback component 반환
    return Promise.resolve(() => (
      <div className="flex items-center justify-center h-96 border rounded bg-red-50">
        <div className="text-center">
          <p className="text-red-600 mb-2">❌ 마크다운 에디터를 불러올 수 없습니다</p>
          <p className="text-sm text-gray-600">페이지를 새로고침하거나 관리자에게 문의해주세요.</p>
        </div>
      </div>
    ));
  }),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 border rounded">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">마크다운 에디터를 불러오는 중...</p>
        </div>
      </div>
    )
  }
);

export default function TestMDEditorPage() {
  const [value, setValue] = useState<string>('# Hello World\n\nThis is a test.');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">마크다운 에디터 테스트</h1>
      <div className="border rounded p-4">
        <MDEditor
          value={value}
          onChange={(val) => setValue(val || '')}
          data-color-mode="light"
          height={400}
        />
      </div>
    </div>
  );
}