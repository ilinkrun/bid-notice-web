/**
 * Korean Government Public Data Portal (data.go.kr) API client
 * Fetches bid notice information from the public procurement system
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { parseStringPromise } from 'xml2js';

export interface ApiRequestParams {
  pageNo?: number;
  numOfRows?: number;
  inqryDiv?: string;
  inqryBgnDt?: string;
  inqryEndDt?: string;
  type?: 'xml' | 'json';
}

export interface ApiResponse<T = any> {
  header: {
    resultCode: string;
    resultMsg: string;
  };
  body: {
    pageNo: number;
    numOfRows: number;
    totalCount: number;
    items: T;
  };
}

export interface BidNoticeRawItem {
  bidNtceNo?: string;           // 입찰공고번호
  bidNtceNm?: string;           // 입찰공고명
  ntceInsttNm?: string;         // 공고기관명
  dminsttNm?: string;           // 수요기관명
  ntceInsttCd?: string;         // 공고기관코드
  dminsttCd?: string;           // 수요기관코드
  bidNtceDt?: string;           // 입찰공고일시
  bidNtceStDt?: string;         // 입찰공고시작일시
  bidNtceEndDt?: string;        // 입찰공고종료일시
  bidClseDt?: string;           // 입찰마감일시
  opengDt?: string;             // 개찰일시
  presmptPrce?: string;         // 예정가격
  asignBdgtAmt?: string;        // 배정예산금액
  bidMethdCd?: string;          // 입찰방식코드
  bidMethdNm?: string;          // 입찰방식명
  cntrctCnclsMthdCd?: string;   // 계약체결방법코드
  cntrctCnclsMthdNm?: string;   // 계약체결방법명
  rcptRegistNo?: string;        // 접수등록번호
  rcptRegistNm?: string;        // 접수등록명
  indstrytyLmttClCd?: string;   // 업종제한구분코드
  indstrytyLmttClNm?: string;   // 업종제한구분명
  prtcptCnditnCd?: string;      // 참가조건코드
  prtcptCnditnNm?: string;      // 참가조건명
  prtcptCndtnCn?: string;       // 참가조건내용
  bidNtceDtlCn?: string;        // 입찰공고상세내용
  cntrctPrd?: string;           // 계약기간
  dlvryPlce?: string;           // 납품장소
  ntceKindNm?: string;          // 공고구분명
  [key: string]: any;           // Additional dynamic fields
}

export class DataGoKrApiClient {
  private readonly baseUrl = 'https://apis.data.go.kr/1230000/ad/BidPublicInfoService';
  private readonly httpClient: AxiosInstance;
  private readonly serviceKey: string;

  constructor(serviceKey: string) {
    this.serviceKey = serviceKey;
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BidNoticeBot/1.0)',
        'Accept': 'application/json, application/xml'
      }
    });

    // Add request/response interceptors for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API Request Error]', error.message);
        return Promise.reject(error);
      }
    );

    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`[API Response] ${response.status} ${response.statusText} - ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`[API Response Error] ${error.response?.status} ${error.response?.statusText} - ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get bid announcement list
   * 입찰공고 목록 조회
   */
  async getBidPblancListInfoServc(params: ApiRequestParams = {}): Promise<BidNoticeRawItem[]> {
    const endpoint = `${this.baseUrl}/getBidPblancListInfoServc`;

    const requestParams = {
      serviceKey: this.serviceKey,
      pageNo: params.pageNo || 1,
      numOfRows: params.numOfRows || 100,
      type: params.type || 'json',
      ...params
    };

    try {
      const response: AxiosResponse = await this.httpClient.get(endpoint, {
        params: requestParams,
        timeout: 30000
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle different response formats
      let parsedData: any;

      if (params.type === 'xml' || response.headers['content-type']?.includes('xml')) {
        // Parse XML response
        parsedData = await this.parseXmlResponse(response.data);
      } else {
        // Handle JSON response
        parsedData = response.data;
      }

      // Extract items from response structure
      const items = this.extractItemsFromResponse(parsedData);

      console.log(`[API] Retrieved ${items.length} bid notices`);
      return items;

    } catch (error: any) {
      console.error(`[API Error] ${error.message}`);

      if (error.response) {
        console.error(`Response Status: ${error.response.status}`);
        console.error(`Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }

      throw new Error(`API request failed: ${error.message}`);
    }
  }

  /**
   * Get all bid notices with pagination
   * 모든 입찰공고를 페이징으로 조회
   */
  async getAllBidList(
    startDate?: Date,
    endDate?: Date,
    areaCode?: string,
    orgName?: string,
    bidKind?: string,
    maxPages: number = 10
  ): Promise<BidNoticeRawItem[]> {
    const allItems: BidNoticeRawItem[] = [];
    let currentPage = 1;
    let hasMore = true;

    // Format dates for API
    const formatDate = (date: Date): string => {
      return date.toISOString().slice(0, 10).replace(/-/g, '') + '0000'; // YYYYMMDD0000
    };

    const baseParams: ApiRequestParams = {
      numOfRows: 100,
      type: 'json'
    };

    // Add date filters if provided
    if (startDate) {
      baseParams.inqryBgnDt = formatDate(startDate);
    }
    if (endDate) {
      baseParams.inqryEndDt = formatDate(endDate);
    }

    console.log(`[API] Starting paginated fetch - Start: ${startDate?.toISOString()}, End: ${endDate?.toISOString()}`);

    while (hasMore && currentPage <= maxPages) {
      try {
        const params = {
          ...baseParams,
          pageNo: currentPage
        };

        console.log(`[API] Fetching page ${currentPage}...`);
        const pageItems = await this.getBidPblancListInfoServc(params);

        if (pageItems.length === 0) {
          console.log(`[API] No more items on page ${currentPage}, stopping`);
          hasMore = false;
          break;
        }

        allItems.push(...pageItems);
        console.log(`[API] Page ${currentPage}: ${pageItems.length} items (Total: ${allItems.length})`);

        // Check if this is the last page
        if (pageItems.length < (baseParams.numOfRows || 100)) {
          console.log(`[API] Received fewer items than requested, assuming last page`);
          hasMore = false;
        }

        currentPage++;

        // Add delay between requests to avoid rate limiting
        await this.delay(500);

      } catch (error: any) {
        console.error(`[API] Error fetching page ${currentPage}:`, error.message);
        hasMore = false;
      }
    }

    console.log(`[API] Completed paginated fetch: ${allItems.length} total items`);
    return allItems;
  }

  /**
   * Parse XML response to JSON
   */
  private async parseXmlResponse(xmlData: string): Promise<any> {
    try {
      const result = await parseStringPromise(xmlData, {
        explicitArray: false,
        ignoreAttrs: true,
        normalize: true,
        normalizeTags: true,
        trim: true
      });
      return result;
    } catch (error: any) {
      throw new Error(`XML parsing failed: ${error.message}`);
    }
  }

  /**
   * Extract items array from API response structure
   */
  private extractItemsFromResponse(data: any): BidNoticeRawItem[] {
    try {
      // Handle different response structures
      let items: any = null;

      // Try different possible paths for items
      if (data?.response?.body?.items?.item) {
        items = data.response.body.items.item;
      } else if (data?.body?.items?.item) {
        items = data.body.items.item;
      } else if (data?.items?.item) {
        items = data.items.item;
      } else if (data?.response?.body?.items) {
        items = data.response.body.items;
      } else if (Array.isArray(data)) {
        items = data;
      }

      if (!items) {
        console.warn('[API] No items found in response structure');
        return [];
      }

      // Ensure items is an array
      if (!Array.isArray(items)) {
        items = [items];
      }

      return items.filter(item => item && typeof item === 'object');

    } catch (error: any) {
      console.error('[API] Error extracting items from response:', error.message);
      return [];
    }
  }

  /**
   * Add delay between API calls
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate API response
   */
  private validateResponse(data: any): boolean {
    // Check for error responses
    if (data?.header?.resultCode && data.header.resultCode !== '00') {
      throw new Error(`API Error: ${data.header.resultMsg || 'Unknown error'}`);
    }

    if (data?.response?.header?.resultCode && data.response.header.resultCode !== '00') {
      throw new Error(`API Error: ${data.response.header.resultMsg || 'Unknown error'}`);
    }

    return true;
  }
}