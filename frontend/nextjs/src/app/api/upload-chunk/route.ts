import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readdir, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Route config for chunked uploads
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('📁 청크 업로드 요청 시작');
    
    const formData = await request.formData();
    const chunk = formData.get('chunk') as File;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const fileName = formData.get('fileName') as string;
    const fileId = formData.get('fileId') as string;

    if (!chunk || !fileName || !fileId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    console.log(`📄 청크 업로드: ${fileName} - ${chunkIndex + 1}/${totalChunks} (${chunk.size}bytes)`);

    // 청크 저장 디렉토리 생성
    const chunksDir = join(process.cwd(), 'public', 'uploads', 'chunks', fileId);
    if (!existsSync(chunksDir)) {
      await mkdir(chunksDir, { recursive: true });
    }

    // 청크 파일 저장
    const chunkPath = join(chunksDir, `${chunkIndex}`);
    const bytes = await chunk.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(chunkPath, buffer);

    console.log(`✅ 청크 저장 완료: ${chunkIndex}`);

    // 모든 청크가 업로드되었는지 확인
    const uploadedChunks = await readdir(chunksDir);
    if (uploadedChunks.length === totalChunks) {
      console.log('🔗 모든 청크 업로드 완료, 파일 합치기 시작');
      
      // 파일 합치기
      const finalDir = join(process.cwd(), 'public', 'uploads');
      if (!existsSync(finalDir)) {
        await mkdir(finalDir, { recursive: true });
      }

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileExtension = fileName.split('.').pop();
      const finalFileName = `${timestamp}-${randomString}.${fileExtension}`;
      const finalPath = join(finalDir, finalFileName);

      // 청크들을 순서대로 합치기
      const chunks: Buffer[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = join(chunksDir, `${i}`);
        const chunkBuffer = await readFile(chunkPath);
        chunks.push(chunkBuffer);
      }
      
      const finalBuffer = Buffer.concat(chunks);
      await writeFile(finalPath, finalBuffer);

      // 청크 파일들 삭제
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = join(chunksDir, `${i}`);
        await unlink(chunkPath);
      }
      
      // 청크 디렉토리 삭제 (빈 디렉토리)
      try {
        const fs = await import('fs');
        fs.rmSync(chunksDir, { recursive: true });
      } catch (e) {
        // 무시
      }

      console.log(`🎉 파일 업로드 완료: ${finalFileName}`);

      return NextResponse.json({
        url: `/uploads/${finalFileName}`,
        filename: fileName,
        size: finalBuffer.length,
        completed: true
      });
    }

    return NextResponse.json({
      message: `청크 ${chunkIndex + 1}/${totalChunks} 업로드 완료`,
      completed: false
    });

  } catch (error) {
    console.error('청크 업로드 오류:', error);
    return NextResponse.json(
      { error: '청크 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}