import { apiClient } from '@/lib/api/backendClient';

export const settingsListResolvers = {
  Query: {
    settingsLists: async () => {
      try {
        const response = await apiClient.get('/settings_notice_list');
        return response.data.map((setting: any) => {
          return {
            orgName: setting.org_name,
            detailUrl: setting.url || '',
            region: setting.org_region,
            registration: setting.registration,
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
        const response = await apiClient.get(`/settings_notice_list/${orgName}`);
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
          region: setting.org_region,
          registration: setting.registration,
          use: setting.use
        };
      } catch (error) {
        console.error(`Error fetching setting for ${orgName}:`, error);
        return null;
      }
    },

    orgNameList: async () => {
      try {
        const response = await apiClient.get('/settings_notice_list');
        return response.data.filter((setting: any) => setting.use == 1).map((setting: any) => setting.org_name);
      } catch (error) {
        console.error('Error fetching org name list:', error);
        return [];
      }
    }
  },

  Mutation: {
    upsertSettingsList: async (_: unknown, { orgName, input }: { orgName: string, input: any }) => {
      try {
        const response = await apiClient.post(`/settings_notice_list/${orgName}`, {
          ...input,
          org_region: input.region,
          registration: input.registration
        });
        return {
          ...response.data,
          region: response.data.org_region,
          registration: response.data.registration
        };
      } catch (error) {
        console.error('Error upserting setting:', error);
        throw new Error('Failed to upsert setting');
      }
    },
  }
};
