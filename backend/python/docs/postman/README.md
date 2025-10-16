# Postman API Collections

이 디렉토리는 각 백엔드 서버별로 분리된 Postman API 컬렉션들을 포함합니다.

## 컬렉션 파일들

### 1. `server_bid.postman_collection.json`
**포트: 11303** | **메인 비즈니스 로직 서버**

주요 기능:
- **설정 관리**: 스크래핑 설정, 상세 페이지 설정
- **공고 관리**: 공고 조회, 검색, 카테고리별 분류, 상태 업데이트
- **입찰 관리**: 내 입찰 목록, 상태별 조회
- **로깅**: 스크래핑 로그 및 에러 조회
- **키워드 관리**: 카테고리별 키워드, 가중치 검색, 필터링
- **데이터베이스 관리**: 백업, 오래된 데이터 삭제

총 **26개 엔드포인트** 포함

### 2. `server_mysql.postman_collection.json`
**포트: 11302** | **직접 데이터베이스 연산 서버**

주요 기능:
- **SQL 실행**: 직접 SQL 쿼리 실행
- **고급 검색**: 키워드 가중치 기반 검색, 복합 조건 검색
- **복잡한 쿼리**: JOIN 검색, 다중 조건 검색
- **테스트 케이스**: 특수문자, 대용량 키워드, 엣지 케이스

총 **12개 검색 시나리오** 포함

### 3. `server_spider.postman_collection.json`
**포트: 11301** | **웹 스크래핑 서버**

주요 기능:
- **웹 스크래핑**: 기관별 공고 목록 스크래핑
- **CSV 테스트**: 다양한 형태의 CSV 데이터 처리
- **에러 시나리오**: 네트워크 타임아웃, 파싱 오류 테스트
- **성능 테스트**: 동시 요청 처리 테스트

총 **18개 테스트 케이스** 포함

### 4. `server_board.postman_collection.json`
**포트: 11307** | **게시판 시스템 서버**

주요 기능:
- **게시글 관리**: 생성, 조회, 수정, 삭제 (CRUD)
- **댓글 관리**: 댓글/답글 생성, 조회, 수정, 삭제
- **다양한 게시판**: 개발, 테스트, 공지, FAQ 게시판
- **에러 처리**: 잘못된 비밀번호, 존재하지 않는 게시글

총 **22개 게시판 기능** 포함

## 환경 변수 설정

각 컬렉션을 사용하기 전에 Postman에서 다음 환경 변수들을 설정하세요:

### 필수 변수
```
ip: 서버 IP 주소 (예: localhost, 192.168.1.100)
port_bid: 11303
port_mysql: 11302  
port_spider: 11301
port_board: 11307
```

### 선택적 변수
```
org_name: 테스트할 기관명 (예: 가평군청)
board_name: 게시판명 (기본값: board_dev)
post_id: 게시글 ID (기본값: 1)
```

## 사용 방법

### 1. 컬렉션 Import
1. Postman 실행
2. Import 버튼 클릭
3. 원하는 서버의 JSON 파일 선택
4. Import 완료

### 2. 환경 설정
1. 우상단 Environment 드롭다운에서 "Manage Environments" 선택
2. "Add" 버튼으로 새 환경 생성
3. 위의 환경 변수들 입력
4. 생성된 환경 선택

### 3. 서버 실행 확인
각 서버가 실행 중인지 확인:
```bash
# 모든 서버 실행
./start_servers.sh

# 개별 서버 실행  
python server_bid.py     # 포트 11303
python server_mysql.py   # 포트 11302
python server_spider.py  # 포트 11301
python server_board.py   # 포트 11307
```

### 4. Health Check
각 컬렉션의 "Health Check" 폴더에서 `/hello` 엔드포인트를 먼저 테스트하여 서버 연결을 확인하세요.

## 테스트 시나리오

### 기본 테스트 플로우

#### server_bid 테스트:
1. `Health Check` → `Hello`
2. `Settings - Notice List` → `Get All Settings Notice List`
3. `Notice Management` → `Get Notice List (All)`
4. `Keyword & Category Management` → `Get All Notice Categories`

#### server_mysql 테스트:
1. `SQL Operations` → `Execute SQL Query`
2. `Advanced Search` → `Notice List by Search (Basic)`

#### server_spider 테스트:
1. `Health Check` → `Hello`
2. `Web Scraping` → `Check Fetch List - 가평군청`
3. `CSV Testing` → `Test CSV - Basic`

#### server_board 테스트:
1. `Posts Management` → `Create Post`
2. `Posts Management` → `Get Post by ID`
3. `Comments Management` → `Create Comment`

### 고급 테스트 케이스

#### 키워드 검색 테스트:
- **기본 검색**: "안전*3,점검*2" (가중치 포함)
- **제외 키워드**: "건축물,토목" (특정 단어 제외)
- **최소 점수**: 4점 이상만 결과 반환

#### 에러 처리 테스트:
- 존재하지 않는 기관 스크래핑
- 잘못된 SQL 쿼리 실행
- 잘못된 비밀번호로 게시글 수정

#### 성능 테스트:
- 동시 스크래핑 요청
- 대용량 키워드 리스트 검색
- 복잡한 JOIN 쿼리 실행

## API 응답 형식

### 성공 응답
```json
{
  "status": "success",
  "data": [...],
  "message": "요청이 성공적으로 처리되었습니다"
}
```

### 에러 응답  
```json
{
  "error_code": 404,
  "error_message": "요청한 리소스를 찾을 수 없습니다",
  "data": null
}
```

### 스크래핑 응답
```json
{
  "org_name": "기관명",
  "success": true,
  "error_code": 0,
  "error_message": "",
  "data_count": 10,
  "data": [...]
}
```

## 자동화 테스트

### Collection Runner 사용
1. 컬렉션 선택 후 "Run" 버튼 클릭
2. 실행할 요청들 선택
3. 환경 및 반복 횟수 설정
4. "Run [Collection Name]" 클릭

### Newman CLI 사용
```bash
# Newman 설치
npm install -g newman

# 컬렉션 실행
newman run server_bid.postman_collection.json \
  --environment production.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

## 트러블슈팅

### 일반적인 문제

**서버 연결 실패:**
- 서버가 실행 중인지 확인
- IP 주소와 포트 번호 확인
- 방화벽 설정 확인

**환경 변수 오류:**
- 환경이 올바르게 선택되었는지 확인
- 변수명 오타 확인 (대소문자 구분)

**응답 시간 초과:**
- 요청 타임아웃 설정 증가
- 서버 성능 및 네트워크 상태 확인

**한글 인코딩 문제:**
- Content-Type: application/json 헤더 확인
- UTF-8 인코딩 설정 확인

### 로그 확인
서버별 로그 파일:
```
logs/server_bid.log
logs/server_mysql.log  
logs/server_spider.log
logs/server_board.log
```

## 확장 가능성

새로운 엔드포인트 추가시:
1. 해당 서버의 컬렉션 파일을 편집
2. 새로운 요청을 적절한 폴더에 추가
3. 필요한 환경 변수 업데이트
4. 테스트 케이스 추가

이 분리된 구조는 각 서버의 독립적인 테스트를 가능하게 하며, 개발 및 운영 단계에서의 효율적인 API 검증을 지원합니다.