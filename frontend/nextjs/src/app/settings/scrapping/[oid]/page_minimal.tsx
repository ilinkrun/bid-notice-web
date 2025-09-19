'use client';

import { ScrappingSettingsLayout } from '@/components/settings/ScrappingSettingsLayout';
import { SectionTitleHelp } from '@/components/shared/Help';
import { List, FileText } from 'lucide-react';

export default function ScrappingSettingsPage() {
  return (
    <ScrappingSettingsLayout
      orgName="Test Org"
      isActive={true}
      region="서울"
    >
      <div className="space-y-6">
        {/* 목록 스크랩 설정 섹션 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <List className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">목록 스크랩 설정</h3>
            <SectionTitleHelp
              title="목록 스크랩 설정 도움말"
              content={
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">목록 스크랩 설정 가이드</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>기관명:</strong> 스크랩 대상 기관의 이름</li>
                      <li>• <strong>URL:</strong> 입찰공고 목록 페이지 URL</li>
                    </ul>
                  </div>
                </div>
              }
            />
          </div>
          <div className="p-4 border rounded">목록 설정 내용</div>
        </div>

        {/* 상세 스크랩 설정 섹션 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">상세 스크랩 설정</h3>
            <SectionTitleHelp
              title="상세 스크랩 설정 도움말"
              content={
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">상세 스크랩 설정 가이드</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>제목:</strong> 공고 제목을 추출할 XPath</li>
                      <li>• <strong>본문:</strong> 공고 본문을 추출할 XPath</li>
                    </ul>
                  </div>
                </div>
              }
            />
          </div>
          <div className="p-4 border rounded">상세 설정 내용</div>
        </div>
      </div>
    </ScrappingSettingsLayout>
  );
}