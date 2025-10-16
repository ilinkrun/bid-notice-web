## channel_dev

title: 글 제목
content: 글 내용
format: text / markdown / html
writer: 글쓴이 이름
password: 숫자 4글자
created_at: 생성 날짜.시간
updated_at: 최종 수정 날짜.시간
view: 보임/감춤

### 예정 기능
- 이미지 첨부
- 댓글
- 메시지 전송(카카오톡, 슬랙, ...)

===

`/Users/moon/JnJ/Developments/Servers/nextjs/ilmac-bid/src/components/layouts/Header.tsx` 해더에 '설정 관리' 우측에 아래와 같은 내용의 '채널' 메뉴를 추가해주세요. icon들은 해당 내용과 관련있는 아이콘을 선택해서 적용해주세요.

'채널'
1. 
title: 공지 및 건의(개발)
description: 개발 관련 공지, 개선.수정 건의 및 요구사항
href: 'channels/dev'
icon: 

2. 
title: 공지 및 건의(운영)
description: 운영(업무) 관련 공지, 기능 반영 및 요구 사항
href: 'channels/op'
icon: 

3.
title: 매뉴얼
description: 사이트 운영 지침 및 사용 설명서
href: 'channels/manual'
icon: 


===

개발 채널 페이지를 게시판 형식으로 만들려고 해요.

title: 글 제목
content: 글 내용
format: text / markdown / html
writer: 글쓴이 이름
password: 숫자 4글자
created_at: 생성 날짜.시간
updated_at: 최종 수정 날짜.시간
view: 보임/감춤

mysql을 위한 CREATE sql문을 만들어 주세요

---

CREATE TABLE channel_dev (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '글 제목',
    content TEXT NOT NULL COMMENT '글 내용',
    format ENUM('text', 'markdown', 'html') NOT NULL DEFAULT 'text' COMMENT '내용 형식',
    writer VARCHAR(50) NOT NULL COMMENT '글쓴이 이름',
    password CHAR(4) NOT NULL COMMENT '숫자 4자리 비밀번호',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 날짜/시간',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 날짜/시간',
    is_visible BOOLEAN NOT NULL DEFAULT TRUE COMMENT '글 노출 여부',
    
    -- 인덱스 추가
    INDEX idx_created_at (created_at),
    INDEX idx_writer (writer),
    INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='개발 채널 게시판';

-- 비밀번호는 숫자만 입력 가능하도록 CHECK 제약조건 추가
ALTER TABLE channel_dev
ADD CONSTRAINT chk_password_numeric 
CHECK (password REGEXP '^[0-9]{4}$');


테이블 구조 설명:
id: 게시글 고유 식별자 (자동 증가)
title: 글 제목 (최대 255자)
content: 글 내용 (TEXT 타입으로 긴 내용 저장 가능)
format: 내용 형식 (text, markdown, html 중 하나)
writer: 글쓴이 이름 (최대 50자)
password: 4자리 숫자 비밀번호
created_at: 생성 일시 (자동 기록)
updated_at: 수정 일시 (수정 시 자동 업데이트)
is_visible: 글 노출 여부 (true/false)
특징:
UTF8MB4 인코딩을 사용하여 이모지 등 모든 유니코드 문자 지원
비밀번호는 숫자 4자리만 허용하는 CHECK 제약조건 추가
자주 조회되는 컬럼에 대한 인덱스 추가
생성/수정 일시는 자동으로 기록
InnoDB 엔진 사용으로 트랜잭션 지원


네, channel_dev 테이블이 생성되었네요. 이제 이 테이블을 사용하여 개발 채널 게시판을 구현할 수 있습니다.
다음 단계로 진행하실 작업이 있다면 말씀해 주세요. 예를 들어:
게시판 목록 페이지 구현
글쓰기 페이지 구현
상세 보기 페이지 구현
수정/삭제 기능 구현
등의 작업을 도와드릴 수 있습니다.

===

SHOW CREATE TABLE channel_dev;

SELECT * FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = '데이터베이스이름' 
AND TABLE_NAME = 'channel_dev';

===

graphql을 위한 스키마, 리졸버를 아래의 파일에 구현하고, index.ts에 등록해주세요. 구현 형식은 `C:\JnJ\Developments\Servers\nextjs\ilmac-bid\src\app\api\graphql\schema\settingsCategory.ts`, `C:\JnJ\Developments\Servers\nextjs\ilmac-bid\src\app\api\graphql\resolvers\settingsCategory.ts`  파일을 숙지하여 참고해주세요

---

`C:\JnJ\Developments\Servers\nextjs\ilmac-bid\src\app\api\graphql\schema\board.ts`
`C:\JnJ\Developments\Servers\nextjs\ilmac-bid\src\app\api\graphql\resolvers\board.ts`



===


http://localhost:3011/api/graphql

  posts(board: $board) {
    id
    created_at
    format
    title
    password
    is_visible
    updated_at
    writer
  }

{
  "data": {
    "posts": [
      {
        "id": 1,
        "created_at": "2025-04-16 11:55:05",
        "format": null,
        "title": "[수정]첫 번째 게시글입니다",
        "password": "1234",
        "is_visible": true,
        "updated_at": "2025-04-16 12:19:22",
        "writer": "테스터"
      }
    ]
  }
}

---

query Query($postId: Int!, $board: String!) {
  post(id: $postId, board: $board) {
    id
    title
    content
    writer
    password
    created_at
    updated_at
    format
    is_visible
  }
}

{
  "data": {
    "post": {
      "id": 1,
      "title": "[수정]첫 번째 게시글입니다",
      "content": "[수정]안녕하세요. 게시판 테스트 중입니다.",
      "writer": "테스터",
      "password": "1234",
      "created_at": "2025-04-16 11:55:05",
      "updated_at": "2025-04-16 12:19:22",
      "format": "text",
      "is_visible": true
    }
  }
}

===

`uploadImage` 뮤테이션에서 `file` 파라미터의 형식은 GraphQL의 `Upload` 스칼라 타입입니다. 이는 GraphQL에서 파일 업로드를 처리하기 위한 특별한 타입입니다.

GraphQL의 `Upload` 타입은 다음과 같은 특징을 가집니다:

1. **형식**: `Upload`는 GraphQL 스키마에서 정의된 스칼라 타입으로, 파일 업로드를 위한 특별한 타입입니다.

2. **사용 방법**: 
   - 클라이언트에서는 `File` 또는 `Blob` 객체를 이 타입으로 전송합니다.
   - 서버에서는 이 타입을 처리하여 실제 파일 데이터에 접근할 수 있습니다.

3. **멀티파트 요청**: 
   - 파일 업로드를 처리할 때는 일반적으로 `multipart/form-data` 형식의 HTTP 요청을 사용합니다.
   - Apollo Client와 같은 GraphQL 클라이언트는 이 형식을 자동으로 처리합니다.

4. **서버 측 처리**:
   - 서버에서는 이 `Upload` 타입을 처리하여 파일 시스템에 저장하거나 다른 저장소에 업로드할 수 있습니다.

현재 코드에서는 `UPLOAD_IMAGE` 뮤테이션에서 `file: Upload!`로 정의되어 있으며, 이는 필수 파라미터로 파일을 받아야 함을 의미합니다. 실제 구현에서는 이 파일을 서버에 업로드하고 URL을 반환하는 로직이 필요합니다.

서버 측에서는 이 `Upload` 타입을 처리하는 리졸버를 구현해야 합니다. 일반적으로 다음과 같은 형태로 구현됩니다:

```typescript
uploadImage: async (_, { board, file }) => {
  // file은 Upload 타입의 객체
  // file.createReadStream()을 통해 파일 데이터에 접근 가능
  // 파일을 저장하고 URL 반환
  return {
    url: "저장된 파일의 URL",
    filename: "원본 파일명"
  };
}
```

이 기능을 완전히 구현하려면 서버 측에서 파일 업로드를 처리하는 로직이 필요합니다.


---

```prompt
혹은 현재 frontend의 nextjs 로 파일 업로드/다운로드 기능을 구현하고, 파일은 public에 저장하는 건 어떤가요? 이미지 파일은 게시글에 이미지를 사용하는 용도가 크니까요.
```

네, Next.js에서 직접 파일 업로드/다운로드 기능을 구현하고 파일을 `public` 디렉토리에 저장하는 방법은 좋은 접근법입니다. 특히 이미지 파일이 게시글에 포함되는 용도라면 더욱 적합합니다.

이 방법의 장점은 다음과 같습니다:

1. **간단한 구현**: GraphQL 스키마를 수정하지 않고도 구현할 수 있습니다.
2. **직접적인 파일 접근**: `public` 디렉토리에 저장된 파일은 URL로 직접 접근 가능합니다.
3. **서버 부하 감소**: 백엔드 서버에 파일 업로드 요청을 보내지 않아도 됩니다.

Next.js에서 이 기능을 구현하는 방법을 살펴보겠습니다:

### 1. API 라우트 생성

먼저 파일 업로드를 처리할 API 라우트를 생성합니다:



```typescript:src/app/api/upload/route.ts
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
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      );
    }
    
    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 5MB를 초과할 수 없습니다.' },
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
이제 클라이언트 측 코드를 수정하여 이 API를 사용하도록 변경하겠습니다:




```typescript jsx:src/app/channels/board/[board]/page.tsx
// ... existing code ...
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length === 0) return;
    
    try {
      setIsLoading(true);
      
      for (const file of files) {
        // FormData 생성
        const formData = new FormData();
        formData.append('file', file);
        
        // API 호출
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        if (result.url) {
          const imageUrl = result.url;
          setUploadedImages([...uploadedImages, imageUrl]);
          
          // 이미지 태그 삽입
          const imageTag = `\n<img src="${imageUrl}" alt="업로드된 이미지" />\n`;
          
          if (isEditMode && contentRef.current) {
            const cursorPos = contentRef.current.selectionStart;
            const textBefore = selectedPost.content.substring(0, cursorPos);
            const textAfter = selectedPost.content.substring(cursorPos);
            
            setSelectedPost({
              ...selectedPost,
              content: textBefore + imageTag + textAfter
            });
          } else if (isCreateDialogOpen && contentRef.current) {
            const cursorPos = contentRef.current.selectionStart;
            const textBefore = newPost.content.substring(0, cursorPos);
            const textAfter = newPost.content.substring(cursorPos);
            
            setNewPost({
              ...newPost,
              content: textBefore + imageTag + textAfter
            });
          }
        }
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
// ... existing code ...
```
이제 사용하지 않는 `UPLOAD_IMAGE` GraphQL 뮤테이션을 제거하겠습니다:




```typescript jsx:src/app/channels/board/[board]/page.tsx
// ... existing code ...
// GraphQL 쿼리
const GET_POSTS = `
  query GetPosts($board: String!) {
    posts(board: $board) {
      id
      title
      writer
      created_at
      updated_at
      is_visible
    }
  }
`;

const GET_POST = `
  query GetPost($id: Int!, $board: String!) {
    post(id: $id, board: $board) {
      id
      title
      content
      format
      writer
      password
      created_at
      updated_at
      is_visible
    }
  }
`;

const CREATE_POST = `
  mutation CreatePost($board: String!, $input: CreatePostInput!) {
    createPost(board: $board, input: $input) {
      id
      title
      content
      format
      writer
      password
      created_at
      updated_at
      is_visible
    }
  }
`;

const UPDATE_POST = `
  mutation UpdatePost($board: String!, $input: UpdatePostInput!) {
    updatePost(board: $board, input: $input) {
      id
      title
      content
      format
      writer
      password
      created_at
      updated_at
      is_visible
    }
  }
`;

const DELETE_POST = `
  mutation DeletePost($board: String!, $input: DeletePostInput!) {
    deletePost(board: $board, input: $input) {
      id
      title
      content
      format
      writer
      password
      created_at
      updated_at
      is_visible
    }
  }
`;

// ... existing code ...
```
이제 이미지 업로드 기능이 Next.js API 라우트를 사용하도록 변경되었습니다. 주요 변경 사항은 다음과 같습니다:

1. **API 라우트 생성**:
   - `/api/upload` 경로에 파일 업로드를 처리하는 API 라우트를 생성했습니다.
   - 파일 확장자 검증, 크기 제한, 안전한 파일명 생성 등의 기능을 포함합니다.
   - 업로드된 파일은 `public/uploads` 디렉토리에 저장됩니다.

2. **클라이언트 코드 수정**:
   - GraphQL 뮤테이션 대신 새로 만든 API 라우트를 사용하도록 변경했습니다.
   - 파일 업로드 후 반환된 URL을 사용하여 이미지 태그를 삽입합니다.
   - 오류 처리를 개선하여 더 자세한 오류 메시지를 표시합니다.

3. **사용하지 않는 코드 제거**:
   - `UPLOAD_IMAGE` GraphQL 뮤테이션을 제거했습니다.

이제 이미지 드래그 앤 드롭 업로드 기능이 다음과 같이 작동합니다:

1. 사용자가 이미지 파일을 텍스트 영역에 드래그 앤 드롭합니다.
2. 파일이 `/api/upload` API로 전송됩니다.
3. API는 파일을 검증하고 `public/uploads` 디렉토리에 저장합니다.
4. 저장된 파일의 URL이 반환됩니다.
5. 반환된 URL을 사용하여 이미지 태그가 게시글 내용에 삽입됩니다.

이 방법의 장점은 다음과 같습니다:

1. **간단한 구현**: GraphQL 스키마를 수정하지 않고도 구현할 수 있습니다.
2. **직접적인 파일 접근**: `public` 디렉토리에 저장된 파일은 URL로 직접 접근 가능합니다.
3. **서버 부하 감소**: 백엔드 서버에 파일 업로드 요청을 보내지 않아도 됩니다.
4. **보안**: 파일 확장자 검증, 크기 제한 등의 보안 기능을 포함합니다.

이제 게시글 작성 및 수정 시 이미지를 드래그 앤 드롭으로 업로드할 수 있습니다.
