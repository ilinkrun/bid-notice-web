'use client';

import { ScrappingSettingsLayout } from '@/components/settings/ScrappingSettingsLayout';
import { SectionWithGuide } from '@/components/shared/SectionWithGuide';
import { List, FileText } from 'lucide-react';

export default function ScrappingSettingsPage() {
  return (
    <ScrappingSettingsLayout
      orgName="Test Org"
      isActive={true}
      region="서울"
    >
      <div className="space-y-6">
        {/* 목록 스크래핑 설정 섹션 */}
        <SectionWithGuide
          title="목록 스크래핑 설정"
          icon={<List className="w-5 h-5" />}
          accentColor="#6366f1"
          category="운영가이드"
          pageTitle="스크래핑 설정"
          className="mb-6"
        >
          <div className="p-4 border rounded">목록 설정 내용</div>
        </SectionWithGuide>

        {/* 상세 스크랩 설정 섹션 */}
        <SectionWithGuide
          title="상세 스크랩 설정"
          icon={<FileText className="w-5 h-5" />}
          accentColor="#6366f1"
          category="운영가이드"
          pageTitle="스크래핑 설정"
          className="mb-6"
        >
          <div className="p-4 border rounded">상세 설정 내용</div>
        </SectionWithGuide>
      </div>
    </ScrappingSettingsLayout>
  );
}