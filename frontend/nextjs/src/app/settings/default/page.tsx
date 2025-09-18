'use client';

import { useState, useEffect } from 'react';
import { HardDrive, Palette, Settings, Clock, Database, FolderOpen, Monitor, Cog } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { IsActive, RadioButtonSet, OutlineSelectBox, OutlineSelectItem, DropdownSectionHeader, TabHeader, TabContainer } from '@/components/shared/FormComponents';
import { SectionTitleHelp } from '@/components/shared/Help';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 섹션 접힘/펼침 상태
  const [isNasExpanded, setIsNasExpanded] = useState(true);
  const [isUiExpanded, setIsUiExpanded] = useState(true);
  const [isScrapExpanded, setIsScrapExpanded] = useState(true);

  // 업무 가이드 표시 상태
  const [isNasGuideOpen, setIsNasGuideOpen] = useState(false);
  const [isUiGuideOpen, setIsUiGuideOpen] = useState(false);
  const [isScrapGuideOpen, setIsScrapGuideOpen] = useState(false);

  // 탭 상태
  const [nasActiveTab, setNasActiveTab] = useState('folder');
  const [uiActiveTab, setUiActiveTab] = useState('theme');
  const [scrapActiveTab, setScrapActiveTab] = useState('cron');

  // GraphQL 쿼리 실행 함수
  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql', {
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
        helpTooltip="앱 기본값 설정 도움말"
        helpContent="시스템의 기본 설정을 관리할 수 있습니다. NAS 설정, UI 설정, 스크랩 설정을 통해 애플리케이션의 동작을 사용자 환경에 맞게 조정할 수 있습니다."
      />

      {/* NAS 설정 섹션 */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <DropdownSectionHeader
            title="NAS 설정"
            icon={<HardDrive className="w-5 h-5" />}
            isExpanded={isNasExpanded}
            onToggle={() => setIsNasExpanded(!isNasExpanded)}
            accentColor="#6366f1"
          />
          <SectionTitleHelp
            isOpen={isNasGuideOpen}
            onToggle={() => setIsNasGuideOpen(!isNasGuideOpen)}
          />
        </div>

        {/* NAS 설정 업무 가이드 */}
        {isNasGuideOpen && (
          <div className="mt-2 bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="max-w-full">
              <h4 className="font-semibold text-blue-800 mb-2">NAS 설정 업무 가이드</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <p>• NAS 폴더: 파일 저장을 위한 네트워크 드라이브 경로를 설정합니다.</p>
                <p>• NAS 정보: 연결된 NAS 장비의 상태와 정보를 확인할 수 있습니다.</p>
                <p>• 경로 설정 시 올바른 네트워크 경로와 접근 권한을 확인하세요.</p>
              </div>
            </div>
          </div>
        )}

        {isNasExpanded && (
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
        )}
      </div>

      {/* UI 설정 섹션 */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <DropdownSectionHeader
            title="UI 설정"
            icon={<Settings className="w-5 h-5" />}
            isExpanded={isUiExpanded}
            onToggle={() => setIsUiExpanded(!isUiExpanded)}
            accentColor="#10b981"
          />
          <SectionTitleHelp
            isOpen={isUiGuideOpen}
            onToggle={() => setIsUiGuideOpen(!isUiGuideOpen)}
          />
        </div>

        {/* UI 설정 업무 가이드 */}
        {isUiGuideOpen && (
          <div className="mt-2 bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="max-w-full">
              <h4 className="font-semibold text-green-800 mb-2">UI 설정 업무 가이드</h4>
              <div className="text-sm text-green-700 space-y-2">
                <p>• 테마 모드: 라이트 모드와 다크 모드 중 선택할 수 있습니다.</p>
                <p>• 테마 색상: 각 화면별로 적용할 색상 테마를 설정할 수 있습니다.</p>
                <p>• 설정한 테마는 즉시 적용되며, 브라우저에 저장됩니다.</p>
              </div>
            </div>
          </div>
        )}

        {isUiExpanded && (
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
        )}
      </div>

      {/* 스크랩 설정 섹션 */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <DropdownSectionHeader
            title="스크랩 설정"
            icon={<Clock className="w-5 h-5" />}
            isExpanded={isScrapExpanded}
            onToggle={() => setIsScrapExpanded(!isScrapExpanded)}
            accentColor="#f59e0b"
          />
          <SectionTitleHelp
            isOpen={isScrapGuideOpen}
            onToggle={() => setIsScrapGuideOpen(!isScrapGuideOpen)}
          />
        </div>

        {/* 스크랩 설정 업무 가이드 */}
        {isScrapGuideOpen && (
          <div className="mt-2 bg-orange-50 border border-orange-200 p-4 rounded-lg">
            <div className="max-w-full">
              <h4 className="font-semibold text-orange-800 mb-2">스크랩 설정 업무 가이드</h4>
              <div className="text-sm text-orange-700 space-y-2">
                <p>• cron 설정: 자동 스크랩 실행을 위한 cron 표현식을 설정합니다.</p>
                <p>• 스크랩 주기: 스크랩 실행 시간과 주기를 관리할 수 있습니다.</p>
                <p>• 시간 형식은 HH:MM으로 입력하며, 여러 시간대는 쉼표로 구분합니다.</p>
              </div>
            </div>
          </div>
        )}

        {isScrapExpanded && (
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
        )}
      </div>
    </PageContainer>
  );
} 