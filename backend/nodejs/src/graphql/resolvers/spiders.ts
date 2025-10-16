import { scrapeList, ERROR_CODES } from '@/utils/spiderGovBidList';

export const spidersResolvers = {
  Query: {
    spidersCheckFetchList: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        // Use TypeScript utility function instead of Python API
        const result = await scrapeList(orgName, 1, 2);

        return {
          orgName: result.org_name,
          success: result.error_code === ERROR_CODES.SUCCESS,
          errorCode: result.error_code,
          errorMessage: result.error_message,
          dataCount: result.data.length,
          data: result.data
        };
      } catch (error) {
        console.error('Error checking fetch list:', error);
        return {
          orgName,
          success: false,
          errorCode: ERROR_CODES.UNKNOWN_ERROR,
          errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
          dataCount: 0,
          data: []
        };
      }
    },

    spidersHello: async () => {
      // Simple test endpoint - no need for external API
      return { message: 'Hello, World!' };
    },
  },

  Mutation: {
    spidersTestCsv: async (_: unknown, { csvData }: { csvData: string }) => {
      // Simple CSV echo endpoint - no need for external API
      try {
        return csvData;
      } catch (error) {
        console.error('Error testing CSV:', error);
        throw new Error('Failed to test CSV data');
      }
    },
  },
};