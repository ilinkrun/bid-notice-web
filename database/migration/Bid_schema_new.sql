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
  `title` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '제목: title',
  `file_name` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '파일이름: file_names',
  `file_url` text COLLATE utf8_unicode_ci COMMENT '파일주소: file_urls',
  `notice_div` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '공고구분: notice_div',
  `notice_num` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '공고번호: notice_num',
  `org_dept` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '담당부서: org_dept',
  `org_man` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '담당자: org_man',
  `org_tel` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '연락처: org_tel',
  `scraped_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '스크랩 시간',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  `org_name` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '기관명: org_name',
  `body_html` text COLLATE utf8_unicode_ci COMMENT '본문: body_html',
  `detail_url` varchar(800) COLLATE utf8_unicode_ci DEFAULT '' COMMENT '상세페이지주소: detail_url',
  `created_at` timestamp NULL DEFAULT NULL COMMENT '생성 시간',
  `posted_date` date DEFAULT NULL COMMENT '작성일: posted_date',
  `posted_by` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '작성자: posted_by',
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
  `file_name` varchar(400) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '파일이름: file_name',
  `file_url` varchar(600) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '파일주소: file_url',
  `down_folder` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '다운폴더: down_folder',
  `down_start` datetime DEFAULT NULL COMMENT '다운로드 시작시간',
  `scraped_at` datetime DEFAULT NULL COMMENT '스크랩 시간',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
  PRIMARY KEY (`nid`,`sn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

-- =============================================
-- Table: logs_scraping
-- Engine: InnoDB
-- Rows: 21971
-- Comment: No comment
-- =============================================
CREATE TABLE `logs_scraping` (
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
  `org_name` varchar(40) COLLATE utf8_unicode_ci NOT NULL COMMENT '기관명: org_name',
  `title` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '제목: title',
  `detail_url` varchar(800) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '상세페이지주소: detail_url',
  `posted_date` date DEFAULT NULL COMMENT '작성일: posted_date',
  `posted_by` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '작성자: posted_by',
  `scraped_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '스크랩 시간',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성시간',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정시간',
  `category` varchar(20) COLLATE utf8_unicode_ci DEFAULT '무관' COMMENT '구분: 업무 분류',
  `status` varchar(20) COLLATE utf8_unicode_ci DEFAULT '제외' COMMENT '상태',
  `is_selected` tinyint(4) NOT NULL DEFAULT '0' COMMENT '진행: 입찰 진행 여부',
  PRIMARY KEY (`nid`),
  UNIQUE KEY `unique_url` (`detail_url`)
) ENGINE=InnoDB AUTO_INCREMENT=538827 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

-- =============================================
-- Table: settings_category
-- Engine: InnoDB
-- Rows: 3
-- Comment: No comment
-- =============================================
CREATE TABLE `settings_category` (
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
-- Table: settings_detail
-- Engine: InnoDB
-- Rows: 101
-- Comment: No comment
-- =============================================
CREATE TABLE `settings_detail` (
  `org_name` varchar(200) COLLATE utf8_unicode_ci NOT NULL COMMENT '기관명: org_name',
  `title` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '제목: xpath_title',
  `body_html` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '본문: xpath_body',
  `file_name` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '파일이름: xpath_file_name',
  `file_url` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '파일주소: xpath_file_url',
  `preview` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '미리보기: xpath_preview',
  `notice_div` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '공고구분: xpath_notice_div',
  `notice_num` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '공고번호: xpath_notice_num',
  `org_dept` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '담당부서: xpath_org_div',
  `org_man` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '담당자: xpath_org_man',
  `org_tel` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '연락처: xpath_org_tel',
  `use` tinyint(1) DEFAULT NULL COMMENT '사용',
  `sample_url` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '샘플 url',
  `down` tinyint(1) DEFAULT '1' COMMENT '다운로드',
  `oid` int(11) DEFAULT NULL COMMENT '순번',
  PRIMARY KEY (`org_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci

-- =============================================
-- Table: settings_list
-- Engine: InnoDB
-- Rows: 113
-- Comment: No comment
-- =============================================
CREATE TABLE `settings_list` (
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
  `company` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '담당업체',
  `org_man` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT '담당자',
  `oid` int(11) DEFAULT NULL,
  PRIMARY KEY (`org_name`),
  UNIQUE KEY `idx_org_name` (`org_name`)
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


-- =============================================
-- Migration Tables
-- =============================================

-- Table: table_migration_fields
CREATE TABLE `table_migration_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '테이블명',
  `field_src` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '원본 필드명',
  `field_dst` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '변경 필드명',
  `remark` text COLLATE utf8mb4_unicode_ci COMMENT '비고',
  PRIMARY KEY (`id`),
  KEY `idx_table_name` (`table_name`),
  KEY `idx_field_src` (`field_src`),
  KEY `idx_field_dst` (`field_dst`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='필드 마이그레이션 정보';

-- Table: table_field_label_mappings
CREATE TABLE `table_field_label_mappings` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '테이블명',
  `field_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '필드키',
  `field_label` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '필드라벨',
  `remark` text COLLATE utf8mb4_unicode_ci COMMENT '비고',
  PRIMARY KEY (`id`),
  KEY `idx_table_field` (`table_name`, `field_key`),
  KEY `idx_field_key` (`field_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='필드 라벨 매핑 정보';
