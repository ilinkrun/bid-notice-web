'use client';

import { useState, useEffect } from 'react';
import { HardDrive, Palette, Settings, Clock, Database } from 'lucide-react';

const SETTINGS_DEFAULT_QUERY = `
  query GetSettingsDefault {
    settingsDefault {
      nasPathSettings {
        id
        name
        area
        depth
        folder
        remark
      }
      nasInfo {
        type
        model
        version
        status
      }
      uiSettings {
        darkMode
        language
        timezone
      }
      themeSettings {
        defaultTheme
        noticeTheme
        bidTheme
      }
      scrapingSettings {
        schedule
        isActive
        lastRun
        nextRun
      }
    }
  }
`;

interface NasSetting {
  id: string;
  name: string;
  area: string;
  depth: string;
  folder: string;
  remark?: string;
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
      const response = await fetch('${process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql'}', {
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

      const data = result.data?.settingsDefault;
      if (data) {
        setNasSettings(data.nasPathSettings || []);
        setNasInfo(data.nasInfo);
        setUiSettings(data.uiSettings);
        setThemeSettings(data.themeSettings);
        setScrapingSettings(data.scrapingSettings);
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
      <div className="theme-default">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold pt-1 pl-1 mb-4">앱 기본값 설정</h1>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600">설정 데이터를 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="theme-default">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold pt-1 pl-1 mb-4">앱 기본값 설정</h1>
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
        </div>
      </div>
    );
  }

  return (
    <div className="theme-default">
      <div className="container mx-auto">
        <h1 className="text-xl font-bold pt-1 pl-1 mb-4">앱 기본값 설정</h1>
      
      {/* NAS 설정 섹션 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <HardDrive className="w-5 h-5 mr-2" />
          <h2 className="text-xl font-semibold">NAS 설정</h2>
        </div>
        
        {/* NAS 폴더 설정 */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Database className="w-4 h-4 mr-2" />
            <h3 className="text-lg font-medium">NAS 폴더</h3>
          </div>
          
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순번</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용영역</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">깊이</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">폴더명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nasSettings.map((setting, index) => (
                    <tr key={setting.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{setting.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{setting.area}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{setting.depth}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{setting.folder}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{setting.remark || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* NAS 정보 */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <HardDrive className="w-4 h-4 mr-2" />
            <h3 className="text-lg font-medium">NAS 정보</h3>
          </div>
          
          {nasInfo && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">타입:</span>
                  <p className="text-sm text-gray-900">{nasInfo.type}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">모델:</span>
                  <p className="text-sm text-gray-900">{nasInfo.model}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">버전:</span>
                  <p className="text-sm text-gray-900">{nasInfo.version}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">상태:</span>
                  <p className="text-sm text-green-600">{nasInfo.status}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="my-8 border-gray-200" />

      {/* UI 설정 섹션 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 mr-2" />
          <h2 className="text-xl font-semibold">UI 설정</h2>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">테마 모드</label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    checked={!uiSettings.darkMode}
                    onChange={() => setUiSettings({...uiSettings, darkMode: false})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">라이트모드</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    checked={uiSettings.darkMode}
                    onChange={() => setUiSettings({...uiSettings, darkMode: true})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">다크모드</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 테마 색상 설정 섹션 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Palette className="w-5 h-5 mr-2" />
          <h2 className="text-xl font-semibold">테마 색상 설정</h2>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">기본 테마</label>
                <select 
                  value={themeSettings.defaultTheme}
                  onChange={(e) => setThemeSettings({...themeSettings, defaultTheme: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gray">Gray</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="red">Red</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">공고 목록</label>
                <select 
                  value={themeSettings.noticeTheme}
                  onChange={(e) => setThemeSettings({...themeSettings, noticeTheme: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="gray">Gray</option>
                  <option value="red">Red</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">입찰 목록</label>
                <select 
                  value={themeSettings.bidTheme}
                  onChange={(e) => setThemeSettings({...themeSettings, bidTheme: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="gray">Gray</option>
                  <option value="red">Red</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="my-8 border-gray-200" />

      {/* 스크랩 설정 섹션 */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Clock className="w-5 h-5 mr-2" />
          <h2 className="text-xl font-semibold">스크랩 설정</h2>
        </div>
        
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">스크랩 주기</label>
              <p className="text-sm text-gray-600 mb-2">매일 {scrapingSettings.schedule.join(', ')}시</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="예: 10:00,22:00"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">자동 스크래핑 활성화</label>
            </div>

            {scrapingSettings.lastRun && (
              <div className="text-sm text-gray-500">
                마지막 실행: {scrapingSettings.lastRun}
              </div>
            )}

            {scrapingSettings.nextRun && (
              <div className="text-sm text-gray-500">
                다음 실행 예정: {scrapingSettings.nextRun}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
} 