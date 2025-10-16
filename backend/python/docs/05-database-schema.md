# 데이터베이스 스키마

## 개요

입찰공고 스크래핑 시스템은 MySQL 데이터베이스 **Bid**를 사용하며, 다음과 같은 주요 컴포넌트로 구성됩니다:
- 핵심 스크래핑 테이블: `notices`, `details`, `files`
- 설정 관리 테이블: `settings_list`, `settings_detail`, `settings_category`
- 워크플로우 테이블: `bids`
- 로그 관리 테이블: `logs_scraping`, `errors_notice_scraping`
- 게시판 테이블: `channel_dev`

## 데이터베이스 연결 설정

```python
# 환경변수 설정 (from utils_mysql.py)
MYSQL_HOST = '1.2.3.4'          # 기본값
MYSQL_PORT = 2306               # 기본값  
MYSQL_USER = 'root'             # 기본값
MYSQL_PASSWORD = 'mysqlIlmac1!' # 기본값
MYSQL_DATABASE = 'Bid'          # 기본값
CHARSET = 'utf8'
```

## 핵심 테이블

### 1. `notices` 테이블
**목적**: 각종 정부기관에서 스크래핑한 입찰공고/공고사항 저장

**스키마**:
```sql
CREATE TABLE notices (
    nid INT AUTO_INCREMENT PRIMARY KEY COMMENT '공고 고유 ID',
    기관명 VARCHAR(255) NOT NULL COMMENT '기관명/조직명',
    제목 TEXT NOT NULL COMMENT '공고 제목',
    상세페이지주소 TEXT COMMENT '상세 페이지 URL',
    작성일 DATE COMMENT '공고 작성일 (YYYY-MM-DD 형식)',
    작성자 VARCHAR(255) COMMENT '공고 작성자',
    category ENUM('공사점검', '성능평가', '기타') NULL COMMENT '자동 분류된 카테고리',
    status VARCHAR(50) NULL COMMENT '처리 상태 (준비, 관심, 등)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '레코드 생성 시간',
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '스크래핑 시간',
    
    INDEX idx_org_name (기관명),
    INDEX idx_posted_date (작성일),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_scraped_at (scraped_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**주요 필드**:
- `nid`: 기본키, 자동증가 ID
- `기관명`: 기관명 (필터링 및 그룹화용)
- `제목`: 공고 제목 (주요 검색 필드)
- `작성일`: 작성 날짜 (DATE 형식, 시간 기반 쿼리용)
- `category`: 키워드 매칭으로 자동 분류된 카테고리
- `status`: 입찰 처리를 위한 워크플로우 상태

### 2. `details` 테이블
**목적**: 공고 상세 페이지에서 추출한 상세 정보 저장

**스키마**:
```sql
CREATE TABLE details (
    did INT AUTO_INCREMENT PRIMARY KEY,
    nid INT NOT NULL COMMENT '공고 ID (notices 테이블 참조)',
    제목 TEXT COMMENT '상세 페이지 제목',
    본문 LONGTEXT COMMENT '공고 본문 내용',
    파일이름 TEXT COMMENT '첨부파일명 (여러개시 구분자로 분리)',
    파일주소 TEXT COMMENT '첨부파일 URL (여러개시 구분자로 분리)', 
    공고구분 VARCHAR(255) COMMENT '공고 구분/유형',
    공고번호 VARCHAR(255) COMMENT '공고 번호',
    담당부서 VARCHAR(255) COMMENT '담당 부서명',
    담당자 VARCHAR(255) COMMENT '담당자명',
    연락처 VARCHAR(255) COMMENT '연락처 정보',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (nid) REFERENCES notices(nid) ON DELETE CASCADE,
    INDEX idx_nid (nid),
    INDEX idx_notice_number (공고번호)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3. `files` 테이블
**목적**: 공고에서 추출한 개별 파일 정보 저장

**스키마**:
```sql
CREATE TABLE files (
    sn INT AUTO_INCREMENT PRIMARY KEY,
    nid INT NOT NULL COMMENT '공고 ID (notices 테이블 참조)',
    파일이름 VARCHAR(500) COMMENT '파일명',
    파일주소 TEXT COMMENT '파일 다운로드 URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (nid) REFERENCES notices(nid) ON DELETE CASCADE,
    INDEX idx_nid (nid),
    INDEX idx_filename (파일이름)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 설정 관리 테이블

### 4. `settings_list` 테이블
**목적**: 기관별 목록 페이지 스크래핑 설정 저장

**스키마**:
```sql
CREATE TABLE settings_list (
    sid INT AUTO_INCREMENT PRIMARY KEY,
    기관명 VARCHAR(255) NOT NULL UNIQUE COMMENT '기관명',
    url TEXT NOT NULL COMMENT '스크래핑 대상 URL',
    iframe VARCHAR(500) NULL COMMENT 'iframe URL (필요시)',
    rowXpath TEXT COMMENT '목록 행 XPath',
    paging VARCHAR(100) COMMENT '페이징 방식',
    startPage INT DEFAULT 1 COMMENT '시작 페이지',
    endPage INT DEFAULT 3 COMMENT '종료 페이지',
    login VARCHAR(500) NULL COMMENT '로그인 정보',
    use TINYINT(1) DEFAULT 1 COMMENT '사용 여부 (1: 사용, 0: 미사용)',
    지역 VARCHAR(100) COMMENT '지역 구분',
    등록 TINYINT(1) DEFAULT 1 COMMENT '등록 여부',
    제목 TEXT COMMENT '제목 추출 XPath',
    상세페이지주소 TEXT COMMENT '상세페이지 URL 추출 XPath',
    작성일 TEXT COMMENT '작성일 추출 XPath',
    작성자 TEXT COMMENT '작성자 추출 XPath',
    제외항목 TEXT COMMENT '제외할 항목 조건',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_org_name (기관명),
    INDEX idx_use (use),
    INDEX idx_region (지역)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 5. `settings_detail` 테이블
**목적**: 기관별 상세 페이지 스크래핑 설정 저장

**스키마**:
```sql
CREATE TABLE settings_detail (
    sid INT AUTO_INCREMENT PRIMARY KEY,
    기관명 VARCHAR(255) NOT NULL COMMENT '기관명',
    제목 TEXT COMMENT '제목 추출 XPath',
    본문 TEXT COMMENT '본문 추출 XPath', 
    파일이름 TEXT COMMENT '파일명 추출 XPath',
    파일주소 TEXT COMMENT '파일주소 추출 XPath',
    공고구분 TEXT COMMENT '공고구분 추출 XPath',
    공고번호 TEXT COMMENT '공고번호 추출 XPath',
    담당부서 TEXT COMMENT '담당부서 추출 XPath',
    담당자 TEXT COMMENT '담당자 추출 XPath',
    연락처 TEXT COMMENT '연락처 추출 XPath',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (기관명) REFERENCES settings_list(기관명),
    INDEX idx_org_name (기관명)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 6. `settings_category` 테이블
**목적**: 키워드 기반 분류 규칙 저장

**스키마**:
```sql
CREATE TABLE settings_category (
    sn INT AUTO_INCREMENT PRIMARY KEY,
    keywords TEXT NOT NULL COMMENT '검색 키워드 (키워드*가중치,키워드*가중치 형식)',
    nots TEXT COMMENT '제외할 키워드 (쉼표로 구분)',
    min_point INT DEFAULT 4 COMMENT '최소 가중치 점수',
    category ENUM('공사점검', '성능평가', '기타') NOT NULL COMMENT '카테고리명',
    creator VARCHAR(100) COMMENT '생성자',
    memo TEXT COMMENT '메모',
    use TINYINT(1) DEFAULT 1 COMMENT '사용 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_use (use)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 워크플로우 테이블

### 7. `bids` 테이블
**목적**: 입찰 워크플로우 관리 정보 저장

**스키마**:
```sql
CREATE TABLE bids (
    bid INT AUTO_INCREMENT PRIMARY KEY,
    nid INT NOT NULL COMMENT '공고 ID (notices 테이블 참조)',
    status VARCHAR(50) NOT NULL COMMENT '입찰 상태',
    title TEXT COMMENT '입찰 제목',
    started_at TIMESTAMP NULL COMMENT '시작 시간',
    ended_at TIMESTAMP NULL COMMENT '종료 시간', 
    detail TEXT COMMENT '상세 정보',
    memo TEXT COMMENT '메모',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (nid) REFERENCES notices(nid),
    INDEX idx_nid (nid),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 로그 관리 테이블

### 8. `logs_scraping` 테이블
**목적**: 스크래핑 작업 로그 저장

**스키마**:
```sql
CREATE TABLE logs_scraping (
    lid INT AUTO_INCREMENT PRIMARY KEY,
    org_name VARCHAR(255) NOT NULL COMMENT '기관명',
    error_code INT NULL COMMENT '에러 코드 (0: 성공)',
    error_message TEXT NULL COMMENT '에러 메시지',
    scraped_count INT DEFAULT 0 COMMENT '스크래핑된 항목 수',
    inserted_count INT DEFAULT 0 COMMENT '삽입된 항목 수',
    time TIMESTAMP NOT NULL COMMENT '실행 시간',
    
    INDEX idx_org_name (org_name),
    INDEX idx_time (time),
    INDEX idx_error_code (error_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 9. `errors_notice_scraping` 테이블  
**목적**: 일반적인 스크래핑 오류 정보 저장

**스키마**:
```sql
CREATE TABLE errors_notice_scraping (
    eid INT AUTO_INCREMENT PRIMARY KEY,
    orgs TEXT NOT NULL COMMENT '에러 발생 기관 목록',
    time TIMESTAMP NOT NULL COMMENT '에러 발생 시간',
    
    INDEX idx_time (time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 게시판 테이블

### 10. `channel_dev` 테이블
**목적**: 개발팀 커뮤니케이션용 게시판

**스키마**:
```sql
CREATE TABLE channel_dev (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '글 제목',
    content TEXT NOT NULL COMMENT '글 내용',
    format ENUM('text', 'markdown', 'html') NOT NULL DEFAULT 'text' COMMENT '내용 형식',
    writer VARCHAR(50) NOT NULL COMMENT '글쓴이 이름',
    password CHAR(4) NOT NULL COMMENT '숫자 4자리 비밀번호',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 날짜/시간',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 날짜/시간',
    is_visible BOOLEAN NOT NULL DEFAULT TRUE COMMENT '글 노출 여부',
    
    INDEX idx_created_at (created_at),
    INDEX idx_writer (writer),
    INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='개발 채널 게시판';
```

## 테이블 관계도

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│   settings_list │       │     notices      │       │    details      │
├─────────────────┤       ├──────────────────┤       ├─────────────────┤
│ 기관명 (PK)     │────┬─▶│ nid (PK)         │◀──────│ nid (FK)        │
│ url             │    │  │ 기관명           │       │ 제목            │
│ rowXpath        │    │  │ 제목             │       │ 본문            │
│ 제목            │    │  │ 상세페이지주소   │       │ 파일이름        │
│ 상세페이지주소  │    │  │ 작성일           │       │ 파일주소        │
│ 작성일          │    │  │ 작성자           │       │ 공고번호        │
│ 작성자          │    │  │ category         │       └─────────────────┘
│ use             │    │  │ status           │                │
│ 지역            │    │  │ scraped_at       │                │
│ 등록            │    │  └──────────────────┘                │
└─────────────────┘    │           │                         │
                       │           │                         │
┌─────────────────┐    │           │       ┌─────────────────┐
│ settings_detail │    │           │       │     files       │
├─────────────────┤    │           │       ├─────────────────┤
│ 기관명 (FK)     │────┘           └──────▶│ nid (FK)        │
│ 제목            │                        │ 파일이름        │
│ 본문            │                        │ 파일주소        │
│ 파일이름        │                        └─────────────────┘
│ 파일주소        │                                 │
│ 공고번호        │                                 │
└─────────────────┘                                 │
                                                    │
┌─────────────────┐       ┌──────────────────┐     │
│settings_category│       │      bids        │     │
├─────────────────┤       ├──────────────────┤     │
│ sn (PK)         │       │ bid (PK)         │     │
│ keywords        │       │ nid (FK)         │─────┘
│ nots            │       │ status           │
│ min_point       │       │ title            │
│ category        │       │ started_at       │
│ use             │       │ ended_at         │
└─────────────────┘       └──────────────────┘

┌─────────────────┐       ┌──────────────────┐
│  logs_scraping  │       │ errors_notice_scraping  │
├─────────────────┤       ├──────────────────┤
│ lid (PK)        │       │ eid (PK)         │
│ org_name        │       │ orgs             │
│ error_code      │       │ time             │
│ error_message   │       └──────────────────┘
│ scraped_count   │
│ inserted_count  │
│ time            │
└─────────────────┘

┌─────────────────┐
│   channel_dev   │
├─────────────────┤
│ id (PK)         │
│ title           │
│ content         │
│ format          │
│ writer          │
│ password        │
│ created_at      │
│ updated_at      │
│ is_visible      │
└─────────────────┘
```

## 주요 관계

1. **notices ← settings_list**: `기관명`을 통한 일대다 관계
2. **notices → details**: `nid`를 통한 일대다 관계
3. **notices → files**: `nid`를 통한 일대다 관계  
4. **notices → bids**: `nid`를 통한 일대다 관계
5. **settings_list → settings_detail**: `기관명`을 통한 일대일 관계

## 인덱스 및 성능

### 기본 인덱스
- 모든 테이블에 `AUTO_INCREMENT PRIMARY KEY` 설정
- `settings_list`에 `기관명`에 대한 `UNIQUE KEY` 설정

### 검색 인덱스
- `notices`: `기관명`, `작성일`, `category`, `status`, `scraped_at`에 인덱스
- `details`: `nid`, `공고번호`에 인덱스
- `files`: `nid`, `파일이름`에 인덱스
- `logs_scraping`: `org_name`, `time`, `error_code`에 인덱스

### 외래키 제약조건
- `details.nid` → `notices.nid` (CASCADE DELETE)
- `files.nid` → `notices.nid` (CASCADE DELETE)
- `bids.nid` → `notices.nid`
- `settings_detail.기관명` → `settings_list.기관명`

## 데이터 플로우 및 사용 패턴

### 1. 스크래핑 워크플로우
```sql
-- 1. 설정 조회
SELECT * FROM settings_list WHERE use = 1;

-- 2. 공고 스크래핑 및 삽입
INSERT INTO notices (기관명, 제목, 상세페이지주소, 작성일, 작성자) VALUES (...);

-- 3. 상세 정보 추출
INSERT INTO details (nid, 제목, 본문, 파일이름, 파일주소, 공고번호) VALUES (...);

-- 4. 파일 정보 추출  
INSERT INTO files (nid, 파일이름, 파일주소) VALUES (...);
```

### 2. 분류 워크플로우
```sql
-- 1. 분류 규칙 조회
SELECT keywords, nots, min_point, category FROM settings_category WHERE use = 1;

-- 2. 가중치 키워드로 공고 검색
SELECT nid, 제목 FROM notices WHERE 제목 LIKE '%keyword%';

-- 3. 카테고리 업데이트
UPDATE notices SET category = '공사점검', status = '준비' WHERE nid IN (...);
```

### 3. 일반적인 쿼리 패턴

#### 카테고리별 최근 공고
```sql
SELECT n.nid, n.제목, n.상세페이지주소, n.작성일, n.기관명, s.지역
FROM notices n 
LEFT JOIN settings_list s ON n.기관명 = s.기관명
WHERE n.category = '공사점검' 
  AND n.작성일 >= DATE_SUB(NOW(), INTERVAL 15 DAY)
ORDER BY n.작성일 DESC;
```

#### 키워드 가중치 검색
```sql
SELECT n.nid, n.제목, n.기관명, n.작성일
FROM notices n
WHERE n.제목 LIKE '%검사%' OR n.제목 LIKE '%점검%'
  AND n.category = '무관'
  AND n.scraped_at >= '2024-01-01'
ORDER BY n.nid DESC;
```

#### 통계 쿼리
```sql
SELECT n.기관명, s.지역, n.category, COUNT(*) as count
FROM notices n
LEFT JOIN settings_list s ON n.기관명 = s.기관명  
WHERE n.작성일 >= DATE_SUB(NOW(), INTERVAL 5 DAY)
GROUP BY n.기관명, s.지역, n.category;
```

## 데이터베이스 관리 작업

### 1. 오래된 공고 정리
```sql
DELETE FROM notices 
WHERE category = '무관' 
  AND scraped_at < DATE_SUB(NOW(), INTERVAL 15 DAY);
```

### 2. 백업 작업
시스템에는 모든 핵심 테이블의 SQL 덤프를 생성하는 백업 기능이 포함되어 있습니다:
- `notices`, `settings_list`, `settings_detail`, `settings_category`
- `logs_scraping`, `errors_notice_scraping`

### 3. 성능 모니터링
- `logs_scraping` 테이블에서 스크래핑 성능 지표 추적
- `errors_notice_scraping` 테이블에서 시스템 레벨 오류 추적

## 데이터 무결성

### 참조 무결성
- CASCADE DELETE를 통해 공고 삭제 시 관련 상세정보와 파일정보 자동 삭제
- 외래키 제약조건으로 데이터 일관성 보장

### 데이터 검증
- `category` 필드는 ENUM으로 제한된 값만 허용
- `use` 필드는 TINYINT(1)로 boolean 값 보장
- `created_at`, `updated_at` 필드로 데이터 추적 가능

이 데이터베이스 스키마는 포괄적인 입찰공고 스크래핑 및 분류 시스템을 효과적으로 지원하며, 적절한 관심사 분리, 데이터 무결성, 성능 최적화를 제공합니다.