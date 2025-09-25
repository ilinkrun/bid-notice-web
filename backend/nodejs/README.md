# Unified Node.js Backend

Korean government bid notice system의 통합 Node.js 백엔드입니다.

## 🏗️ 구조

```
src/
├── graphql/          # GraphQL 서버
│   ├── server.ts
│   ├── schema/
│   └── resolvers/
├── utils/            # 재사용 유틸리티
│   ├── gov/          # 관공서 관련 utils
│   └── nara/         # 나라장터 관련 utils
├── execs/            # 독립 실행 스크립트
│   ├── spider_list.ts
│   └── spider_detail.ts
├── types/            # TypeScript 타입 정의
├── database/         # 데이터베이스 관련
└── index.ts          # 메인 서버 진입점
```

## 🚀 실행 방법

### 개발 모드

```bash
# GraphQL 서버 개발 모드
npm run graphql:dev

# 또는 전체 서버 개발 모드
npm run dev
```

### 프로덕션 빌드

```bash
# SWC로 빌드
npm run build

# 빌드된 파일 실행
npm start
```

### Spider 스크립트 실행

```bash
# 관공서 공고 목록 수집 (Dry-run 모드 - API 키 불필요)
npm run spider:list -- --source gov --limit 100 --dry-run

# 나라장터 공고 목록 수집 (Dry-run 모드 - API 키 불필요)
npm run spider:list -- --source nara --limit 100 --dry-run

# 실제 API 호출 (환경변수 DATA_GO_KR_SERVICE_KEY 필요)
npm run spider:list -- --source nara --limit 50

# 공고 상세 정보 수집
npm run spider:detail -- --source nara --notice-id test123 --dry-run

# 관공서 스크래핑 테스트 (수동)
npm run test:gov -- --org-name "가평군청" --debug --dry-run
npm run test:gov -- --org-name "한국공항공사" --debug --dry-run
```

**주요 옵션:**
- `--dry-run`: 테스트 모드, 실제 데이터베이스에 저장하지 않음
- `--debug`: 상세 로그 출력
- `--limit N`: 수집할 공고 개수 제한

## 🔧 설정

### 환경 변수

`.env` 파일을 생성하고 다음 환경 변수들을 설정하세요:

```env
NODE_ENV=development
PORT=4000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# Data.go.kr API Key (나라장터)
# Get your service key from: https://www.data.go.kr/
DATA_GO_KR_SERVICE_KEY=your_data_go_kr_service_key_here

# Browser Configuration (for GOV scraping)
HEADLESS=true
CHROMIUM_EXECUTABLE_PATH=
```

## 📝 주요 특징

1. **통합된 package.json**: 중복된 의존성 제거
2. **절대 경로 import**: `@/` alias 사용 (NextJS 방식)
3. **TypeScript + SWC**: 빠른 컴파일
4. **GraphQL 서버**: Apollo Server 기반
5. **독립 실행 스크립트**: spider 작업 등

## 🛠️ 개발 도구

```bash
# 타입 체크
npm run type-check

# 린트
npm run lint

# 포맷팅
npm run format

# 테스트
npm run test
```

## 📦 의존성

### 주요 프로덕션 의존성
- `@apollo/server`: GraphQL 서버
- `express`: 웹 서버
- `mysql2`: MySQL 클라이언트
- `axios`: HTTP 클라이언트
- `cheerio`: HTML 파싱
- `playwright`: 웹 스크래핑

### 주요 개발 의존성
- `@swc/core`: 빠른 TypeScript 컴파일러
- `tsx`: TypeScript 실행기
- `typescript`: TypeScript 컴파일러
- `vitest`: 테스트 프레임워크

## 🔄 마이그레이션 가이드

기존 `api/` 및 `graphql/` 디렉토리에서 통합 구조로 마이그레이션:

1. GraphQL 관련 코드: `src/graphql/`로 이동
2. API 유틸리티: `src/utils/`로 이동
3. 독립 실행 스크립트: `src/execs/`로 이동
4. 절대 경로 import 사용: `@/utils/nara/client` 등

## 🎯 향후 계획

- [ ] Python backend 기능들을 Node.js로 포팅
- [ ] Python 서버 의존성 제거
- [ ] GraphQL에서 모든 기능 일원화
- [ ] 성능 최적화 및 캐싱 전략
- [ ] 모니터링 및 로깅 시스템