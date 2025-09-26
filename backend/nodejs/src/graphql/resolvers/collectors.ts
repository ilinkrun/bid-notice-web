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
        if (input.noticeId) {
          // NID로 상세 정보 가져오기
          const response = await fetch(`http://localhost:11301/fetch_detail_by_nid?nid=${input.noticeId}&debug=${input.debug || false}`);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json() as any;

          return {
            success: result.error_code === 0,
            processed: result.error_code === 0 ? 1 : 0,
            updated: result.error_code === 0 ? 1 : 0,
            errors: result.error_code !== 0 ? [result.error_message] : [],
            data: result.error_code === 0 ? {
              title: result.data?.title || null,
              bodyHtml: result.data?.body_html || null,
              fileName: result.data?.file_name || null,
              fileUrl: result.data?.file_url || null,
              noticeDiv: result.data?.notice_div || null,
              noticeNum: result.data?.notice_num || null,
              orgDept: result.data?.org_dept || null,
              orgMan: result.data?.org_man || null,
              orgTel: result.data?.org_tel || null,
              detailUrl: result.data?.detail_url || null,
              orgName: result.data?.org_name || null
            } : null
          };
        } else {
          // 설정을 사용한 상세 페이지 스크래핑
          const url = input.sampleUrl || 'https://example.com/detail/1';
          const debug = input.debug || false;

          const response = await fetch(`http://localhost:11301/scrape_detail_by_settings?url=${encodeURIComponent(url)}&debug=${debug}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              org_name: input.orgName || 'default',
              title: input.title || '',
              body_html: input.bodyHtml || '',
              file_name: input.fileName || '',
              file_url: input.fileUrl || '',
              preview: input.preview || '',
              notice_div: input.noticeDiv || '',
              notice_num: input.noticeNum || '',
              org_dept: input.orgDept || '',
              org_man: input.orgMan || '',
              org_tel: input.orgTel || ''
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json() as any;

          return {
            success: result.error_code === 0,
            processed: result.error_code === 0 ? 1 : 0,
            updated: result.error_code === 0 ? 1 : 0,
            errors: result.error_code !== 0 ? [result.error_message] : [],
            data: result.error_code === 0 ? {
              title: result.data?.title || null,
              bodyHtml: result.data?.body_html || null,
              fileName: result.data?.file_name || null,
              fileUrl: result.data?.file_url || null,
              noticeDiv: result.data?.notice_div || null,
              noticeNum: result.data?.notice_num || null,
              orgDept: result.data?.org_dept || null,
              orgMan: result.data?.org_man || null,
              orgTel: result.data?.org_tel || null,
              detailUrl: result.data?.detail_url || null,
              orgName: result.data?.org_name || null
            } : null
          };
        }
      } catch (error) {
        return {
          success: false,
          processed: 0,
          updated: 0,
          errors: [`Failed to call Python scraper: ${error}`],
          data: null
        };
      }
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