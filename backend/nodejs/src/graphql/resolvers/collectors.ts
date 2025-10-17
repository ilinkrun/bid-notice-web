// Import collector functions
let collectGovNotices: any;
let scrapeListBySettingsUtil: any;
let scrapeDetailBySettingsUtil: any;

// Dynamic imports to handle file path issues
async function loadCollectors() {
  try {
    // Use spiderGovBidList instead of gov/collector-list
    const govCollector = await import('@/utils/spiderGovBidList');
    scrapeListBySettingsUtil = govCollector.scrapeListBySettings;
    console.log('Loaded scrapeListBySettings from spiderGovBidList');
  } catch (error) {
    console.warn('Could not load spiderGovBidList:', error);
  }

  try {
    const detailCollector = await import('@/utils/spiderGovBidDetail');
    scrapeDetailBySettingsUtil = detailCollector.scrapeDetailBySettings;
    console.log('Loaded scrapeDetailBySettings from spiderGovBidDetail');
  } catch (error) {
    console.warn('Could not load spiderGovBidDetail:', error);
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
  sampleUrl?: string;
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

// Convert GraphQL input to internal format for spiderGovBidList
function convertToScrapingSettings(input: SettingsNoticeListInput): any {
  // spiderGovBidList expects elements as "title=xpath,detail_url=xpath,posted_date=xpath,posted_by=xpath"
  const elementParts: string[] = [];
  if (input.title) elementParts.push(`title=${input.title}`);
  if (input.detailUrl) elementParts.push(`detail_url=${input.detailUrl}`);
  if (input.postedDate) elementParts.push(`posted_date=${input.postedDate}`);
  if (input.postedBy) elementParts.push(`posted_by=${input.postedBy}`);

  return {
    oid: input.oid || 0,
    org_name: input.orgName,
    url: input.url,
    rowXpath: input.rowXpath || '',
    startPage: input.startPage || 1,
    endPage: input.endPage || 1,
    use: input.use || 1,
    elements: elementParts.join(','),
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
      try {
        const response = await fetch('http://localhost:11301/scrape_list_by_settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            org_name: input.agencies?.[0] || 'default',
            url: 'https://example.com',
            rowXpath: '//tr',
            elements: JSON.stringify({
              title: 'td[1]',
              detail_url: 'td[1]/a/@href',
              posted_date: 'td[2]',
              posted_by: 'td[3]'
            }),
            startPage: 1,
            endPage: input.limit || 3
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json() as any;

        return {
          success: result.error_code === 0,
          totalScraped: result.data?.length || 0,
          totalInserted: result.data?.length || 0,
          agencies: 1,
          errors: result.error_code !== 0 ? [result.error_message] : []
        };
      } catch (error) {
        return {
          success: false,
          totalScraped: 0,
          totalInserted: 0,
          agencies: 0,
          errors: [`Failed to call Python scraper: ${error}`]
        };
      }
    },

    collectDetail: async (_: any, { input }: { input: CollectDetailInput }) => {
      try {
        console.log('[collectDetail] Starting with input:', input);

        if (!scrapeDetailBySettingsUtil) {
          console.log('[collectDetail] Scraper not available');
          return {
            success: false,
            processed: 0,
            updated: 0,
            errors: ['Detail scraper not available'],
            data: null
          };
        }

        // Use sampleUrl as the URL to scrape
        const url = input.sampleUrl;
        if (!url) {
          console.log('[collectDetail] No sample URL provided');
          return {
            success: false,
            processed: 0,
            updated: 0,
            errors: ['Sample URL is required'],
            data: null
          };
        }

        if (!input.orgName) {
          console.log('[collectDetail] No org name provided');
          return {
            success: false,
            processed: 0,
            updated: 0,
            errors: ['Organization name is required'],
            data: null
          };
        }

        // Convert GraphQL input to scraper settings
        const detailSettings = {
          org_name: input.orgName,
          title: input.title,
          body_html: input.bodyHtml,
          file_name: input.fileName,
          file_url: input.fileUrl,
          notice_div: input.noticeDiv,
          notice_num: input.noticeNum,
          org_dept: input.orgDept,
          org_man: input.orgMan,
          org_tel: input.orgTel,
          use: 1
        };

        console.log('[collectDetail] Calling scraper with:', {
          url,
          orgName: input.orgName
        });

        const result = await scrapeDetailBySettingsUtil(
          url,
          input.orgName,
          detailSettings,
          input.debug || false
        );

        console.log('[collectDetail] Scraper returned:', {
          error_code: result.error_code,
          error_message: result.error_message,
          has_data: !!result.data
        });

        if (result.error_code !== 0) {
          return {
            success: false,
            processed: 0,
            updated: 0,
            errors: [result.error_message],
            data: null
          };
        }

        // Convert to GraphQL format
        const responseData = {
          title: result.data?.title || null,
          bodyHtml: result.data?.body_html || null,
          fileName: result.data?.file_name || null,
          fileUrl: result.data?.file_url || null,
          noticeDiv: result.data?.notice_div || null,
          noticeNum: result.data?.notice_num || null,
          orgDept: result.data?.org_dept || null,
          orgMan: result.data?.org_man || null,
          orgTel: result.data?.org_tel || null,
          detailUrl: result.data?.detail_url || url,
          orgName: result.data?.org_name || input.orgName
        };

        console.log('[collectDetail] Returning success with data');

        return {
          success: true,
          processed: 1,
          updated: 1,
          errors: [],
          data: responseData
        };
      } catch (error) {
        console.error('[collectDetail] Error:', error);
        return {
          success: false,
          processed: 0,
          updated: 0,
          errors: [`Error: ${error}`],
          data: null
        };
      }
    },

    collectListWithSettings: async (_: any, { settings }: { settings: SettingsNoticeListInput }) => {
      try {
        console.log('[collectListWithSettings] Starting for org:', settings.orgName);

        if (!scrapeListBySettingsUtil) {
          console.log('[collectListWithSettings] Scraper not available');
          return {
            orgName: settings.orgName,
            errorCode: 999,
            errorMessage: 'Scraper not available',
            data: []
          };
        }

        const scrapingSettings = convertToScrapingSettings(settings);
        console.log('[collectListWithSettings] Calling scraper with settings:', scrapingSettings);

        const result = await scrapeListBySettingsUtil(scrapingSettings, false);

        console.log('[collectListWithSettings] Scraper returned:', {
          org_name: result.org_name,
          error_code: result.error_code,
          error_message: result.error_message,
          data_count: result.data?.length || 0
        });

        const response = {
          orgName: result.org_name,
          errorCode: result.error_code,
          errorMessage: result.error_message,
          data: result.data.map(convertToGraphQLNotice)
        };

        console.log('[collectListWithSettings] Returning response with', response.data.length, 'items');
        return response;
      } catch (error) {
        console.error('[collectListWithSettings] Error:', error);
        return {
          orgName: settings.orgName,
          errorCode: 900,
          errorMessage: `Error: ${error}`,
          data: []
        };
      }
    },

    collectDetailWithSettings: async (_: any, { settings }: { settings: SettingsNoticeDetailInput }) => {
      try {
        console.log('[collectDetailWithSettings] Starting with settings:', settings);

        if (!scrapeDetailBySettingsUtil) {
          console.log('[collectDetailWithSettings] Scraper not available');
          return {
            success: false,
            processed: 0,
            updated: 0,
            errors: ['Detail scraper not available'],
            data: null
          };
        }

        if (!settings.sampleUrl) {
          console.log('[collectDetailWithSettings] No sample URL provided');
          return {
            success: false,
            processed: 0,
            updated: 0,
            errors: ['Sample URL is required'],
            data: null
          };
        }

        // Convert GraphQL input to scraper settings
        const detailSettings = {
          org_name: settings.orgName,
          title: settings.title,
          body_html: settings.bodyHtml,
          file_name: settings.fileName,
          file_url: settings.fileUrl,
          notice_div: settings.noticeDiv,
          notice_num: settings.noticeNum,
          org_dept: settings.orgDept,
          org_man: settings.orgMan,
          org_tel: settings.orgTel,
          use: settings.use || 1
        };

        console.log('[collectDetailWithSettings] Calling scraper with:', {
          url: settings.sampleUrl,
          orgName: settings.orgName
        });

        const result = await scrapeDetailBySettingsUtil(
          settings.sampleUrl,
          settings.orgName,
          detailSettings,
          false // debug = false
        );

        console.log('[collectDetailWithSettings] Scraper returned:', {
          error_code: result.error_code,
          error_message: result.error_message,
          has_data: !!result.data
        });

        if (result.error_code !== 0) {
          return {
            success: false,
            processed: 0,
            updated: 0,
            errors: [result.error_message],
            data: null
          };
        }

        // Convert to GraphQL format
        const responseData = {
          title: result.data?.title || null,
          bodyHtml: result.data?.body_html || null,
          fileName: result.data?.file_name || null,
          fileUrl: result.data?.file_url || null,
          noticeDiv: result.data?.notice_div || null,
          noticeNum: result.data?.notice_num || null,
          orgDept: result.data?.org_dept || null,
          orgMan: result.data?.org_man || null,
          orgTel: result.data?.org_tel || null,
          detailUrl: result.data?.detail_url || settings.sampleUrl,
          orgName: result.data?.org_name || settings.orgName
        };

        console.log('[collectDetailWithSettings] Returning success with data');

        return {
          success: true,
          processed: 1,
          updated: 1,
          errors: [],
          data: responseData
        };
      } catch (error) {
        console.error('[collectDetailWithSettings] Error:', error);
        return {
          success: false,
          processed: 0,
          updated: 0,
          errors: [`Error: ${error}`],
          data: null
        };
      }
    }
  }
};