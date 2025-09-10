import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Route config for large file uploads
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Next.js 15에서 body size 제한 늘리기
export const bodyParser = {
  sizeLimit: '100mb',
};

// Alternative configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    console.log('📁 파일 업로드 요청 시작');
    console.log('📏 Request Content-Length:', request.headers.get('content-length'));
    
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    console.log('📏 Content Length (bytes):', contentLength);
    console.log('📏 Content Length (MB):', Math.round(contentLength / 1024 / 1024 * 100) / 100);
    
    // Check if content length exceeds our limit (100MB)
    const maxSizeBytes = 100 * 1024 * 1024; // 100MB
    if (contentLength > maxSizeBytes) {
      return NextResponse.json(
        { error: `파일 크기가 너무 큽니다. 최대 100MB까지 허용됩니다. (현재: ${Math.round(contentLength / 1024 / 1024)}MB)` },
        { status: 413 }
      );
    }
    
    // Parse formData with timeout protection
    let formData: FormData;
    let file: File;
    
    try {
      // Use request.formData() with proper error handling
      formData = await Promise.race([
        request.formData(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('FormData parsing timeout')), 30000)
        )
      ]);
      file = formData.get('file') as File;
    } catch (parseError) {
      console.error('❌ FormData 파싱 에러:', parseError);
      return NextResponse.json(
        { error: '파일 파싱에 실패했습니다. 파일 크기가 너무 클 수 있습니다.' },
        { status: 413 }
      );
    }
    
    console.log('📄 업로드된 파일:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    });

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

    // 파일 크기 확인 (50MB 제한)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 50MB를 초과할 수 없습니다.' },
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