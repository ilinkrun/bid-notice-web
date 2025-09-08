// http://localhost:3011/api/rest

import axios, { AxiosInstance } from 'axios';

let client: AxiosInstance | null = null;

export function getClient() {
  if (!client) {
    client = axios.create({
      baseURL: 'http://14.34.23.70:11303',
      headers: {
        'Content-Type': 'application/json',
      },
      // timeout: 10000, // 10초
    });

    // 요청 인터셉터
    client.interceptors.request.use(
      (config) => {
        // 요청 전에 수행할 작업
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    client.interceptors.response.use(
      (response) => {
        // 응답 데이터 가공이 필요한 경우
        return response;
      },
      (error) => {
        // 에러 처리
        if (error.response) {
          // 서버가 응답을 반환한 경우
          console.error('Response Error:', error.response.data);
        } else if (error.request) {
          // 요청은 보냈지만 응답을 받지 못한 경우
          console.error('Request Error:', error.request);
        } else {
          // 요청 설정 중 에러가 발생한 경우
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }
  return client;
} 