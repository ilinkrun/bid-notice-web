import { apiClient } from '@/lib/api/backendClient';

interface ErrorScrapingResponse {
  orgs: string;
  time: string;
}

export const errorScrapingResolvers = {
  Query: {
    errorScrapings: async (_parent: unknown, { gap }: { gap: number }) => {
      try {
        const response = await apiClient.get<ErrorScrapingResponse[]>('/errors_notice_scraping', { params: { gap } });
        return response.data.map((error) => ({
          orgNames: error.orgs.split(','),
          time: error.time
        }));
      } catch (error) {
        console.error('Error fetching errors scraping:', error);
        return [];
      }
    },
  },
};
