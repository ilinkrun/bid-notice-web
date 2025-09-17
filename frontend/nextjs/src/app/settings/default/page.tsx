'use client';

import { useState, useEffect } from 'react';
import { HardDrive, Palette, Settings, Clock, Database } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { IsActive, RadioButtonSet, OutlineSelectBox, OutlineSelectItem } from '@/components/shared/FormComponents';
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
      />
      
      {/* NAS 설정 섹션 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <HardDrive className="w-5 h-5 mr-2 text-color-primary-foreground" />
          <h2 className="text-xl font-semibold text-color-primary-foreground">NAS 설정</h2>
        </div>
        
        {/* NAS 폴더 설정 */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Database className="w-4 h-4 mr-2 text-color-primary-foreground" />
            <h3 className="text-lg font-medium text-color-primary-foreground">NAS 폴더</h3>
          </div>
          
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
        </div>

        {/* NAS 정보 */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <HardDrive className="w-4 h-4 mr-2 text-color-primary-foreground" />
            <h3 className="text-lg font-medium text-color-primary-foreground">NAS 정보</h3>
          </div>
          
          {nasInfo && (
            <div className="rounded-lg p-4">
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
            </div>
          )}
        </div>
      </div>

      <hr className="my-8 border-color-primary-foreground" />

      {/* UI 설정 섹션 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 mr-2 text-color-primary-foreground" />
          <h2 className="text-xl font-semibold text-color-primary-foreground">UI 설정</h2>
        </div>
        
        <div className="rounded-lg border border-color-primary-foreground p-6">
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
        </div>
      </div>

      {/* 테마 색상 설정 섹션 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Palette className="w-5 h-5 mr-2 text-color-primary-foreground" />
          <h2 className="text-xl font-semibold text-color-primary-foreground">테마 색상 설정</h2>
        </div>
        
        <div className="rounded-lg border border-color-primary-foreground p-6">
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
        </div>
      </div>

      <hr className="my-8 border-color-primary-foreground" />

      {/* 스크랩 설정 섹션 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 mr-2 text-color-primary-foreground" />
          <h2 className="text-xl font-semibold text-color-primary-foreground">스크랩 설정</h2>
        </div>
        
        <div className="rounded-lg border border-color-primary-foreground p-6">
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

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={scrapingSettings.isActive}
                onChange={(e) => setScrapingSettings({...scrapingSettings, isActive: e.target.checked})}
                className="w-4 h-4 text-blue-600 border-color-primary-foreground rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-color-primary-foreground">자동 스크래핑 활성화</label>
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
        </div>
      </div>
    </PageContainer>
  );
} 