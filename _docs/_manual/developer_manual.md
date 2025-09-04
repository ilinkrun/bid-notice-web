# 입찰공고 관리 시스템 - 개발자 매뉴얼

## 목차
1. [시스템 개요](#시스템-개요)
2. [아키텍처](#아키텍처)
3. [개발 환경 설정](#개발-환경-설정)
4. [백엔드 개발](#백엔드-개발)
5. [프론트엔드 개발](#프론트엔드-개발)
6. [데이터베이스](#데이터베이스)
7. [API 문서](#api-문서)
8. [배포](#배포)
9. [트러블슈팅](#트러블슈팅)

## 시스템 개요

**입찰공고 관리 시스템**은 한국 정부 입찰공고를 자동으로 수집하고 분류하는 웹 스크래핑 시스템입니다.

### 주요 기능
- 정부기관 입찰공고 자동 수집
- 키워드 기반 분류 및 매칭
- 실시간 공고 검색 및 필터링
- 통계 및 분석 대시보드
- 파일 첨부 관리

### 기술 스택
- **Backend**: Python, FastAPI, MySQL, Playwright
- **Frontend**: Next.js, React, TypeScript, GraphQL, Tailwind CSS
- **Infrastructure**: Docker, Ubuntu, Synology NAS

## 아키텍처

### 멀티 서버 구조
시스템은 4개의 FastAPI 서버로 구성됩니다:

```
┌─────────────────────────────────────────┐
│              Frontend (Next.js)        │
│                Port 11501               │
└─────────────┬───────────────────────────┘
              │ GraphQL API
              │
┌─────────────┴───────────────────────────┐
│              Backend Services           │
├─────────────────────────────────────────┤
│ server_spider.py  │ server_mysql.py     │
│    Port 11301     │    Port 11302       │
├─────────────────────┬───────────────────┤
│ server_bid.py     │ server_board.py     │
│    Port 11303     │    Port 11307       │
└─────────────────────┴───────────────────┘
              │
┌─────────────┴───────────────────────────┐
│              MySQL Database             │
│                Port 11101               │
└─────────────────────────────────────────┘
```

### 서버 역할
- **server_spider.py (11301)**: 웹 스크래핑 전용 서버
- **server_mysql.py (11302)**: 데이터베이스 직접 조작
- **server_bid.py (11303)**: 메인 비즈니스 로직, 키워드 매칭
- **server_board.py (11307)**: 게시판 시스템

## 개발 환경 설정

### 필수 요구사항
- Ubuntu 24.04+ (Docker)
- Python 3.11+
- Node.js 18+
- MySQL 8.0+

### 백엔드 환경 설정

```bash
# 프로젝트 클론
cd /volume1/docker/platforms/ilmac-ubuntu-dev/projects
git clone <repository-url> bid-notice-web

# 백엔드 디렉토리 이동
cd bid-notice-web/backend

# Python 가상환경 생성 (UV 사용)
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync

# 환경변수 설정
cp .env.example .env
# .env 파일 편집하여 MySQL 정보 입력

# 필수 시스템 패키지 설치
apt-get update && apt-get install -y libxml2-dev libxslt-dev

# Playwright 설치
uv run python -m playwright install
```

### 프론트엔드 환경 설정

```bash
# 프론트엔드 디렉토리 이동
cd ../frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 환경변수 (.env)

```bash
# MySQL 설정
MYSQL_HOST=localhost
MYSQL_PORT=11101
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=bid_notice

# API 키 (필요시)
API_KEY=your_api_key

# 로그 레벨
LOG_LEVEL=INFO
```

## 백엔드 개발

### 프로젝트 구조

```
backend/
├── src/
│   ├── server_spider.py     # 스크래핑 서버
│   ├── server_mysql.py      # DB 조작 서버
│   ├── server_bid.py        # 메인 비즈니스 로직
│   ├── server_board.py      # 게시판 서버
│   ├── spider_*.py          # 스크래핑 모듈들
│   ├── mysql_*.py           # DB 조작 모듈들
│   └── utils_*.py           # 유틸리티 모듈들
├── config/
│   └── crontab              # 크론 설정
├── scripts/
│   └── start_servers.sh     # 서버 시작 스크립트
└── logs/                    # 로그 파일들
```

### 서버 실행

```bash
# 전체 서버 실행
./start_servers.sh

# 개별 서버 실행
uv run server_spider.py    # Port 11301
uv run server_mysql.py     # Port 11302
uv run server_bid.py       # Port 11303
uv run server_board.py     # Port 11307
```

### 주요 개발 패턴

#### 1. 데이터베이스 연결
```python
from utils_mysql import get_connection

async def get_notices():
    with get_connection() as conn:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM notices")
        return cursor.fetchall()
```

#### 2. 에러 처리
```python
from fastapi import HTTPException

async def api_endpoint():
    try:
        # 비즈니스 로직
        result = process_data()
        return {"error_code": 0, "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error_code": 1, "error_message": str(e)}
        )
```

#### 3. 로깅
```python
from utils_log import setup_logger

logger = setup_logger(__name__)

async def function():
    logger.info("Processing started")
    # 로직 실행
    logger.error("Error occurred", exc_info=True)
```

### 스크래핑 모듈 개발

#### 새로운 기관 추가
1. `settings_list` 테이블에 기관 정보 추가:
```sql
INSERT INTO settings_list (
    org_name, url, rowXpath, title, detail_url, 
    iframe, page_type, use_status
) VALUES (
    '새기관명', 
    'http://example.com/list',
    '//tr[@class="row"]',
    './/td[2]/a',
    './/td[2]/a/@href',
    '', 
    'pagination', 
    'Y'
);
```

2. 스크래핑 테스트:
```bash
uv run spider_list.py --org_name="새기관명"
```

#### XPath 셀렉터 개발 팁
- Chrome DevTools 활용
- 동적 콘텐츠는 Playwright 사용
- 페이지네이션 패턴 파악
- 로그인 필요 여부 확인

## 프론트엔드 개발

### 프로젝트 구조

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/graphql/     # GraphQL API
│   │   ├── bids/            # 입찰 관련 페이지
│   │   ├── notices/         # 공고 관련 페이지
│   │   ├── settings/        # 설정 페이지
│   │   └── statistics/      # 통계 페이지
│   ├── components/          # 재사용 컴포넌트
│   │   ├── ui/             # Shadcn/ui 컴포넌트
│   │   ├── bids/           # 입찰 관련 컴포넌트
│   │   ├── notices/        # 공고 관련 컴포넌트
│   │   └── layouts/        # 레이아웃 컴포넌트
│   └── lib/                # 유틸리티 라이브러리
```

### GraphQL 스키마

#### 주요 타입 정의
```graphql
type Notice {
  nid: String!
  title: String!
  orgName: String!
  postedAt: String!
  category: String
  region: String
  files: [NoticeFile]
}

type Query {
  notices(
    page: Int = 1
    pageSize: Int = 20
    category: String
    keyword: String
    orgName: String
  ): NoticeConnection!
  
  noticeDetail(nid: String!): Notice
}
```

#### 리졸버 예시
```typescript
// src/app/api/graphql/resolvers/notice.ts
export const noticeResolvers = {
  Query: {
    notices: async (parent: any, args: any) => {
      const response = await fetch(
        `http://localhost:11302/mysql/notice_list?` +
        new URLSearchParams(args)
      );
      return response.json();
    }
  }
};
```

### 컴포넌트 개발

#### 테이블 컴포넌트 패턴
```typescript
// components/notices/NoticeTable.tsx
interface NoticeTableProps {
  data: Notice[];
  loading?: boolean;
  onRowClick?: (notice: Notice) => void;
}

export function NoticeTable({ data, loading, onRowClick }: NoticeTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>제목</TableHead>
          <TableHead>기관명</TableHead>
          <TableHead>등록일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((notice) => (
          <TableRow 
            key={notice.nid}
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onRowClick?.(notice)}
          >
            <TableCell>{notice.title}</TableCell>
            <TableCell>{notice.orgName}</TableCell>
            <TableCell>{notice.postedAt}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

#### Apollo Client 사용
```typescript
// lib/api/graphqlClient.ts
import { ApolloClient, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  uri: '/api/graphql',
  cache: new InMemoryCache()
});

// 컴포넌트에서 사용
import { useQuery } from '@apollo/client';

function NoticesList() {
  const { data, loading } = useQuery(GET_NOTICES, {
    variables: { page: 1, pageSize: 20 }
  });
  
  if (loading) return <LoadingSpinner />;
  
  return <NoticeTable data={data?.notices?.items || []} />;
}
```

### 스타일링

#### Tailwind CSS + Shadcn/ui
```typescript
// 테마 설정 - src/app/themes.css
:root {
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 210 40% 96%;
}

// 컴포넌트 스타일링
<div className="container mx-auto p-4">
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="text-2xl font-bold">
        입찰공고 목록
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* 컨텐츠 */}
    </CardContent>
  </Card>
</div>
```

## 데이터베이스

### 주요 테이블 구조

#### notices (공고 목록)
```sql
CREATE TABLE notices (
  nid VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  org_name VARCHAR(255),
  posted_at DATETIME,
  category VARCHAR(100),
  region VARCHAR(100),
  keyword_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### details (공고 상세)
```sql
CREATE TABLE details (
  nid VARCHAR(255) PRIMARY KEY,
  content LONGTEXT,
  detail_url TEXT,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nid) REFERENCES notices(nid)
);
```

#### settings_list (스크래핑 설정)
```sql
CREATE TABLE settings_list (
  org_name VARCHAR(255) PRIMARY KEY,
  url TEXT NOT NULL,
  rowXpath TEXT,
  title TEXT,
  detail_url TEXT,
  iframe TEXT,
  page_type VARCHAR(50),
  use_status CHAR(1) DEFAULT 'Y'
);
```

### 데이터베이스 마이그레이션

```bash
# 마이그레이션 스크립트 실행
cd backend/scripts
python migrate_database.py
```

## API 문서

### Spider Server (Port 11301)

#### POST /spider/notice_list/{org_name}
기관별 공고 목록 스크래핑
```bash
curl -X POST "http://localhost:11301/spider/notice_list/가평군청" \
  -H "Content-Type: application/json"
```

#### GET /spider/test/{org_name}
스크래핑 설정 테스트
```bash
curl "http://localhost:11301/spider/test/가평군청"
```

### MySQL Server (Port 11302)

#### GET /mysql/notice_list
공고 목록 조회
```bash
curl "http://localhost:11302/mysql/notice_list?page=1&limit=20&category=공사점검"
```

#### POST /mysql/notice_list/{nid}
공고 정보 업데이트
```bash
curl -X POST "http://localhost:11302/mysql/notice_list/N123456" \
  -H "Content-Type: application/json" \
  -d '{"category": "성능평가", "keyword_score": 85}'
```

### Bid Server (Port 11303)

#### GET /bid/search
키워드 검색
```bash
curl "http://localhost:11303/bid/search?keyword=건축&category=공사점검"
```

#### GET /bid/categories
카테고리별 공고 통계
```bash
curl "http://localhost:11303/bid/categories"
```

## 배포

### Docker 배포

```bash
# 도커 컨테이너 시작
cd /volume1/docker/platforms/linux-servers
docker-compose up -d

# 컨테이너 내부 접속
docker exec -it linux-server-dev /bin/bash

# 프로젝트 디렉토리 이동
cd /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web

# 백엔드 서버 시작
cd backend && ./start_servers.sh

# 프론트엔드 빌드 및 시작
cd ../frontend
npm run build
npm run start
```

### Cron 설정
```bash
# crontab 등록
crontab config/crontab

# 크론 작업 확인
crontab -l

# 로그 확인
tail -f logs/cron.log
```

### 환경별 설정
- **개발환경**: 모든 서버 개별 실행, 디버그 로그
- **운영환경**: Docker Compose, 로그 로테이션
- **테스트환경**: 메모리 DB, 목 데이터

## 트러블슈팅

### 자주 발생하는 문제

#### 1. MySQL 연결 오류
```bash
# 연결 테스트
uv run utils_mysql.py

# 해결 방법
- .env 파일 MySQL 정보 확인
- 방화벽 설정 확인 (Port 11101)
- MySQL 서비스 상태 확인
```

#### 2. 스크래핑 실패
```bash
# 로그 확인
tail -f logs/spider_list.log

# 해결 방법
- XPath 셀렉터 업데이트
- 웹사이트 구조 변경 대응
- Playwright 브라우저 재설치
```

#### 3. 한글 인코딩 문제
```python
# 해결 방법
- MySQL 설정: charset=utf8mb4
- Python: UTF-8 인코딩 명시
- 웹페이지: meta charset 확인
```

#### 4. 메모리 사용량 증가
```bash
# 모니터링
htop
docker stats

# 해결 방법
- Playwright 브라우저 인스턴스 정리
- 데이터베이스 연결 풀 크기 조정
- 로그 로테이션 설정
```

### 로그 파일 위치
```bash
backend/logs/
├── server_spider.log    # 스크래핑 서버 로그
├── server_mysql.log     # DB 서버 로그
├── server_bid.log       # 메인 서버 로그
├── spider_list.log      # 스크래핑 작업 로그
└── cron.log            # 크론 작업 로그
```

### 개발 도구

#### 유용한 명령어
```bash
# 서버 상태 확인
lsof -i :11301,11302,11303,11307,11501

# 프로세스 확인
ps aux | grep -E "(server_|npm)"

# 로그 실시간 모니터링
tail -f logs/*.log

# 데이터베이스 쿼리 테스트
mysql -h localhost -P 11101 -u username -p bid_notice
```

#### VS Code 설정
```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "./backend/.venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "editor.formatOnSave": true
}
```

### 성능 최적화

#### 백엔드 최적화
- 데이터베이스 인덱스 추가
- 연결 풀 크기 조정
- 캐싱 전략 구현
- 비동기 처리 활용

#### 프론트엔드 최적화
- 코드 스플리팅
- 이미지 최적화
- 메모이제이션 활용
- 번들 사이즈 분석

---

## 추가 리소스

### 관련 문서
- [운영자 매뉴얼](./operations_manual.md)
- [사용자 매뉴얼](./user_manual.md)
- [API 레퍼런스](../api/)

### 외부 문서
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Playwright 공식 문서](https://playwright.dev/)
- [MySQL 8.0 레퍼런스](https://dev.mysql.com/doc/refman/8.0/en/)

### 커뮤니티
- GitHub Issues: 버그 리포트 및 기능 요청
- 개발팀 Slack: 실시간 소통
- 위키: 개발 노하우 공유