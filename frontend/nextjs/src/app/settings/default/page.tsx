'use client';

import { useState, useEffect } from 'react';
import { HardDrive, Palette, Settings, Clock, Database, FolderOpen, Monitor, Cog, Map, Languages, FileText, Table2 } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { IsActive, RadioButtonSet, OutlineSelectBox, OutlineSelectItem, TabHeader, TabContainer } from '@/components/shared/FormComponents';
import { SectionWithGuide } from '@/components/shared/SectionWithGuide';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SETTINGS_DEFAULT_QUERY = `
  query GetSettingsDefault {
    settingsNasPathAll {
      id
      pathName
      pathValue
      description
      isActive
    }
    settingsAppDefaultAll {
      id
      settingKey
      settingValue
      description
      category
    }
    mappingsLangAll {
      id
      area
      scope
      ko
      en
      remark
      isActive
      createdAt
      updatedAt
    }
    docsManualAll(limit: 100) {
      manuals {
        id
        title
        content
        category
        writer
        created_at
        updated_at
        is_visible
        is_notice
      }
      total_count
    }
  }
`;

interface NasSetting {
  id: string;
  pathName: string;
  pathValue: string;
  description?: string;
  isActive: boolean;
}

interface NasInfo {
  type: string;
  model: string;
  version: string;
  status: string;
}

interface LangMapping {
  id: number;
  area: string;
  scope: string;
  ko: string;
  en: string;
  remark?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DocsManual {
  id: number;
  title: string;
  content: string;
  category: string;
  writer: string;
  created_at: string;
  updated_at: string;
  is_visible: boolean;
  is_notice: boolean;
}

export default function DefaultSettingsPage() {
  const [nasSettings, setNasSettings] = useState<NasSetting[]>([]);
  const [nasInfo, setNasInfo] = useState<NasInfo | null>(null);
  const [uiSettings, setUiSettings] = useState({
    darkMode: false,
    language: 'ko',
    timezone: 'Asia/Seoul'
  });
  const [themeSettings, setThemeSettings] = useState({
    defaultTheme: 'gray',
    noticeTheme: 'green',
    bidTheme: 'blue'
  });
  const [scrapingSettings, setScrapingSettings] = useState({
    schedule: ['10:00', '22:00'],
    isActive: true,
    lastRun: null,
    nextRun: null
  });
  const [langMappings, setLangMappings] = useState<LangMapping[]>([]);
  const [docsManuals, setDocsManuals] = useState<DocsManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 섹션 접힘/펼침 상태 (SectionWithGuide에서 내부적으로 관리)
  const [isNasExpanded, setIsNasExpanded] = useState(true);
  const [isMappingExpanded, setIsMappingExpanded] = useState(true);
  const [isUiExpanded, setIsUiExpanded] = useState(true);
  const [isScrapExpanded, setIsScrapExpanded] = useState(true);

  // 탭 상태
  const [nasActiveTab, setNasActiveTab] = useState('folder');
  const [mappingActiveTab, setMappingActiveTab] = useState('lang');
  const [uiActiveTab, setUiActiveTab] = useState('theme');
  const [scrapActiveTab, setScrapActiveTab] = useState('cron');

  // GraphQL 쿼리 실행 함수
  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL ||
                                   process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL ||
                                   `http://localhost:${process.env.NEXT_PUBLIC_API_GRAPHQL_PORT || '21023'}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: SETTINGS_DEFAULT_QUERY,
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        setError('데이터를 불러오는데 실패했습니다.');
        return;
      }

      const data = result.data;
      if (data) {
        setNasSettings(data.settingsNasPathAll || []);
        setLangMappings(data.mappingsLangAll || []);
        setDocsManuals(data.docsManualAll?.manuals || []);

        // 앱 기본값에서 UI 설정 추출 (예시)
        const appDefaults = data.settingsAppDefaultAll || [];
        const uiDefaults = appDefaults.filter(item => item.category === 'ui');
        const themeDefaults = appDefaults.filter(item => item.category === 'theme');
        const scrapingDefaults = appDefaults.filter(item => item.category === 'scraping');

        // 기본값 설정 (실제 값이 없으면 초기값 사용)
        setUiSettings({
          darkMode: uiDefaults.find(item => item.settingKey === 'darkMode')?.settingValue === 'true' || false,
          language: uiDefaults.find(item => item.settingKey === 'language')?.settingValue || 'ko',
          timezone: uiDefaults.find(item => item.settingKey === 'timezone')?.settingValue || 'Asia/Seoul'
        });

        setThemeSettings({
          defaultTheme: themeDefaults.find(item => item.settingKey === 'defaultTheme')?.settingValue || 'gray',
          noticeTheme: themeDefaults.find(item => item.settingKey === 'noticeTheme')?.settingValue || 'green',
          bidTheme: themeDefaults.find(item => item.settingKey === 'bidTheme')?.settingValue || 'blue'
        });
      }
    } catch (err) {
      console.error('Error fetching settings data:', err);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title="앱 기본값 설정"
          breadcrumbs={[
            { label: '설정', href: '/settings' },
            { label: '앱 기본값 설정', href: '/settings/default' }
          ]}
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-color-primary-muted-foreground">설정 데이터를 불러오는 중...</span>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title="앱 기본값 설정"
          breadcrumbs={[
            { label: '설정', href: '/settings' },
            { label: '앱 기본값 설정', href: '/settings/default' }
          ]}
        />
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchSettingsData}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="앱 기본값 설정"
        breadcrumbs={[
          { label: '설정', href: '/settings' },
          { label: '앱 기본값 설정', href: '/settings/default' }
        ]}
        scopeHierarchy="application.settings.default"
        helpTooltip="앱 기본값 설정 도움말"
        helpContent="시스템의 기본 설정을 관리할 수 있습니다. NAS 설정, UI 설정, 스크랩 설정을 통해 애플리케이션의 동작을 사용자 환경에 맞게 조정할 수 있습니다."
      />

      {/* NAS 설정 섹션 */}
      <SectionWithGuide
        title="NAS 설정"
        icon={<HardDrive className="w-5 h-5" />}
        accentColor="#6366f1"
        category="운영가이드"
        pageTitle="앱 기본값 설정"
        scope="section"
        scopeHierarchy="application.settings.default.nas"
        isExpanded={isNasExpanded}
        onToggle={setIsNasExpanded}
        className="mb-6"
      >
          <div className="mt-2 space-y-0">
            {/* 탭 버튼 */}
            <TabHeader
              tabs={[
                {
                  id: 'folder',
                  label: 'NAS 폴더',
                  icon: <FolderOpen className="w-4 h-4" />
                },
                {
                  id: 'info',
                  label: 'NAS 정보',
                  icon: <Database className="w-4 h-4" />
                }
              ]}
              activeTab={nasActiveTab}
              onTabChange={setNasActiveTab}
            />

            {/* NAS 폴더 탭 */}
            {nasActiveTab === 'folder' && (
              <div>
                <TabContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">순번</TableHead>
                        <TableHead className="w-[120px]">경로명</TableHead>
                        <TableHead className="w-[200px]">경로값</TableHead>
                        <TableHead className="w-[100px]">활성화</TableHead>
                        <TableHead className="w-auto">설명</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nasSettings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-[100px] text-center text-color-primary-muted-foreground">
                            데이터가 없습니다.
                          </TableCell>
                        </TableRow>
                      ) : (
                        nasSettings.map((setting, index) => (
                          <TableRow key={setting.id}>
                            <TableCell className="w-[80px]">{index + 1}</TableCell>
                            <TableCell className="w-[120px]">{setting.pathName}</TableCell>
                            <TableCell className="w-[200px]">{setting.pathValue}</TableCell>
                            <TableCell className="w-[100px]">
                              <IsActive value={setting.isActive} />
                            </TableCell>
                            <TableCell className="w-auto">{setting.description || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabContainer>
              </div>
            )}

            {/* NAS 정보 탭 */}
            {nasActiveTab === 'info' && (
              <div>
                <TabContainer>
                  {nasInfo ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm font-medium text-color-primary-foreground">타입:</span>
                        <p className="text-sm text-color-primary-foreground">{nasInfo.type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-color-primary-foreground">모델:</span>
                        <p className="text-sm text-color-primary-foreground">{nasInfo.model}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-color-primary-foreground">버전:</span>
                        <p className="text-sm text-color-primary-foreground">{nasInfo.version}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-color-primary-foreground">상태:</span>
                        <p className="text-sm text-color-primary-foreground">{nasInfo.status}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-color-primary-muted-foreground">
                      NAS 정보를 불러올 수 없습니다.
                    </div>
                  )}
                </TabContainer>
              </div>
            )}
          </div>
      </SectionWithGuide>

      {/* 매핑 설정 섹션 */}
      <SectionWithGuide
        title="매핑 설정"
        icon={<Map className="w-5 h-5" />}
        accentColor="#8b5cf6"
        category="운영가이드"
        pageTitle="앱 기본값 설정"
        scope="section"
        scopeHierarchy="application.settings.default.mapping"
        isExpanded={isMappingExpanded}
        onToggle={setIsMappingExpanded}
        className="mb-6"
      >
          <div className="mt-2 space-y-0">
            {/* 탭 버튼 */}
            <TabHeader
              tabs={[
                {
                  id: 'lang',
                  label: '한영 용어 매핑',
                  icon: <Languages className="w-4 h-4" />
                },
                {
                  id: 'docs',
                  label: '문서 매핑',
                  icon: <FileText className="w-4 h-4" />
                },
                {
                  id: 'mysql',
                  label: 'MySQL 필드 매핑',
                  icon: <Table2 className="w-4 h-4" />
                }
              ]}
              activeTab={mappingActiveTab}
              onTabChange={setMappingActiveTab}
            />

            {/* 한영 용어 매핑 탭 */}
            {mappingActiveTab === 'lang' && (
              <div>
                <TabContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead className="w-[100px]">영역</TableHead>
                        <TableHead className="w-[100px]">범위</TableHead>
                        <TableHead className="w-[150px]">한국어</TableHead>
                        <TableHead className="w-[150px]">영어</TableHead>
                        <TableHead className="w-[80px]">활성화</TableHead>
                        <TableHead className="w-auto">비고</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {langMappings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-[100px] text-center text-color-primary-muted-foreground">
                            한영 용어 매핑 데이터가 없습니다.
                          </TableCell>
                        </TableRow>
                      ) : (
                        langMappings.map((mapping) => (
                          <TableRow key={mapping.id}>
                            <TableCell className="w-[80px]">{mapping.id}</TableCell>
                            <TableCell className="w-[100px]">{mapping.area}</TableCell>
                            <TableCell className="w-[100px]">{mapping.scope}</TableCell>
                            <TableCell className="w-[150px]">{mapping.ko}</TableCell>
                            <TableCell className="w-[150px]">{mapping.en}</TableCell>
                            <TableCell className="w-[80px]">
                              <IsActive value={mapping.isActive} />
                            </TableCell>
                            <TableCell className="w-auto">{mapping.remark || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabContainer>
              </div>
            )}

            {/* 문서 매핑 탭 */}
            {mappingActiveTab === 'docs' && (
              <div>
                <TabContainer>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">ID</TableHead>
                        <TableHead className="w-[200px]">제목</TableHead>
                        <TableHead className="w-[120px]">카테고리</TableHead>
                        <TableHead className="w-[100px]">작성자</TableHead>
                        <TableHead className="w-[80px]">공개</TableHead>
                        <TableHead className="w-[80px]">공지</TableHead>
                        <TableHead className="w-auto">생성일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docsManuals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-[100px] text-center text-color-primary-muted-foreground">
                            문서 매핑 데이터가 없습니다.
                          </TableCell>
                        </TableRow>
                      ) : (
                        docsManuals.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell className="w-[80px]">{doc.id}</TableCell>
                            <TableCell className="w-[200px]" title={doc.title}>
                              {doc.title.length > 30 ? `${doc.title.substring(0, 30)}...` : doc.title}
                            </TableCell>
                            <TableCell className="w-[120px]">{doc.category}</TableCell>
                            <TableCell className="w-[100px]">{doc.writer}</TableCell>
                            <TableCell className="w-[80px]">
                              <IsActive value={doc.is_visible} />
                            </TableCell>
                            <TableCell className="w-[80px]">
                              <IsActive value={doc.is_notice} />
                            </TableCell>
                            <TableCell className="w-auto">
                              {new Date(doc.created_at).toLocaleDateString('ko-KR')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabContainer>
              </div>
            )}

            {/* MySQL 필드 매핑 탭 */}
            {mappingActiveTab === 'mysql' && (
              <div>
                <TabContainer>
                  <div className="text-center py-8 text-color-primary-muted-foreground">
                    <Table2 className="w-12 h-12 mx-auto mb-4 text-color-primary-muted-foreground" />
                    <p className="text-lg font-medium mb-2">MySQL 필드 매핑</p>
                    <p className="text-sm">
                      mappings_lang 테이블을 기반으로 MySQL 필드 매핑 기능을 구현할 예정입니다.
                    </p>
                    <p className="text-sm mt-2">
                      현재 데이터베이스 필드: {langMappings.length}개의 매핑 항목
                    </p>
                  </div>
                </TabContainer>
              </div>
            )}
          </div>
      </SectionWithGuide>

      {/* UI 설정 섹션 */}
      <SectionWithGuide
        title="UI 설정"
        icon={<Settings className="w-5 h-5" />}
        accentColor="#10b981"
        category="운영가이드"
        pageTitle="앱 기본값 설정"
        scope="section"
        scopeHierarchy="application.settings.default.ui"
        isExpanded={isUiExpanded}
        onToggle={setIsUiExpanded}
        className="mb-6"
      >
          <div className="mt-2 space-y-0">
            {/* 탭 버튼 */}
            <TabHeader
              tabs={[
                {
                  id: 'theme',
                  label: '테마 모드',
                  icon: <Monitor className="w-4 h-4" />
                },
                {
                  id: 'color',
                  label: '테마 색상',
                  icon: <Palette className="w-4 h-4" />
                }
              ]}
              activeTab={uiActiveTab}
              onTabChange={setUiActiveTab}
            />

            {/* 테마 모드 탭 */}
            {uiActiveTab === 'theme' && (
              <div>
                <TabContainer>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-color-primary-foreground mb-2">테마 모드</label>
                      <RadioButtonSet
                        options={[
                          { value: 'light', label: '라이트모드' },
                          { value: 'dark', label: '다크모드' }
                        ]}
                        value={uiSettings.darkMode ? 'dark' : 'light'}
                        onChange={(value) => setUiSettings({...uiSettings, darkMode: value === 'dark'})}
                      />
                    </div>
                  </div>
                </TabContainer>
              </div>
            )}

            {/* 테마 색상 탭 */}
            {uiActiveTab === 'color' && (
              <div>
                <TabContainer>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-color-primary-foreground mb-2">기본 테마</label>
                        <OutlineSelectBox
                          value={themeSettings.defaultTheme}
                          onValueChange={(value) => setThemeSettings({...themeSettings, defaultTheme: value})}
                          placeholder="테마 선택"
                        >
                          <OutlineSelectItem value="gray">Gray</OutlineSelectItem>
                          <OutlineSelectItem value="blue">Blue</OutlineSelectItem>
                          <OutlineSelectItem value="green">Green</OutlineSelectItem>
                          <OutlineSelectItem value="red">Red</OutlineSelectItem>
                        </OutlineSelectBox>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-color-primary-foreground mb-2">공고 목록</label>
                        <OutlineSelectBox
                          value={themeSettings.noticeTheme}
                          onValueChange={(value) => setThemeSettings({...themeSettings, noticeTheme: value})}
                          placeholder="테마 선택"
                        >
                          <OutlineSelectItem value="green">Green</OutlineSelectItem>
                          <OutlineSelectItem value="blue">Blue</OutlineSelectItem>
                          <OutlineSelectItem value="gray">Gray</OutlineSelectItem>
                          <OutlineSelectItem value="red">Red</OutlineSelectItem>
                        </OutlineSelectBox>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-color-primary-foreground mb-2">입찰 목록</label>
                        <OutlineSelectBox
                          value={themeSettings.bidTheme}
                          onValueChange={(value) => setThemeSettings({...themeSettings, bidTheme: value})}
                          placeholder="테마 선택"
                        >
                          <OutlineSelectItem value="blue">Blue</OutlineSelectItem>
                          <OutlineSelectItem value="green">Green</OutlineSelectItem>
                          <OutlineSelectItem value="gray">Gray</OutlineSelectItem>
                          <OutlineSelectItem value="red">Red</OutlineSelectItem>
                        </OutlineSelectBox>
                      </div>
                    </div>
                  </div>
                </TabContainer>
              </div>
            )}
          </div>
      </SectionWithGuide>

      {/* 스크랩 설정 섹션 */}
      <SectionWithGuide
        title="스크랩 설정"
        icon={<Clock className="w-5 h-5" />}
        accentColor="#f59e0b"
        category="운영가이드"
        pageTitle="앱 기본값 설정"
        scope="section"
        scopeHierarchy="application.settings.default.scraping"
        isExpanded={isScrapExpanded}
        onToggle={setIsScrapExpanded}
        className="mb-6"
      >
          <div className="mt-2 space-y-0">
            {/* 탭 버튼 */}
            <TabHeader
              tabs={[
                {
                  id: 'cron',
                  label: 'cron 설정',
                  icon: <Cog className="w-4 h-4" />
                },
                {
                  id: 'schedule',
                  label: '스크랩 주기',
                  icon: <Clock className="w-4 h-4" />
                }
              ]}
              activeTab={scrapActiveTab}
              onTabChange={setScrapActiveTab}
            />

            {/* cron 설정 탭 */}
            {scrapActiveTab === 'cron' && (
              <div>
                <TabContainer>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={scrapingSettings.isActive}
                        onChange={(e) => setScrapingSettings({...scrapingSettings, isActive: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-color-primary-foreground rounded focus:ring-blue-500"
                      />
                      <label className="text-sm font-medium text-color-primary-foreground">자동 스크래핑 활성화</label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-color-primary-foreground mb-2">cron 표현식</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="예: 0 10,22 * * *"
                          className="flex-1 px-3 py-2 border border-color-primary-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-color-primary-foreground"
                          defaultValue="0 10,22 * * *"
                        />
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          저장
                        </button>
                      </div>
                      <p className="text-xs text-color-primary-muted-foreground mt-1">
                        분 시 일 월 요일 형식으로 입력하세요. 예: 0 10,22 * * * (매일 10시, 22시)
                      </p>
                    </div>
                  </div>
                </TabContainer>
              </div>
            )}

            {/* 스크랩 주기 탭 */}
            {scrapActiveTab === 'schedule' && (
              <div>
                <TabContainer>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-color-primary-foreground mb-2">스크랩 주기</label>
                      <p className="text-sm text-color-primary-foreground mb-2">매일 {scrapingSettings.schedule.join(', ')}시</p>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="예: 10:00,22:00"
                          className="flex-1 px-3 py-2 border border-color-primary-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-color-primary-foreground"
                          defaultValue={scrapingSettings.schedule.join(',')}
                        />
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          저장
                        </button>
                      </div>
                    </div>

                    {scrapingSettings.lastRun && (
                      <div className="text-sm text-color-primary-foreground">
                        마지막 실행: {scrapingSettings.lastRun}
                      </div>
                    )}

                    {scrapingSettings.nextRun && (
                      <div className="text-sm text-color-primary-foreground">
                        다음 실행 예정: {scrapingSettings.nextRun}
                      </div>
                    )}
                  </div>
                </TabContainer>
              </div>
            )}
          </div>
      </SectionWithGuide>
    </PageContainer>
  );
} 