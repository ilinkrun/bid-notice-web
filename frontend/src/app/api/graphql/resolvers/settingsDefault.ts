import { apiClient } from '@/lib/api/backendClient';

export const settingsDefaultResolvers = {
  Query: {
    settingsDefault: async () => {
      try {
        console.log('settingsDefault API 호출 시작');
        
        // 각 설정 데이터를 병렬로 가져오기
        const [nasPathResponse, nasInfoResponse, uiResponse, themeResponse, scrapingResponse] = await Promise.all([
          apiClient.get('/settings_nas_path').catch(() => ({ data: [] })),
          apiClient.get('/settings_nas_info').catch(() => ({ data: null })),
          apiClient.get('/settings_ui').catch(() => ({ data: null })),
          apiClient.get('/settings_theme').catch(() => ({ data: null })),
          apiClient.get('/settings_scraping').catch(() => ({ data: null }))
        ]);

        return {
          nasPathSettings: nasPathResponse.data?.map((item: any) => ({
            id: item.id || 0,
            name: item.name || '',
            area: item.area || '',
            depth: item.depth || 0,
            folder: item.folder || '',
            remark: item.remark || null
          })) || [],
          
          nasInfo: nasInfoResponse.data ? {
            type: nasInfoResponse.data.type || 'Synology NAS',
            model: nasInfoResponse.data.model || null,
            version: nasInfoResponse.data.version || null,
            status: nasInfoResponse.data.status || 'connected'
          } : {
            type: 'Synology NAS',
            model: null,
            version: null,
            status: 'unknown'
          },

          uiSettings: {
            darkMode: uiResponse.data?.dark_mode || false,
            language: uiResponse.data?.language || 'ko',
            timezone: uiResponse.data?.timezone || 'Asia/Seoul'
          },

          themeSettings: {
            defaultTheme: themeResponse.data?.default_theme || 'gray',
            noticeTheme: themeResponse.data?.notice_theme || 'green',
            bidTheme: themeResponse.data?.bid_theme || 'blue'
          },

          scrapingSettings: {
            schedule: scrapingResponse.data?.schedule ? scrapingResponse.data.schedule.split(',') : ['10:00', '22:00'],
            isActive: scrapingResponse.data?.is_active || true,
            lastRun: scrapingResponse.data?.last_run || null,
            nextRun: scrapingResponse.data?.next_run || null
          }
        };
      } catch (error) {
        console.error('settingsDefault API 에러:', error);
        
        // 기본값 반환
        return {
          nasPathSettings: [],
          nasInfo: {
            type: 'Synology NAS',
            model: null,
            version: null,
            status: 'unknown'
          },
          uiSettings: {
            darkMode: false,
            language: 'ko',
            timezone: 'Asia/Seoul'
          },
          themeSettings: {
            defaultTheme: 'gray',
            noticeTheme: 'green',
            bidTheme: 'blue'
          },
          scrapingSettings: {
            schedule: ['10:00', '22:00'],
            isActive: true,
            lastRun: null,
            nextRun: null
          }
        };
      }
    },

    nasPathSettings: async () => {
      try {
        console.log('nasPathSettings API 호출');
        const response = await apiClient.get('/settings_nas_path');
        
        if (!response.data || !Array.isArray(response.data)) {
          return [];
        }

        return response.data.map((item: any) => ({
          id: item.id || 0,
          name: item.name || '',
          area: item.area || '',
          depth: item.depth || 0,
          folder: item.folder || '',
          remark: item.remark || null
        }));
      } catch (error) {
        console.error('nasPathSettings API 에러:', error);
        return [];
      }
    }
  },

  Mutation: {
    updateUiSettings: async (_: unknown, { darkMode, language, timezone }: { darkMode?: boolean, language?: string, timezone?: string }) => {
      try {
        const payload: any = {};
        if (darkMode !== undefined) payload.dark_mode = darkMode;
        if (language !== undefined) payload.language = language;
        if (timezone !== undefined) payload.timezone = timezone;

        const response = await apiClient.put('/settings_ui', payload);
        
        return {
          darkMode: response.data?.dark_mode || false,
          language: response.data?.language || 'ko',
          timezone: response.data?.timezone || 'Asia/Seoul'
        };
      } catch (error) {
        console.error('UI 설정 업데이트 에러:', error);
        throw new Error('UI 설정 업데이트에 실패했습니다.');
      }
    },

    updateThemeSettings: async (_: unknown, { defaultTheme, noticeTheme, bidTheme }: { defaultTheme?: string, noticeTheme?: string, bidTheme?: string }) => {
      try {
        const payload: any = {};
        if (defaultTheme !== undefined) payload.default_theme = defaultTheme;
        if (noticeTheme !== undefined) payload.notice_theme = noticeTheme;
        if (bidTheme !== undefined) payload.bid_theme = bidTheme;

        const response = await apiClient.put('/settings_theme', payload);
        
        return {
          defaultTheme: response.data?.default_theme || 'gray',
          noticeTheme: response.data?.notice_theme || 'green',
          bidTheme: response.data?.bid_theme || 'blue'
        };
      } catch (error) {
        console.error('테마 설정 업데이트 에러:', error);
        throw new Error('테마 설정 업데이트에 실패했습니다.');
      }
    },

    updateScrapingSettings: async (_: unknown, { schedule, isActive }: { schedule?: string[], isActive?: boolean }) => {
      try {
        const payload: any = {};
        if (schedule !== undefined) payload.schedule = schedule.join(',');
        if (isActive !== undefined) payload.is_active = isActive;

        const response = await apiClient.put('/settings_scraping', payload);
        
        return {
          schedule: response.data?.schedule ? response.data.schedule.split(',') : ['10:00', '22:00'],
          isActive: response.data?.is_active || true,
          lastRun: response.data?.last_run || null,
          nextRun: response.data?.next_run || null
        };
      } catch (error) {
        console.error('스크래핑 설정 업데이트 에러:', error);
        throw new Error('스크래핑 설정 업데이트에 실패했습니다.');
      }
    },

    updateNasPathSetting: async (_: unknown, { id, name, area, depth, folder, remark }: { id: number, name?: string, area?: string, depth?: number, folder?: string, remark?: string }) => {
      try {
        const payload: any = {};
        if (name !== undefined) payload.name = name;
        if (area !== undefined) payload.area = area;
        if (depth !== undefined) payload.depth = depth;
        if (folder !== undefined) payload.folder = folder;
        if (remark !== undefined) payload.remark = remark;

        const response = await apiClient.put(`/settings_nas_path/${id}`, payload);
        
        return {
          id: response.data?.id || id,
          name: response.data?.name || '',
          area: response.data?.area || '',
          depth: response.data?.depth || 0,
          folder: response.data?.folder || '',
          remark: response.data?.remark || null
        };
      } catch (error) {
        console.error('NAS 경로 설정 업데이트 에러:', error);
        throw new Error('NAS 경로 설정 업데이트에 실패했습니다.');
      }
    },

    addNasPathSetting: async (_: unknown, { name, area, depth, folder, remark }: { name: string, area: string, depth: number, folder: string, remark?: string }) => {
      try {
        const payload = {
          name,
          area,
          depth,
          folder,
          remark: remark || null
        };

        const response = await apiClient.post('/settings_nas_path', payload);
        
        return {
          id: response.data?.id || 0,
          name: response.data?.name || name,
          area: response.data?.area || area,
          depth: response.data?.depth || depth,
          folder: response.data?.folder || folder,
          remark: response.data?.remark || remark || null
        };
      } catch (error) {
        console.error('NAS 경로 설정 추가 에러:', error);
        throw new Error('NAS 경로 설정 추가에 실패했습니다.');
      }
    },

    deleteNasPathSetting: async (_: unknown, { id }: { id: number }) => {
      try {
        await apiClient.delete(`/settings_nas_path/${id}`);
        return true;
      } catch (error) {
        console.error('NAS 경로 설정 삭제 에러:', error);
        throw new Error('NAS 경로 설정 삭제에 실패했습니다.');
      }
    }
  }
};