import { apiClient } from '@/lib/api/backendClient';

export const settingsListResolvers = {
  Query: {
    settingsLists: async () => {
      try {
        const response = await apiClient.get('/settings_list');
        return response.data.map((setting: any) => {
          return {
            orgName: setting.기관명,
            detailUrl: setting.url || '',
            region: setting.지역,
            registration: setting.등록,
            use: setting.use
          };
        });
      } catch (error) {
        console.error('Error fetching settings list:', error);
        return [];
      }
    },

    settingList: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        const response = await apiClient.get(`/settings_list/${orgName}`);
        const setting = response.data;

        return {
          orgName: orgName,
          detailUrl: setting.url || '',
          iframe: setting.iframe || "",
          rowXpath: setting.rowXpath,
          paging: setting.paging || "",
          startPage: setting.startPage,
          endPage: setting.endPage,
          login: setting.login || "",
          elements: setting.elements || [],
          region: setting.지역,
          registration: setting.등록,
          use: setting.use
        };
      } catch (error) {
        console.error(`Error fetching setting for ${orgName}:`, error);
        return null;
      }
    },

    orgNameList: async () => {
      try {
        const response = await apiClient.get('/settings_list');
        return response.data.filter((setting: any) => setting.use == 1).map((setting: any) => setting.기관명);
      } catch (error) {
        console.error('Error fetching org name list:', error);
        return [];
      }
    }
  },

  Mutation: {
    createSettingsList: async (_: unknown, { input }: { input: any }) => {
      try {
        const response = await apiClient.post('/settings_list', {
          ...input,
          지역: input.region,
          등록: input.registration
        });
        return {
          ...response.data,
          region: response.data.지역,
          registration: response.data.등록
        };
      } catch (error) {
        console.error('Error creating setting:', error);
        throw new Error('Failed to create setting');
      }
    },

    updateSettingsList: async (_: unknown, { orgName, input }: { orgName: string, input: any }) => {
      try {
        const response = await apiClient.put(`/settings_list/${orgName}`, {
          ...input,
          지역: input.region,
          등록: input.registration
        });
        return {
          ...response.data,
          region: response.data.지역,
          registration: response.data.등록
        };
      } catch (error) {
        console.error('Error updating setting:', error);
        throw new Error('Failed to update setting');
      }
    },
  }
};
