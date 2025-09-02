# GraphQL Integration Tests

이 디렉토리에는 bid-notice-web 프론트엔드의 GraphQL API 통합 테스트가 포함되어 있습니다.

## 테스트 구조

### 테스트 파일들

- **test-base.js** - 기본 GraphQL 기능 테스트 (health check, introspection)
- **test-notice.js** - 공고 관련 쿼리 및 뮤테이션 테스트
- **test-bid.js** - 입찰 관련 쿼리 및 뮤테이션 테스트  
- **test-settings.js** - 설정 관련 쿼리 및 뮤테이션 테스트
- **test-spider.js** - 스파이더 서버 연동 테스트
- **test-mysql.js** - MySQL 직접 쿼리 테스트
- **test-statistics.js** - 통계 데이터 쿼리 테스트

### 유틸리티 파일들

- **run-all-tests.js** - 모든 테스트를 순차적으로 실행하는 스크립트
- **package.json** - 테스트 의존성 및 스크립트 정의

## 사전 준비사항

### 1. 필요한 서버들이 실행 중인지 확인

```bash
# Frontend server (port 11501)
cd /frontend && npm run dev

# Backend servers
cd /backend/src
python server_bid.py     # port 11303
python server_mysql.py   # port 11302  
python server_spider.py  # port 11301
```

### 2. 의존성 설치

```bash
cd /_exp/projects/bid-notice-web/frontend/tests/graphql
npm install
```

## 테스트 실행 방법

### 전체 테스트 실행

```bash
# 모든 테스트 한번에 실행
node run-all-tests.js

# 또는 npm script 사용
npm test
```

### 개별 테스트 실행

```bash
# 특정 테스트 파일만 실행
node --test test-notice.js
node --test test-bid.js
node --test test-settings.js
```

### Watch 모드로 실행

```bash
# 파일 변경시 자동으로 재실행
npm run test:watch
```

## 테스트 세부사항

### Base Tests (test-base.js)
- ✅ GraphQL 서버 health check
- ✅ Schema introspection
- ✅ Invalid query 에러 핸들링

### Notice Tests (test-notice.js)  
- ✅ 공고 목록 조회 (`notices`)
- ✅ 공고 통계 조회 (`noticesStatistics`)
- ✅ 키워드 기반 공고 검색 (`searchNotices`)

### Bid Tests (test-bid.js)
- ✅ 내 입찰 목록 조회 (`myBids`)
- ✅ 상태별 입찰 조회 (`bidsByStatus`)
- ✅ 입찰 상태 업데이트 (`updateBidStatus`)

### Settings Tests (test-settings.js)
- ✅ 설정 목록 조회 (`settingsList`)
- ✅ 카테고리 설정 조회 (`settingsCategorys`)
- ✅ 카테고리 가중치 검색 (`categoryWeightSearch`)
- ✅ 키워드 가중치 파싱 (`parseKeywordWeights`)

### Spider Tests (test-spider.js)
- ✅ 스파이더 서버 연결 테스트 (`spiderHello`)
- ✅ 기관별 크롤링 상태 확인 (`checkFetchList`)
- ✅ CSV 데이터 테스트 (`testCsv`)

### MySQL Tests (test-mysql.js)
- ✅ 직접 SQL 쿼리 실행 (`executeSql`)
- ✅ 가중치 기반 공고 검색 (`searchNoticesByWeight`)

### Statistics Tests (test-statistics.js)
- ✅ 크롤링 로그 통계 (`logScrapings`)
- ✅ 크롤링 에러 통계 (`errorScrapings`)
- ✅ 지역별 공고 통계 (`noticeRegionStatistics`)

## 에러 처리

각 테스트는 다음과 같은 시나리오를 처리합니다:

- 네트워크 연결 실패
- 백엔드 서버 응답 없음  
- 잘못된 GraphQL 쿼리
- 데이터 형식 불일치
- 인증/권한 오류

## 환경 설정

### GraphQL Endpoint
- 기본값: `http://localhost:11501/api/graphql`
- 환경변수로 변경 가능: `GRAPHQL_ENDPOINT`

### Backend Servers
- Bid Server: `http://14.34.23.70:11303`
- MySQL Server: `http://14.34.23.70:11302`  
- Spider Server: `http://14.34.23.70:11301`

## 문제 해결

### 테스트 실패시 확인사항

1. **서버 상태 확인**
   ```bash
   curl http://localhost:11501/api/graphql -d '{"query":"{ health }"}' -H "Content-Type: application/json"
   ```

2. **백엔드 서버 연결 확인**
   ```bash
   curl http://14.34.23.70:11303/health
   curl http://14.34.23.70:11302/health  
   curl http://14.34.23.70:11301/health
   ```

3. **GraphQL Schema 확인**
   - GraphQL Playground: `http://localhost:11501/api/graphql`

### 일반적인 오류들

- **ECONNREFUSED**: 프론트엔드 서버가 실행되지 않음
- **Network Error**: 백엔드 서버 연결 불가
- **GraphQL Error**: 스키마 불일치 또는 쿼리 오류
- **Timeout**: 서버 응답 지연

## 로그 및 디버깅

테스트 실행시 다음과 같은 로그가 출력됩니다:

```
🚀 Starting GraphQL Integration Tests
=====================================
GraphQL Endpoint: http://localhost:11501/api/graphql
Running 7 test suites...

📋 Running test-base.js...
✅ test-base.js - PASSED

📋 Running test-notice.js...
✅ test-notice.js - PASSED

...
```

각 테스트의 상세 응답 데이터도 콘솔에 출력되어 디버깅에 도움이 됩니다.