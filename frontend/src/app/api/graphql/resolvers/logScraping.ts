import { apiClient } from '@/lib/api/backendClient';

export const logScrapingResolvers = {
  Query: {
    logScrapings: async (_: any, { gap }: any) => {
      try {
        const response = await apiClient.get('/logs_notice_scraping', { params: { gap } });
        return response.data.map((log: any) => ({
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
    createLogScraping: async (_: any, { input }: any) => {
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
