## details

CREATE TABLE `details` (
  `nid` int(11) NOT NULL,
  `제목` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `파일이름` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `파일주소` text COLLATE utf8_unicode_ci,
  `공고구분` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `공고번호` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `담당부서` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `담당자` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `연락처` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `scraped_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `기관명` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `본문` text COLLATE utf8_unicode_ci,
  `상세페이지주소` varchar(800) COLLATE utf8_unicode_ci DEFAULT '',
  `created_at` timestamp NULL DEFAULT NULL,
  `작성일` date DEFAULT NULL,
  `작성자` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `category` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`nid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci


## bids

CREATE TABLE `bids` (
  `bid` int(11) NOT NULL AUTO_INCREMENT COMMENT '입찰아이디',
  `nid` int(11) NOT NULL COMMENT '공고아이디',
  `title` text COLLATE utf8mb4_unicode_ci COMMENT '제목',
  `started_at` datetime DEFAULT NULL COMMENT '입찰시작일',
  `ended_at` datetime DEFAULT NULL COMMENT '입찰종료일',
  `detail` json DEFAULT NULL COMMENT '상세 정보',
  `memo` text COLLATE utf8mb4_unicode_ci COMMENT '메모',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  `status` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`bid`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='입찰 정보'

