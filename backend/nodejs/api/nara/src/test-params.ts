/**
 * Test script for handling multiple search parameter combinations
 * Fetches bid notices with different search criteria and stores them in g2b_notices table
 * with search_params field tracking
 */

import dotenv from 'dotenv';
import axios from 'axios';
import mysql from 'mysql2/promise';
import { G2bNotice } from './models.js';

dotenv.config();

interface ApiResponse {
    response?: {
        header: {
            resultCode: string;
            resultMsg: string;
        };
        body: {
            items?: {
                item?: any[];
            };
            totalCount: number;
            pageNo: number;
            numOfRows: number;
        };
    };
    'nkoneps.com.response.ResponseError'?: {
        header: {
            resultCode: string;
            resultMsg: string;
        };
    };
}

interface SearchParams {
    bidNtceNm: string;
    prtcptLmtRgnNm: string;
    indstrytyCd?: string;
}

class G2bNoticeManager {
    private connection: mysql.Connection;
    private baseUrl = 'https://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoServcPPSSrch';
    private serviceKey = process.env.DATA_GO_KR_SERVICE_KEY || '';

    constructor(connection: mysql.Connection) {
        this.connection = connection;
    }

    /**
     * Generate all parameter combinations
     */
    generateParamCombinations(): SearchParams[] {
        // Load from environment variables
        const bidNtceNames = process.env.NARA_PARAMS_BIDNAME?.split(',') || ['내진성능평가', '구조설계', '내진보강', '정밀안전진단', '정밀안전점검', '정기안전점검', '구조보강', '구조감리', '구조안전진단'];
        const regions = process.env.NARA_PARAMS_REGION?.split(',') || ['전국', '서울특별시', '인천광역시'];
        const industriesStr = process.env.NARA_PARAMS_INDUSTRIES?.split(',') || ['1397', '7377', '3585', '7336', '9999', ''];
        const industries = industriesStr.map(str => str.trim() === '' ? undefined : str); // empty string = 업종 제한 없음

        const combinations: SearchParams[] = [];

        for (const bidNtceNm of bidNtceNames) {
            for (const prtcptLmtRgnNm of regions) {
                for (const indstrytyCd of industries) {
                    combinations.push({
                        bidNtceNm,
                        prtcptLmtRgnNm,
                        indstrytyCd
                    });
                }
            }
        }

        return combinations;
    }

    /**
     * Build search parameters string for API call
     */
    buildSearchParamsString(params: SearchParams): string {
        const searchParams = new URLSearchParams({
            inqryDiv: '1',
            inqryBgnDt: '202509010000',
            inqryEndDt: '202509230000',
            prtcptLmtRgnNm: params.prtcptLmtRgnNm
        });

        // Only add bidNtceNm if it's not empty
        if (params.bidNtceNm) {
            searchParams.append('bidNtceNm', params.bidNtceNm);
        }

        // Add industry code if provided
        if (params.indstrytyCd) {
            searchParams.append('indstrytyCd', params.indstrytyCd);
        }

        return searchParams.toString();
    }

    /**
     * Build search parameters string for database storage (without encoding)
     */
    buildSearchParamsForStorage(params: SearchParams): string {
        const parts: string[] = [];

        parts.push('inqryDiv=1');
        parts.push('inqryBgnDt=202509010000');
        parts.push('inqryEndDt=202509230000');
        parts.push(`prtcptLmtRgnNm=${params.prtcptLmtRgnNm}`);

        // Only add bidNtceNm if it's not empty
        if (params.bidNtceNm) {
            parts.push(`bidNtceNm=${params.bidNtceNm}`);
        }

        // Add industry code if provided
        if (params.indstrytyCd) {
            parts.push(`indstrytyCd=${params.indstrytyCd}`);
        }

        return parts.join('&');
    }

    /**
     * Fetch data from API
     */
    async fetchApiData(params: SearchParams): Promise<G2bNotice[]> {
        console.log(`Fetching: ${params.bidNtceNm}, region: ${params.prtcptLmtRgnNm}, industry: ${params.indstrytyCd || '제한없음'}`);

        const apiParams: any = {
            serviceKey: this.serviceKey,
            pageNo: 1,
            numOfRows: 10,
            inqryDiv: '1',
            inqryBgnDt: '202509010000',
            inqryEndDt: '202509230000',
            prtcptLmtRgnNm: params.prtcptLmtRgnNm,
            type: 'json'
        };

        // Only add bidNtceNm if it's not empty
        if (params.bidNtceNm) {
            apiParams.bidNtceNm = params.bidNtceNm;
        }

        // Add industry code if provided
        if (params.indstrytyCd) {
            apiParams.indstrytyCd = params.indstrytyCd;
        }

        console.log(`API Params:`, apiParams);

        try {
            const response = await axios.get(this.baseUrl, {
                params: apiParams
            });
            const data: ApiResponse = response.data;

            console.log(`  -> Full Response:`, JSON.stringify(data, null, 2));

            // Check for error response format
            if (data['nkoneps.com.response.ResponseError']) {
                const errorHeader = data['nkoneps.com.response.ResponseError'].header;
                console.log(`  -> API Error: ${errorHeader.resultCode} - ${errorHeader.resultMsg}`);
                return [];
            }

            // Check for normal response format
            if (!data.response || !data.response.header) {
                console.log(`  -> Invalid API response structure`);
                return [];
            }

            if (data.response.header.resultCode !== '00') {
                console.log(`  -> API Error: ${data.response.header.resultCode} - ${data.response.header.resultMsg}`);
                return [];
            }

            console.log(`  -> Total Count: ${data.response.body.totalCount}`);
            console.log(`  -> Items structure:`, data.response.body.items);

            // Check both possible structures
            let items = [];
            if (data.response.body.items?.item) {
                items = data.response.body.items.item;
            } else if (data.response.body.items && Array.isArray(data.response.body.items)) {
                items = data.response.body.items;
            }

            console.log(`  -> Extracted items:`, items);
            console.log(`  -> Items is array:`, Array.isArray(items));
            console.log(`  -> Items length:`, items?.length);

            const notices: G2bNotice[] = Array.isArray(items) ? items : (items ? [items] : []);

            console.log(`  -> Found ${notices.length} notices`);
            return notices;

        } catch (error: any) {
            console.error(`  -> Request failed: ${error.message}`);
            return [];
        }
    }

    /**
     * Convert API response to G2bNotice format
     */
    convertToG2bNotice(apiData: any): G2bNotice {
        return {
            bidNtceNo: apiData.bidNtceNo || '',
            bidNtceOrd: apiData.bidNtceOrd || '',
            reNtceYn: apiData.reNtceYn || 'N',
            rgstTyNm: apiData.rgstTyNm || '',
            ntceKindNm: apiData.ntceKindNm || '',
            intrbidYn: apiData.intrbidYn || 'N',
            bidNtceDt: apiData.bidNtceDt ? new Date(apiData.bidNtceDt) : undefined,
            refNo: apiData.refNo || '',
            bidNtceNm: apiData.bidNtceNm || '',
            ntceInsttCd: apiData.ntceInsttCd || '',
            ntceInsttNm: apiData.ntceInsttNm || '',
            dminsttCd: apiData.dminsttCd || '',
            dminsttNm: apiData.dminsttNm || '',
            bidMethdNm: apiData.bidMethdNm || '',
            cntrctCnclsMthdNm: apiData.cntrctCnclsMthdNm || '',
            ntceInsttOfclNm: apiData.ntceInsttOfclNm || '',
            ntceInsttOfclTelNo: apiData.ntceInsttOfclTelNo || '',
            ntceInsttOfclEmailAdrs: apiData.ntceInsttOfclEmailAdrs || '',
            exctvNm: apiData.exctvNm || '',
            bidQlfctRgstDt: apiData.bidQlfctRgstDt ? new Date(apiData.bidQlfctRgstDt) : undefined,
            bidBeginDt: apiData.bidBeginDt ? new Date(apiData.bidBeginDt) : undefined,
            bidClseDt: apiData.bidClseDt ? new Date(apiData.bidClseDt) : undefined,
            opengDt: apiData.opengDt ? new Date(apiData.opengDt) : undefined,
            asignBdgtAmt: apiData.asignBdgtAmt ? Number(apiData.asignBdgtAmt) : undefined,
            presmptPrce: apiData.presmptPrce ? Number(apiData.presmptPrce) : undefined,
            opengPlce: apiData.opengPlce || '',
            bidNtceDtlUrl: apiData.bidNtceDtlUrl || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    /**
     * Save or update notice with search_params
     */
    async saveNoticeWithSearchParams(notice: G2bNotice, searchParamsString: string): Promise<void> {
        if (!notice.bidNtceNo) {
            console.warn('Notice without bidNtceNo, skipping');
            return;
        }

        try {
            // Check if notice already exists
            const [existing] = await this.connection.execute(
                'SELECT id, search_params FROM g2b_notices WHERE bidNtceNo = ?',
                [notice.bidNtceNo]
            ) as any;

            if (existing.length > 0) {
                // Update existing record - append search_params only if not duplicate
                const existingSearchParams = existing[0].search_params || '';

                // Check if the search params already exists
                const existingParamsList = existingSearchParams.split(',').filter((p: string) => p.trim());
                const isDuplicate = existingParamsList.includes(searchParamsString);

                if (!isDuplicate) {
                    const newSearchParams = existingSearchParams
                        ? `${existingSearchParams},${searchParamsString}`
                        : searchParamsString;

                    await this.connection.execute(
                        'UPDATE g2b_notices SET search_params = ?, updatedAt = CURRENT_TIMESTAMP WHERE bidNtceNo = ?',
                        [newSearchParams, notice.bidNtceNo]
                    );

                    console.log(`  Updated notice ${notice.bidNtceNo} with new search params`);
                } else {
                    console.log(`  Notice ${notice.bidNtceNo} already has this search params, skipping`);
                }
            } else {
                // Insert new record
                const insertData = { ...notice, search_params: searchParamsString };
                delete insertData.id; // Remove ID for insert

                const fields = Object.keys(insertData).join(', ');
                const placeholders = Object.keys(insertData).map(() => '?').join(', ');
                const values = Object.values(insertData);

                await this.connection.execute(
                    `INSERT INTO g2b_notices (${fields}) VALUES (${placeholders})`,
                    values
                );

                console.log(`  Inserted new notice ${notice.bidNtceNo}`);
            }
        } catch (error: any) {
            console.error(`Failed to save notice ${notice.bidNtceNo}: ${error.message}`);
        }
    }

    /**
     * Process all parameter combinations
     */
    async processAllCombinations(): Promise<void> {
        const combinations = this.generateParamCombinations();
        console.log(`Processing ${combinations.length} parameter combinations`);

        // Debug: Print all combinations to check for duplicates
        console.log('\n=== All Parameter Combinations ===');
        combinations.forEach((combo, index) => {
            const paramsStr = this.buildSearchParamsForStorage(combo);
            console.log(`${index + 1}: ${paramsStr}`);
        });
        console.log('=====================================\n');

        let totalProcessed = 0;
        const processedCombinations = new Set<string>();

        for (let i = 0; i < combinations.length; i++) {
            const params = combinations[i];
            const searchParamsForStorage = this.buildSearchParamsForStorage(params);

            // Check if we've already processed this exact combination
            if (processedCombinations.has(searchParamsForStorage)) {
                console.log(`\n[${i + 1}/${combinations.length}] SKIPPING duplicate combination: ${searchParamsForStorage}`);
                continue;
            }

            processedCombinations.add(searchParamsForStorage);
            console.log(`\n[${i + 1}/${combinations.length}] Processing: ${searchParamsForStorage}`);

            try {
                const notices = await this.fetchApiData(params);
                console.log(`  -> API returned ${notices.length} notices`);

                // Track unique notices in this API response
                const seenNotices = new Set<string>();

                for (const apiNotice of notices) {
                    const bidNtceNo = apiNotice.bidNtceNo;

                    if (seenNotices.has(bidNtceNo)) {
                        console.log(`  -> Duplicate notice in same API response: ${bidNtceNo}`);
                        continue;
                    }

                    seenNotices.add(bidNtceNo);
                    const g2bNotice = this.convertToG2bNotice(apiNotice);
                    await this.saveNoticeWithSearchParams(g2bNotice, searchParamsForStorage);
                    totalProcessed++;
                }

                // Add delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error: any) {
                console.error(`Error processing combination ${i + 1}: ${error.message}`);
            }
        }

        console.log(`\n=== Processing Complete ===`);
        console.log(`Total notices processed: ${totalProcessed}`);
        console.log(`Unique combinations processed: ${processedCombinations.size}`);
    }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
    // Database configuration
    const dbConfig = {
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'test',
        charset: 'utf8mb4',
        timezone: '+00:00'
    };

    let connection: mysql.Connection | null = null;

    try {
        console.log('=== G2B Notice Parameter Test ===');

        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('Database connected');

        // Create manager and process combinations
        const manager = new G2bNoticeManager(connection);
        await manager.processAllCombinations();

    } catch (error: any) {
        console.error(`Test failed: ${error.message}`);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { G2bNoticeManager, SearchParams };