// Import collector functions (check correct file paths)
let collectGovNotices: any;
let scrapeListBySettingsUtil: any;
let collectGovNoticeDetails: any;

// Dynamic imports to handle file path issues
async function loadCollectors() {
  try {
    const govCollector = await import('@/utils/gov/collector-list');
    collectGovNotices = govCollector.collectGovNotices;
    scrapeListBySettingsUtil = govCollector.scrapeListBySettings;
  } catch (error) {
    console.warn('Could not load gov collector:', error);
  }

  try {
    const detailCollector = await import('@/utils/gov/collector-detail');
    collectGovNoticeDetails = detailCollector.collectGovNoticeDetails;
  } catch (error) {
    console.warn('Could not load detail collector:', error);
  }
}

// Load collectors on module initialization
loadCollectors();

interface CollectListInput {
  agencies?: string[];
  limit?: number;
  dryRun?: boolean;
  debug?: boolean;
}

interface CollectDetailInput {
  orgName?: string;
  noticeId?: string;
  limit?: number;
  dryRun?: boolean;
  debug?: boolean;
}

interface SettingsNoticeListInput {
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

interface SettingsNoticeDetailInput {
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

// Convert GraphQL input to internal format
function convertToScrapingSettings(input: SettingsNoticeListInput): any {
  return {
    oid: input.oid || 0,
    org_name: input.orgName,
    url: input.url,
    rowXpath: input.rowXpath || '',
    startPage: input.startPage || 1,
    endPage: input.endPage || 1,
    use: input.use || 1,
    elements: JSON.stringify({
      title: { xpath: input.title || 'td[2]' },
      detail_url: { xpath: input.detailUrl || 'td[2]/a' },
      posted_date: { xpath: input.postedDate || 'td[3]' },
      posted_by: { xpath: input.postedBy || 'td[4]' }
    }),
    iframe: input.iframe,
    paging: input.paging,
    login: input.login,
    org_region: input.orgRegion,
    registration: input.registration,
    exception_row: input.exceptionRow
  };
}

// Convert internal Notice to GraphQL Notice
function convertToGraphQLNotice(notice: any) {
  return {
    nid: 0, // Will be assigned when saved to database
    title: notice.title,
    orgName: notice.org_name,
    region: notice.org_region || '',
    detailUrl: notice.detail_url,
    category: notice.category || '무관',
    registration: notice.registration || '',
    postedAt: notice.posted_date || notice.scraped_at
  };
}

// Convert internal NoticeDetail to GraphQL NoticeDetail
function convertToGraphQLNoticeDetail(detail: any) {
  return {
    nid: parseInt(detail.nid),
    title: detail.title,
    fileName: detail.attachments?.map((a: any) => a.filename).join(',') || null,
    fileUrl: detail.attachments?.map((a: any) => a.url).join(',') || null,
    noticeDiv: null,
    noticeNum: null,
    orgDept: null,
    orgMan: null,
    orgTel: null,
    scrapedAt: detail.scraped_at,
    updatedAt: new Date().toISOString(),
    orgName: detail.org_name,
    bodyHtml: detail.content,
    detailUrl: detail.attachments?.[0]?.url || '',
    createdAt: new Date().toISOString(),
    postedDate: new Date().toISOString().split('T')[0],
    postedBy: null,
    category: null
  };
}

export const collectorsResolvers = {
  Query: {
    testCollectList: async (_: any, { input }: { input: CollectListInput }) => {
      if (!collectGovNotices) {
        return {
          success: false,
          totalScraped: 0,
          totalInserted: 0,
          agencies: 0,
          errors: ['Collector not available']
        };
      }

      const options = {
        agencies: input.agencies,
        limit: input.limit || 10,
        dryRun: true, // Always dry run for tests
        debug: input.debug || false
      };

      return await collectGovNotices(options);
    },

    testCollectDetail: async (_: any, { input }: { input: CollectDetailInput }) => {
      if (!collectGovNoticeDetails) {
        return {
          success: false,
          processed: 0,
          updated: 0,
          errors: ['Detail collector not available']
        };
      }

      const options = {
        orgName: input.orgName,
        noticeId: input.noticeId,
        limit: input.limit || 10,
        dryRun: true, // Always dry run for tests
        debug: input.debug || false
      };

      return await collectGovNoticeDetails(options);
    }
  },

  Mutation: {
    collectList: async (_: any, { input }: { input: CollectListInput }) => {
      if (!collectGovNotices) {
        return {
          success: false,
          totalScraped: 0,
          totalInserted: 0,
          agencies: 0,
          errors: ['Collector not available']
        };
      }

      const options = {
        agencies: input.agencies,
        limit: input.limit || 10,
        dryRun: input.dryRun || false,
        debug: input.debug || false
      };

      return await collectGovNotices(options);
    },

    collectDetail: async (_: any, { input }: { input: CollectDetailInput }) => {
      if (!collectGovNoticeDetails) {
        return {
          success: false,
          processed: 0,
          updated: 0,
          errors: ['Detail collector not available']
        };
      }

      const options = {
        orgName: input.orgName,
        noticeId: input.noticeId,
        limit: input.limit || 10,
        dryRun: input.dryRun || false,
        debug: input.debug || false
      };

      return await collectGovNoticeDetails(options);
    },

    collectListWithSettings: async (_: any, { settings }: { settings: SettingsNoticeListInput }) => {
      if (!scrapeListBySettingsUtil) {
        return {
          orgName: settings.orgName,
          errorCode: 999,
          errorMessage: 'Scraper not available',
          data: []
        };
      }

      const scrapingSettings = convertToScrapingSettings(settings);
      const result = await scrapeListBySettingsUtil(scrapingSettings, false);

      return {
        orgName: result.org_name,
        errorCode: result.error_code,
        errorMessage: result.error_message,
        data: result.data.map(convertToGraphQLNotice)
      };
    },

    collectDetailWithSettings: async (_: any, { settings }: { settings: SettingsNoticeDetailInput }) => {
      // For now, return empty array as detail collection with custom settings
      // would require more complex implementation
      console.log('collectDetailWithSettings called with:', settings);
      return [];
    }
  }
};