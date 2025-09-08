import { apiClient } from '@/lib/api/backendClient';

export const settingsListResolvers = {
  Query: {
    settingsLists: async () => {
      try {
        const response = await apiClient.get('/settings_notice_list');
        return response.data.map((setting: any) => {
          return {
            oid: setting.oid,
            orgName: setting.org_name,
            detailUrl: setting.url || '',
            region: setting.org_region,
            registration: setting.registration,
            use: setting.use,
            companyInCharge: setting.company_in_charge
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
          oid: setting.oid,
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
          use: setting.use,
          companyInCharge: setting.company_in_charge,
          orgMan: setting.org_man,
          exceptionRow: setting.exception_row || ''
        };
      } catch (error) {
        console.error(`Error fetching setting for ${orgName}:`, error);
        return null;
      }
    },

    settingListByOid: async (_: unknown, { oid }: { oid: number }) => {
      try {
        const response = await apiClient.get(`/settings_notice_list_by_oid/${oid}`);
        const setting = response.data;

        return {
          oid: setting.oid,
          orgName: setting.org_name,
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
          use: setting.use,
          companyInCharge: setting.company_in_charge,
          orgMan: setting.org_man,
          exceptionRow: setting.exception_row || ''
        };
      } catch (error) {
        console.error(`Error fetching setting for oid ${oid}:`, error);
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
    },

    settingsDetailByOid: async (_: unknown, { oid }: { oid: number }) => {
      try {
        const response = await apiClient.get(`/settings_notice_detail_by_oid/${oid}`);
        const setting = response.data;

        return {
          oid: setting.oid,
          orgName: setting.org_name,
          title: setting.title || '',
          bodyHtml: setting.body_html || '',
          fileName: setting.file_name || '',
          fileUrl: setting.file_url || '',
          preview: setting.preview || '',
          noticeDiv: setting.notice_div || '',
          noticeNum: setting.notice_num || '',
          orgDept: setting.org_dept || '',
          orgMan: setting.org_man || '',
          orgTel: setting.org_tel || '',
          use: setting.use,
          sampleUrl: setting.sample_url || '',
          down: setting.down
        };
      } catch (error) {
        console.error(`Error fetching detail setting for oid ${oid}:`, error);
        return null;
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

    upsertSettingsListByOid: async (_: unknown, { oid, input }: { oid: number, input: any }) => {
      try {
        const response = await apiClient.post(`/settings_notice_list_by_oid/${oid}`, {
          ...input,
          org_region: input.region,
          registration: input.registration,
          company_in_charge: input.companyInCharge,
          org_man: input.orgMan,
          exception_row: input.exceptionRow
        });
        return {
          oid: oid,
          orgName: input.orgName,
          detailUrl: input.detailUrl,
          iframe: input.iframe,
          rowXpath: input.rowXpath,
          paging: input.paging,
          startPage: input.startPage,
          endPage: input.endPage,
          login: input.login,
          elements: input.elements,
          region: input.region,
          registration: input.registration,
          use: input.use,
          companyInCharge: input.companyInCharge,
          orgMan: input.orgMan,
          exceptionRow: input.exceptionRow
        };
      } catch (error) {
        console.error('Error upserting setting by oid:', error);
        throw new Error('Failed to upsert setting by oid');
      }
    },

    upsertSettingsDetailByOid: async (_: unknown, { oid, input }: { oid: number, input: any }) => {
      try {
        const response = await apiClient.post(`/settings_notice_detail_by_oid/${oid}`, {
          ...input,
          org_name: input.orgName,
          body_html: input.bodyHtml,
          file_name: input.fileName,
          file_url: input.fileUrl,
          notice_div: input.noticeDiv,
          notice_num: input.noticeNum,
          org_dept: input.orgDept,
          org_man: input.orgMan,
          org_tel: input.orgTel,
          sample_url: input.sampleUrl
        });
        return {
          oid: oid,
          orgName: input.orgName,
          title: input.title,
          bodyHtml: input.bodyHtml,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          preview: input.preview,
          noticeDiv: input.noticeDiv,
          noticeNum: input.noticeNum,
          orgDept: input.orgDept,
          orgMan: input.orgMan,
          orgTel: input.orgTel,
          use: input.use,
          sampleUrl: input.sampleUrl,
          down: input.down
        };
      } catch (error) {
        console.error('Error upserting detail setting by oid:', error);
        throw new Error('Failed to upsert detail setting by oid');
      }
    },
  }
};
