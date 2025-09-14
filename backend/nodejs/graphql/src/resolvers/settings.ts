import { apiClient } from '../lib/api/backendClient.js';

// Settings Notice List
export interface SettingsNoticeListData {
  oid: number;
  org_name: string;
  url: string;
  iframe: string;
  rowXpath: string;
  paging: string;
  startPage: number;
  endPage: number;
  login: string;
  use: number;
  org_region: string;
  registration: string;
  title: string;
  detail_url: string;
  posted_date: string;
  posted_by: string;
  company_in_charge: string;
  org_man: string;
  exception_row: string;
}

export interface SettingsNoticeListInput {
  oid?: number;
  orgName: string;
  url: string;
  iframe?: string;
  rowXpath?: string;
  paging?: string;
  startPage?: number;
  endPage?: number;
  login?: string;
  use?: number;
  orgRegion?: string;
  registration?: string;
  title?: string;
  detailUrl?: string;
  postedDate?: string;
  postedBy?: string;
  companyInCharge?: string;
  orgMan?: string;
  exceptionRow?: string;
}

// Settings Notice Detail
export interface SettingsNoticeDetailData {
  oid: number;
  org_name: string;
  title: string;
  body_html: string;
  file_name: string;
  file_url: string;
  preview: string;
  notice_div: string;
  notice_num: string;
  org_dept: string;
  org_man: string;
  org_tel: string;
  use: number;
  sample_url: string;
  down: string;
}

export interface SettingsNoticeDetailInput {
  oid?: number;
  orgName: string;
  title?: string;
  bodyHtml?: string;
  fileName?: string;
  fileUrl?: string;
  preview?: string;
  noticeDiv?: string;
  noticeNum?: string;
  orgDept?: string;
  orgMan?: string;
  orgTel?: string;
  use?: number;
  sampleUrl?: string;
  down?: string;
}

// Settings Notice Category
export interface SettingsNoticeCategoryData {
  sn: number;
  keywords: string;
  nots: string;
  min_point: number;
  category: string;
  creator?: string;
  memo?: string;
}

export interface SettingsNoticeCategoryInput {
  sn?: number;
  keywords: string;
  nots: string;
  minPoint: number;
  category: string;
  creator?: string;
  memo?: string;
}

// Settings NAS Path
export interface SettingsNasPathData {
  id: number;
  name: string;
  area: string;
  depth: number;
  folder: string;
  remark?: string;
}

export interface SettingsNasPathInput {
  id?: string;
  pathName: string;
  pathValue: string;
  description?: string;
  isActive?: boolean;
}

// Settings App Default
export interface SettingsAppDefaultData {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
  category?: string;
}

export interface SettingsAppDefaultInput {
  id?: string;
  settingKey: string;
  settingValue: string;
  description?: string;
  category?: string;
}

export interface NoticeSearchResult {
  nid?: number;
  title: string;
  org_name: string;
  posted_date: string;
  detail_url: string;
  category?: string;
  org_region?: string;
}

export const settingsResolvers = {
  Query: {
    // Settings Notice List
    settingsNoticeListAll: async () => {
      try {
        const response = await apiClient.get('/settings_notice_list');
        return response.data.map((setting: SettingsNoticeListData) => ({
          oid: setting.oid,
          orgName: setting.org_name,
          url: setting.url,
          iframe: setting.iframe || '',
          rowXpath: setting.rowXpath || '',
          paging: setting.paging || '',
          startPage: setting.startPage || 0,
          endPage: setting.endPage || 0,
          login: setting.login || '',
          use: setting.use,
          orgRegion: setting.org_region || '',
          registration: setting.registration || '',
          title: setting.title || '',
          detailUrl: setting.detail_url || '',
          postedDate: setting.posted_date || '',
          postedBy: setting.posted_by || '',
          companyInCharge: setting.company_in_charge || '',
          orgMan: setting.org_man || '',
          exceptionRow: setting.exception_row || ''
        }));
      } catch (error) {
        console.error('Error fetching all notice list settings:', error);
        return [];
      }
    },

    settingsNoticeListOne: async (_: unknown, { oid }: { oid: number }) => {
      try {
        const response = await apiClient.get(`/settings_notice_list_by_oid/${oid}`);
        const setting = response.data;
        return {
          oid: setting.oid,
          orgName: setting.org_name,
          url: setting.url,
          iframe: setting.iframe || '',
          rowXpath: setting.rowXpath || '',
          paging: setting.paging || '',
          startPage: setting.startPage || 0,
          endPage: setting.endPage || 0,
          login: setting.login || '',
          use: setting.use,
          orgRegion: setting.org_region || '',
          registration: setting.registration || '',
          title: setting.title || '',
          detailUrl: setting.detail_url || '',
          postedDate: setting.posted_date || '',
          postedBy: setting.posted_by || '',
          companyInCharge: setting.company_in_charge || '',
          orgMan: setting.org_man || '',
          exceptionRow: setting.exception_row || '',
          elements: setting.elements || []
        };
      } catch (error) {
        console.error('Error fetching notice list settings by oid:', error);
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
          url: setting.url,
          detailUrl: setting.url || '',
          iframe: setting.iframe || '',
          rowXpath: setting.rowXpath || '',
          paging: setting.paging || '',
          startPage: setting.startPage || 0,
          endPage: setting.endPage || 0,
          login: setting.login || '',
          use: setting.use,
          orgRegion: setting.org_region || '',
          registration: setting.registration || '',
          title: setting.title || '',
          postedDate: setting.posted_date || '',
          postedBy: setting.posted_by || '',
          companyInCharge: setting.company_in_charge || '',
          orgMan: setting.org_man || '',
          exceptionRow: setting.exception_row || '',
          elements: setting.elements || []
        };
      } catch (error) {
        console.error('Error fetching setting list by oid:', error);
        return null;
      }
    },

    settingsNoticeListByOrg: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        console.log(`Fetching settings for organization: ${orgName}`);
        const response = await apiClient.get(`/settings_notice_list_by_org_name/${orgName}`);
        
        console.log('Raw response from Python backend:', response.data);
        
        // Handle the response structure from the Python endpoint
        if (response.data.error) {
          console.error('Python backend returned error:', response.data.error);
          return [];
        }

        // If response.data is a single object (not an array), wrap it in an array
        const dataArray = Array.isArray(response.data) ? response.data : [response.data];
        
        return dataArray.map((setting: SettingsNoticeListData) => ({
          oid: setting.oid,
          orgName: setting.org_name,
          url: setting.url,
          iframe: setting.iframe || '',
          rowXpath: setting.rowXpath || '',
          paging: setting.paging || '',
          startPage: setting.startPage || 0,
          endPage: setting.endPage || 0,
          login: setting.login || '',
          use: setting.use,
          orgRegion: setting.org_region || '',
          registration: setting.registration || '',
          title: setting.title || '',
          detailUrl: setting.detail_url || '',
          postedDate: setting.posted_date || '',
          postedBy: setting.posted_by || '',
          companyInCharge: setting.company_in_charge || '',
          orgMan: setting.org_man || '',
          exceptionRow: setting.exception_row || ''
        }));
      } catch (error) {
        console.error('Error fetching notice list settings by org:', error);
        return [];
      }
    },

    // Settings Notice Detail
    settingsNoticeDetailAll: async () => {
      try {
        const response = await apiClient.get('/settings_notice_detail');
        return response.data.map((setting: SettingsNoticeDetailData) => ({
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
          down: setting.down || ''
        }));
      } catch (error) {
        console.error('Error fetching all notice detail settings:', error);
        return [];
      }
    },

    settingsNoticeDetailOne: async (_: unknown, { oid }: { oid: number }) => {
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
          down: setting.down || ''
        };
      } catch (error) {
        console.error('Error fetching notice detail settings by oid:', error);
        return null;
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
          down: setting.down || ''
        };
      } catch (error) {
        console.error('Error fetching settings detail by oid:', error);
        return null;
      }
    },

    settingsNoticeDetailByOrg: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        const response = await apiClient.get(`/settings_notice_detail/org/${orgName}`);
        return response.data.map((setting: SettingsNoticeDetailData) => ({
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
          down: setting.down || ''
        }));
      } catch (error) {
        console.error('Error fetching notice detail settings by org:', error);
        return [];
      }
    },

    // Settings Notice Category
    settingsNoticeCategoryAll: async () => {
      try {
        const response = await apiClient.get('/settings_notice_categorys');
        return response.data
          .map((category: SettingsNoticeCategoryData) => ({
            sn: category.sn,
            keywords: category.keywords,
            nots: category.nots,
            minPoint: category.min_point,
            category: category.category,
            creator: category.creator || '',
            memo: category.memo || ''
          }))
          .sort((a: SettingsNoticeCategoryData, b: SettingsNoticeCategoryData) => a.sn - b.sn);
      } catch (error) {
        console.error('Error fetching notice category settings:', error);
        return [];
      }
    },

    settingsNoticeCategoryByCategory: async (_: unknown, { category }: { category: string }) => {
      try {
        const response = await apiClient.get(`/settings_notice_categorys/${category}`);
        return response.data.map((item: SettingsNoticeCategoryData) => ({
          sn: item.sn,
          keywords: item.keywords,
          nots: item.nots,
          minPoint: item.min_point,
          category: item.category,
          creator: item.creator || '',
          memo: item.memo || ''
        }));
      } catch (error) {
        console.error('Error fetching notice category settings by category:', error);
        return [];
      }
    },

    settingsNoticeCategoryParseKeywordWeights: async (_: unknown, { keywordWeightStr }: { keywordWeightStr: string }) => {
      try {
        const response = await apiClient.get('/parse_keyword_weights', {
          params: { keyword_weight_str: keywordWeightStr }
        });
        return response.data;
      } catch (error) {
        console.error('Error parsing keyword weights:', error);
        return [];
      }
    },

    // Settings NAS Path
    settingsNasPathAll: async () => {
      try {
        const response = await apiClient.get('/settings_nas_path');
        return response.data.map((setting: SettingsNasPathData) => ({
          id: setting.id.toString(),
          pathName: setting.name,
          pathValue: setting.folder,
          description: setting.remark || '',
          isActive: setting.area !== 'disabled' // area가 'disabled'가 아니면 활성으로 간주
        }));
      } catch (error) {
        console.error('Error fetching all NAS path settings:', error);
        return [];
      }
    },

    settingsNasPathOne: async (_: unknown, { id }: { id: string }) => {
      try {
        const response = await apiClient.get(`/settings_nas_path/${id}`);
        const setting = response.data;
        return {
          id: setting.id,
          pathName: setting.path_name,
          pathValue: setting.path_value,
          description: setting.description || '',
          isActive: setting.is_active
        };
      } catch (error) {
        console.error('Error fetching NAS path settings by id:', error);
        return null;
      }
    },

    // Settings App Default
    settingsAppDefaultAll: async () => {
      try {
        const response = await apiClient.get('/settings_app_default');
        return response.data.map((setting: SettingsAppDefaultData) => ({
          id: setting.id,
          settingKey: setting.setting_key,
          settingValue: setting.setting_value,
          description: setting.description || '',
          category: setting.category || ''
        }));
      } catch (error) {
        console.error('Error fetching all app default settings:', error);
        return [];
      }
    },

    settingsAppDefaultByCategory: async (_: unknown, { category }: { category: string }) => {
      try {
        const response = await apiClient.get(`/settings_app_default/category/${category}`);
        return response.data.map((setting: SettingsAppDefaultData) => ({
          id: setting.id,
          settingKey: setting.setting_key,
          settingValue: setting.setting_value,
          description: setting.description || '',
          category: setting.category || ''
        }));
      } catch (error) {
        console.error('Error fetching app default settings by category:', error);
        return [];
      }
    },

    settingsAppDefaultOne: async (_: unknown, { settingKey }: { settingKey: string }) => {
      try {
        const response = await apiClient.get(`/settings_app_default/key/${settingKey}`);
        const setting = response.data;
        return {
          id: setting.id,
          settingKey: setting.setting_key,
          settingValue: setting.setting_value,
          description: setting.description || '',
          category: setting.category || ''
        };
      } catch (error) {
        console.error('Error fetching app default settings by key:', error);
        return null;
      }
    },
  },

  Mutation: {
    // Settings Notice List Mutations
    settingsNoticeListCreate: async (_: unknown, { input }: { input: SettingsNoticeListInput }) => {
      try {
        const response = await apiClient.post('/settings_notice_list', {
          org_name: input.orgName,
          url: input.url,
          iframe: input.iframe || '',
          rowXpath: input.rowXpath || '',
          paging: input.paging || '',
          startPage: input.startPage || 0,
          endPage: input.endPage || 0,
          login: input.login || '',
          use: input.use !== undefined ? input.use : 1,
          org_region: input.orgRegion || '',
          registration: input.registration || '',
          title: input.title || '',
          detail_url: input.detailUrl || '',
          posted_date: input.postedDate || '',
          posted_by: input.postedBy || '',
          company_in_charge: input.companyInCharge || '',
          org_man: input.orgMan || '',
          exception_row: input.exceptionRow || ''
        });
        return {
          oid: response.data.oid,
          orgName: response.data.org_name,
          url: response.data.url,
          iframe: response.data.iframe || '',
          rowXpath: response.data.rowXpath || '',
          paging: response.data.paging || '',
          startPage: response.data.startPage || 0,
          endPage: response.data.endPage || 0,
          login: response.data.login || '',
          use: response.data.use,
          orgRegion: response.data.org_region || '',
          registration: response.data.registration || '',
          title: response.data.title || '',
          detailUrl: response.data.detail_url || '',
          postedDate: response.data.posted_date || '',
          postedBy: response.data.posted_by || '',
          companyInCharge: response.data.company_in_charge || '',
          orgMan: response.data.org_man || '',
          exceptionRow: response.data.exception_row || ''
        };
      } catch (error) {
        console.error('Error creating notice list settings:', error);
        throw new Error('Failed to create notice list settings');
      }
    },

    settingsNoticeListUpdate: async (_: unknown, { input }: { input: SettingsNoticeListInput }) => {
      try {
        const response = await apiClient.post(`/settings_notice_list_by_oid/${input.oid}`, {
          org_name: input.orgName,
          url: input.url,
          iframe: input.iframe || '',
          rowXpath: input.rowXpath || '',
          paging: input.paging || '',
          startPage: input.startPage || 0,
          endPage: input.endPage || 0,
          login: input.login || '',
          use: input.use !== undefined ? input.use : 1,
          org_region: input.orgRegion || '',
          registration: input.registration || '',
          title: input.title || '',
          detail_url: input.detailUrl || '',
          posted_date: input.postedDate || '',
          posted_by: input.postedBy || '',
          company_in_charge: input.companyInCharge || '',
          org_man: input.orgMan || '',
          exception_row: input.exceptionRow || ''
        });
        return {
          oid: response.data.oid,
          orgName: response.data.org_name,
          url: response.data.url,
          iframe: response.data.iframe || '',
          rowXpath: response.data.rowXpath || '',
          paging: response.data.paging || '',
          startPage: response.data.startPage || 0,
          endPage: response.data.endPage || 0,
          login: response.data.login || '',
          use: response.data.use,
          orgRegion: response.data.org_region || '',
          registration: response.data.registration || '',
          title: response.data.title || '',
          detailUrl: response.data.detail_url || '',
          postedDate: response.data.posted_date || '',
          postedBy: response.data.posted_by || '',
          companyInCharge: response.data.company_in_charge || '',
          orgMan: response.data.org_man || '',
          exceptionRow: response.data.exception_row || ''
        };
      } catch (error) {
        console.error('Error updating notice list settings:', error);
        throw new Error('Failed to update notice list settings');
      }
    },

    settingsNoticeListDelete: async (_: unknown, { oid }: { oid: number }) => {
      try {
        await apiClient.delete(`/settings_notice_list_by_oid/${oid}`);
        return true;
      } catch (error) {
        console.error('Error deleting notice list settings:', error);
        throw new Error('Failed to delete notice list settings');
      }
    },

    // Settings Notice Detail Mutations
    settingsNoticeDetailCreate: async (_: unknown, { input }: { input: SettingsNoticeDetailInput }) => {
      try {
        const response = await apiClient.post('/settings_notice_detail', {
          org_name: input.orgName,
          title: input.title || '',
          body_html: input.bodyHtml || '',
          file_name: input.fileName || '',
          file_url: input.fileUrl || '',
          preview: input.preview || '',
          notice_div: input.noticeDiv || '',
          notice_num: input.noticeNum || '',
          org_dept: input.orgDept || '',
          org_man: input.orgMan || '',
          org_tel: input.orgTel || '',
          use: input.use !== undefined ? input.use : 1,
          sample_url: input.sampleUrl || '',
          down: input.down || ''
        });
        return {
          oid: response.data.oid,
          orgName: response.data.org_name,
          title: response.data.title || '',
          bodyHtml: response.data.body_html || '',
          fileName: response.data.file_name || '',
          fileUrl: response.data.file_url || '',
          preview: response.data.preview || '',
          noticeDiv: response.data.notice_div || '',
          noticeNum: response.data.notice_num || '',
          orgDept: response.data.org_dept || '',
          orgMan: response.data.org_man || '',
          orgTel: response.data.org_tel || '',
          use: response.data.use,
          sampleUrl: response.data.sample_url || '',
          down: response.data.down || ''
        };
      } catch (error) {
        console.error('Error creating notice detail settings:', error);
        throw new Error('Failed to create notice detail settings');
      }
    },

    settingsNoticeDetailUpdate: async (_: unknown, { input }: { input: SettingsNoticeDetailInput }) => {
      try {
        const response = await apiClient.post(`/settings_notice_detail_by_oid/${input.oid}`, {
          org_name: input.orgName,
          title: input.title || '',
          body_html: input.bodyHtml || '',
          file_name: input.fileName || '',
          file_url: input.fileUrl || '',
          preview: input.preview || '',
          notice_div: input.noticeDiv || '',
          notice_num: input.noticeNum || '',
          org_dept: input.orgDept || '',
          org_man: input.orgMan || '',
          org_tel: input.orgTel || '',
          use: input.use !== undefined ? input.use : 1,
          sample_url: input.sampleUrl || '',
          down: input.down || ''
        });
        return {
          oid: response.data.oid,
          orgName: response.data.org_name,
          title: response.data.title || '',
          bodyHtml: response.data.body_html || '',
          fileName: response.data.file_name || '',
          fileUrl: response.data.file_url || '',
          preview: response.data.preview || '',
          noticeDiv: response.data.notice_div || '',
          noticeNum: response.data.notice_num || '',
          orgDept: response.data.org_dept || '',
          orgMan: response.data.org_man || '',
          orgTel: response.data.org_tel || '',
          use: response.data.use,
          sampleUrl: response.data.sample_url || '',
          down: response.data.down || ''
        };
      } catch (error) {
        console.error('Error updating notice detail settings:', error);
        throw new Error('Failed to update notice detail settings');
      }
    },

    settingsNoticeDetailDelete: async (_: unknown, { oid }: { oid: number }) => {
      try {
        await apiClient.delete(`/settings_notice_detail_by_oid/${oid}`);
        return true;
      } catch (error) {
        console.error('Error deleting notice detail settings:', error);
        throw new Error('Failed to delete notice detail settings');
      }
    },

    upsertSettingsDetailByOid: async (_: unknown, { oid, input }: { oid: number; input: SettingsNoticeDetailInput }) => {
      try {
        const response = await apiClient.post(`/settings_notice_detail_by_oid/${oid}`, {
          org_name: input.orgName,
          title: input.title || '',
          body_html: input.bodyHtml || '',
          file_name: input.fileName || '',
          file_url: input.fileUrl || '',
          preview: input.preview || '',
          notice_div: input.noticeDiv || '',
          notice_num: input.noticeNum || '',
          org_dept: input.orgDept || '',
          org_man: input.orgMan || '',
          org_tel: input.orgTel || '',
          use: input.use !== undefined ? input.use : 1,
          sample_url: input.sampleUrl || '',
          down: input.down || ''
        });
        return {
          oid: response.data.oid,
          orgName: response.data.org_name,
          title: response.data.title || '',
          bodyHtml: response.data.body_html || '',
          fileName: response.data.file_name || '',
          fileUrl: response.data.file_url || '',
          preview: response.data.preview || '',
          noticeDiv: response.data.notice_div || '',
          noticeNum: response.data.notice_num || '',
          orgDept: response.data.org_dept || '',
          orgMan: response.data.org_man || '',
          orgTel: response.data.org_tel || '',
          use: response.data.use,
          sampleUrl: response.data.sample_url || '',
          down: response.data.down || ''
        };
      } catch (error) {
        console.error('Error upserting settings detail by oid:', error);
        throw new Error('Failed to upsert settings detail');
      }
    },

    // Settings Notice Category Mutations
    settingsNoticeCategoryCreate: async (_: unknown, { input }: { input: SettingsNoticeCategoryInput }) => {
      try {
        const response = await apiClient.post('/settings_notice_categorys', {
          sn: input.sn,
          keywords: input.keywords,
          nots: input.nots,
          min_point: input.minPoint,
          category: input.category,
          creator: input.creator || '',
          memo: input.memo || ''
        });
        return {
          sn: response.data.sn,
          keywords: response.data.keywords,
          nots: response.data.nots,
          minPoint: response.data.min_point,
          category: response.data.category,
          creator: response.data.creator || '',
          memo: response.data.memo || ''
        };
      } catch (error) {
        console.error('Error creating notice category settings:', error);
        throw new Error('Failed to create notice category settings');
      }
    },

    settingsNoticeCategoryUpdate: async (_: unknown, { input }: { input: SettingsNoticeCategoryInput }) => {
      try {
        const response = await apiClient.put(`/settings_notice_categorys/${input.category}`, {
          sn: input.sn,
          keywords: input.keywords,
          nots: input.nots,
          min_point: input.minPoint,
          category: input.category,
          creator: input.creator || '',
          memo: input.memo || ''
        });
        return {
          sn: response.data.sn,
          keywords: response.data.keywords,
          nots: response.data.nots,
          minPoint: response.data.min_point,
          category: response.data.category,
          creator: response.data.creator || '',
          memo: response.data.memo || ''
        };
      } catch (error) {
        console.error('Error updating notice category settings:', error);
        throw new Error('Failed to update notice category settings');
      }
    },

    settingsNoticeCategoryDelete: async (_: unknown, { sn }: { sn: number }) => {
      try {
        await apiClient.delete(`/settings_notice_categorys/${sn}`);
        return true;
      } catch (error) {
        console.error('Error deleting notice category settings:', error);
        throw new Error('Failed to delete notice category settings');
      }
    },

    settingsNoticeCategoryWeightSearch: async (_: unknown, { 
      keywords, minPoint, field, tableName, addFields, addWhere 
    }: {
      keywords: string;
      minPoint: number;
      field?: string;
      tableName?: string;
      addFields?: string[];
      addWhere?: string;
    }) => {
      try {
        const response = await apiClient.post('/category_weight_search', {
          keywords,
          min_point: minPoint,
          field: field || 'title',
          table_name: tableName || 'notice_list',
          add_fields: addFields || ['detail_url', 'posted_date', 'org_name'],
          add_where: addWhere || ''
        });
        
        return response.data.map((notice: NoticeSearchResult) => ({
          nid: notice.nid?.toString(),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          detailUrl: notice.detail_url,
          category: notice.category || "",
          region: notice.org_region || "미지정",
        }));
      } catch (error) {
        console.error('Error in category weight search:', error);
        throw new Error('Failed to search by category weight');
      }
    },

    settingsNoticeCategoryFilterNoticeList: async (_: unknown, { notStr, dicts, field }: {
      notStr: string;
      dicts: unknown[];
      field?: string;
    }) => {
      try {
        const response = await apiClient.post('/filter_notice_list', {
          not_str: notStr,
          dicts,
          field: field || 'title'
        });
        
        return response.data.map((notice: NoticeSearchResult) => ({
          nid: notice.nid?.toString(),
          title: notice.title,
          orgName: notice.org_name,
          postedAt: notice.posted_date,
          detailUrl: notice.detail_url,
          category: notice.category || "",
          region: notice.org_region || "미지정",
        }));
      } catch (error) {
        console.error('Error filtering notice list:', error);
        throw new Error('Failed to filter notice list');
      }
    },

    // Settings NAS Path Mutations
    settingsNasPathCreate: async (_: unknown, { input }: { input: SettingsNasPathInput }) => {
      try {
        const response = await apiClient.post('/settings_nas_path', {
          path_name: input.pathName,
          path_value: input.pathValue,
          description: input.description || '',
          is_active: input.isActive !== undefined ? input.isActive : true
        });
        return {
          id: response.data.id,
          pathName: response.data.path_name,
          pathValue: response.data.path_value,
          description: response.data.description || '',
          isActive: response.data.is_active
        };
      } catch (error) {
        console.error('Error creating NAS path settings:', error);
        throw new Error('Failed to create NAS path settings');
      }
    },

    settingsNasPathUpdate: async (_: unknown, { input }: { input: SettingsNasPathInput }) => {
      try {
        const response = await apiClient.put(`/settings_nas_path/${input.id}`, {
          path_name: input.pathName,
          path_value: input.pathValue,
          description: input.description || '',
          is_active: input.isActive !== undefined ? input.isActive : true
        });
        return {
          id: response.data.id,
          pathName: response.data.path_name,
          pathValue: response.data.path_value,
          description: response.data.description || '',
          isActive: response.data.is_active
        };
      } catch (error) {
        console.error('Error updating NAS path settings:', error);
        throw new Error('Failed to update NAS path settings');
      }
    },

    settingsNasPathDelete: async (_: unknown, { id }: { id: string }) => {
      try {
        await apiClient.delete(`/settings_nas_path/${id}`);
        return true;
      } catch (error) {
        console.error('Error deleting NAS path settings:', error);
        throw new Error('Failed to delete NAS path settings');
      }
    },

    // Settings App Default Mutations
    settingsAppDefaultCreate: async (_: unknown, { input }: { input: SettingsAppDefaultInput }) => {
      try {
        const response = await apiClient.post('/settings_app_default', {
          setting_key: input.settingKey,
          setting_value: input.settingValue,
          description: input.description || '',
          category: input.category || ''
        });
        return {
          id: response.data.id,
          settingKey: response.data.setting_key,
          settingValue: response.data.setting_value,
          description: response.data.description || '',
          category: response.data.category || ''
        };
      } catch (error) {
        console.error('Error creating app default settings:', error);
        throw new Error('Failed to create app default settings');
      }
    },

    settingsAppDefaultUpdate: async (_: unknown, { input }: { input: SettingsAppDefaultInput }) => {
      try {
        const response = await apiClient.put(`/settings_app_default/${input.id}`, {
          setting_key: input.settingKey,
          setting_value: input.settingValue,
          description: input.description || '',
          category: input.category || ''
        });
        return {
          id: response.data.id,
          settingKey: response.data.setting_key,
          settingValue: response.data.setting_value,
          description: response.data.description || '',
          category: response.data.category || ''
        };
      } catch (error) {
        console.error('Error updating app default settings:', error);
        throw new Error('Failed to update app default settings');
      }
    },

    settingsAppDefaultDelete: async (_: unknown, { id }: { id: string }) => {
      try {
        await apiClient.delete(`/settings_app_default/${id}`);
        return true;
      } catch (error) {
        console.error('Error deleting app default settings:', error);
        throw new Error('Failed to delete app default settings');
      }
    },
  },
};