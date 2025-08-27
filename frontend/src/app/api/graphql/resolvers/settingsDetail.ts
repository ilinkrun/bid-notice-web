import { apiClient } from '@/lib/api/backendClient';

export const settingsDetailResolvers = {
  Query: {
    settingsDetails: async () => {
      try {
        const response = await apiClient.get('/settings_detail');
        if (!response) {
          console.log('API 응답이 없습니다');
          return [];
        }

        if (!response.data || !Array.isArray(response.data)) {
          console.log('유효하지 않은 응답 데이터:', response.data);
          return [];
        }

        return response.data.map((item: any) => ({
          orgName: item?.기관명 || '',
          title: item?.제목 || '',
          content: item?.본문 || '',
          // fileName: item?.파일이름 || '',
          // fileUrl: item?.파일주소 || '',
          // noticeType: item?.공고구분 || '',
          // noticeNumber: item?.공고번호 || '',
          // department: item?.담당부서 || '',
          // manager: item?.담당자 || '',
          // contact: item?.연락처 || '',
        }));
      } catch (error) {
        console.error('settingsDetail API 에러 상세:', error);
        return [];
      }
    },

    settingDetail: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        const response = await apiClient.get(`/settings_detail/${orgName}`);
        const setting = response.data;

        return {
          orgName: orgName,
          elements: setting.elements || [],
        };
      } catch (error) {
        console.error(`Error fetching setting for ${orgName}:`, error);
        return null;
      }
    },
  },
};
