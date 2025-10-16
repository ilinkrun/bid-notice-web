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

    // 파일명 생성 (기존 파일명 유지하되 중복시 번호 추가)
    const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
    let fileName = file.name;
    let counter = 1;
    
    while (existsSync(join(uploadDir, fileName))) {
      fileName = `${originalName}(${counter}).${fileExtension}`;
      counter++;
    }
    
    const filePath = join(uploadDir, fileName);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 파일 URL 반환 (production에서도 동작하도록 API 경로 사용)
    const fileUrl = `/api/uploads/${fileName}`;

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