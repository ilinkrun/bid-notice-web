# Bid Notice GraphQL Server

Frontend API를 통합한 독립적인 GraphQL 서버입니다. Frontend API 파일들은 수정하지 않고 그대로 보존하며, 새로운 backend GraphQL 서버를 제공합니다.

## 설치 및 실행

```bash
cd /exposed/projects/bid-notice-web/backend/nodejs/graphql

# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

## API 엔드포인트

- GraphQL: `http://localhost:11401/graphql`
- GraphQL Playground: `http://localhost:11401/graphql` (개발 모드)
- Health Check: `http://localhost:11401/health`

## 환경 변수

```bash
PORT=11401
FRONTEND_URL=http://localhost:11501
BACKEND_API_URL=http://localhost:8000
```

## 통합된 기능

### Frontend API에서 복사한 GraphQL 스키마와 리졸버:
- Notice 관련 queries/mutations
- Settings 관련 queries/mutations  
- Board 관련 queries/mutations
- Spider 관련 queries/mutations
- MySQL 관련 queries/mutations
- Error/Log scraping 관련 queries/mutations

### Frontend API를 GraphQL로 변환:
- REST routes → GraphQL queries
- Upload routes → GraphQL mutations
- Test routes → GraphQL queries

## 주의사항

- Frontend API 파일들은 수정되지 않았으며 기존 기능을 그대로 유지합니다
- 이 GraphQL 서버는 frontend API와 독립적으로 동작합니다
- 필요에 따라 frontend에서 이 GraphQL 서버를 사용하거나 기존 API를 계속 사용할 수 있습니다