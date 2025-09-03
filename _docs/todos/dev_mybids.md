## 입찰 관리

### 진행

---
입찰 정보


---

- 진행중 업무
  - 입찰 정보 입력/수정
  - 문서 작성
    - 문서 보기/편집/작성
  - 응찰 정보 입력/수정

- 단계 조정
  - 응찰, 포기

### 응찰

### 완료

낙찰, 응찰, 포기

===

- '입찰 관리' 페이지들은 모두 우상단 아이콘 버튼에서 '편집' 아이콘 버튼만 남겨주세요.

- '진행' 페이지에서 '편집' 버튼을 누르면,
  - '응찰', '낙찰', '패찰', '포기' 체크 박스가 나오는데,
    - '응찰'을 체크를 하면, 체크박스 다음줄에 아래의 내용이 자동으로 생성되고, 입력할 수 있도록 해주세요.
      - 응찰가 [input]
      - 메모 [textarea]
    - '낙찰'을 체크를 하면,
      - [checkbox] 프로젝트 생성
      - PM [input]
      - 메모 [textarea]
    - '패찰'을 체크하면,
      - 메모 [textarea]
    - '포기'를 체크하면,
      - 포기 이유 [input]
      - 메모 [textarea]
  

- '진행' 목록에서 해당 공고를 클릭하면, url이 http://14.34.23.70:11501/bids/progress/[nid] 로 변경되고, 상세페이지가 아래와 같은 섹션들로 이루어지도록 해주세요.


bids/progress/[nid]/page.tsx 를 아래와 같은 구성으로 만들어주세요.

---
[아이콘] 입찰 정보

  [아이콘] 공고 상세정보
  ---
  공고명: '.......'
  공고일: 
  담당자:
  ...
  ---

  [아이콘] 입찰 상세정보
  --
  입찰 개시 시간
  입찰 종료 시간
  입찰 종류
  제출 서류
  ...
  --

---

[아이콘] 입찰 문서

  [아이콘] 공고 문서

  [아이콘] 문서 작성

--

[아이콘] 단계 변경

  - '응찰', '낙찰', '패찰', '포기' 체크 박스

    - '응찰'을 체크를 하면, 체크박스 다음줄에 아래의 내용이 자동으로 생성되고, 입력할 수 있도록 해주세요.
      - 응찰가 [input]
      - 메모 [textarea]
    - '낙찰'을 체크를 하면,
      - [checkbox] 프로젝트 생성
      - PM [input]
      - 메모 [textarea]
    - '패찰'을 체크하면,
      - 메모 [textarea]
    - '포기'를 체크하면,
      - 포기 이유 [input]
      - 메모 [textarea]

공고 정보 / 입찰 상세 페이지 정보 + 스크랩 실패 정보(수동 다운로드!!)



===
아래의 파일들을 분석하고 수정하여, 'http://14.34.23.70:11501/bids/progress/2392' 페이지의 '404' 에러를 해결해주세요.

- frontend page: 
  - /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/bids/progress/[nid]/page.tsx

- graphql:
  - /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/api/graphql/resolvers/myBid.ts
  - /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/api/graphql/schema/myBid.ts

- backend:
  - /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/mysql_notice.py
  - /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/server_bid.py