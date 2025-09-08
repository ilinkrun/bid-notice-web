import { apiClient } from '@/lib/api/backendClient';

export const settingsDetailResolvers = {
  Query: {
    settingsDetails: async () => {
      try {
        console.log('settingsDetails API 호출 시작');
        const response = await apiClient.get('/settings_notice_detail');
        console.log('settingsDetails API 응답:', response.data);
        
        if (!response) {
          console.log('API 응답이 없습니다');
          return [];
        }

        if (!response.data || !Array.isArray(response.data)) {
          console.log('유효하지 않은 응답 데이터:', response.data);
          return [];
        }

        return response.data.map((item: any) => ({
          orgName: item?.org_name || '',
          title: item?.title || '',
          content: item?.body_html || '',
          // fileName: item?.file_name || '',
          // fileUrl: item?.file_url || '',
          // noticeType: item?.notice_div || '',
          // noticeNumber: item?.notice_num || '',
          // department: item?.org_dept || '',
          // manager: item?.org_man || '',
          // contact: item?.org_tel || '',
        }));
      } catch (error) {
        console.error('settingsDetail API 에러 상세:', error);
        if (error instanceof Error) {
          console.error('에러 메시지:', error.message);
        }
        return [];
      }
    },

    settingDetail: async (_: unknown, { orgName }: { orgName: string }) => {
      try {
        console.log('settingDetail 요청:', orgName);
        const encodedOrgName = encodeURIComponent(orgName);
        console.log('인코딩된 기관명:', encodedOrgName);
        
        // 백엔드 BID 서버의 /settings_notice_detail/{기관명} 엔드포인트 호출
        const response = await apiClient.get(`/settings_notice_detail/${encodedOrgName}`);
        console.log('settingDetail API 응답:', response.data);
        
        const setting = response.data;

        if (!setting) {
          console.log('settingDetail: 설정 데이터가 없습니다');
          return null;
        }

        // 백엔드에서 받은 데이터 구조 처리 (실제 응답에 맞게 수정)
        let elements: Array<{
          key: string;
          xpath: string;
          target: string | null;
          callback: string | null;
        }> = [];
        
        // 백엔드 응답이 배열 형태인 경우 (실제 응답 형태)
        if (Array.isArray(setting)) {
          // 배열의 첫 번째 요소가 기관 설정 정보
          const orgSetting = setting[0];
          if (orgSetting) {
            // XPath 문자열 분석 함수
            const parseXPath = (xpathString: string) => {
              if (!xpathString) return { xpath: '', target: null, callback: null };
              
              const parts = xpathString.split('|-');
              const xpath = parts[0] || '';
              const target = parts[1] || null;
              const callback = parts[2] || null;
              
              return { xpath, target, callback };
            };

            // 각 필드를 element로 변환
            const fieldMappings = [
              { key: '제목', xpathString: orgSetting['title'] || '' },
              { key: '본문', xpathString: orgSetting['body_html'] || '' },
              { key: '파일이름', xpathString: orgSetting['file_name'] || '' },
              { key: '파일주소', xpathString: orgSetting['file_url'] || '' },
              { key: '공고구분', xpathString: orgSetting['notice_div'] || '' },
              { key: '공고번호', xpathString: orgSetting['notice_num'] || '' },
              { key: '담당부서', xpathString: orgSetting['org_dept'] || '' },
              { key: '담당자', xpathString: orgSetting['org_man'] || '' },
              { key: '연락처', xpathString: orgSetting['org_tel'] || '' },
            ];
            
            elements = fieldMappings
              .filter(field => field.xpathString) // XPath 문자열이 있는 것만 포함
              .map(field => {
                const parsed = parseXPath(field.xpathString);
                return {
                  key: field.key,
                  xpath: parsed.xpath,
                  target: parsed.target,
                  callback: parsed.callback
                };
              });
          }
        } 
        // 백엔드 응답이 객체 형태인 경우 (fallback)
        else if (setting && typeof setting === 'object') {
          // XPath 문자열 분석 함수
          const parseXPath = (xpathString: string) => {
            if (!xpathString) return { xpath: '', target: null, callback: null };
            
            const parts = xpathString.split('|-');
            const xpath = parts[0] || '';
            const target = parts[1] || null;
            const callback = parts[2] || null;
            
            return { xpath, target, callback };
          };

          const elementKeys = Object.keys(setting).filter(key => 
            key !== 'org_name' && setting[key]
          );
          
          elements = elementKeys.map(key => {
            const parsed = parseXPath(setting[key] || '');
            return {
              key: key,
              xpath: parsed.xpath,
              target: parsed.target,
              callback: parsed.callback
            };
          });
        }
        
        console.log('변환된 elements:', elements);

        const result = {
          orgName: orgName,
          elements: elements,
        };
        
        console.log('settingDetail 결과:', result);
        return result;
      } catch (error) {
        console.error(`Error fetching setting for ${orgName}:`, error);
        if (error instanceof Error) {
          console.error('에러 상세:', error.message);
        }
        return null;
      }
    },
  },
};
