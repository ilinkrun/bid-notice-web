===
## settings/scrapping/[oid]/detail

파일 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/_docs/todos/dev_settings_scraping.md 내용을 참고하여,

http://14.34.23.70:11501/settings/scrapping/[oid]/detail 관련 코드들을 수정해주세요

- /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/settings/scrapping/[oid]/list/page.tsx 에 '요소 설정' 부분이 없어졌어요. /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/settings/scrapping/[orgName].backup/list/page.tsx 를 참고하여 복원해주세요.

===

- http://14.34.23.70:11501/settings/scrapping/[orgName]/detail 으로 이동하고 아래의 오류 메시지가 뜹니다.

"""
오류 발생
데이터를 불러오는 중 오류가 발생했습니다.

Variable "$oid" of non-null type "Int!" must not be null.
"""

- http://14.34.23.70:11501/settings/scrapping/5/detail 로 접근하였더니,

- 페이지의 UI가 수정되지 않았어요.
- 페이지 UI 구성은 아래와 같이 settings/scrapping/[oid]/list와 유사하게 해주세요.

"""
입찰공고 상세 스크랩 설정 [help]  [편집]

📋 기본 설정

'기관명' 필드


🔧 요소 설정
키      Xpath   타겟  콜백
제목[title]
본문[body_html]
파일이름
파일주소
미리보기
공고구분
공고번호
담당부서
담당자
연락처
샘플 url


"""

- 설정 가이드는 [help] 버튼을 누르면 모달로 나타나도록 해주세요.

- database 테이블은 아래를 참고해주세요.

"""
CREATE TABLE `settings_notice_detail` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='설정(공고 상세정보 스크랩)'
"""

===

백엔드는 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/mysql_settings.py, /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/server_bid.py 를 분석하고, settings_notice_list의 constant, function들을 참고하여 수정해주세요


===

- 목록 스크랩 페이지 settings/scrapping/[oid]/list 에서 필드 라벨들에 있는 테두리(border)를 제거하고, 글자색상도 타이틀색('기본 설정', '요소 설정' 등과 같은 색)으로 변경해주세요.
- 상세 스크랩 페이지 settings/scrapping/[oid]/detail 에서
  - 타겟, 콜백 필드의 UI(CSS)를 목록 스크랩 페이지의 '요소 설정'과 동일하게 해주세요.
  - 필드 라벨의 UI(css)에 대한 변경을 위의 목록 스크랩 페이지 변경과 동일하게 적용해주세요
- 상단에 있는 Navigation Bar('< 목록으로    탭') 아래의 여백을 제거해주세요.


              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">설정 가이드</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>키:</strong> 데이터를 식별하는 고유 이름 (예: title, content, file_url)</li>
                  <li>• <strong>XPath:</strong> HTML에서 해당 데이터를 추출할 경로</li>
                  <li>• <strong>타겟:</strong> 추출할 속성 (text, href, src 등)</li>
                  <li>• <strong>콜백:</strong> 추출 후 적용할 변환 함수</li>
                </ul>
              </div>