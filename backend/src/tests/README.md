# Backend API Tests

이 디렉토리는 bid-notice-web 백엔드 서버들의 단위 테스트를 포함합니다.

## 테스트 구조

### 테스트 파일들
- `test_server_bid.py` - server_bid.py의 모든 API 엔드포인트 테스트
- `test_server_mysql.py` - server_mysql.py의 MySQL 관련 API 테스트  
- `test_server_spider.py` - server_spider.py의 웹 스크래핑 API 테스트
- `test_imports.py` - 기본 import 및 기능 검증 테스트
- `postman/HSN_ilmac-bid.postman_collection.json` - Postman 컬렉션 (웹 API 테스트용)

## 로컬 테스트 실행

### 환경 설정
```bash
# 프로젝트 디렉토리로 이동
cd /exposed/projects/bid-notice-web/backend/src

# 의존성 설치 (uv 사용)
uv sync --dev

# 또는 pip 사용시
pip install -e .[dev]
```

### 개별 테스트 실행

#### 기본 기능 테스트 (pytest 없이)
```bash
# 간단한 import 및 기본 기능 검증
uv run python tests/test_imports.py
```

#### pytest를 사용한 단위 테스트

**전체 테스트 실행:**
```bash
uv run python -m pytest tests/ -v
```

**개별 파일 테스트:**
```bash
# server_bid 테스트
uv run python -m pytest tests/test_server_bid.py -v

# server_mysql 테스트  
uv run python -m pytest tests/test_server_mysql.py -v

# server_spider 테스트
uv run python -m pytest tests/test_server_spider.py -v
```

**특정 테스트 클래스 실행:**
```bash
# 설정 관련 테스트만
uv run python -m pytest tests/test_server_bid.py::TestSettingsNoticeListEndpoints -v

# 공고 관련 테스트만
uv run python -m pytest tests/test_server_bid.py::TestNoticeListEndpoints -v
```

**특정 테스트 메서드 실행:**
```bash
# hello 엔드포인트 테스트
uv run python -m pytest tests/test_server_bid.py::TestUtilityEndpoints::test_hello_endpoint -v

# 키워드 검색 테스트
uv run python -m pytest tests/test_server_mysql.py::TestNoticeListBySearchEndpoint::test_notice_list_by_search_success -v
```

### 테스트 특징

#### Mock 기반 테스트
- 모든 데이터베이스 연결은 Mock으로 대체되어 네트워크 접속 없이 로컬에서 실행 가능
- `unittest.mock.patch`를 사용하여 외부 의존성 격리
- 실제 MySQL 데이터베이스나 웹 스크래핑 없이 API 로직 테스트

#### 테스트 범위
**server_bid.py 테스트:**
- 설정 관리 API (GET, POST)
- 공고 관리 API (조회, 검색, 업데이트)
- 입찰 관리 API
- 로그/에러 조회 API
- 스크래핑 테스트 API
- 키워드 및 카테고리 관리 API
- 데이터베이스 관리 API

**server_mysql.py 테스트:**
- SQL 쿼리 실행 API
- 키워드 기반 검색 API
- 가중치 계산 로직
- 제외 키워드 필터링
- 한글/특수문자 처리

**server_spider.py 테스트:**
- 웹 스크래핑 API
- 에러 처리 (타임아웃, 파싱 오류 등)
- CSV 테스트 API
- 다양한 입력 케이스 처리

## 웹 API 테스트 (Postman)

### Postman 컬렉션 사용
1. Postman에서 `postman/HSN_ilmac-bid.postman_collection.json` 파일 import
2. Environment 변수 설정:
   - `ip`: 서버 IP 주소 (예: localhost)
   - `port_bid`: server_bid 포트 (기본: 11303)  
   - `port_mysql`: server_mysql 포트 (기본: 11302)
   - `port_spider`: server_spider 포트 (기본: 11301)
   - `port_board`: server_board 포트 (기본: 11307)

### 주요 API 엔드포인트

#### server_bid (포트 11303)
- `GET /hello` - 기본 연결 테스트
- `GET /settings_notice_list` - 스크래핑 설정 목록
- `GET /notice_list` - 공고 목록 조회  
- `POST /search_notice_list` - 키워드 검색
- `GET /my_bids` - 입찰 목록
- `GET /logs_notice_scraping` - 스크래핑 로그

#### server_mysql (포트 11302)  
- `POST /fetch_by_sql/` - SQL 직접 실행
- `POST /notice_list_by_search/` - 가중치 기반 검색

#### server_spider (포트 11301)
- `GET /hello` - 기본 연결 테스트
- `GET /check_fetch_list` - 스크래핑 테스트
- `POST /test_csv/` - CSV 데이터 테스트

## 테스트 데이터

### 샘플 데이터
테스트에서 사용되는 샘플 데이터는 실제 운영 데이터와 유사한 형태로 구성:

**공고 데이터 예시:**
```json
{
  "nid": 1,
  "posted_date": "2024-01-01", 
  "org_name": "테스트기관",
  "title": "안전점검 공고",
  "detail_url": "http://test.com/detail/1"
}
```

**키워드 검색 예시:**
```json
{
  "keywords": "안전*3,점검*2,진단*1",
  "nots": "건축물,토목",
  "min_point": 4
}
```

### 한글 데이터 처리
- 모든 테스트는 한글 기관명, 키워드, 공고 제목을 올바르게 처리
- UTF-8 인코딩 검증 포함

## 트러블슈팅

### 일반적인 문제

**Import 오류:**
```bash
# 경로 문제시 현재 디렉토리에서 실행
cd /exposed/projects/bid-notice-web/backend/src
uv run python -m pytest tests/
```

**의존성 오류:**
```bash
# 의존성 재설치  
uv sync --dev
```

**테스트 실패:**
- Mock 데이터가 올바르게 설정되었는지 확인
- API 함수명 변경이 있었는지 확인 (예: `find_bids` → `find_my_bids`)

### 디버깅
```bash
# 상세한 출력으로 테스트 실행
uv run python -m pytest tests/test_server_bid.py -v -s

# 특정 테스트만 디버깅
uv run python -m pytest tests/test_server_bid.py::TestUtilityEndpoints::test_hello_endpoint -v -s --tb=long
```

## 확장 가능한 구조

새로운 API 엔드포인트 추가시:
1. 해당 서버 테스트 파일에 테스트 클래스 추가
2. Mock 설정을 `mock_mysql_functions` fixture에 추가  
3. Postman 컬렉션에 새로운 요청 추가
4. 성공/실패 케이스 모두 테스트

이 테스트 구조는 지속적인 개발과 유지보수를 지원하며, 코드 변경시 회귀 테스트를 통해 안정성을 보장합니다.