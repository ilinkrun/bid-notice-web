- graphql 코드 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/nodejs/graphql/src/resolvers, /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/nodejs/graphql/src/schema 에서 파일이름과 query, mutation 이름들을 체계적으로 변경하고 싶어요. 어떤 방식이 좋을까요? 다음 방식 중 무엇이 좋은지 선택하고, 이유를 말해주세요. 그리고 추천할 만한 다른 방식이 있으면 알려주세요. 코드를 수정하지는 마세요.

- database 기준
  - 테이블 이름 => 파일 이름 => query
  - notice_list => noticeList => noticeListAll, noticeListByCategory, ...
  - settings_notice_list => settingsNoticeList => settingsNoticeListUpsert, ...
- backend 기준
  - backend api 서버 => 파일이름 => query
  - server_bid => bid => bidNoticeListAll, bidNoticeByCategory, ...
- frontend 기준
  - app 서브 디렉토리 => 파일 이름 => query
  - notices => notices => noticesAll, noticesAll, noticesByCategory

---

현재 GraphQL 구조를 분석해보니
다음과 같은 명명 패턴을
확인했습니다:

현재 명명 패턴 분석

파일명 패턴

- notice.ts → notices,
  noticesByCategory
- myBid.ts → myBids, bidByStatus
- settingsList.ts → settings 관련
  queries

Query 명명 패턴

- 복수형 사용: notices, myBids
- camelCase 사용
- 기능별 구분: noticesByCategory,
  bidByStatus

세 가지 접근 방식 평가

1. Database 기준 (추천 ⭐)

notice_list → noticeList →
noticeListAll, noticeListByCategory
settings_notice_list →
settingsNoticeList →
settingsNoticeListUpsert

장점:

- 데이터 구조와 직접적 연관성
- 백엔드 개발자가 이해하기 쉬움
- 데이터베이스 스키마 변경 시 추적
  용이

단점:

- Frontend에서 의미가 명확하지 않을 수 있음
- 테이블명이 변경되면 모든 레이어 수정 필요

2. Backend 기준

server_bid → bid →
bidNoticeListAll,
bidNoticeByCategory

장점:

- API 서버 구조와 일치
- 서버 개발팀의 이해도 높음

단점:

- Frontend 관점에서 추상적
- 서버 구조 변경 시 영향 범위 큼

3. Frontend 기준

notices → notices → noticesAll,
noticesByCategory

장점:

- 사용자/개발자 친화적 명명
- 비즈니스 도메인 중심
- Frontend 개발자가 이해하기 쉬움

단점:

- Backend 구조와 괴리감
- 도메인 복잡성 증가 시 혼란 가능

최종 추천: 하이브리드 접근법 🎯

● 도메인 중심 + 기능 구분 방식을 제안합니다:

구조:

도메인 영역 → 파일명 → 기능별 Query/Mutation

예시:

// 입찰 공고 관련
notices.ts → noticesAll,
noticesByCategory, noticesSearch
bids.ts → myBidsAll, bidsByStatus,
bidCreate, bidUpdate

// 설정 관련
settings.ts → settingsGet,
settingsUpdate
settingsCategories.ts →
settingsCategoriesAll,
settingsCategoryCreate

// 로깅 관련
logs.ts → logsScrapingAll,
logsErrorAll

명명 규칙:

1. 파일명: 비즈니스 도메인 기준(복수형)
2. Query/Mutation: 도메인명 + 동작 패턴
3. 일관성: 모든 조회는 All, 필터링은 By\_\_, 생성은 Create, 수정은 Update

장점:

- 직관적: Frontend 개발자가 이해하기 쉬움
- 확장 가능: 새로운 기능 추가 시 예측 가능한 명명
- 유지보수 용이: 도메인별로 관련 기능들이 그룹핑
- GraphQL 철학 부합: API의 사용자(Frontend) 관점에서 설계

● 이 방식이 Frontend 기준과 유사하지만, 더 체계적이고 확장 가능한 접근법입니다. GraphQL의 본질적 목적인 "API 소비자의 편의성"에 가장 부합하며, 현재 코드베이스의 패턴과도 자연스럽게 연결됩니다.

===

- 현재 nextjs 페이지(/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/nextjs/src/app/notices/page.tsx 등)들에는
- nextjs 자체 api(/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/nextjs/src/app/api)가 연결되어 있어요.
- nextjs 페이지들의 데이터로딩을 nextjs api 대신 backend nodejs api(/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/nodejs/graphql)로 대체하도록 해주세요.
- 우선 frontend 페이지들은 수정하지 않고, api 연결과 관련된 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/nextjs/src/lib 의 코드를 변경시켜 가능하다면 그렇게 해주세요.

===

- graphql 코드(/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/nodejs/graphql/src/resolvers, /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/nodejs/graphql/src/schema) 에서 파일이름과 query, mutation 이름들을 아래와 같은 방식으로 수정하려고 해요.
- 이와 같이 파일을 통합하고, 파일 이름, 쿼리, 뮤테이션 등을 변경해주세요. 그리고 이러한 변경 사항이 frontend(/exposed/projects/bid-notice-web/frontend/nextjs/src) 에도 잘 반영되도록 해주세요.

"""
● 도메인 중심 + 기능 구분 방식

구조:

도메인 영역 → 파일명 → 기능별 Query/Mutation

예시:

// 입찰 공고 관련
notices.ts → noticesAll,
noticesByCategory, noticesSearch
bids.ts → myBidsAll, bidsByStatus,
bidCreate, bidUpdate

// 설정 관련
settings.ts → settingsGet,
settingsUpdate
settingsCategories.ts →
settingsCategoriesAll,
settingsCategoryCreate

// 로깅 관련
logs.ts → logsScrapingAll,
logsErrorAll

명명 규칙:

1. 파일명: 비즈니스 도메인 기준(복수형)
2. Query/Mutation: 도메인명 + 동작 패턴
3. 일관성: 모든 조회는 All, 상세데이터(1개 row)는 One, 필터링은 By\_\_, 생성은 Create, 수정은 Update, 자동 생성/수정(insert + upsert)는 Upsert, 삭제는 Delete

"""

- 게시판 글쓰기 페이지에 접근하면, 아래와 같은 에러가 뜹니다.

Request URL
http://1.231.118.217:11501/channels/board/dev/new?format=markdown
Request Method
GET
Status Code
500 Internal Server Error
Remote Address
1.231.118.217:11501
Referrer Policy
strict-origin-when-cross-origin

---

- upload 관련된 에러가 있으면
- 수정전 upload 코드 입니다. 참고해주세요.

> frontend/nextjs/src/app/api/upload/route.ts

```
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 확장자 확인
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension) {
      return NextResponse.json(
        { error: '파일 확장자가 없습니다.' },
        { status: 400 }
      );
    }

    // 보안상 위험한 파일 타입은 제외
    const blockedExtensions = ['exe', 'bat', 'cmd', 'com', 'scr', 'vbs', 'js', 'jar'];

    if (blockedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: '보안상 위험한 파일 형식입니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 확인 (20MB 제한)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 20MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 저장 경로 설정
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    // 디렉토리가 없으면 생성
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 파일 URL 반환
    const fileUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      url: fileUrl,
      filename: file.name
    });

  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}
```

===

- graphql 서버는 정상작동 중인데,

> url: http://1.231.118.217:11401/graphql

```
> request
query Posts($board: String!) {
  posts(board: $board) {

    id
    title
    created_at

  }
}

{
  "board": "board_dev"
}

> response
> {
> "data": {

    "posts": []

}
}
```

===
graphql은 정상 반환하는데, 페이지에서 에러는 그대로입니다
https://bid.ilmaceng.com/channels/board/dev (board_dev)

network payload를 확인해보면

{"query":"\n query GetPosts($board: String!) {\n posts(board: $board) {\n id\n title\n writer\n created_at\n updated_at\n is_visible\n }\n }\n","variables":{"board":"board_dev"}}

---

아직도 그대로입니다.

network header를 확인해보면

Request URL
http://1.231.118.217:11401/graphql
Referrer Policy
strict-origin-when-cross-origin

---

문제를 발견했습니다! Mixed Content 이슈입니다.

https://bid.ilmaceng.com (HTTPS)에서
http://1.231.118.217:11401/graphql (HTTP)로 요청하고
있어서 브라우저가 차단하고 있습니다.

해결 방법은 두 가지입니다:

해결 방법 1: HTTPS 사용 (권장)

백엔드 GraphQL 서버가 HTTPS를 지원한다면:

● Update(/volume1/docker/platforms/ilmac-ubuntu-dev/projects/b
id-notice-web/frontend/nextjs/.env.local)
⎿ Updated ../../.env.local with 1 addition and 1  
 removal
5  
 6 ## API
7 ### BACKEND GRAPHQL
8 - NEXT_PUBLIC_BACKEND_GRAPHQL_URL=http - ://1.231.118.217:11401/graphql
8 + NEXT_PUBLIC_BACKEND_GRAPHQL_URL=https + ://1.231.118.217:11401/graphql
9  
 10 ## BACKEND
11 NEXT_PUBLIC_BACKEND_IP=localhost

● 해결 방법 2: 도메인 사용

만약 백엔드 서버에 도메인이 있다면 (예:
https://api.ilmaceng.com:11401/graphql):

NEXT_PUBLIC_BACKEND_GRAPHQL_URL=https://api.ilmaceng.com
:11401/graphql

해결 방법 3: 프록시 설정 (임시)

Next.js에서 프록시를 통해 요청하는 방법도 있습니다.

---

우선 HTTPS로 시도해보세요. 만약 백엔드 GraphQL 서버가
HTTPS를 지원하지 않는다면, 백엔드 서버에 SSL 인증서를
설정하거나 프록시를 통해 해결해야 합니다.

브라우저 콘솔에서 Mixed Content 관련 에러가 표시되는지
확인해보세요. 이것이 문제의 원인일 가능성이 높습니다.

🔒 Mixed Content 정책: HTTPS 사이트에서는 HTTP 리소스를
로드할 수 없습니다.

---

프론트엔드를 http://1.231.118.217:11501/로 접근하는 것도 방법이 되나요?


===

```
cd /exposed/projects/bid-notice-web/backend/nodejs/graphql && nohup npm run dev

```

http://1.231.118.217:11501/channels/board/dev 페이지는 정상적으로 목록이 나오는데

http://1.231.118.217:11501/channels/board/dev/5 는 빈페이지가 나옵니다.


글 수정 페이지에서 글 편집 내용이 markdown으로 나오지 않고 html으로 나와요.
디비 테이블에서 markdown 내용은 markdown_source
http://1.231.118.217:11501/channels/board/dev/5?mode=edit&format=markdown

---
http://1.231.118.217:11501/channels/board/dev 페이지는 정상적으로 목록이 나오는데,
글 쓰기 페이지는 빈페이지로 나와요.
http://1.231.118.217:11501/channels/board/dev/new?format=markdown

---

글쓰기 페이지가 나오는데, 글을 쓴 후 저장하면 markdown 내용이 저장되지 않아요. markdown_source 가 null이네요.

backend /exposed/projects/bid-notice-web/backend/python/src/server/server_board.py 의 

update_post 함수를 활용해서, create_post 함수에 markdown_source 관련부분을 반영해주세요


===

settings 관련해서는 파일은 settings.ts 1개로 통합하더라도 쿼리, 뮤테이션 등에서는 settingsNoticeList, settingsNoticeDetail, settingsNoticeCategory , settingsNasPath, settingsAppDefault 등 세팅 영역을 명시해주세요. 


===

- backend python server는 /exposed/projects/bid-notice-web/backend/python/src/server 디렉토리의 파일들을 참고해주세요. 그리고 python api의 접근 포트는 아래와 같아요.

- 11301: server_spider
- 11301: server_mysql
- 11303: server_bid
- 11307: server_board

---
- http://1.231.118.217:11401/graphql 에는 아래와 같이 에러가 없는데, http://1.231.118.217:11501/channels/board/dev 페이지에서는 게시글 목록을 불러오는데 실패했습니다. 에러가 발생해요. 에러를 제거하고, 'board/dev' 로 되어 있는 페이지를 'board/board_dev'로 게시판 전체 이름으로 접근하도록 수정해주세요.

query BoardsPostsAll($board: String!) {
  boardsPostsAll(board: $board) {
    id
    title
  }
}

{
  "board": "board_dev"
}

> response

{
  "data": {
    "boardsPostsAll": [
      {
        "id": 14,
        "title": "test"
      },
      {
        "id": 13,
        "title": "GraphQL Test Fixed"
      },
  ...
}
