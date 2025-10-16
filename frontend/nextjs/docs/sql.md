아래를 참고하여 mysql 테이블 생성 sql을 만들어주세요

테이블 이름: bids
컬럼: bid, nid, ...

---
입찰아이디	bid	int	primary auto
공고아이디	nid	int	foreign notices nid
제목	title	text
입찰시작일	started_at	datetime
입찰종료일	ended_at	datetime
상세	detail	json	상세 정보
메모	memo	text

---

CREATE TABLE `bids` (
  `bid` int NOT NULL AUTO_INCREMENT COMMENT '입찰아이디',
  `nid` int NOT NULL COMMENT '공고아이디',
  `title` text COMMENT '제목',
  `started_at` datetime COMMENT '입찰시작일',
  `ended_at` datetime COMMENT '입찰종료일',
  `detail` json COMMENT '상세 정보',
  `memo` text COMMENT '메모',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (`bid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='입찰 정보';

---

CREATE TABLE `bids` (
  `bid` int NOT NULL AUTO_INCREMENT COMMENT '입찰아이디',
  `nid` int NOT NULL COMMENT '공고아이디',
  `title` text COMMENT '제목',
  `started_at` datetime COMMENT '입찰시작일',
  `ended_at` datetime COMMENT '입찰종료일',
  `detail` json COMMENT '상세 정보',
  `memo` text COMMENT '메모',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (`bid`),
  KEY `idx_nid` (`nid`),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='입찰 정보';



====

-- 1. 일반적인 입찰 공고
INSERT INTO bids (nid, title, started_at, ended_at, detail, memo) 
VALUES (
  1, 
  '2024년 상반기 건축공사 입찰공고',
  '2024-03-01 09:00:00',
  '2024-03-15 17:00:00',
  '{
    "예상금액": "5,000,000,000원",
    "입찰자격": "건설업 등록 1급",
    "공사기간": "6개월",
    "공사지역": "서울시 강남구",
    "담당자": "홍길동",
    "연락처": "02-1234-5678"
  }',
  '우리 회사 강점: 1. 유사공사 경험 2. 자재 확보 3. 시공능력'
);

-- 2. 긴급 입찰 공고
INSERT INTO bids (nid, title, started_at, ended_at, detail, memo) 
VALUES (
  2,
  '긴급 도로보수공사 입찰',
  '2024-03-10 10:00:00',
  '2024-03-12 15:00:00',
  '{
    "예상금액": "500,000,000원",
    "입찰자격": "건설업 등록 2급",
    "공사기간": "1개월",
    "공사지역": "경기도 수원시",
    "담당자": "김철수",
    "연락처": "031-9876-5432",
    "긴급사유": "도로 함몰 위험"
  }',
  '긴급공사이므로 빠른 착공 필요'
);

-- 3. 대규모 프로젝트
INSERT INTO bids (nid, title, started_at, ended_at, detail, memo) 
VALUES (
  3,
  '신도시 주상복합 건축공사',
  '2024-04-01 09:00:00',
  '2024-04-30 17:00:00',
  '{
    "예상금액": "50,000,000,000원",
    "입찰자격": "건설업 등록 1급",
    "공사기간": "24개월",
    "공사지역": "경기도 화성시",
    "담당자": "이영희",
    "연락처": "031-2345-6789",
    "건축면적": "50,000㎡",
    "층수": "지하 3층, 지상 30층"
  }',
  '대규모 프로젝트, 자금조달 계획 필요'
);

-- 4. 기계설비 입찰
INSERT INTO bids (nid, title, started_at, ended_at, detail, memo) 
VALUES (
  4,
  '공장 자동화 설비 설치공사',
  '2024-03-15 09:00:00',
  '2024-03-25 17:00:00',
  '{
    "예상금액": "2,000,000,000원",
    "입찰자격": "기계설비업 등록",
    "공사기간": "3개월",
    "공사지역": "충청남도 천안시",
    "담당자": "박기술",
    "연락처": "041-5678-1234",
    "설비종류": "산업용 로봇, 컨베이어",
    "보증기간": "2년"
  }',
  '기술력과 설치경험이 중요'
);

-- 5. 소규모 리모델링
INSERT INTO bids (nid, title, started_at, ended_at, detail, memo) 
VALUES (
  5,
  '오피스 빌딩 리모델링 공사',
  '2024-03-20 09:00:00',
  '2024-03-27 17:00:00',
  '{
    "예상금액": "300,000,000원",
    "입찰자격": "건설업 등록 3급",
    "공사기간": "2개월",
    "공사지역": "서울시 영등포구",
    "담당자": "최관리",
    "연락처": "02-8765-4321",
    "공사내용": "인테리어, 전기설비, 냉방설비",
    "점유중": "있음"
  }',
  '점유중 공사이므로 주의 필요'
);

====






`C:\JnJ\Developments\Servers\nextjs\ilmac-bid\src\app\notices\[category]\page.tsx` 를 참고하여, `C:\JnJ\Developments\Servers\nextjs\ilmac-bid\src\app\bids\[status]\page.tsx` 를 구현해주세요.
전체적인 UI는 동일합니다.
status선택박스, 검색, 'status 변경' 아이콘이 있고,
아래로는 각 status별 목록 테이블이 나옵니다.
변수나 함수들은 notices 대신 bids, category 대신 status를 사용하고, graphql로 데이터를 fetch하는 부분은 우선은 dummy data를 사용해주세요.

입찰아이디 bid
공고아이디	nid
제목	title
입찰일	started_at
입찰종료일	ended_at
상세	detail	json	상세 정보
메모	memo


유형	category
상태	stutus
상세페이지 주소	detailUrl
기관명	orgName
지역	region

