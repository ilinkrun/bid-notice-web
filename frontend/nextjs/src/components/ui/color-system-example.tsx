'use client';

import React from 'react';

/**
 * 새로운 색상 시스템 사용 예시 컴포넌트
 * 이 컴포넌트는 새로 정의한 색상 변수들의 사용법을 보여줍니다.
 */
export function ColorSystemExample() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold text-color-primary-foreground">
        색상 시스템 예시
      </h2>

      {/* Primary Colors */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-color-primary-foreground">
          Primary Colors (Slate)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          <div className="p-4 border rounded">
            <div className="text-color-primary-foreground font-medium">Foreground</div>
            <div className="text-sm text-color-primary-muted">기본 글자색</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-color-primary-foreground font-medium">Hovered</div>
            <div className="text-sm text-color-primary-muted">hover 상태</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-color-primary-muted font-medium">Muted</div>
            <div className="text-sm text-color-primary-muted">비활성화 상태</div>
          </div>
          <div className="p-4 border rounded">
            <a href="#" className="text-color-primary-linked font-medium hover:underline">
              Linked
            </a>
            <div className="text-sm text-color-primary-muted">링크 색상</div>
          </div>
          <div className="p-4 border rounded">
            <div className="text-color-secondary-active font-medium">Secondary Active</div>
            <div className="text-sm text-color-primary-muted">활성화 상태 (Orange)</div>
          </div>
        </div>
      </div>

      {/* Table Example */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-color-primary-foreground">
          테이블 예시
        </h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-3 text-left text-color-primary-foreground font-medium">제목</th>
                <th className="p-3 text-left text-color-primary-foreground font-medium">상태</th>
                <th className="p-3 text-left text-color-primary-foreground font-medium">링크</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:transition-colors">
                <td className="p-3 text-color-primary-foreground">샘플 항목 1</td>
                <td className="p-3">
                  <span className="text-color-secondary-active font-medium">활성</span>
                </td>
                <td className="p-3">
                  <a href="#" className="text-color-primary-linked hover:underline">
                    자세히 보기
                  </a>
                </td>
              </tr>
              <tr className="hover:transition-colors">
                <td className="p-3 text-color-primary-foreground">샘플 항목 2</td>
                <td className="p-3">
                  <span className="text-color-primary-muted">비활성</span>
                </td>
                <td className="p-3">
                  <a href="#" className="text-color-primary-linked hover:underline">
                    자세히 보기
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-color-primary-foreground">
          사용법
        </h3>
        <div className="p-4 rounded border">
          <div className="space-y-2 text-sm">
            <div className="text-color-primary-foreground">
              <strong>Primary Colors (Slate):</strong>
            </div>
            <ul className="space-y-1 text-color-primary-foreground ml-4">
              <li>• <code className="px-1 rounded">text-color-primary-foreground</code> - 기본 글자색</li>
              <li>• <code className="px-1 rounded"></code> - 기본 배경색 (제거됨)</li>
              <li>• <code className="px-1 rounded">bg-color-primary-hovered</code> - hover 상태 배경색 (hover 컨텍스트에서만 유지)</li>
              <li>• <code className="px-1 rounded">text-color-primary-muted</code> - 비활성화 글자색</li>
              <li>• <code className="px-1 rounded">text-color-primary-linked</code> - 링크 글자색</li>
            </ul>
            <div className="text-color-primary-foreground mt-3">
              <strong>Secondary & Tertiary:</strong>
            </div>
            <ul className="space-y-1 text-color-primary-foreground ml-4">
              <li>• <code className="px-1 rounded">text-color-secondary-active</code> - 활성화 상태 (Orange)</li>
              <li>• <code className="px-1 rounded">text-color-tertiary-base</code> - Tertiary 색상 (Green)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ColorSystemExample;