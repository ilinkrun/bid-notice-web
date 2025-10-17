CREATE TABLE `settings_notice_list` (
  `org_name` varchar(40) NOT NULL COMMENT '기관명: org_name',
  `url` varchar(400) DEFAULT NULL COMMENT '게시판 url',
  `iframe` varchar(60) DEFAULT NULL COMMENT '게시판 iframe',
  `rowXpath` varchar(200) DEFAULT NULL COMMENT '게시판 행',
  `paging` varchar(200) DEFAULT NULL COMMENT '페이지 클릭요소',
  `startPage` tinyint(4) DEFAULT NULL COMMENT '시작 페이지',
  `endPage` tinyint(4) DEFAULT NULL COMMENT '끝 페이지',
  `login` varchar(300) DEFAULT NULL COMMENT '로그인',
  `title` varchar(200) DEFAULT NULL COMMENT '제목: path_title',
  `detail_url` varchar(800) DEFAULT NULL COMMENT '상세페이지주소: path_detail_url',
  `posted_date` varchar(200) DEFAULT NULL COMMENT '작성일: path_posted_date',
  `posted_by` varchar(200) DEFAULT NULL COMMENT '작성자: path_posted_by',
  `exception_row` varchar(400) DEFAULT NULL COMMENT '제외항목: path_exception',
  `is_active` tinyint(1) DEFAULT 0,
  `org_region` varchar(10) DEFAULT 'NULL' COMMENT '지역: 지역',
  `registration` tinyint(4) DEFAULT NULL COMMENT '등록',
  `company_in_charge` varchar(20) DEFAULT NULL,
  `org_man` varchar(10) DEFAULT NULL COMMENT '담당자',
  `oid` int(11) NOT NULL,
  PRIMARY KEY (`oid`),
  UNIQUE KEY `idx_org_name` (`org_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci COMMENT='설정(공고 목록 스크랩)'

---

CREATE TABLE `settings_notice_detail` (
  `org_name` varchar(200) NOT NULL COMMENT '기관명: org_name',
  `title` varchar(200) DEFAULT NULL COMMENT '제목: xpath_title',
  `body_html` varchar(200) DEFAULT NULL COMMENT '본문: xpath_body',
  `file_name` varchar(200) DEFAULT NULL COMMENT '파일이름: xpath_file_name',
  `file_url` varchar(200) DEFAULT NULL COMMENT '파일주소: xpath_file_url',
  `preview` varchar(200) DEFAULT NULL COMMENT '미리보기: xpath_preview',
  `notice_div` varchar(200) DEFAULT NULL COMMENT '공고구분: xpath_notice_div',
  `notice_num` varchar(200) DEFAULT NULL COMMENT '공고번호: xpath_notice_num',
  `org_dept` varchar(200) DEFAULT NULL COMMENT '담당부서: xpath_org_div',
  `org_man` varchar(200) DEFAULT NULL COMMENT '담당자: xpath_org_man',
  `org_tel` varchar(200) DEFAULT NULL COMMENT '연락처: xpath_org_tel',
  `is_active` tinyint(1) DEFAULT 0,
  `sample_url` varchar(500) DEFAULT NULL COMMENT '샘플 url',
  `down` tinyint(1) DEFAULT 1 COMMENT '다운로드',
  `oid` int(11) NOT NULL,
  PRIMARY KEY (`oid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci COMMENT='설정(공고 상세정보 스크랩)'

---

CREATE TABLE `settings_notice_category` (
  `sn` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(20) NOT NULL COMMENT '구분: 업무 분류',
  `division` varchar(50) DEFAULT NULL,
  `keywords` varchar(200) DEFAULT NULL COMMENT '키워드',
  `nots` varchar(200) DEFAULT NULL COMMENT '배제어',
  `min_point` smallint(6) DEFAULT NULL COMMENT '최소점수',
  `creator` varchar(20) DEFAULT NULL COMMENT '생성자',
  `memo` varchar(400) DEFAULT NULL COMMENT '메모',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp() COMMENT '생성시간',
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() COMMENT '수정시간',
  `is_active` tinyint(1) DEFAULT 0,
  `priority` int(11) NOT NULL DEFAULT 50 COMMENT '우선순위 (값이 클수록 먼저 분류, 작을수록 나중에 분류되어 덮어쓰기 가능)',
  PRIMARY KEY (`sn`),
  UNIQUE KEY `unique_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci COMMENT='설정(공고 업무 구분)'

