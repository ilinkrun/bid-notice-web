-- MySQL Schema Backup
-- Database: Bid
-- Generated: 2025-08-31 07:28:42
-- Total Tables: 15



-- =============================================
-- Table: bids
-- Engine: InnoDB
-- Rows: 5
-- Comment: 입찰 정보
-- =============================================
CREATE TABLE `bids` (
  `bid` int(11) NOT NULL AUTO_INCREMENT COMMENT '입찰아이디',
  `nid` int(11) NOT NULL COMMENT '공고아이디',
  `title` text COLLATE utf8mb4_unicode_ci COMMENT '제목: 입찰 공고 제목',
  `started_at` datetime DEFAULT NULL COMMENT '입찰시작: 입찰 시작 시간',
  `ended_at` datetime DEFAULT NULL COMMENT '입찰종료: 입찰 종료 시간',
  `detail` json DEFAULT NULL COMMENT '상세정보',
  `memo` text COLLATE utf8mb4_unicode_ci COMMENT '메모',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  `status` text COLLATE utf8mb4_unicode_ci COMMENT '상태: 입찰 진행 상태',
  PRIMARY KEY (`bid`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='입찰 정보'

-- =============================================
-- Table: board_comments
-- Engine: InnoDB
-- Rows: 2
-- Comment: 게시판 댓글
-- =============================================
CREATE TABLE `board_comments` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '순번',
  `board` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '게시판명: channel_dev, channel_op, channel_manual',
  `post_id` bigint(20) unsigned NOT NULL COMMENT '게시글 ID',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '내용: 댓글 내용',
  `writer` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '작성자: 댓글 작성자 이름',
  `password` char(4) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '비밀번호: 숫자 4자리',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성시간',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정시간',
  `is_visible` tinyint(1) NOT NULL DEFAULT '1' COMMENT '노출: 댓글 노출 여부',
  PRIMARY KEY (`id`),
  KEY `idx_board_post` (`board`,`post_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_writer` (`writer`),
  KEY `idx_is_visible` (`is_visible`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시판 댓글'

-- =============================================
-- Table: channel_dev
-- Engine: InnoDB
-- Rows: 8
-- Comment: 개발 채널 게시판
-- =============================================
CREATE TABLE `channel_dev` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '순번: 글 순번 아이디',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '제목: 글제목',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '내용: 글내용',
  `format` enum('text','markdown','html') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text' COMMENT '형식: 글형식(text, markdown, html)',
  `writer` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '글쓴이: 글쓴이 이름',
  `password` char(4) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '비밀번호: 숫자 4자리',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성시간',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정시간',
  `is_visible` tinyint(1) NOT NULL DEFAULT '1' COMMENT '노출: 글 노출 여부',
  PRIMARY KEY (`id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_writer` (`writer`),
  KEY `idx_is_visible` (`is_visible`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='개발 채널 게시판'

-- =============================================
-- Table: channel_manual
-- Engine: InnoDB
-- Rows: 0
-- Comment: 개발 채널 게시판
-- =============================================
CREATE TABLE `channel_manual` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '순번: 글 순번 아이디',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '제목: 글제목',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '내용: 글내용',
  `format` enum('text','markdown','html') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text' COMMENT '형식: 글형식(text, markdown, html)',
  `writer` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '글쓴이: 글쓴이 이름',
  `password` char(4) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '비밀번호: 숫자 4자리',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성시간',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정시간',
  `is_visible` tinyint(1) NOT NULL DEFAULT '1' COMMENT '노출: 글 노출 여부',
  PRIMARY KEY (`id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_writer` (`writer`),
  KEY `idx_is_visible` (`is_visible`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='개발 채널 게시판'

-- =============================================
-- Table: channel_op
-- Engine: InnoDB
-- Rows: 0
-- Comment: 개발 채널 게시판
-- =============================================
CREATE TABLE `channel_op` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '순번: 글 순번 아이디',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '제목: 글제목',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '내용: 글내용',
  `format` enum('text','markdown','html') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text' COMMENT '형식: 글형식(text, markdown, html)',
  `writer` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '글쓴이: 글쓴이 이름',
  `password` char(4) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '비밀번호: 숫자 4자리',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성시간',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정시간',
  `is_visible` tinyint(1) NOT NULL DEFAULT '1' COMMENT '노출: 글 노출 여부',
  PRIMARY KEY (`id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_writer` (`writer`),
  KEY `idx_is_visible` (`is_visible`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='개발 채널 게시판'

-- =============================================
-- Table: details
-- Engine: InnoDB
-- Rows: 4
-- Comment: No comment
-- =============================================
CREATE TABLE `details` (
  `nid` int(11) NOT NULL COMMENT '순번',
  `제목` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'title',
  `파일이름` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'file_names',
  `파일주소` text COLLATE utf8_unicode_ci COMMENT 'file_urls',
  `공고구분` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'notice_div',
  `공고번호` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'notice_num',
  `담당부서` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'org_dept',
  `담당자` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'org_man',
  `연락처` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'org_tel',
  `scraped_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '스크랩 시간',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  `기관명` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'org_name',
  `본문` text COLLATE utf8_unicode_ci COMMENT 'body_html',
  `상세페이지주소` varchar(800) COLLATE utf8_unicode_ci DEFAULT '' COMMENT 'detail_url',
  `created_at` timestamp NULL DEFAULT NULL COMMENT '생성 시간',
  `작성일` date DEFAULT NULL COMMENT 'posted_date',
  `작성자` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'posted_by',
  `category` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '업무 분류',
  `status` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '진행 상태',
  PRIMARY KEY (`nid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

-- =============================================
-- Table: errors_notice_scraping
-- Engine: InnoDB
-- Rows: 267
-- Comment: No comment
-- =============================================
CREATE TABLE `errors_notice_scraping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orgs` text NOT NULL,
  `time` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=297 DEFAULT CHARSET=utf8mb4

-- =============================================
-- Table: files
-- Engine: InnoDB
-- Rows: 668
-- Comment: No comment
-- =============================================
CREATE TABLE `files` (
  `nid` int(11) NOT NULL COMMENT '순번: 공고 아이디',
  `sn` smallint(6) NOT NULL COMMENT '일련번호',
  `파일이름` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'file_name',
  `파일주소` varchar(600) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'file_url',
  `다운폴더` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'down_folder',
  `down_start` datetime DEFAULT NULL COMMENT '다운로드 시작시간',
  `scraped_at` datetime DEFAULT NULL COMMENT '스크랩 시간',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  PRIMARY KEY (`nid`,`sn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

-- =============================================
-- Table: logs_notice_scraping
-- Engine: InnoDB
-- Rows: 21971
-- Comment: No comment
-- =============================================
CREATE TABLE `logs_notice_scraping` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `org_name` varchar(255) NOT NULL,
  `error_code` int(11) DEFAULT NULL,
  `error_message` text,
  `scraped_count` int(11) DEFAULT '0',
  `inserted_count` int(11) DEFAULT '0',
  `time` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22558 DEFAULT CHARSET=utf8mb4

-- =============================================
-- Table: notices
-- Engine: InnoDB
-- Rows: 128499
-- Comment: No comment
-- =============================================
CREATE TABLE `notices` (
  `nid` int(11) NOT NULL AUTO_INCREMENT COMMENT '순번: 공고 아이디',
  `sn` int(11) NOT NULL COMMENT '일련번호',
  `기관명` varchar(40) COLLATE utf8_unicode_ci NOT NULL COMMENT 'org_name: 기관이름',
  `제목` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'title',
  `상세페이지주소` varchar(800) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'detail_url',
  `작성일` date DEFAULT NULL COMMENT 'posted_date',
  `작성자` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'posted_by',
  `scraped_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '스크랩 시간',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성시간',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정시간',
  `category` varchar(20) COLLATE utf8_unicode_ci DEFAULT '무관' COMMENT '구분: 업무 분류',
  `status` varchar(20) COLLATE utf8_unicode_ci DEFAULT '제외' COMMENT '상태',
  `is_selected` tinyint(4) NOT NULL DEFAULT '0' COMMENT '진행: 입찰 진행 여부',
  PRIMARY KEY (`nid`),
  UNIQUE KEY `unique_url` (`상세페이지주소`)
) ENGINE=InnoDB AUTO_INCREMENT=538827 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

-- =============================================
-- Table: settings_notice_category
-- Engine: InnoDB
-- Rows: 3
-- Comment: No comment
-- =============================================
CREATE TABLE `settings_notice_category` (
  `sn` int(11) DEFAULT '1' COMMENT '순번',
  `category` varchar(20) COLLATE utf8_unicode_ci NOT NULL COMMENT '구분: 업무 분류',
  `keywords` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '키워드',
  `nots` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '배제어',
  `min_point` smallint(6) DEFAULT NULL COMMENT '최소점수',
  `creator` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '생성자',
  `memo` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '메모',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성시간',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정시간',
  `use` tinyint(1) DEFAULT NULL COMMENT '사용: 사용 여부',
  PRIMARY KEY (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

-- =============================================
-- Table: settings_notice_detail
-- Engine: InnoDB
-- Rows: 101
-- Comment: No comment
-- =============================================
CREATE TABLE `settings_notice_detail` (
  `기관명` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT 'org_name',
  `제목` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'xpath_title',
  `본문` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'xpath_body',
  `파일이름` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'xpath_file_name',
  `파일주소` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'xpath_file_url',
  `미리보기` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'xpath_preview',
  `공고구분` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'xpath_notice_div',
  `공고번호` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'xpath_notice_num',
  `담당부서` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'xpath_org_div',
  `담당자` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'xpath_org_man',
  `연락처` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'xpath_org_tel',
  `use` tinyint(1) DEFAULT NULL COMMENT '사용',
  `sample_url` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '샘플 url',
  `down` tinyint(1) DEFAULT '1' COMMENT '다운로드',
  `oid` int(11) DEFAULT NULL COMMENT '순번',
  PRIMARY KEY (`기관명`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

-- =============================================
-- Table: settings_keyword
-- Engine: InnoDB
-- Rows: 3
-- Comment: No comment
-- =============================================
CREATE TABLE `settings_keyword` (
  `use` tinyint(1) DEFAULT NULL,
  `검색명` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `검색어` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `배제어` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `최소점수` smallint(6) DEFAULT NULL,
  `적용분야` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `적용기관` varchar(40) COLLATE utf8_unicode_ci DEFAULT NULL,
  `적용지역` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `작성자` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `메모` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`검색명`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

-- =============================================
-- Table: settings_notice_list
-- Engine: InnoDB
-- Rows: 113
-- Comment: No comment
-- =============================================
CREATE TABLE `settings_notice_list` (
  `기관명` varchar(40) COLLATE utf8_unicode_ci NOT NULL COMMENT 'org_name',
  `url` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '게시판 url',
  `iframe` varchar(60) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '게시판 iframe',
  `rowXpath` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '게시판 행',
  `paging` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '페이지 클릭요소',
  `startPage` tinyint(4) DEFAULT NULL COMMENT '시작 페이지',
  `endPage` tinyint(4) DEFAULT NULL COMMENT '끝 페이지',
  `login` varchar(300) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '로그인',
  `제목` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'path_title',
  `상세페이지주소` varchar(800) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'path_detail_url',
  `작성일` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'path_posted_date',
  `작성자` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'path_posted_by',
  `제외항목` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'path_exception',
  `use` tinyint(1) DEFAULT NULL COMMENT '사용: 사용 여부',
  `지역` varchar(10) COLLATE utf8_unicode_ci DEFAULT 'NULL' COMMENT 'org_region: 지역',
  `등록` tinyint(4) DEFAULT NULL,
  `담당업체` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `담당자` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `oid` int(11) DEFAULT NULL,
  PRIMARY KEY (`기관명`),
  UNIQUE KEY `idx_org_name` (`기관명`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

-- =============================================
-- Table: settings_nas_folder
-- Engine: InnoDB
-- Rows: 7
-- Comment: No comment
-- =============================================
CREATE TABLE `settings_nas_folder` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '순번: 아이디',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '이름',
  `area` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '영역',
  `level` int(11) NOT NULL COMMENT '깊이',
  `folder` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '폴더',
  `remark` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '비고',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci