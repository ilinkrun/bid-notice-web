import axios from 'axios';

// API client for general backend services (port 11303)
export const apiClient = axios.create({
  baseURL: process.env.BACKEND_BID_URL || 'http://1.231.118.217:11303',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API client for spider services (port 11301)
export const spiderApiClient = axios.create({
  baseURL: process.env.BACKEND_SPIDER_URL || 'http://1.231.118.217:11301',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API client for MySQL services (port 11302) 
export const mysqlApiClient = axios.create({
  baseURL: process.env.BACKEND_MYSQL_URL || 'http://1.231.118.217:11302',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API client for board services (port 11307)
export const boardApiClient = axios.create({
  baseURL: process.env.BACKEND_BOARD_URL || 'http://1.231.118.217:11307',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptors
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Add similar interceptors for other clients
[spiderApiClient, mysqlApiClient, boardApiClient].forEach(client => {
  client.interceptors.request.use(
    (config) => {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error.response?.data || error.message);
      return Promise.reject(error);
    }
  );
});