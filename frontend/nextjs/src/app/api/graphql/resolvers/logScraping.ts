import { apiClient } from '@/lib/api/backendClient';

interface LogScrapingInput {
  orgName?: string;
  errorCode?: string;
  errorMessage?: string;
  scrapedCount?: number;
  insertedCount?: number;
  time?: string;
}

export const logScrapingResolvers = {
  Query: {
    logScrapings: async (_: unknown, { gap }: { gap?: number }) => {
      try {
        const response = await apiClient.get('/logs_notice_scraping', { params: { gap } });
        return response.data.map((log: { org_name: string; error_code: string; error_message: string; scraped_count: number; inserted_count: number; time: string }) => ({
          orgName: log.org_name,
          errorCode: log.error_code,
          errorMessage: log.error_message,
          scrapedCount: log.scraped_count,
          insertedCount: log.inserted_count,
          time: log.time
        }));
      } catch (error) {
        console.error('Error fetching logs notice scraping:', error);
        return [];
      }
    },
  },
  Mutation: {
    createLogScraping: async (_: unknown, { input }: { input: LogScrapingInput }) => {
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
  },
};
