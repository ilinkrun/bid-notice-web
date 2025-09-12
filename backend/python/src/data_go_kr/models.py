"""
공공데이터포털 조달청 나라장터 입찰공고 데이터베이스 스키마
"""

# 공공데이터 입찰공고 테이블
PUBLIC_BID_NOTICES_TABLE = """
CREATE TABLE public_bid_notices (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- API 응답 데이터 필드들
    bid_notice_no VARCHAR(50) NOT NULL UNIQUE COMMENT '입찰공고번호',
    bid_notice_name TEXT NOT NULL COMMENT '입찰공고명',
    bid_notice_url VARCHAR(500) COMMENT '입찰공고 URL',
    
    -- 기관 정보
    dept_code VARCHAR(20) COMMENT '기관코드',
    dept_name VARCHAR(200) COMMENT '기관명',
    area_code VARCHAR(10) COMMENT '지역코드',
    area_name VARCHAR(100) COMMENT '지역명',
    
    -- 입찰 정보
    bid_kind_code VARCHAR(10) COMMENT '입찰종류코드 (01:일반, 02:제한, 03:지명, 04:턴키)',
    bid_kind_name VARCHAR(50) COMMENT '입찰종류명',
    bid_method_code VARCHAR(10) COMMENT '입찰방법코드',
    bid_method_name VARCHAR(50) COMMENT '입찰방법명',
    contract_kind_code VARCHAR(10) COMMENT '계약종류코드',
    contract_kind_name VARCHAR(50) COMMENT '계약종류명',
    
    -- 일정 정보
    notice_date DATE COMMENT '공고일시',
    notice_start_date DATETIME COMMENT '입찰공고 게시일시',
    notice_end_date DATETIME COMMENT '입찰공고 마감일시',
    bid_date DATETIME COMMENT '개찰일시',
    
    -- 금액 정보
    budget_amount BIGINT COMMENT '예산금액(원)',
    estimated_price BIGINT COMMENT '추정가격(원)',
    
    -- 업무 분류
    work_class_code VARCHAR(20) COMMENT '업무분류코드',
    work_class_name VARCHAR(100) COMMENT '업무분류명',
    industry_code VARCHAR(20) COMMENT '업종코드',
    industry_name VARCHAR(100) COMMENT '업종명',
    
    -- 기타 정보
    bid_qualification TEXT COMMENT '입찰자격',
    bid_condition TEXT COMMENT '입찰조건',
    contract_period VARCHAR(100) COMMENT '계약기간',
    delivery_place VARCHAR(200) COMMENT '납품장소',
    
    -- 첨부파일 정보 (JSON 형태로 저장)
    attachments JSON COMMENT '첨부파일 목록',
    
    -- 원본 API 응답 데이터 (전체 응답을 JSON으로 저장)
    raw_data JSON COMMENT '원본 API 응답 데이터',
    
    -- 시스템 관리 필드
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    scraped_at DATETIME NOT NULL COMMENT 'API 수집일시',
    
    -- 분류 및 처리 상태
    category VARCHAR(50) COMMENT '카테고리 분류',
    keywords JSON COMMENT '매칭된 키워드 목록',
    score INT DEFAULT 0 COMMENT '키워드 매칭 점수',
    is_processed BOOLEAN DEFAULT FALSE COMMENT '처리 완료 여부',
    is_matched BOOLEAN DEFAULT FALSE COMMENT '키워드 매칭 여부',
    
    -- 인덱스 추가
    INDEX idx_bid_notice_no (bid_notice_no),
    INDEX idx_dept_name (dept_name),
    INDEX idx_notice_date (notice_date),
    INDEX idx_bid_date (bid_date),
    INDEX idx_scraped_at (scraped_at),
    INDEX idx_category (category),
    INDEX idx_is_matched (is_matched),
    INDEX idx_is_processed (is_processed),
    INDEX idx_work_class_code (work_class_code),
    INDEX idx_industry_code (industry_code),
    INDEX idx_budget_amount (budget_amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공공데이터 입찰공고 정보';
"""

# API 수집 로그 테이블
API_COLLECTION_LOGS_TABLE = """
CREATE TABLE api_collection_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- API 호출 정보
    api_endpoint VARCHAR(100) NOT NULL COMMENT 'API 엔드포인트',
    request_params JSON COMMENT '요청 파라미터',
    
    -- 수집 결과
    total_count INT DEFAULT 0 COMMENT '전체 건수',
    collected_count INT DEFAULT 0 COMMENT '수집된 건수',
    new_count INT DEFAULT 0 COMMENT '신규 건수',
    updated_count INT DEFAULT 0 COMMENT '업데이트된 건수',
    error_count INT DEFAULT 0 COMMENT '오류 건수',
    
    -- 수집 기간
    start_date DATE COMMENT '수집 시작일',
    end_date DATE COMMENT '수집 종료일',
    
    -- 실행 정보
    status ENUM('running', 'completed', 'failed', 'cancelled') DEFAULT 'running' COMMENT '실행 상태',
    started_at DATETIME NOT NULL COMMENT '시작일시',
    completed_at DATETIME COMMENT '완료일시',
    duration_seconds INT COMMENT '소요시간(초)',
    
    -- 오류 정보
    error_message TEXT COMMENT '오류 메시지',
    error_details JSON COMMENT '상세 오류 정보',
    
    -- 시스템 필드
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    
    -- 인덱스
    INDEX idx_api_endpoint (api_endpoint),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API 수집 로그';
"""

# 키워드 매칭 설정 테이블 (기존 시스템과 호환)
KEYWORD_RULES_TABLE = """
CREATE TABLE keyword_rules (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- 키워드 정보
    keyword VARCHAR(100) NOT NULL COMMENT '키워드',
    category VARCHAR(50) NOT NULL COMMENT '카테고리',
    weight INT DEFAULT 1 COMMENT '가중치',
    
    -- 매칭 조건
    match_field ENUM('title', 'content', 'dept_name', 'work_class', 'industry', 'all') 
        DEFAULT 'all' COMMENT '매칭 대상 필드',
    match_type ENUM('exact', 'contains', 'regex') DEFAULT 'contains' COMMENT '매칭 타입',
    is_negative BOOLEAN DEFAULT FALSE COMMENT '부정 키워드 여부',
    
    -- 상태
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    
    -- 시스템 필드
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    created_by VARCHAR(50) COMMENT '생성자',
    
    -- 인덱스
    INDEX idx_keyword (keyword),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active),
    INDEX idx_match_field (match_field)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='키워드 매칭 규칙';
"""

# 입찰공고 상세 정보 테이블 (추가 상세 데이터가 필요한 경우)
BID_NOTICE_DETAILS_TABLE = """
CREATE TABLE bid_notice_details (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- 연결 정보
    bid_notice_no VARCHAR(50) NOT NULL COMMENT '입찰공고번호',
    public_bid_notice_id BIGINT UNSIGNED COMMENT '공고 테이블 ID',
    
    -- 상세 정보
    detail_content LONGTEXT COMMENT '상세 내용',
    specifications TEXT COMMENT '사양서',
    terms_and_conditions TEXT COMMENT '입찰 조건',
    evaluation_criteria TEXT COMMENT '평가 기준',
    
    -- 업체 정보
    successful_bidder VARCHAR(200) COMMENT '낙찰업체',
    successful_bid_amount BIGINT COMMENT '낙찰금액',
    successful_bid_rate DECIMAL(5,2) COMMENT '낙찰률(%)',
    
    -- 입찰 결과
    bidder_count INT COMMENT '입찰업체 수',
    bid_status VARCHAR(50) COMMENT '입찰 상태',
    result_date DATE COMMENT '결과 발표일',
    
    -- 시스템 필드
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    collected_at DATETIME COMMENT '수집일시',
    
    -- 외래키 및 인덱스
    FOREIGN KEY (public_bid_notice_id) REFERENCES public_bid_notices(id) ON DELETE CASCADE,
    INDEX idx_bid_notice_no (bid_notice_no),
    INDEX idx_public_bid_notice_id (public_bid_notice_id),
    INDEX idx_successful_bidder (successful_bidder),
    INDEX idx_result_date (result_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='입찰공고 상세 정보';
"""

# 테이블 생성 순서 (외래키 관계 고려)
CREATE_TABLES_ORDER = [
    ('public_bid_notices', PUBLIC_BID_NOTICES_TABLE),
    ('api_collection_logs', API_COLLECTION_LOGS_TABLE),
    ('keyword_rules', KEYWORD_RULES_TABLE),
    ('bid_notice_details', BID_NOTICE_DETAILS_TABLE),
]

# 기본 키워드 규칙 데이터
DEFAULT_KEYWORD_RULES = [
    {'keyword': '소프트웨어', 'category': 'IT개발', 'weight': 5},
    {'keyword': '시스템 구축', 'category': 'IT개발', 'weight': 4},
    {'keyword': '웹사이트', 'category': '웹개발', 'weight': 4},
    {'keyword': '홈페이지', 'category': '웹개발', 'weight': 4},
    {'keyword': '앱 개발', 'category': '모바일', 'weight': 5},
    {'keyword': '모바일', 'category': '모바일', 'weight': 3},
    {'keyword': '데이터베이스', 'category': 'DB/서버', 'weight': 3},
    {'keyword': '서버 구축', 'category': 'DB/서버', 'weight': 4},
    {'keyword': '클라우드', 'category': 'DB/서버', 'weight': 3},
    {'keyword': '보안', 'category': '보안', 'weight': 4},
    {'keyword': '정보보호', 'category': '보안', 'weight': 4},
    {'keyword': 'AI', 'category': 'AI/빅데이터', 'weight': 5},
    {'keyword': '인공지능', 'category': 'AI/빅데이터', 'weight': 5},
    {'keyword': '빅데이터', 'category': 'AI/빅데이터', 'weight': 4},
    {'keyword': '머신러닝', 'category': 'AI/빅데이터', 'weight': 4},
    {'keyword': '디지털', 'category': 'DX', 'weight': 2},
    {'keyword': '전자정부', 'category': 'DX', 'weight': 3},
    {'keyword': '스마트', 'category': 'DX', 'weight': 2},
]