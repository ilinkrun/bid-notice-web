# 공공데이터 나라장터 입찰공고 수집 시스템

조달청 나라장터 입찰공고정보서비스 API를 활용하여 입찰공고 데이터를 자동으로 수집하고, 키워드 매칭을 통해 분류하는 시스템입니다.

## 주요 기능

- **자동 데이터 수집**: 공공데이터포털 API를 통한 입찰공고 자동 수집
- **지능형 파싱**: XML 응답 데이터를 구조화된 형태로 변환
- **키워드 매칭**: 설정된 키워드 규칙에 따른 자동 카테고리 분류
- **데이터베이스 관리**: MySQL을 활용한 체계적인 데이터 저장 및 관리
- **로깅 및 모니터링**: 상세한 수집 로그 및 통계 정보 제공

## 시스템 구성

```
data_go_kr/
├── __init__.py
├── README.md
├── api_client.py     # API 클라이언트
├── collector.py      # 데이터 수집기
├── database.py       # 데이터베이스 관리자
├── models.py         # 데이터베이스 스키마
└── service.py        # 통합 서비스
```

## 설치 및 설정

### 1. 의존성 설치
```bash
# 기존 프로젝트 의존성 사용
pip install requests pymysql
```

### 2. 공공데이터포털 API 키 발급
1. [공공데이터포털](https://www.data.go.kr) 회원가입
2. [조달청_나라장터 입찰공고정보서비스](https://www.data.go.kr/data/15129394/openapi.do) 신청
3. 승인 후 서비스키 확인

### 3. 환경변수 설정
`.env` 파일에 서비스키 추가:
```
# 공공데이터 API 키
DATA_GO_KR_SERVICE_KEY=your_service_key_here
```

## 사용법

### 1. 데이터베이스 초기화
```bash
# 처음 설치시 테이블 생성
python -m data_go_kr.service --service-key YOUR_KEY --action init

# 기존 테이블 삭제 후 재생성
python -m data_go_kr.service --service-key YOUR_KEY --action init --drop-tables
```

### 2. 일일 데이터 수집
```bash
# 오늘 날짜 입찰공고 수집
python -m data_go_kr.service --service-key YOUR_KEY --action daily

# 특정 날짜 수집
python -m data_go_kr.service --service-key YOUR_KEY --action daily --date 2024-01-15

# 필터 적용 수집
python -m data_go_kr.service --service-key YOUR_KEY --action daily \
  --area-code 11000 --org-name "서울특별시" --bid-kind 01
```

### 3. 기간별 데이터 수집
```bash
# 기간별 수집
python -m data_go_kr.service --service-key YOUR_KEY --action period \
  --start-date 2024-01-01 --end-date 2024-01-31
```

### 4. 통계 정보 조회
```bash
python -m data_go_kr.service --service-key YOUR_KEY --action stats
```

### 5. 키워드 매칭 처리
```bash
# 미처리 공고들에 키워드 매칭 적용
python -m data_go_kr.service --service-key YOUR_KEY --action keywords
```

## Python 코드에서 사용

### 기본 사용법
```python
import os
from datetime import date
from data_go_kr.service import PublicBidNoticeService

# 서비스 초기화
service_key = os.getenv('DATA_GO_KR_SERVICE_KEY')
service = PublicBidNoticeService(service_key)

# 데이터베이스 초기화 (최초 1회)
service.initialize_database()

# 오늘 데이터 수집
result = service.collect_and_save_daily()
print(f"수집 결과: 신규 {result['new_count']}건, 업데이트 {result['updated_count']}건")

# 통계 조회
stats = service.get_statistics()
print(f"전체 공고 수: {stats['total_notices']:,}건")
```

### 고급 사용법
```python
from datetime import date, timedelta

# 최근 7일간 데이터 수집
end_date = date.today()
start_date = end_date - timedelta(days=7)

result = service.collect_and_save_period(
    start_date=start_date,
    end_date=end_date,
    area_code='11000',  # 서울특별시
    bid_kind='01'       # 일반입찰
)

if result['success']:
    print(f"기간별 수집 완료: {result['new_count']}건의 신규 공고")
else:
    print(f"수집 실패: {result['error']}")
```

## 데이터베이스 스키마

### 주요 테이블

#### `public_bid_notices`
입찰공고 메인 데이터
- `bid_notice_no`: 입찰공고번호 (PK)
- `bid_notice_name`: 입찰공고명
- `dept_name`: 기관명
- `notice_date`: 공고일시
- `budget_amount`: 예산금액
- `category`: 분류된 카테고리
- `score`: 키워드 매칭 점수

#### `keyword_rules`
키워드 매칭 규칙
- `keyword`: 키워드
- `category`: 카테고리
- `weight`: 가중치
- `match_type`: 매칭 타입 (exact, contains, regex)

#### `api_collection_logs`
API 수집 로그
- `api_endpoint`: API 엔드포인트
- `total_count`: 전체 건수
- `new_count`: 신규 건수
- `status`: 실행 상태

## 키워드 규칙 설정

### 기본 키워드 규칙
시스템 초기화시 다음 키워드들이 자동으로 등록됩니다:

| 키워드 | 카테고리 | 가중치 |
|--------|----------|--------|
| 소프트웨어 | IT개발 | 5 |
| 시스템 구축 | IT개발 | 4 |
| 웹사이트 | 웹개발 | 4 |
| 앱 개발 | 모바일 | 5 |
| 데이터베이스 | DB/서버 | 3 |
| 보안 | 보안 | 4 |
| AI, 인공지능 | AI/빅데이터 | 5 |

### 사용자 정의 키워드 추가
```python
from data_go_kr.database import DatabaseManager

db_manager = DatabaseManager()
mysql = db_manager.get_connection()

# 새 키워드 규칙 추가
keyword_data = {
    'keyword': '블록체인',
    'category': '블록체인',
    'weight': 5,
    'match_field': 'title',
    'match_type': 'contains',
    'is_active': True
}

mysql.insert('keyword_rules', keyword_data)
```

## 자동화 설정

### Cron 작업 등록
```bash
# crontab -e
# 매일 오전 9시에 전일 데이터 수집
0 9 * * * cd /path/to/project && python -m data_go_kr.service --service-key YOUR_KEY --action daily

# 매주 월요일 오전 10시에 키워드 매칭 재처리
0 10 * * 1 cd /path/to/project && python -m data_go_kr.service --service-key YOUR_KEY --action keywords
```

## API 제한사항

- **호출 제한**: 일반적으로 1초당 10회 제한
- **데이터 제한**: 한번에 최대 999건 조회 가능
- **날짜 범위**: 과거 데이터는 제한될 수 있음

## 트러블슈팅

### 1. API 호출 실패
```
해결책: 서비스키 확인, 네트워크 상태 점검, API 제한 확인
```

### 2. 데이터베이스 연결 오류
```
해결책: MySQL 연결 정보 확인, 데이터베이스 권한 확인
```

### 3. 키워드 매칭이 동작하지 않음
```
해결책: keyword_rules 테이블 데이터 확인, is_active 상태 확인
```

### 4. 중복 데이터
```
해결책: bid_notice_no 기반 중복 처리, 정기적인 데이터 정리
```

## 로그 확인

로그는 `logs/` 디렉토리에 저장됩니다:
- `data_go_kr_api_client.log`: API 호출 로그
- `data_go_kr_collector.log`: 데이터 수집 로그
- `data_go_kr_database.log`: 데이터베이스 작업 로그

## 성능 최적화

### 1. 인덱스 활용
주요 검색 필드에 인덱스가 자동 생성됩니다:
- `bid_notice_no` (UNIQUE)
- `dept_name`, `notice_date`
- `category`, `is_matched`

### 2. 배치 처리
대량 데이터 처리시 배치 단위로 처리:
```python
# 키워드 매칭 배치 처리
service.process_keyword_matching(limit=1000)
```

### 3. 데이터 정리
주기적으로 오래된 로그 및 처리 완료 데이터 정리 권장

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 지원

문의사항이나 버그 리포트는 GitHub Issues를 통해 제출해 주세요.