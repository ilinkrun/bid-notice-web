// Government notice collector using ScrapingWorkflow
import { ScrapingWorkflow } from '@/utils/scraping-workflow';
import { createLogger } from '@/utils/scraping-utils';

const logger = createLogger('gov-collector');

export interface GovCollectionOptions {
  limit?: number;
  dryRun?: boolean;
  debug?: boolean;
  agencies?: string[];
}

/**
 * Collect government notices using predefined agency settings
 */
export async function collectGovNotices(options: GovCollectionOptions = {}): Promise<{
  success: boolean;
  totalScraped: number;
  totalInserted: number;
  agencies: number;
  errors: string[];
}> {
  const {
    limit = 10,
    dryRun = false,
    debug = false,
    agencies = []
  } = options;

  logger.info(`Starting GOV notice collection with limit: ${limit}, dryRun: ${dryRun}`);

  const workflow = new ScrapingWorkflow();

  try {
    await workflow.initialize();

    // Get list of agencies to process
    const agenciesToProcess = agencies.length > 0 ? agencies : await getDefaultAgencies();

    if (agenciesToProcess.length === 0) {
      logger.warn('No agencies configured for scraping');
      return {
        success: true,
        totalScraped: 0,
        totalInserted: 0,
        agencies: 0,
        errors: []
      };
    }

    // Limit agencies if specified
    const limitedAgencies = agenciesToProcess.slice(0, Math.max(1, Math.floor(limit / 10)));

    logger.info(`Processing ${limitedAgencies.length} agencies: ${limitedAgencies.join(', ')}`);

    if (dryRun) {
      logger.info('DRY RUN MODE: No data will be saved to database');
      return {
        success: true,
        totalScraped: 0,
        totalInserted: 0,
        agencies: limitedAgencies.length,
        errors: []
      };
    }

    // Process agencies
    const result = await workflow.processMultipleAgencies(limitedAgencies, debug);

    return {
      success: result.error_agencies === 0,
      totalScraped: result.total_scraped,
      totalInserted: result.total_inserted,
      agencies: result.total_agencies,
      errors: result.error_orgs
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`GOV collection failed: ${errorMessage}`);

    return {
      success: false,
      totalScraped: 0,
      totalInserted: 0,
      agencies: 0,
      errors: [errorMessage]
    };
  } finally {
    await workflow.cleanup();
  }
}

/**
 * Collect notices from a specific government agency
 */
export async function collectGovAgencyNotices(
  agencyName: string,
  options: { debug?: boolean; dryRun?: boolean } = {}
): Promise<{
  success: boolean;
  scraped: number;
  inserted: number;
  error?: string;
}> {
  const { debug = false, dryRun = false } = options;

  logger.info(`Collecting notices from agency: ${agencyName}`);

  if (dryRun) {
    logger.info('DRY RUN MODE: No data will be saved');
    return {
      success: true,
      scraped: 0,
      inserted: 0
    };
  }

  const workflow = new ScrapingWorkflow();

  try {
    await workflow.initialize();

    const result = await workflow.processSingleAgency(agencyName, debug);

    return {
      success: result.success,
      scraped: result.scraped_count,
      inserted: result.inserted_count,
      error: result.success ? undefined : result.error_message
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Agency collection failed: ${errorMessage}`);

    return {
      success: false,
      scraped: 0,
      inserted: 0,
      error: errorMessage
    };
  } finally {
    await workflow.cleanup();
  }
}

/**
 * Get default list of government agencies for scraping
 * TODO: This should be loaded from database or config
 */
async function getDefaultAgencies(): Promise<string[]> {
  // Sample agencies - in real implementation, this would come from database
  const defaultAgencies = [
    '서울특별시',
    '부산광역시',
    '대구광역시',
    '인천광역시',
    '광주광역시',
    '대전광역시',
    '울산광역시',
    '세종특별자치시',
    '경기도',
    '강원도'
  ];

  logger.info(`Using ${defaultAgencies.length} default agencies`);
  return defaultAgencies;
}