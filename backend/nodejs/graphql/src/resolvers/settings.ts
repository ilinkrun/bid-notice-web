import { apiClient } from '@/lib/api/backendClient';

// Settings Notice List
interface SettingsNoticeListData {
  id: string;
  org_name: string;
  crawl_url: string;
  crawl_url_detail?: string;
  is_active: boolean;
  last_crawled_at?: string;
  memo?: string;
}

interface SettingsNoticeListInput {
  id?: string;
  orgName: string;
  crawlUrl: string;
  crawlUrlDetail?: string;
  isActive?: boolean;
  lastCrawledAt?: string;
  memo?: string;
}

// Settings Notice Detail
interface SettingsNoticeDetailData {
  id: string;
  org_name: string;
  detail_url: string;
  selector?: string;
  is_active: boolean;
  memo?: string;
}

interface SettingsNoticeDetailInput {
  id?: string;
  orgName: string;
  detailUrl: string;
  selector?: string;
  isActive?: boolean;
  memo?: string;
}

// Settings Notice Category
interface SettingsNoticeCategoryData {
  sn: number;
  keywords: string;
  nots: string;
  min_point: number;
  category: string;
  creator?: string;
  memo?: string;
}

interface SettingsNoticeCategoryInput {
  sn?: number;
  keywords: string;
  nots: string;
  minPoint: number;
  category: string;
  creator?: string;
  memo?: string;
}

// Settings NAS Path
interface SettingsNasPathData {
  id: number;
  name: string;
  area: string;
  depth: number;
  folder: string;
  remark?: string;
}

interface SettingsNasPathInput {
  id?: string;
  pathName: string;
  pathValue: string;
  description?: string;
  isActive?: boolean;
}

// Settings App Default
interface SettingsAppDefaultData {
  id: string;
  setting_key: string;
  setting_value: string;
  description?: string;
  category?: string;
}

interface SettingsAppDefaultInput {
  id?: string;
  settingKey: string;
  settingValue: string;
  description?: string;
  category?: string;
}

interface NoticeSearchResult {
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
          id: setting.id,
          orgName: setting.org_name,
          crawlUrl: setting.crawl_url,
          crawlUrlDetail: setting.crawl_url_detail || '',
          isActive: setting.is_active,
          lastCrawledAt: setting.last_crawled_at || '',
          memo: setting.memo || ''
        }));
      } catch (error) {
        console.error('Error fetching all notice list settings:', error);
        return [];
      }
    },

    settingsNoticeListOne: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        const response = await apiClient.get(`/settings_notice_list/${orgName}`);
        const setting = response.data;
        return {
          id: setting.id,
          orgName: setting.org_name,
          crawlUrl: setting.crawl_url,
          crawlUrlDetail: setting.crawl_url_detail || '',
          isActive: setting.is_active,
          lastCrawledAt: setting.last_crawled_at || '',
          memo: setting.memo || ''
        };
      } catch (error) {
        console.error('Error fetching notice list settings by org name:', error);
        return null;
      }
    },

    settingsNoticeListByOrg: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        const response = await apiClient.get(`/settings_notice_list/org/${orgName}`);
        return response.data.map((setting: SettingsNoticeListData) => ({
          id: setting.id,
          orgName: setting.org_name,
          crawlUrl: setting.crawl_url,
          crawlUrlDetail: setting.crawl_url_detail || '',
          isActive: setting.is_active,
          lastCrawledAt: setting.last_crawled_at || '',
          memo: setting.memo || ''
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
          id: setting.id,
          orgName: setting.org_name,
          detailUrl: setting.detail_url,
          selector: setting.selector || '',
          isActive: setting.is_active,
          memo: setting.memo || ''
        }));
      } catch (error) {
        console.error('Error fetching all notice detail settings:', error);
        return [];
      }
    },

    settingsNoticeDetailOne: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        const response = await apiClient.get(`/settings_notice_detail/${orgName}`);
        const setting = response.data;
        return {
          id: setting.id,
          orgName: setting.org_name,
          detailUrl: setting.detail_url,
          selector: setting.selector || '',
          isActive: setting.is_active,
          memo: setting.memo || ''
        };
      } catch (error) {
        console.error('Error fetching notice detail settings by org name:', error);
        return null;
      }
    },

    settingsNoticeDetailByOrg: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        const response = await apiClient.get(`/settings_notice_detail/org/${orgName}`);
        return response.data.map((setting: SettingsNoticeDetailData) => ({
          id: setting.id,
          orgName: setting.org_name,
          detailUrl: setting.detail_url,
          selector: setting.selector || '',
          isActive: setting.is_active,
          memo: setting.memo || ''
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
          crawl_url: input.crawlUrl,
          crawl_url_detail: input.crawlUrlDetail || '',
          is_active: input.isActive !== undefined ? input.isActive : true,
          memo: input.memo || ''
        });
        return {
          id: response.data.id,
          orgName: response.data.org_name,
          crawlUrl: response.data.crawl_url,
          crawlUrlDetail: response.data.crawl_url_detail || '',
          isActive: response.data.is_active,
          lastCrawledAt: response.data.last_crawled_at || '',
          memo: response.data.memo || ''
        };
      } catch (error) {
        console.error('Error creating notice list settings:', error);
        throw new Error('Failed to create notice list settings');
      }
    },

    settingsNoticeListUpdate: async (_: unknown, { input }: { input: SettingsNoticeListInput }) => {
      try {
        const response = await apiClient.put(`/settings_notice_list/${input.id}`, {
          org_name: input.orgName,
          crawl_url: input.crawlUrl,
          crawl_url_detail: input.crawlUrlDetail || '',
          is_active: input.isActive !== undefined ? input.isActive : true,
          memo: input.memo || ''
        });
        return {
          id: response.data.id,
          orgName: response.data.org_name,
          crawlUrl: response.data.crawl_url,
          crawlUrlDetail: response.data.crawl_url_detail || '',
          isActive: response.data.is_active,
          lastCrawledAt: response.data.last_crawled_at || '',
          memo: response.data.memo || ''
        };
      } catch (error) {
        console.error('Error updating notice list settings:', error);
        throw new Error('Failed to update notice list settings');
      }
    },

    settingsNoticeListDelete: async (_: unknown, { id }: { id: string }) => {
      try {
        await apiClient.delete(`/settings_notice_list/${id}`);
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
          detail_url: input.detailUrl,
          selector: input.selector || '',
          is_active: input.isActive !== undefined ? input.isActive : true,
          memo: input.memo || ''
        });
        return {
          id: response.data.id,
          orgName: response.data.org_name,
          detailUrl: response.data.detail_url,
          selector: response.data.selector || '',
          isActive: response.data.is_active,
          memo: response.data.memo || ''
        };
      } catch (error) {
        console.error('Error creating notice detail settings:', error);
        throw new Error('Failed to create notice detail settings');
      }
    },

    settingsNoticeDetailUpdate: async (_: unknown, { input }: { input: SettingsNoticeDetailInput }) => {
      try {
        const response = await apiClient.put(`/settings_notice_detail/${input.id}`, {
          org_name: input.orgName,
          detail_url: input.detailUrl,
          selector: input.selector || '',
          is_active: input.isActive !== undefined ? input.isActive : true,
          memo: input.memo || ''
        });
        return {
          id: response.data.id,
          orgName: response.data.org_name,
          detailUrl: response.data.detail_url,
          selector: response.data.selector || '',
          isActive: response.data.is_active,
          memo: response.data.memo || ''
        };
      } catch (error) {
        console.error('Error updating notice detail settings:', error);
        throw new Error('Failed to update notice detail settings');
      }
    },

    settingsNoticeDetailDelete: async (_: unknown, { id }: { id: string }) => {
      try {
        await apiClient.delete(`/settings_notice_detail/${id}`);
        return true;
      } catch (error) {
        console.error('Error deleting notice detail settings:', error);
        throw new Error('Failed to delete notice detail settings');
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