import { executeQuery } from '@/utils/database/mysql';
import {
  getSettingsNoticeList,
  getSettingsNoticeListByOid,
  getSettingsNoticeListByOrgName,
  upsertSettingsNoticeListByOid,
  getSettingsNoticeDetail,
  getSettingsNoticeDetailByOid,
  getSettingsNoticeDetailByOrgName,
  upsertSettingsNoticeDetailByOid,
  getAllNoticeCategorySettings,
  getNoticeCategorySetting,
  parseKeywordWeights,
  searchNoticeList,
  filterNoticeList,
  getNasPathSettings,
  getNasPathSettingById,
  createNasPathSetting,
  updateNasPathSetting,
  deleteNasPathSetting
} from '@/utils/utilsGovBid';

// App Settings
export interface AppSettingData {
  sn: number;
  area: string;
  name: string;
  value: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface AppSettingInput {
  sn?: number;
  area: string;
  name: string;
  value: string;
  remark?: string;
}

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
        const settings = await getSettingsNoticeList();
        return settings.map((setting) => ({
          oid: setting.oid,
          orgName: setting.org_name,
          url: setting.url,
          iframe: setting.iframe || '',
          rowXpath: setting.rowXpath || '',
          paging: setting.paging || '',
          startPage: setting.startPage || 0,
          endPage: setting.endPage || 0,
          login: setting.login || '',
          use: setting.use || 0,
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
        const setting = await getSettingsNoticeListByOid(oid);
        if (!setting) {
          return null;
        }
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
          use: setting.use || 0,
          orgRegion: setting.org_region || '',
          registration: setting.registration || '',
          title: setting.title || '',
          detailUrl: setting.detail_url || '',
          postedDate: setting.posted_date || '',
          postedBy: setting.posted_by || '',
          companyInCharge: setting.company_in_charge || '',
          orgMan: setting.org_man || '',
          exceptionRow: setting.exception_row || '',
          elements: []
        };
      } catch (error) {
        console.error('Error fetching notice list settings by oid:', error);
        return null;
      }
    },

    settingListByOid: async (_: unknown, { oid }: { oid: number }) => {
      try {
        const setting = await getSettingsNoticeListByOid(oid);
        if (!setting) {
          return null;
        }
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
          use: setting.use || 0,
          orgRegion: setting.org_region || '',
          registration: setting.registration || '',
          title: setting.title || '',
          postedDate: setting.posted_date || '',
          postedBy: setting.posted_by || '',
          companyInCharge: setting.company_in_charge || '',
          orgMan: setting.org_man || '',
          exceptionRow: setting.exception_row || '',
          elements: []
        };
      } catch (error) {
        console.error('Error fetching setting list by oid:', error);
        return null;
      }
    },

    settingsNoticeListByOrg: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        console.log(`Fetching settings for organization: ${orgName}`);
        const setting = await getSettingsNoticeListByOrgName(orgName);

        if (!setting) {
          console.error('No settings found for organization:', orgName);
          return [];
        }

        return [{
          oid: setting.oid,
          orgName: setting.org_name,
          url: setting.url,
          iframe: setting.iframe || '',
          rowXpath: setting.rowXpath || '',
          paging: setting.paging || '',
          startPage: setting.startPage || 0,
          endPage: setting.endPage || 0,
          login: setting.login || '',
          use: setting.use || 0,
          orgRegion: setting.org_region || '',
          registration: setting.registration || '',
          title: setting.title || '',
          detailUrl: setting.detail_url || '',
          postedDate: setting.posted_date || '',
          postedBy: setting.posted_by || '',
          companyInCharge: setting.company_in_charge || '',
          orgMan: setting.org_man || '',
          exceptionRow: setting.exception_row || ''
        }];
      } catch (error) {
        console.error('Error fetching notice list settings by org:', error);
        return [];
      }
    },

    // Settings Notice Detail
    settingsNoticeDetailAll: async () => {
      try {
        const settings = await getSettingsNoticeDetail();
        return settings.map((setting) => ({
          oid: setting.oid,
          orgName: setting.org_name || '',
          use: setting.use,
          url: setting.url || '',
          naverMapKeyword: setting.naver_map_keyword || '',
          xPath: setting.x_path || '',
          xPathNoticeNum: setting.x_path_notice_num || '',
          xPathTitle: setting.x_path_title || '',
          xPathOrg: setting.x_path_org || '',
          xPathDemandOrg: setting.x_path_demand_org || '',
          xPathBidType: setting.x_path_bid_type || '',
          xPathAnnounceDate: setting.x_path_announce_date || '',
          xPathDeadlineDate: setting.x_path_deadline_date || '',
          xPathDepositDeadlineDate: setting.x_path_deposit_deadline_date || '',
          xPathDemandDeadlineDate: setting.x_path_demand_deadline_date || '',
          xPathProduct: setting.x_path_product || '',
          xPathBasePrice: setting.x_path_base_price || '',
          xPathFiles: setting.x_path_files || '',
          xPathTargetIndex: setting.x_path_target_index !== null ? setting.x_path_target_index : null,
          xPathNoticeNumTargetIndex: setting.x_path_notice_num_target_index !== null ? setting.x_path_notice_num_target_index : null,
          xPathTitleTargetIndex: setting.x_path_title_target_index !== null ? setting.x_path_title_target_index : null,
          xPathOrgTargetIndex: setting.x_path_org_target_index !== null ? setting.x_path_org_target_index : null,
          xPathDemandOrgTargetIndex: setting.x_path_demand_org_target_index !== null ? setting.x_path_demand_org_target_index : null,
          xPathBidTypeTargetIndex: setting.x_path_bid_type_target_index !== null ? setting.x_path_bid_type_target_index : null,
          xPathAnnounceDateTargetIndex: setting.x_path_announce_date_target_index !== null ? setting.x_path_announce_date_target_index : null,
          xPathDeadlineDateTargetIndex: setting.x_path_deadline_date_target_index !== null ? setting.x_path_deadline_date_target_index : null,
          xPathDepositDeadlineDateTargetIndex: setting.x_path_deposit_deadline_date_target_index !== null ? setting.x_path_deposit_deadline_date_target_index : null,
          xPathDemandDeadlineDateTargetIndex: setting.x_path_demand_deadline_date_target_index !== null ? setting.x_path_demand_deadline_date_target_index : null,
          xPathProductTargetIndex: setting.x_path_product_target_index !== null ? setting.x_path_product_target_index : null,
          xPathBasePriceTargetIndex: setting.x_path_base_price_target_index !== null ? setting.x_path_base_price_target_index : null,
          xPathFilesTargetIndex: setting.x_path_files_target_index !== null ? setting.x_path_files_target_index : null,
        }));
      } catch (error) {
        console.error('Error fetching all notice detail settings:', error);
        return [];
      }
    },

    settingsNoticeDetailOne: async (_: unknown, { oid }: { oid: number }) => {
      try {
        const setting = await getSettingsNoticeDetailByOid(oid);
        if (!setting) {
          return null;
        }
        return {
          oid: setting.oid,
          orgName: setting.org_name || '',
          use: setting.use,
          url: setting.url || '',
          naverMapKeyword: setting.naver_map_keyword || '',
          xPath: setting.x_path || '',
          xPathNoticeNum: setting.x_path_notice_num || '',
          xPathTitle: setting.x_path_title || '',
          xPathOrg: setting.x_path_org || '',
          xPathDemandOrg: setting.x_path_demand_org || '',
          xPathBidType: setting.x_path_bid_type || '',
          xPathAnnounceDate: setting.x_path_announce_date || '',
          xPathDeadlineDate: setting.x_path_deadline_date || '',
          xPathDepositDeadlineDate: setting.x_path_deposit_deadline_date || '',
          xPathDemandDeadlineDate: setting.x_path_demand_deadline_date || '',
          xPathProduct: setting.x_path_product || '',
          xPathBasePrice: setting.x_path_base_price || '',
          xPathFiles: setting.x_path_files || '',
          xPathTargetIndex: setting.x_path_target_index !== null ? setting.x_path_target_index : null,
          xPathNoticeNumTargetIndex: setting.x_path_notice_num_target_index !== null ? setting.x_path_notice_num_target_index : null,
          xPathTitleTargetIndex: setting.x_path_title_target_index !== null ? setting.x_path_title_target_index : null,
          xPathOrgTargetIndex: setting.x_path_org_target_index !== null ? setting.x_path_org_target_index : null,
          xPathDemandOrgTargetIndex: setting.x_path_demand_org_target_index !== null ? setting.x_path_demand_org_target_index : null,
          xPathBidTypeTargetIndex: setting.x_path_bid_type_target_index !== null ? setting.x_path_bid_type_target_index : null,
          xPathAnnounceDateTargetIndex: setting.x_path_announce_date_target_index !== null ? setting.x_path_announce_date_target_index : null,
          xPathDeadlineDateTargetIndex: setting.x_path_deadline_date_target_index !== null ? setting.x_path_deadline_date_target_index : null,
          xPathDepositDeadlineDateTargetIndex: setting.x_path_deposit_deadline_date_target_index !== null ? setting.x_path_deposit_deadline_date_target_index : null,
          xPathDemandDeadlineDateTargetIndex: setting.x_path_demand_deadline_date_target_index !== null ? setting.x_path_demand_deadline_date_target_index : null,
          xPathProductTargetIndex: setting.x_path_product_target_index !== null ? setting.x_path_product_target_index : null,
          xPathBasePriceTargetIndex: setting.x_path_base_price_target_index !== null ? setting.x_path_base_price_target_index : null,
          xPathFilesTargetIndex: setting.x_path_files_target_index !== null ? setting.x_path_files_target_index : null,
        };
      } catch (error) {
        console.error('Error fetching notice detail settings by oid:', error);
        return null;
      }
    },

    settingsDetailByOid: async (_: unknown, { oid }: { oid: number }) => {
      try {
        const setting = await getSettingsNoticeDetailByOid(oid);
        if (!setting) {
          return null;
        }
        return {
          oid: setting.oid,
          orgName: setting.org_name || '',
          use: setting.use,
          url: setting.url || '',
          naverMapKeyword: setting.naver_map_keyword || '',
          xPath: setting.x_path || '',
          xPathNoticeNum: setting.x_path_notice_num || '',
          xPathTitle: setting.x_path_title || '',
          xPathOrg: setting.x_path_org || '',
          xPathDemandOrg: setting.x_path_demand_org || '',
          xPathBidType: setting.x_path_bid_type || '',
          xPathAnnounceDate: setting.x_path_announce_date || '',
          xPathDeadlineDate: setting.x_path_deadline_date || '',
          xPathDepositDeadlineDate: setting.x_path_deposit_deadline_date || '',
          xPathDemandDeadlineDate: setting.x_path_demand_deadline_date || '',
          xPathProduct: setting.x_path_product || '',
          xPathBasePrice: setting.x_path_base_price || '',
          xPathFiles: setting.x_path_files || '',
          xPathTargetIndex: setting.x_path_target_index !== null ? setting.x_path_target_index : null,
          xPathNoticeNumTargetIndex: setting.x_path_notice_num_target_index !== null ? setting.x_path_notice_num_target_index : null,
          xPathTitleTargetIndex: setting.x_path_title_target_index !== null ? setting.x_path_title_target_index : null,
          xPathOrgTargetIndex: setting.x_path_org_target_index !== null ? setting.x_path_org_target_index : null,
          xPathDemandOrgTargetIndex: setting.x_path_demand_org_target_index !== null ? setting.x_path_demand_org_target_index : null,
          xPathBidTypeTargetIndex: setting.x_path_bid_type_target_index !== null ? setting.x_path_bid_type_target_index : null,
          xPathAnnounceDateTargetIndex: setting.x_path_announce_date_target_index !== null ? setting.x_path_announce_date_target_index : null,
          xPathDeadlineDateTargetIndex: setting.x_path_deadline_date_target_index !== null ? setting.x_path_deadline_date_target_index : null,
          xPathDepositDeadlineDateTargetIndex: setting.x_path_deposit_deadline_date_target_index !== null ? setting.x_path_deposit_deadline_date_target_index : null,
          xPathDemandDeadlineDateTargetIndex: setting.x_path_demand_deadline_date_target_index !== null ? setting.x_path_demand_deadline_date_target_index : null,
          xPathProductTargetIndex: setting.x_path_product_target_index !== null ? setting.x_path_product_target_index : null,
          xPathBasePriceTargetIndex: setting.x_path_base_price_target_index !== null ? setting.x_path_base_price_target_index : null,
          xPathFilesTargetIndex: setting.x_path_files_target_index !== null ? setting.x_path_files_target_index : null,
        };
      } catch (error) {
        console.error('Error fetching settings detail by oid:', error);
        return null;
      }
    },

    settingsNoticeDetailByOrg: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        const setting = await getSettingsNoticeDetailByOrgName(orgName);
        if (!setting) {
          return [];
        }
        return [{
          oid: setting.oid,
          orgName: setting.org_name || '',
          use: setting.use,
          url: setting.url || '',
          naverMapKeyword: setting.naver_map_keyword || '',
          xPath: setting.x_path || '',
          xPathNoticeNum: setting.x_path_notice_num || '',
          xPathTitle: setting.x_path_title || '',
          xPathOrg: setting.x_path_org || '',
          xPathDemandOrg: setting.x_path_demand_org || '',
          xPathBidType: setting.x_path_bid_type || '',
          xPathAnnounceDate: setting.x_path_announce_date || '',
          xPathDeadlineDate: setting.x_path_deadline_date || '',
          xPathDepositDeadlineDate: setting.x_path_deposit_deadline_date || '',
          xPathDemandDeadlineDate: setting.x_path_demand_deadline_date || '',
          xPathProduct: setting.x_path_product || '',
          xPathBasePrice: setting.x_path_base_price || '',
          xPathFiles: setting.x_path_files || '',
          xPathTargetIndex: setting.x_path_target_index !== null ? setting.x_path_target_index : null,
          xPathNoticeNumTargetIndex: setting.x_path_notice_num_target_index !== null ? setting.x_path_notice_num_target_index : null,
          xPathTitleTargetIndex: setting.x_path_title_target_index !== null ? setting.x_path_title_target_index : null,
          xPathOrgTargetIndex: setting.x_path_org_target_index !== null ? setting.x_path_org_target_index : null,
          xPathDemandOrgTargetIndex: setting.x_path_demand_org_target_index !== null ? setting.x_path_demand_org_target_index : null,
          xPathBidTypeTargetIndex: setting.x_path_bid_type_target_index !== null ? setting.x_path_bid_type_target_index : null,
          xPathAnnounceDateTargetIndex: setting.x_path_announce_date_target_index !== null ? setting.x_path_announce_date_target_index : null,
          xPathDeadlineDateTargetIndex: setting.x_path_deadline_date_target_index !== null ? setting.x_path_deadline_date_target_index : null,
          xPathDepositDeadlineDateTargetIndex: setting.x_path_deposit_deadline_date_target_index !== null ? setting.x_path_deposit_deadline_date_target_index : null,
          xPathDemandDeadlineDateTargetIndex: setting.x_path_demand_deadline_date_target_index !== null ? setting.x_path_demand_deadline_date_target_index : null,
          xPathProductTargetIndex: setting.x_path_product_target_index !== null ? setting.x_path_product_target_index : null,
          xPathBasePriceTargetIndex: setting.x_path_base_price_target_index !== null ? setting.x_path_base_price_target_index : null,
          xPathFilesTargetIndex: setting.x_path_files_target_index !== null ? setting.x_path_files_target_index : null,
        }];
      } catch (error) {
        console.error('Error fetching notice detail settings by org:', error);
        return [];
      }
    },

    // Settings Notice Category
    settingsNoticeCategoryAll: async () => {
      try {
        const categories = await getAllNoticeCategorySettings();
        return categories
          .map((category) => ({
            sn: category.sn,
            keywords: category.keywords,
            nots: category.nots,
            minPoint: category.min_point,
            category: category.category,
            creator: category.creator || '',
            memo: category.memo || ''
          }))
          .sort((a, b) => a.sn - b.sn);
      } catch (error) {
        console.error('Error fetching notice category settings:', error);
        return [];
      }
    },

    settingsNoticeCategoryByCategory: async (_: unknown, { category }: { category: string }) => {
      try {
        const setting = await getNoticeCategorySetting(category);
        if (!setting) {
          return [];
        }
        return [{
          sn: setting.sn,
          keywords: setting.keywords,
          nots: setting.nots,
          minPoint: setting.min_point,
          category: setting.category,
          creator: setting.creator || '',
          memo: setting.memo || ''
        }];
      } catch (error) {
        console.error('Error fetching notice category settings by category:', error);
        return [];
      }
    },

    settingsNoticeCategoryParseKeywordWeights: async (_: unknown, { keywordWeightStr }: { keywordWeightStr: string }) => {
      try {
        return parseKeywordWeights(keywordWeightStr);
      } catch (error) {
        console.error('Error parsing keyword weights:', error);
        return [];
      }
    },

    // Settings NAS Path
    settingsNasPathAll: async () => {
      try {
        const settings = await getNasPathSettings();
        return settings.map((setting) => ({
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
        const setting = await getNasPathSettingById(Number(id));
        if (!setting) {
          return null;
        }
        return {
          id: setting.id.toString(),
          pathName: setting.name,
          pathValue: setting.folder,
          description: setting.remark || '',
          isActive: setting.area !== 'disabled'
        };
      } catch (error) {
        console.error('Error fetching NAS path settings by id:', error);
        return null;
      }
    },

    // App Settings - Direct MySQL queries
    appSettingsAll: async () => {
      try {
        const rows = await executeQuery(`
          SELECT sn, area, name, value, remark, created_at, updated_at
          FROM settings_app_default
          ORDER BY area ASC, name ASC
        `) as AppSettingData[];

        return rows.map(row => ({
          sn: row.sn,
          area: row.area,
          name: row.name,
          value: row.value,
          remark: row.remark || null,
          created_at: row.created_at,
          updated_at: row.updated_at
        }));
      } catch (error) {
        console.error('Error fetching app settings:', error);
        throw new Error('Failed to fetch app settings');
      }
    },

    appSettingsByArea: async (_: unknown, { area }: { area: string }) => {
      try {
        const rows = await executeQuery(`
          SELECT sn, area, name, value, remark, created_at, updated_at
          FROM settings_app_default
          WHERE area = ?
          ORDER BY name ASC
        `, [area]) as AppSettingData[];

        return rows.map(row => ({
          sn: row.sn,
          area: row.area,
          name: row.name,
          value: row.value,
          remark: row.remark || null,
          created_at: row.created_at,
          updated_at: row.updated_at
        }));
      } catch (error) {
        console.error('Error fetching app settings by area:', error);
        throw new Error('Failed to fetch app settings by area');
      }
    },

    appSettingByName: async (_: unknown, { area, name }: { area: string, name: string }) => {
      try {
        const rows = await executeQuery(`
          SELECT sn, area, name, value, remark, created_at, updated_at
          FROM settings_app_default
          WHERE area = ? AND name = ?
          LIMIT 1
        `, [area, name]) as AppSettingData[];

        if (rows.length === 0) {
          return null;
        }

        const row = rows[0];
        return {
          sn: row.sn,
          area: row.area,
          name: row.name,
          value: row.value,
          remark: row.remark || null,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      } catch (error) {
        console.error('Error fetching app setting by name:', error);
        return null;
      }
    },

    appSettingValue: async (_: unknown, { area, name }: { area: string, name: string }) => {
      try {
        const rows = await executeQuery(`
          SELECT value
          FROM settings_app_default
          WHERE area = ? AND name = ?
          LIMIT 1
        `, [area, name]) as { value: string }[];

        return rows.length > 0 ? rows[0].value : null;
      } catch (error) {
        console.error('Error fetching app setting value:', error);
        return null;
      }
    },
  },

  Mutation: {
    // Settings Notice List Mutations - Use upsert for create/update
    settingsNoticeListCreate: async (_: unknown, { input }: { input: SettingsNoticeListInput }) => {
      try {
        // Create by inserting
        const data = {
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
        };

        const result = await executeQuery(\`
          INSERT INTO settings_notice_list SET ?
        \`, [data]);

        const oid = (result as any).insertId;
        const created = await getSettingsNoticeListByOid(oid);

        if (!created) {
          throw new Error('Failed to retrieve created setting');
        }

        return {
          oid: created.oid,
          orgName: created.org_name,
          url: created.url,
          iframe: created.iframe || '',
          rowXpath: created.rowXpath || '',
          paging: created.paging || '',
          startPage: created.startPage || 0,
          endPage: created.endPage || 0,
          login: created.login || '',
          use: created.use || 0,
          orgRegion: created.org_region || '',
          registration: created.registration || '',
          title: created.title || '',
          detailUrl: created.detail_url || '',
          postedDate: created.posted_date || '',
          postedBy: created.posted_by || '',
          companyInCharge: created.company_in_charge || '',
          orgMan: created.org_man || '',
          exceptionRow: created.exception_row || ''
        };
      } catch (error) {
        console.error('Error creating notice list settings:', error);
        throw new Error('Failed to create notice list settings');
      }
    },

    settingsNoticeListUpdate: async (_: unknown, { input }: { input: SettingsNoticeListInput }) => {
      try {
        if (!input.oid) {
          throw new Error('oid is required for update');
        }

        await upsertSettingsNoticeListByOid(input.oid, {
          org_name: input.orgName,
          url: input.url,
          iframe: input.iframe,
          rowXpath: input.rowXpath,
          paging: input.paging,
          startPage: input.startPage,
          endPage: input.endPage,
          login: input.login,
          use: input.use,
          org_region: input.orgRegion,
          registration: input.registration,
          title: input.title,
          detail_url: input.detailUrl,
          posted_date: input.postedDate,
          posted_by: input.postedBy,
          company_in_charge: input.companyInCharge,
          org_man: input.orgMan,
          exception_row: input.exceptionRow,
        });

        const updated = await getSettingsNoticeListByOid(input.oid);
        if (!updated) {
          throw new Error('Failed to retrieve updated setting');
        }

        return {
          oid: updated.oid,
          orgName: updated.org_name,
          url: updated.url,
          iframe: updated.iframe || '',
          rowXpath: updated.rowXpath || '',
          paging: updated.paging || '',
          startPage: updated.startPage || 0,
          endPage: updated.endPage || 0,
          login: updated.login || '',
          use: updated.use || 0,
          orgRegion: updated.org_region || '',
          registration: updated.registration || '',
          title: updated.title || '',
          detailUrl: updated.detail_url || '',
          postedDate: updated.posted_date || '',
          postedBy: updated.posted_by || '',
          companyInCharge: updated.company_in_charge || '',
          orgMan: updated.org_man || '',
          exceptionRow: updated.exception_row || ''
        };
      } catch (error) {
        console.error('Error updating notice list settings:', error);
        throw new Error('Failed to update notice list settings');
      }
    },

    settingsNoticeListDelete: async (_: unknown, { oid }: { oid: number }) => {
      try {
        const result = await executeQuery(\`
          DELETE FROM settings_notice_list WHERE oid = ?
        \`, [oid]);
        return (result as any).affectedRows > 0;
      } catch (error) {
        console.error('Error deleting notice list settings:', error);
        throw new Error('Failed to delete notice list settings');
      }
    },

    // Settings Notice Detail Mutations
    settingsNoticeDetailCreate: async (_: unknown, { input }: { input: SettingsNoticeDetailInput }) => {
      try {
        const data = {
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
        };

        const result = await executeQuery(\`
          INSERT INTO settings_notice_detail SET ?
        \`, [data]);

        const oid = (result as any).insertId;
        const created = await getSettingsNoticeDetailByOid(oid);

        if (!created) {
          throw new Error('Failed to retrieve created detail setting');
        }

        return {
          oid: created.oid,
          orgName: created.org_name || '',
          use: created.use,
          url: created.url || '',
          naverMapKeyword: created.naver_map_keyword || '',
          xPath: created.x_path || '',
          xPathNoticeNum: created.x_path_notice_num || '',
          xPathTitle: created.x_path_title || '',
          xPathOrg: created.x_path_org || '',
          xPathDemandOrg: created.x_path_demand_org || '',
          xPathBidType: created.x_path_bid_type || '',
          xPathAnnounceDate: created.x_path_announce_date || '',
          xPathDeadlineDate: created.x_path_deadline_date || '',
          xPathDepositDeadlineDate: created.x_path_deposit_deadline_date || '',
          xPathDemandDeadlineDate: created.x_path_demand_deadline_date || '',
          xPathProduct: created.x_path_product || '',
          xPathBasePrice: created.x_path_base_price || '',
          xPathFiles: created.x_path_files || '',
        };
      } catch (error) {
        console.error('Error creating notice detail settings:', error);
        throw new Error('Failed to create notice detail settings');
      }
    },

    settingsNoticeDetailUpdate: async (_: unknown, { input }: { input: SettingsNoticeDetailInput }) => {
      try {
        if (!input.oid) {
          throw new Error('oid is required for update');
        }

        await upsertSettingsNoticeDetailByOid(input.oid, {
          org_name: input.orgName,
          title: input.title,
          body_html: input.bodyHtml,
          file_name: input.fileName,
          file_url: input.fileUrl,
          preview: input.preview,
          notice_div: input.noticeDiv,
          notice_num: input.noticeNum,
          org_dept: input.orgDept,
          org_man: input.orgMan,
          org_tel: input.orgTel,
          use: input.use,
          sample_url: input.sampleUrl,
          down: input.down,
        });

        const updated = await getSettingsNoticeDetailByOid(input.oid);
        if (!updated) {
          throw new Error('Failed to retrieve updated detail setting');
        }

        return {
          oid: updated.oid,
          orgName: updated.org_name || '',
          use: updated.use,
          url: updated.url || '',
          naverMapKeyword: updated.naver_map_keyword || '',
          xPath: updated.x_path || '',
          xPathNoticeNum: updated.x_path_notice_num || '',
          xPathTitle: updated.x_path_title || '',
          xPathOrg: updated.x_path_org || '',
          xPathDemandOrg: updated.x_path_demand_org || '',
          xPathBidType: updated.x_path_bid_type || '',
          xPathAnnounceDate: updated.x_path_announce_date || '',
          xPathDeadlineDate: updated.x_path_deadline_date || '',
          xPathDepositDeadlineDate: updated.x_path_deposit_deadline_date || '',
          xPathDemandDeadlineDate: updated.x_path_demand_deadline_date || '',
          xPathProduct: updated.x_path_product || '',
          xPathBasePrice: updated.x_path_base_price || '',
          xPathFiles: updated.x_path_files || '',
        };
      } catch (error) {
        console.error('Error updating notice detail settings:', error);
        throw new Error('Failed to update notice detail settings');
      }
    },

    settingsNoticeDetailDelete: async (_: unknown, { oid }: { oid: number }) => {
      try {
        const result = await executeQuery(\`
          DELETE FROM settings_notice_detail WHERE oid = ?
        \`, [oid]);
        return (result as any).affectedRows > 0;
      } catch (error) {
        console.error('Error deleting notice detail settings:', error);
        throw new Error('Failed to delete notice detail settings');
      }
    },

    upsertSettingsDetailByOid: async (_: unknown, { oid, input }: { oid: number; input: SettingsNoticeDetailInput }) => {
      try {
        await upsertSettingsNoticeDetailByOid(oid, {
          org_name: input.orgName,
          title: input.title,
          body_html: input.bodyHtml,
          file_name: input.fileName,
          file_url: input.fileUrl,
          preview: input.preview,
          notice_div: input.noticeDiv,
          notice_num: input.noticeNum,
          org_dept: input.orgDept,
          org_man: input.orgMan,
          org_tel: input.orgTel,
          use: input.use,
          sample_url: input.sampleUrl,
          down: input.down,
        });

        const updated = await getSettingsNoticeDetailByOid(oid);
        if (!updated) {
          throw new Error('Failed to retrieve upserted detail setting');
        }

        return {
          oid: updated.oid,
          orgName: updated.org_name || '',
          use: updated.use,
          url: updated.url || '',
          naverMapKeyword: updated.naver_map_keyword || '',
          xPath: updated.x_path || '',
          xPathNoticeNum: updated.x_path_notice_num || '',
          xPathTitle: updated.x_path_title || '',
          xPathOrg: updated.x_path_org || '',
          xPathDemandOrg: updated.x_path_demand_org || '',
          xPathBidType: updated.x_path_bid_type || '',
          xPathAnnounceDate: updated.x_path_announce_date || '',
          xPathDeadlineDate: updated.x_path_deadline_date || '',
          xPathDepositDeadlineDate: updated.x_path_deposit_deadline_date || '',
          xPathDemandDeadlineDate: updated.x_path_demand_deadline_date || '',
          xPathProduct: updated.x_path_product || '',
          xPathBasePrice: updated.x_path_base_price || '',
          xPathFiles: updated.x_path_files || '',
        };
      } catch (error) {
        console.error('Error upserting settings detail by oid:', error);
        throw new Error('Failed to upsert settings detail');
      }
    },

    // Settings Notice Category Mutations
    settingsNoticeCategoryCreate: async (_: unknown, { input }: { input: SettingsNoticeCategoryInput }) => {
      try {
        const result = await executeQuery(\`
          INSERT INTO settings_notice_category (keywords, nots, min_point, category, creator, memo)
          VALUES (?, ?, ?, ?, ?, ?)
        \`, [input.keywords, input.nots, input.minPoint, input.category, input.creator || '', input.memo || '']);

        const sn = (result as any).insertId;

        return {
          sn,
          keywords: input.keywords,
          nots: input.nots,
          minPoint: input.minPoint,
          category: input.category,
          creator: input.creator || '',
          memo: input.memo || ''
        };
      } catch (error) {
        console.error('Error creating notice category settings:', error);
        throw new Error('Failed to create notice category settings');
      }
    },

    settingsNoticeCategoryUpdate: async (_: unknown, { input }: { input: SettingsNoticeCategoryInput }) => {
      try {
        if (!input.sn) {
          throw new Error('sn is required for update');
        }

        await executeQuery(\`
          UPDATE settings_notice_category
          SET keywords = ?, nots = ?, min_point = ?, category = ?, creator = ?, memo = ?
          WHERE sn = ?
        \`, [input.keywords, input.nots, input.minPoint, input.category, input.creator || '', input.memo || '', input.sn]);

        return {
          sn: input.sn,
          keywords: input.keywords,
          nots: input.nots,
          minPoint: input.minPoint,
          category: input.category,
          creator: input.creator || '',
          memo: input.memo || ''
        };
      } catch (error) {
        console.error('Error updating notice category settings:', error);
        throw new Error('Failed to update notice category settings');
      }
    },

    settingsNoticeCategoryDelete: async (_: unknown, { sn }: { sn: number }) => {
      try {
        const result = await executeQuery(\`
          DELETE FROM settings_notice_category WHERE sn = ?
        \`, [sn]);
        return (result as any).affectedRows > 0;
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
        const results = await searchNoticeList({
          keywords,
          minPoint: minPoint || 4,
          field: field || 'title',
          addFields: addFields || ['detail_url', 'posted_date', 'org_name'],
          addWhere: addWhere || ''
        });

        return results.map((notice: any) => ({
          nid: notice.nid?.toString(),
          title: notice.title || '',
          orgName: notice.org_name || '',
          postedAt: notice.posted_date || '',
          detailUrl: notice.detail_url || '',
          category: notice.category || '',
          region: notice.org_region || '미지정',
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
        const filtered = filterNoticeList(notStr, dicts as any[], field || 'title');

        return filtered.map((notice: any) => ({
          nid: notice.nid?.toString(),
          title: notice.title || '',
          orgName: notice.org_name || '',
          postedAt: notice.posted_date || '',
          detailUrl: notice.detail_url || '',
          category: notice.category || '',
          region: notice.org_region || '미지정',
        }));
      } catch (error) {
        console.error('Error filtering notice list:', error);
        throw new Error('Failed to filter notice list');
      }
    },

    // Settings NAS Path Mutations
    settingsNasPathCreate: async (_: unknown, { input }: { input: SettingsNasPathInput }) => {
      try {
        const id = await createNasPathSetting({
          name: input.pathName,
          folder: input.pathValue,
          area: input.isActive !== false ? 'active' : 'disabled',
          depth: 1,
          remark: input.description || ''
        });

        const created = await getNasPathSettingById(id);
        if (!created) {
          throw new Error('Failed to retrieve created NAS path setting');
        }

        return {
          id: created.id?.toString() || '',
          pathName: created.name,
          pathValue: created.folder,
          description: created.remark || '',
          isActive: created.area !== 'disabled'
        };
      } catch (error) {
        console.error('Error creating NAS path settings:', error);
        throw new Error('Failed to create NAS path settings');
      }
    },

    settingsNasPathUpdate: async (_: unknown, { input }: { input: SettingsNasPathInput }) => {
      try {
        if (!input.id) {
          throw new Error('id is required for update');
        }

        await updateNasPathSetting(Number(input.id), {
          name: input.pathName,
          folder: input.pathValue,
          area: input.isActive !== false ? 'active' : 'disabled',
          remark: input.description || ''
        });

        const updated = await getNasPathSettingById(Number(input.id));
        if (!updated) {
          throw new Error('Failed to retrieve updated NAS path setting');
        }

        return {
          id: updated.id?.toString() || '',
          pathName: updated.name,
          pathValue: updated.folder,
          description: updated.remark || '',
          isActive: updated.area !== 'disabled'
        };
      } catch (error) {
        console.error('Error updating NAS path settings:', error);
        throw new Error('Failed to update NAS path settings');
      }
    },

    settingsNasPathDelete: async (_: unknown, { id }: { id: string }) => {
      try {
        return await deleteNasPathSetting(Number(id));
      } catch (error) {
        console.error('Error deleting NAS path settings:', error);
        throw new Error('Failed to delete NAS path settings');
      }
    },

    // App Settings Mutations - Direct MySQL
    appSettingCreate: async (_: unknown, { input }: { input: AppSettingInput }) => {
      try {
        const result = await executeQuery(\`
          INSERT INTO settings_app_default (area, name, value, remark)
          VALUES (?, ?, ?, ?)
        \`, [input.area, input.name, input.value, input.remark || null]);

        const insertId = (result as any).insertId;

        const rows = await executeQuery(\`
          SELECT sn, area, name, value, remark, created_at, updated_at
          FROM settings_app_default
          WHERE sn = ?
        \`, [insertId]) as AppSettingData[];

        if (rows.length === 0) {
          throw new Error('Failed to retrieve created setting');
        }

        const row = rows[0];
        return {
          sn: row.sn,
          area: row.area,
          name: row.name,
          value: row.value,
          remark: row.remark || null,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      } catch (error) {
        console.error('Error creating app setting:', error);
        throw new Error('Failed to create app setting');
      }
    },

    appSettingUpdate: async (_: unknown, { input }: { input: AppSettingInput }) => {
      try {
        if (!input.sn) {
          throw new Error('sn is required for update');
        }

        await executeQuery(\`
          UPDATE settings_app_default
          SET area = ?, name = ?, value = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
          WHERE sn = ?
        \`, [input.area, input.name, input.value, input.remark || null, input.sn]);

        const rows = await executeQuery(\`
          SELECT sn, area, name, value, remark, created_at, updated_at
          FROM settings_app_default
          WHERE sn = ?
        \`, [input.sn]) as AppSettingData[];

        if (rows.length === 0) {
          throw new Error('Setting not found after update');
        }

        const row = rows[0];
        return {
          sn: row.sn,
          area: row.area,
          name: row.name,
          value: row.value,
          remark: row.remark || null,
          created_at: row.created_at,
          updated_at: row.updated_at
        };
      } catch (error) {
        console.error('Error updating app setting:', error);
        throw new Error('Failed to update app setting');
      }
    },

    appSettingDelete: async (_: unknown, { sn }: { sn: number }) => {
      try {
        const result = await executeQuery(\`
          DELETE FROM settings_app_default WHERE sn = ?
        \`, [sn]);

        return (result as any).affectedRows > 0;
      } catch (error) {
        console.error('Error deleting app setting:', error);
        throw new Error('Failed to delete app setting');
      }
    },
  },
};
