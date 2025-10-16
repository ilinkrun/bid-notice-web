import axios from 'axios';

// API 타입 정의 - 모든 백엔드 서버 포함
export type ApiType = 'bid' | 'board' | 'mysql' | 'spider';

// API baseURL 설정
const getBaseUrl = (type: ApiType = 'bid'): string => {
  switch (type) {
    case 'board':
      return process.env.NEXT_PUBLIC_BACKEND_BOARD_URL || 'http://localhost:11307';
    case 'mysql':
      return process.env.NEXT_PUBLIC_BACKEND_MYSQL_URL || 'http://localhost:11302';
    case 'spider':
      return process.env.NEXT_PUBLIC_BACKEND_SPIDER_URL || 'http://localhost:11301';
    case 'bid':
    default:
      return process.env.NEXT_PUBLIC_BACKEND_BID_URL || 'http://localhost:11303';
  }
};


// API 클라이언트 생성 함수
export const createApiClient = (type: ApiType = 'bid') => {
  const apiClient = axios.create({
    baseURL: getBaseUrl(type),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 요청 인터셉터
  apiClient.interceptors.request.use(
    (config) => {
      // 필요한 경우 인증 토큰 추가
      // 서버 컴포넌트에서는 localStorage를 사용할 수 없으므로 조건부로 처리
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        // 서버 응답이 있는 경우
        switch (error.response.status) {
          case 401:
            // 인증 에러 처리
            break;
          case 403:
            // 권한 에러 처리
            break;
          case 404:
            // 리소스 없음 에러 처리
            break;
          case 500:
            // 서버 에러 처리
            break;
          default:
            // 기타 에러 처리
            break;
        }
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
};

// 기본 API 클라이언트 (bid 타입)
export const apiClient = createApiClient('bid');

// 게시판 API 클라이언트
export const boardApiClient = createApiClient('board');

// MySQL API 클라이언트
export const mysqlApiClient = createApiClient('mysql');

// Spider API 클라이언트
export const spiderApiClient = createApiClient('spider'); 