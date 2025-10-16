import {
  getLogsNoticeScraping,
  getErrorsNoticeScraping
} from '@/utils/utilsGovBid';

export interface LogScrapingInput {
  orgName?: string;
  errorCode?: string;
  errorMessage?: string;
  scrapedCount?: number;
  insertedCount?: number;
  time?: string;
}

export const logsResolvers = {
  Query: {
    logsScrapingAll: async (_: unknown, { gap }: { gap?: number }) => {
      try {
        const logs = await getLogsNoticeScraping(gap || 15);
        return logs.map((log) => ({
          orgName: log.org_name || '',
          errorCode: log.error_code !== null ? String(log.error_code) : null,
          errorMessage: log.error_message || null,
          scrapedCount: log.scraped_count || 0,
          insertedCount: log.inserted_count || 0,
          time: log.time
        }));
      } catch (error) {
        console.error('Error fetching logs notice scraping:', error);
        return [];
      }
    },

    logsErrorAll: async (_: unknown, { gap }: { gap?: number }) => {
      try {
        const errors = await getErrorsNoticeScraping(gap || 15);
        return errors.map((log, index) => ({
          id: `error_${index}_${Date.now()}`,
          orgName: log.orgs || '',
          errorMessage: `Error occurred in organization: ${log.orgs}`,
          time: log.time
        }));
      } catch (error) {
        console.error('Error fetching error logs:', error);
        return [];
      }
    },
  },

  Mutation: {
    logCreate: async (_: unknown, { input }: { input: LogScrapingInput }) => {
      try {
        // TODO: 실제 로그 생성 로직 구현
        const newLog = {
          id: Date.now().toString(),
          ...input,
          createdAt: new Date().toISOString(),
        };
        return newLog;
      } catch (error) {
        console.error('Error creating log scraping:', error);
        throw new Error('Failed to create log scraping');
      }
    },

    logUpdate: async (_: unknown, { id, input }: { id: string; input: LogScrapingInput }) => {
      try {
        // TODO: 실제 로그 업데이트 로직 구현
        const updatedLog = {
          id,
          ...input,
          updatedAt: new Date().toISOString(),
        };
        return updatedLog;
      } catch (error) {
        console.error('Error updating log:', error);
        throw new Error('Failed to update log');
      }
    },
  },
};
