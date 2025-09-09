import { spiderApiClient } from '@/lib/api/backendClient';
export const spidersResolvers = {
    Query: {
        spidersCheckFetchList: async (_, { orgName }) => {
            try {
                const response = await spiderApiClient.get('/check_fetch_list', {
                    params: { org_name: orgName }
                });
                return {
                    orgName: response.data.org_name,
                    success: response.data.success || response.data.error_code === 0,
                    errorCode: response.data.error_code,
                    errorMessage: response.data.error_message,
                    dataCount: response.data.data_count,
                    data: response.data.data || []
                };
            }
            catch (error) {
                console.error('Error checking fetch list:', error);
                return {
                    orgName,
                    success: false,
                    errorCode: 999,
                    errorMessage: 'Frontend request failed',
                    dataCount: 0,
                    data: []
                };
            }
        },
        spidersHello: async () => {
            try {
                const response = await spiderApiClient.get('/hello');
                return response.data;
            }
            catch (error) {
                console.error('Error calling spider hello:', error);
                return { message: 'Error connecting to spider server' };
            }
        },
    },
    Mutation: {
        spidersTestCsv: async (_, { csvData }) => {
            try {
                const response = await spiderApiClient.post('/test_csv/', {
                    csv: csvData
                });
                return response.data;
            }
            catch (error) {
                console.error('Error testing CSV:', error);
                throw new Error('Failed to test CSV data');
            }
        },
    },
};
//# sourceMappingURL=spiders.js.map