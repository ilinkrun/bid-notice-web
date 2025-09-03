'공고 목록'에서 '공사점검', '성능평가', '기타' 페이지에 우측 상단의 '편집' 버튼 좌측으로 '제외' 버튼을 만들어주세요.
- 제외 버튼을 누르면, 모달창이 뜨고 '업무에서 제외할까요?', '취소', '확인' 버튼이 보이고,
- '확인' 버튼을 누르면, 해당 공고들의 is_selected=-1 로 업데이트되도록 해주세요.


select title, category, is_selected from notice_list where title like '%방배본동 통장%' or title like '%반포4동 통장%';

===

[/notices/성능평가](http://14.34.23.70:11501/notices/성능평가)
페이지에서 상단의 '제외' 버튼(업무에서 제외)을 클릭했더니

'제외 처리 중 오류가 발생했습니다' 에러가 뜹니다.

---
'공고 목록'에서 '공사점검', '성능평가', '기타' 페이지에 우측 상단의 '편집' 버튼 좌측으로 '제외' 버튼을 만들어주세요.
- 제외 버튼을 누르면, 모달창이 뜨고 '업무에서 제외할까요?', '취소', '확인' 버튼이 보이고,
- '확인' 버튼을 누르면, 해당 공고들의 is_selected=-1 로 업데이트되도록 해주세요.
---

- frontend 페이지는 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/notices/[category]/page.tsx 입니다.

- notice_list 테이블 구조는 아래와 같습니다.
"""
CREATE TABLE `notice_list` (
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
  `is_selected` tinyint(4) NOT NULL DEFAULT '0' COMMENT '진행: 입찰 진행 여부',
  PRIMARY KEY (`nid`),
  UNIQUE KEY `unique_url` (`detail_url`)
) ENGINE=InnoDB AUTO_INCREMENT=5852 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='공고 목록'
"""

- backend 코드는
/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/mysql_notice.py 와 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/server_bid.py
를 분석하고, 필요한 부분은 수정해주세요.

- grapqhql 코드는 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/api/graphql/resolvers/notice.ts 와 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/api/graphql/schema/notice.ts 를 수정해주세요


===

- '공고 목록'의 서브 메뉴에 '제외'를 추가해주세요.

메뉴 파일은 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/components/layouts/Header.tsx 에서 수정해주세요.

- 공고 페이지 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/notices/[category]/page.tsx 의 선택박스에도 '제외'를 추가해주세요.

- 공고 목록 > 제외 페이지는 'is_selected = -1'인 조건의 공고 리스트입니다.

- 페이지의 UI는 
  - '공고 목록 > 무관(관련없음)'과 유사하지만, '-' 버튼 대신 '+'버튼을 넣고, 버튼 클릭시 'is_selected = 0'이 되도록 해주세요.
  - 페이지 테이블의 컬럼은 '제목' 앞에 '유형'을 추가하고, category 값을 넣어주세요.



