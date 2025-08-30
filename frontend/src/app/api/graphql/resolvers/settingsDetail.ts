import { apiClient } from '@/lib/api/backendClient';

export const settingsDetailResolvers = {
  Query: {
    settingsDetails: async () => {
      try {
        console.log('settingsDetails API 호출 시작');
        const response = await apiClient.get('/settings_detail');
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
        
        // 백엔드 BID 서버의 /settings_detail/{기관명} 엔드포인트 호출
        const response = await apiClient.get(`/settings_detail/${encodedOrgName}`);
        console.log('settingDetail API 응답:', response.data);
        
        const setting = response.data;

        if (!setting) {
          console.log('settingDetail: 설정 데이터가 없습니다');
          return null;
        }

        // 백엔드에서 받은 데이터 구조 처리 (실제 응답에 맞게 수정)
        let elements = [];
        
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
              { key: '제목', xpathString: orgSetting['제목'] || '' },
              { key: '본문', xpathString: orgSetting['본문'] || '' },
              { key: '파일이름', xpathString: orgSetting['파일이름'] || '' },
              { key: '파일주소', xpathString: orgSetting['파일주소'] || '' },
              { key: '공고구분', xpathString: orgSetting['공고구분'] || '' },
              { key: '공고번호', xpathString: orgSetting['공고번호'] || '' },
              { key: '담당부서', xpathString: orgSetting['담당부서'] || '' },
              { key: '담당자', xpathString: orgSetting['담당자'] || '' },
              { key: '연락처', xpathString: orgSetting['연락처'] || '' },
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
            key !== '기관명' && setting[key]
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
