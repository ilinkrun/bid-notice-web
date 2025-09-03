[ ] 데이터베이스 변경
  [X] 데이터베이스 생성
  [X] 데이터베이스 테이블명 변경
  [X] 데이터베이스 필드명 변경
[ ] 데이터베이스 변경 사항 backend 적용
  [] backend src 적용
[] 데이터베이스 변경 사항 frontend 적용
  [] graphql 코드 변경


---
[ ] 데이터베이스 변경
  [X] 데이터베이스 생성
  [X] 데이터베이스 테이블명 변경
  [X] 데이터베이스 필드명 변경
[ ] 데이터베이스 변경 사항 backend 적용
  [] backend src 적용
[] 데이터베이스 변경 사항 frontend 적용
  [] graphql 코드 변경


---
> 데이터베이스 관련 함수 ~~분리~~
백엔드의의 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/mysql_bid.py 파일을 아래와 같은 함수들로 분리해주세요. 파일 분리후 server_bid.py, spider_list.py, spider_detail.py 등 mysql_bid를 import하는 함수들에서 import하는 패키지도 수정해주세요.

mysql_settings.py  # settings_notice_list, settings_notice_details, ... 같은 설정 관련 함수
mysql_notice.py  # notice_list, notice_details, notice_files, ... 같은 공고 관련 함수
mysql_database.py  # database 백업, 데이터 삭제 등과 관련 함수
mysql_logs.py  # errors_notice_scraping, logs_notice_scraping


---
> server_bid.py에서 '** database 관리' 부분에 있는 2개의 함수는 server_mysql.py 파일로 이동해주세요.

---
## !!!

프론트엔드 http://14.34.23.70:11501/notices/[category] 페이지에서 우측 상단의 '입찰진행' 아이콘을 
  클릭하면, 체크한 입찰 공고들에 대해서, /_exp/projects/bid-notice-web/backend/src/spider_detail.py 
  파일에 있는 notice_to_progress(nid) 함수를 적용하려고 합니다. 백엔드의 server_bid.py와 프론트엔드의 
  graphql에서 notice.ts 리졸버, 스키마 파일 등을 수정하여 이 기능을 구현해주세요.



● Update Todos
  ⎿  ☒ 현재 프로젝트 구조 파악 및 관련 파일들 분석    
     ☒ spider_detail.py의 notice_to_progress 함수 분석
     ☒ GraphQL 스키마에 새로운 mutation 추가
     ☒ notice.ts 리졸버에 새로운 mutation 구현
     ☒ server_bid.py에 관련 로직 추가/수정
     ☒ 프론트엔드 GraphQL 쿼리/뮤테이션 추가

● 완료되었습니다! 모든 기능이 구현되었습니다.

  구현된 기능 요약

  1. Backend (server_bid.py):
    - /notice_to_progress 엔드포인트 추가
    - NoticeToProgressRequest 모델 클래스 추가
    - 체크된 nid들에 대해 spider_detail.py의 notice_to_progress 함수 실행
    - 성공/실패 카운트 및 오류 처리 포함
  2. GraphQL 스키마 (notice.ts):
    - noticeToProgress(nids: [ID!]!): UpdateResult! mutation 추가
    - 복수의 nid를 받아 진행 상태로 변경
  3. GraphQL 리졸버 (notice.ts):
    - noticeToProgress mutation 리졸버 구현
    - 백엔드 API 호출 및 에러 처리
  4. 프론트엔드 (NoticeTable.tsx):
    - GraphQL NOTICE_TO_PROGRESS mutation 정의
    - useMutation 훅을 사용하여 GraphQL 연동
    - 입찰 진행 버튼 클릭 시 체크된 공고들의 nid 수집
    - 진행 상태 표시 및 로딩 상태 관리
    - 성공/실패 메시지 표시

  동작 흐름

  1. 사용자가 http://14.34.23.70:11501/notices/[category] 페이지에서 공고들을 체크
  2. 우측 상단 '입찰진행' 아이콘(별표) 클릭
  3. 확인 모달에서 '예' 클릭
  4. 프론트엔드에서 GraphQL mutation 실행
  5. GraphQL 리졸버가 백엔드 API 호출
  6. 백엔드에서 각 nid에 대해 notice_to_progress(nid) 함수 실행
  7. 결과를 프론트엔드로 반환하여 사용자에게 결과 메시지 표시

  모든 구현이 완료되어 이제 프론트엔드에서 체크한 입찰 공고들에 대해 '입찰진행' 기능을 사용할
  수 있습니다.

  ----

  '입찰진행' 기능 구현이전으로 롤백해주세요. 롤백 후 단계별로 하나하나 코딩하면서, 에러가        │
│   생기는 단계를 찾아내야 할 것 같아요. 

===

입찰 관리 페이지(/_exp/projects/bid-notice-web/frontend/src/app/bids) 에서는 my_bids에서 status='진행' => progress, status='응찰' => bidding, status='포기', '낙찰', '패찰' => completed 서브 폴더의 page.tsx로 관리합니다. 우선 해당 페이지에는 목록을 나타내고, 우측 상단에서는 status를 변경할 수 있도록 하고, 해당 입찰 row를 클릭하면, 단계별로 상이한 상세페이지를 구성할 예정입니다. 우선적으로 목록 페이지들을 구현해주세요.


프론트 페이지 Header와 입찰관리 페이지의 선택박스에서 '낙찰', '패찰', '포기'는 '종료'로 통합해주세요. '종료' 상태에서는 목록 우측 상단에 '낙찰', '패찰', '포기'를 체크박스로 선택하여 목록에 표시할 것인지를 선택하고, 목록의 해더에 '상태'를 추가해주세요.

===

프론트엔드의 '설정' 메뉴에서 '목록 스크랩 설정'과 '상세 스크랩 설정'을 '스크랩 설정'으로 통합하려고 해요. 이와 관련하여 프론트 페이지(/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/settings 의 하위 페이지), 해더 페이지(/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/components/layouts/Header.tsx) 와 필요한 경우 graphql(/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/api/graphql) 및 backend의 소스(/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/server_bid.py 등)을 참고하여 주세요.

- 설정에 대한 목록 페이지: http://14.34.23.70:11501/settings/scrapping
  - 현재 settings/list와 동일
- 상세페이지 http://14.34.23.70:11501/settings/scrapping/[oid]
  - oid에 해당하는 기관에 대한 '목록 스크랩 설정', '상세 스크랩 설정' 섹션
  - 각 설정 섹션의 우측 상단에 '편집' 버튼
  - '편집' 버튼 클릭시 http://14.34.23.70:11501/settings/scrapping/[oid]?mode=edit 등 기능/UIs느 현재와 동일


---

스크랩 설정의 상세페이지에서 목록, 상세 스크랩 설정을 탭 구조로 수정해주세요. 
  그리고 탭 이동시  http://14.34.23.70:11501/settings/scrapping/[oid]/list와 같이 주소도 변경되도록 해주세요.


===
목록 스크랩 설정 페이지(settings/scrapping/[category]/list)의 body 부분의 UI 구조를 아래와 같이 수정해주세요

- 코드: /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/settings/scrapping/[orgName]/list/page.tsx


"""

입찰공고 목록 스크랩 설정		'편집 (아이콘 + 글자 버튼)'

> 기본 설정

URL: https://www.....
페이징: //div[contains(@class, "pagination")]/...
시작 페이지: 1	종료 페이지: 3	iFrame: '없음'	로그인: '없음'
행 XPath: 

> 요소 설정
키	Xpath	타겟	콜백
title	td[4]/a	-	-
...

---

설정 가이드
> 기본 설정
• URL: 게시판 url
  - 페이지가 url에 있는 포함된 경우 'pgno=${i}'와 같이 '${i}'로 표시
  - 예: https://www.gangnam.go.kr/notice/list.do?mid=ID05_0402&pgno=${i}
• 페이징: 페이지를 클릭으로 이동하는 경우, 해당 요소의 XPath
  - 예: //div[contains(@class, "pagination")]/span/a[contains(text(),"${i}")]
• 시작페이지: 1회에 스크랩하는 페이지의 시작 페이지 번호
  - 예: 1
• 시작페이지: 1회에 스크랩하는 페이지의 종료 페이지 번호
  - 예: 3
• 행 XPath: 스크랩하는 게시판에서 1개의 공고 행의 XPath
  - 예: //*[@id="board"]/table/tbody/tr

> 요소 설정
- 스크랩하려는 
• 키: 요소의 이름
  - title: 제목
  - detail_url: 상세페이지 url
  - posted_date: 작성일
  - posted_by: 작성자
• XPath: 목록 행 내에서의 상대 XPath
  - 예: td[4]/a
• 타겟: 요소의 html 속성(text인 경우 빈값)
  - 예: href
• 콜백:  XPath, 타겟으로 얻은 값(rst)을 수정하는 함수
  - 예: "https://www.gp.go.kr/portal/" + rst.split("/")[1]
"""

목록 스크랩 설정(settings/scrapping/[orgName]/list)의 UI는
- 요소 설정, 설정 가이드는 상세 스크랩 설정(settings/scrapping/[orgName]/detail) 페이지를 참고해주세요.
- 기본 설정도 요소 설정(수정후 UI)과 같이 표로 나타내주세요
| URL | https://www.gp.go.kr/portal/selectGosiList.do?key=2148&not_ancmt_se_code=01 |
| 페이징 | //div[contains(@class, "pagination")]/span/a[contains(text(),"${i}")] |
|시작 | 1 | 종료 | 3 | iFrame | 없음 | 로그인 | 없음 |
| 행 XPath | //*[@id="board"]/table/tbody/tr |

---

목록 스크랩 설정(settings/scrapping/[orgName]/list) 페이지에서
- '> 기본 설정' 등에 사용된 '>'는 눈에 띠는 다른 기호로 바꿔주세요.
- '기본 설정', '요소 설정' 등의 내용 부분은 별도의 섹션으로 보이도록 '설정 가이드' 섹션과 같이 박스로 감싸되, 배경색은 분홍색 계통으로 해주세요.
- '기본 설정'에서 'URL', '페이징'과 같은 값들은 요소 설정의 키 'title', 'detail_url', ... 등과 같은 글자, 배경 css를 사용해주세요.
  - '시작 1 종료 3 iFrame 없음 로그인 없음' 는 2줄로 나타내고, '시작', '종료'는 '시작 페이지', '종료 페이지'로 수정해주세요.

---

목록 스크랩 설정(settings/scrapping/[orgName]/list) 페이지에서 '편집' 버튼을 클릭하면,
- 페이지 주소가 settings/scrapping/[orgName]/list?mode=edit로 변경
- '기본 설정', '요소 설정'에 있는 field값들을 입력할 수 있는 상태로 전환
  - 'URL', '페이징', ...'title', 'detail_url' 등은 입력값이 아님
- 우측 상단의 '편집' 버튼 대신, '보기', '저장' 아이콘 버튼
  - '보기': 상세 보기 페이지(settings/scrapping/[orgName]/list?mode=view) mode의 디폴트값은 view
  - '저장': 설정 변경 내용 데이터베이스에 저장, 저장후 상세 보기 페이지로 페이지 전환

---

목록 스크랩 설정(settings/scrapping/[orgName]/list) 페이지에서 '편집' 모드로 진입한 후
> '기본 설정'에서 
  - 'URL', '페이징', '시작 페이지', '종료 페이지' 'iFrame', '로그인' 등에 대한 설정 데이터값이 제대로 반영되지 않음
  - 입력 필드는 모두 입력가능한 input 형식으로 통일
    - 현재 행 XPath 이외에는 모두 입력 가능하지 않음 -> input
    - 행 XPath: textarea -> input
> '요소 설정'에서
  - 입력 필드에 채워진 값은 모두 실제 설정 데이터값으로 함
    - "-"와 같이 view 모드시에 표시하는 값이 아닌, 비어있는 경우 내용을 비움
  - 입력 필드는 모두 입력가능한 input 형식으로 통일

> '보기' 버튼을 누르면
  - 주소가 'settings/scrapping/[orgName]/list' or 'settings/scrapping/[orgName]/list?mode=view' 로 변경
  - 해당 주소의 페이지로 이동

> '저장' 버튼을 누르면
  - 값이 변경된 필드, 필드값을 모달 창으로 알려줌
    - 예: '- URL이 'https://......'로 변경됨 \n - detail_url이 'td[4]/a|-|-"https://www.gp.go.kr/portal/" + rst.split("/")[2]' 로 변경됨'
  - 모달 창에서 '취소', '저장' 버튼
  - '저장' 버튼 클릭시 데이터베이스에 저장
  - 변경된 값이 없는 경우, '변경된 값이 없습니다' 메시지, '닫기' 버튼

  ---

  목록 스크랩 설정(settings/scrapping/[orgName]/list) 페이지에서 '편집' 모드로 진입한 후
- input 필드의 text색, 배경색을 조정해주세요. 현재는 필드 배경색, 글자색이 섹션 박스의 배경과 같아서 보이지 않아요. 배경색은 아주 옅은 분홍색, 글자색은 아주 짙은 분홍색은 어떤가요.
- input 필드에 마우스를 클릭했을 때, 프롬프트 커서가 보이도록 해주세요



목록 스크랩 설정(settings/scrapping/[orgName]/list) 페이지에서 
- 보기 모드(settings/scrapping/[orgName]/list?mode=view, settings/scrapping/[orgName]/list) 인 경우 input이 disabled된 상태고, 편집 모드(settings/scrapping/[orgName]/list?mode=edit)는 input이 활성화된 상태 외에는 똑같은 UI를 사용하도록 해주세요.
- '편집', '보기' 버튼을 누르면 
  - 주소(모드)가 바뀜
  - 우상단 버튼 바뀜
  - input 필드들 disabled 토글
  - 설정 가이드 섹션 hidden 토글(보기 모드에서는 hidden)


  ---

- 변경된 상단 타이틀 부분은 롤백해주세요.
- /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/components/settings/ScrappingSettingsLayout.tsx 을 아래와 같이 아래와 같이 구성해주세요. 

"""
'< 목록으로'	탭('목록 스크랩 설정', '상세 스크랩 설정')
"""

  - '목록으로' 버튼과 탭은 1라인에 넣고, 탭은 우측 정렬
  - 기관명, 활성, 지역 등의 내용은 삭제





- '기본 설정'
  - '기관명' 필드 추가(첫번째 라인)
  - '지역[org_region]', '사용[use]', '담당자[org_man]' 필드 1줄로 추가('행  XPath' 다음 라인) 


- 편집 모드(list?mode=edit)에서 '보기' 버튼을 눌렀을 때 보기 모드로의 페이지 이동이 되지 않아요.
- 페이지 주소 scrapping/[orgName] 를 scrapping/[oid] 로 변경해주세요.
  - orgName 은 '기관명'에서 변경될 수 있어요
  - oid를 기준으로 목록, 상세 스크랩을 설정해야 해요.
- 담당자 필드값은 설정 데이터 org_man입니다
  - org_man이 graphql에 없다면


  - '기본 설정 > 요소 설정' 아래에 '부가 설정' 섹션을 추가
- 지역, 사용, 담당업체, 담당자 필드를 '부가 설정'으로 이동

- '설정 가이드'에 '부가 설정' 추가

"""
[아이콘] 부가 설정
• 지역: 
• 사용: 스크랩 사용 여부(1: 사용, 0: 사용안함)
• 담당업체: '일맥', '링크', '일맥,링크'
• 담당자: 관련 업무 담당자
"""


===

- '테스트' 버튼 추가
  - 버튼 클릭시 현재 설정으로 스크랩 테스트
  - 스크랩 결과를 모달 창으로 보여줌
  - 스크랩 에러시 에러 발생 상황 보여줌
  - 향후 편집 모드에서 '저장' 클릭시, 에러가 있는 경우는 '저장'시 임시 테이블에 저장

===
- is_selected = -1 추가
  - Header: ''제외됨"
  - 유형변경 모달에 추가, 유형 아래 부분에 '업무에서 제외' 체크
  - 공고 목록에서 업무외 영역으로 

- '공고 목록' 상세보기, 편집(제목, 유형)




===

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

- Primary Key는 oid로 변경하였음음
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
- settings_notice_list 관련 엔드포인트 수정정


- frontend: 
  - graphql:
    - /_exp/projects/bid-notice-web/frontend/src/app/api/graphql/resolvers/settingsList.ts
    - /_exp/projects/bid-notice-web/frontend/src/app/api/graphql/schema/settingsList.ts
  - page:
    - /_exp/projects/bid-notice-web/frontend/src/app/settings/scrapping/[orgName]/list/page.tsx
    => /_exp/projects/bid-notice-web/frontend/src/app/settings/scrapping/[oid]/list/page.tsx


----

http://14.34.23.70:11501/settings/scrapping 페이지 접속은 정상적으로 접속 됩니다. 그런데, 특정 설정을 클릭하면 http://14.34.23.70:11501/settings/scr apping/[orgName] 페이지로 이동하고, 404 에러가 발생해요. oid 테스트로 http://14.34.23.70:11501/settings/scr apping/2/list 를 주소창에 입력하면 페이지 이동은 되는데, '기관명', '담당업체', '담당자' 필드가 비어있어요.

