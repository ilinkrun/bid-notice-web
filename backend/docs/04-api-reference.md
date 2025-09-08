# API 레퍼런스

## 개요

입찰공고 스크래핑 시스템은 4개의 독립적인 FastAPI 서버로 구성되어 있으며, 각각 특정 기능에 특화된 REST API를 제공합니다.

## 서버 구성

| 서버 | 포트 | 목적 | 주요 기능 |
|------|------|------|-----------|
| Spider Server | 11301 | 웹 스크래핑 | 정부 사이트 스크래핑, 데이터 수집 |
| MySQL Server | 11302 | 데이터베이스 직접 조작 | 원시 SQL 쿼리, 대량 데이터 처리 |
| Bid Server | 11303 | 메인 비즈니스 로직 | 검색, 분류, 키워드 매칭 |
| Board Server | 11307 | 게시판 시스템 | 팀 커뮤니케이션, 수동 관리 |

---

## Spider Server (포트 11301)

웹 스크래핑 전용 서버로, 정부 기관 웹사이트에서 입찰공고를 수집합니다.

### 엔드포인트

#### `GET /check_fetch_list`

특정 기관의 스크래핑을 테스트하고 결과를 반환합니다.

**파라미터**:
- `org_name` (query, required): 스크래핑할 기관명

**응답 예시**:
```json
{
    "org_name": "가평군청",
    "error_code": 0,
    "error_message": "",
    "data_count": 15,
    "data": [
        {
            "제목": "2024년 도로포장 공사",
            "상세페이지주소": "https://example.com/detail/123",
            "작성일": "2024-01-15",
            "작성자": "시설과"
        }
    ]
}
```

**오류 코드**:
- `0`: 성공
- `1`: 설정 없음
- `2`: 네트워크 오류
- `3`: 파싱 오류
- `99`: 알 수 없는 오류

#### `POST /test_csv/`

CSV 데이터 처리를 테스트합니다.

**요청 본문**:
```json
{
    "csv": "header1,header2\nvalue1,value2"
}
```

#### `GET /hello`

서버 상태 확인용 헬스체크 엔드포인트입니다.

**응답**:
```json
{
    "message": "Hello, World!"
}
```

---

## MySQL Server (포트 11302)

데이터베이스 직접 조작을 위한 서버로, 복잡한 쿼리와 대량 데이터 처리를 담당합니다.

### 엔드포인트

#### `POST /fetch_by_sql/`

임의의 SQL 쿼리를 실행하고 결과를 반환합니다.

**요청 본문**:
```json
{
    "sql": "SELECT nid, 제목, 작성일 FROM notices WHERE 작성일 >= '2024-01-01' LIMIT 10"
}
```

**응답 예시**:
```json
[
    {
        "nid": 12345,
        "제목": "도로 보수 공사",
        "작성일": "2024-01-15"
    }
]
```

#### `POST /notice_list_by_search/`

고급 검색 기능으로 키워드 가중치를 적용한 공고 검색을 수행합니다.

**요청 본문**:
```json
{
    "keywords": "도로*5,보수*3,공사*4",
    "nots": "철거,해체",
    "min_point": 8,
    "add_where": "작성일 >= '2024-01-01'",
    "base_sql": "SELECT notices.nid, notices.제목 FROM notices",
    "add_sql": "ORDER BY notices.작성일 DESC"
}
```

**응답 예시**:
```json
{
    "total_count": 25,
    "results": [
        {
            "nid": 12345,
            "제목": "도로 보수 공사 입찰공고",
            "matched_keywords": ["도로", "보수", "공사"],
            "total_point": 12
        }
    ]
}
```

---

## Bid Server (포트 11303)

메인 비즈니스 로직을 담당하는 서버로, 검색, 분류, 키워드 매칭 등의 핵심 기능을 제공합니다.

### 설정 관리

#### `GET /settings_list`

모든 기관의 스크래핑 설정을 조회합니다.

**응답 예시**:
```json
[
    {
        "기관명": "가평군청",
        "url": "https://gapyeong.go.kr/board/list",
        "지역": "경기",
        "등록": 1,
        "use": 1
    }
]
```

#### `GET /settings_list/{org_name}`

특정 기관의 스크래핑 설정을 조회합니다.

**파라미터**:
- `org_name` (path, required): 기관명

**응답 예시**:
```json
{
    "기관명": "가평군청",
    "url": "https://gapyeong.go.kr/board/list",
    "iframe": "",
    "rowXpath": "//tbody/tr",
    "제목": "td[2]/a",
    "상세페이지주소": "td[2]/a@href",
    "작성일": "td[4]",
    "작성자": "td[3]",
    "paging": "1",
    "startPage": "1",
    "endPage": "3",
    "지역": "경기",
    "등록": 1,
    "use": 1
}
```

#### `POST /settings_list/{org_name}`

특정 기관의 스크래핑 설정을 업데이트합니다.

**요청 본문**:
```json
{
    "url": "https://new-url.go.kr/board",
    "rowXpath": "//table/tbody/tr",
    "제목": "td[2]/a",
    "상세페이지주소": "td[2]/a@href"
}
```

### 공고 조회

#### `GET /notice_list`

최근 공고를 조회합니다.

**파라미터**:
- `gap` (query, optional): 며칠 전까지의 공고를 가져올지 지정 (기본값: 환경변수 DAY_GAP)

**응답 예시**:
```json
[
    {
        "nid": 12345,
        "제목": "도로 보수 공사",
        "기관명": "가평군청",
        "작성일": "2024-01-15",
        "상세페이지주소": "https://example.com/detail/123",
        "category": "공사점검",
        "지역": "경기",
        "등록": 1
    }
]
```

#### `GET /notice_list/{category}`

특정 카테고리의 공고를 조회합니다.

**파라미터**:
- `category` (path, required): 카테고리명 (공사점검, 성능평가, 기타, 무관)
- `gap` (query, optional): 일수 제한

**응답**: `/notice_list`와 동일한 형식

#### `GET /notice_list_statistics`

공고 통계 데이터를 조회합니다.

**응답 예시**:
```json
[
    {
        "기관명": "가평군청",
        "작성일": "2024-01-15",
        "category": "공사점검"
    }
]
```

#### `GET /last_notice/{org_name}`

특정 기관의 최신 공고를 조회합니다.

**파라미터**:
- `org_name` (path, required): 기관명
- `field` (query, optional): 조회할 필드명 (기본값: "제목")

### 검색 기능

#### `POST /search_notice_list`

고급 키워드 검색을 수행합니다.

**요청 본문**:
```json
{
    "keywords": "도로*5,보수*3",
    "nots": "철거,해체",
    "min_point": 8,
    "add_where": "작성일 >= '2024-01-01'"
}
```

**응답 예시**:
```json
[
    {
        "nid": 12345,
        "제목": "도로 보수 공사 입찰공고",
        "상세페이지주소": "https://example.com/detail/123",
        "작성일": "2024-01-15",
        "기관명": "가평군청",
        "matched_keywords": ["도로", "보수"],
        "total_point": 8
    }
]
```

### 키워드 및 카테고리 관리

#### `GET /settings_categorys`

모든 키워드 설정을 조회합니다.

**응답 예시**:
```json
[
    {
        "sn": 1,
        "keywords": "도로*5,포장*4,보수*3",
        "nots": "철거,해체",
        "min_point": 8,
        "category": "공사점검",
        "creator": "관리자",
        "memo": "도로 관련 공사"
    }
]
```

#### `GET /settings_categorys/{category}`

특정 카테고리의 키워드 설정을 조회합니다.

**파라미터**:
- `category` (path, required): 카테고리명

#### `POST /category_weight_search`

키워드 가중치 기반 검색을 수행합니다.

**요청 본문**:
```json
{
    "keywords": "도로*5,보수*3,공사*4",
    "min_point": 8,
    "field": "제목",
    "add_fields": ["상세페이지주소", "작성일"],
    "add_where": "작성일 >= '2024-01-01'"
}
```

#### `POST /filter_notice_list`

제외 키워드로 공고를 필터링합니다.

**요청 본문**:
```json
{
    "not_str": "철거,해체,폐기",
    "dicts": [
        {"nid": 123, "제목": "도로 보수 공사"},
        {"nid": 124, "제목": "건물 철거 작업"}
    ],
    "field": "제목"
}
```

### 시스템 관리

#### `DELETE /delete_old_notice_list`

오래된 공고를 삭제합니다.

**파라미터**:
- `day_gap` (query, optional): 며칠 이전 공고를 삭제할지 지정 (기본값: 15)

#### `POST /backup_db`

데이터베이스를 백업합니다.

**응답**:
```json
{
    "success": true,
    "message": "데이터베이스 백업이 완료되었습니다",
    "data": "/path/to/backup/file.sql"
}
```

#### `GET /logs_scraping`

스크래핑 로그를 조회합니다.

**파라미터**:
- `gap` (query, optional): 며칠간의 로그를 조회할지 지정

#### `GET /errors_notice_scraping`

스크래핑 오류 로그를 조회합니다.

---

## Board Server (포트 11307)

팀 커뮤니케이션을 위한 게시판 시스템입니다.

### 엔드포인트

#### `POST /posts/{table_name}`

새 게시글을 작성합니다.

**파라미터**:
- `table_name` (path, required): 게시판 테이블명 (예: "channel_dev")

**요청 본문**:
```json
{
    "title": "시스템 점검 공지",
    "content": "내일 오전 2시부터 4시까지 시스템 점검 예정입니다.",
    "writer": "관리자",
    "password": "1234",
    "format": "text",
    "is_visible": true
}
```

**응답**:
```json
{
    "id": 15
}
```

#### `GET /posts/{table_name}/{post_id}`

특정 게시글을 조회합니다.

**파라미터**:
- `table_name` (path, required): 게시판 테이블명
- `post_id` (path, required): 게시글 ID

**응답 예시**:
```json
{
    "id": 15,
    "title": "시스템 점검 공지",
    "content": "내일 오전 2시부터 4시까지 시스템 점검 예정입니다.",
    "writer": "관리자",
    "format": "text",
    "created_at": "2024-01-15T09:00:00",
    "updated_at": "2024-01-15T09:00:00",
    "is_visible": true
}
```

#### `PUT /posts/{table_name}/{post_id}`

게시글을 수정합니다 (비밀번호 확인 필요).

**요청 본문**:
```json
{
    "title": "수정된 제목",
    "content": "수정된 내용",
    "password": "1234",
    "is_visible": false
}
```

#### `DELETE /posts/{table_name}/{post_id}`

게시글을 삭제합니다 (비밀번호 확인 필요).

**요청 본문**:
```json
{
    "password": "1234"
}
```

#### `GET /posts/{table_name}`

게시글 목록을 조회합니다.

**파라미터**:
- `table_name` (path, required): 게시판 테이블명
- `page` (query, optional): 페이지 번호 (기본값: 1)
- `per_page` (query, optional): 페이지당 게시글 수 (기본값: 20)
- `only_visible` (query, optional): 공개된 게시글만 조회할지 여부 (기본값: true)

**응답 예시**:
```json
{
    "total_count": 150,
    "page": 1,
    "per_page": 20,
    "posts": [
        {
            "id": 15,
            "title": "시스템 점검 공지",
            "writer": "관리자",
            "created_at": "2024-01-15T09:00:00",
            "is_visible": true
        }
    ]
}
```

---

## 공통 오류 응답

모든 서버에서 오류 발생 시 다음과 같은 형식으로 응답합니다:

```json
{
    "error_code": 500,
    "error_message": "Internal Server Error",
    "data": null
}
```

## 인증 및 보안

- 현재 시스템은 기본적인 인증을 사용하지 않습니다
- Board Server의 게시글 수정/삭제는 비밀번호로 보호됩니다
- 모든 서버는 CORS를 허용하도록 설정되어 있습니다

## 요청 제한

- 스크래핑 작업은 리소스 집약적이므로 동시 요청 수를 제한해야 합니다
- 대량 데이터 조회 시 페이지네이션을 사용하는 것을 권장합니다
- SQL 쿼리 실행 시 타임아웃을 고려해야 합니다

## 사용 예시

### 1. 새로운 기관 스크래핑 설정
```bash
# 1. 설정 추가
curl -X POST "http://localhost:11303/settings_list/새기관" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://new-org.go.kr/board",
    "rowXpath": "//tbody/tr",
    "제목": "td[2]/a",
    "상세페이지주소": "td[2]/a@href"
  }'

# 2. 스크래핑 테스트
curl "http://localhost:11301/check_fetch_list?org_name=새기관"
```

### 2. 키워드 검색
```bash
curl -X POST "http://localhost:11303/search_notice_list" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "도로*5,보수*3",
    "nots": "철거",
    "min_point": 6
  }'
```

### 3. 게시판 사용
```bash
# 게시글 작성
curl -X POST "http://localhost:11307/posts/channel_dev" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "새 공지사항",
    "content": "중요한 공지입니다.",
    "writer": "관리자",
    "password": "1234"
  }'

# 게시글 목록 조회
curl "http://localhost:11307/posts/channel_dev?page=1&per_page=10"
```