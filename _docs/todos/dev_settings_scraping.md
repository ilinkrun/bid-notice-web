## settings/scrapping/[oid]/list

> 페이지 주소 'http://14.34.23.70:11501/settings/scrapping/[orgName]/list'에서 [orgName]을 [oid]로 변경하려면, backend, frontend 관련 파일들을 수정해야 합니다.
아래 내용을 참고하여, 리팩토링을 수행해주세요.

- database:
"""
CREATE TABLE `settings_notice_list` (
  `org_name` varchar(40) COLLATE utf8_unicode_ci NOT NULL COMMENT '기관명: org_name',
  `url` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '게시판 url',
  `iframe` varchar(60) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '게시판 iframe',
  `rowXpath` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '게시판 행',
  `paging` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '페이지 클릭요소',
  `startPage` tinyint(4) DEFAULT NULL COMMENT '시작 페이지',
  `endPage` tinyint(4) DEFAULT NULL COMMENT '끝 페이지',
  `login` varchar(300) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '로그인',
  `title` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '제목: path_title',
  `detail_url` varchar(800) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '상세페이지주소: path_detail_url',
  `posted_date` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '작성일: path_posted_date',
  `posted_by` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '작성자: path_posted_by',
  `exception_row` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '제외항목: path_exception',
  `use` tinyint(1) DEFAULT NULL COMMENT '사용: 사용 여부',
  `org_region` varchar(10) COLLATE utf8_unicode_ci DEFAULT 'NULL' COMMENT '지역: 지역',
  `registration` tinyint(4) DEFAULT NULL COMMENT '등록',
  `company_in_charge` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '담당업체',
  `org_man` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '담당자',
  `oid` int(11) DEFAULT NULL,
  PRIMARY KEY (`org_name`),
  UNIQUE KEY `idx_org_name` (`org_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='설정(공고 목록 스크랩)'
"""

- Primary Key는 oid로 변경하였음
  - 'ALTER TABLE `settings_notice_list` DROP PRIMARY KEY, MODIFY COLUMN `oid` int(11) NOT NULL, ADD PRIMARY KEY (`oid`);'


- backend: 


/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/mysql_settings.py

/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/server_bid.py

파일을 분석하여,

> mysql_settings.py

- SETTINGS_NOTICE_LIST_FIELDS: "oid", "company_in_charge", "exception_row" 추가

- SETTINGS_NOTICE_LIST_BRIEF_FIELDS: "oid", "company_in_charge" 추가


- find_settings_notice_list
  - 설정 목록 리스트 데이터값 

- find_settings_notice_list_by_oid 함수 생성
  - find_settings_notice_list_by_org_name 함수 참조
  - 설정 상세 페이지의 보기, 편집 모드시 데이터값

- upsert_settings_notice_list_by_oid(oid, data) 함수 생성
  - upsert_settings_notice_list_by_org_name(name, data) 함수 참조
  - 설정 추가, 변경시 사용

> server_bid.py
- settings_notice_list 관련 엔드포인트 수정


- frontend: 
  - graphql:
    - /_exp/projects/bid-notice-web/frontend/src/app/api/graphql/resolvers/settingsList.ts
    - /_exp/projects/bid-notice-web/frontend/src/app/api/graphql/schema/settingsList.ts
  - page:
    - /_exp/projects/bid-notice-web/frontend/src/app/settings/scrapping/[orgName]/list/page.tsx
    => /_exp/projects/bid-notice-web/frontend/src/app/settings/scrapping/[oid]/list/page.tsx




