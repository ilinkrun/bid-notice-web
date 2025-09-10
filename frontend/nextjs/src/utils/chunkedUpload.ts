// 청크 업로드 유틸리티
export interface ChunkUploadOptions {
  file: File;
  chunkSize?: number; // 기본 512KB
  onProgress?: (progress: number) => void;
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void;
}

export interface ChunkUploadResult {
  url: string;
  filename: string;
  size: number;
}

export async function uploadFileInChunks(options: ChunkUploadOptions): Promise<ChunkUploadResult> {
  const { file, chunkSize = 512 * 1024, onProgress, onChunkComplete } = options; // 기본 512KB 청크
  
  const totalChunks = Math.ceil(file.size / chunkSize);
  const fileId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  
  console.log(`🚀 청크 업로드 시작: ${file.name} (${totalChunks} 청크)`);
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('fileName', file.name);
    formData.append('fileId', fileId);
    
    const response = await fetch('/api/upload-chunk', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`청크 ${chunkIndex + 1} 업로드 실패: ${errorData}`);
    }
    
    const result = await response.json();
    
    // 진행률 업데이트
    if (onProgress) {
      const progress = ((chunkIndex + 1) / totalChunks) * 100;
      onProgress(progress);
    }
    
    // 청크 완료 콜백
    if (onChunkComplete) {
      onChunkComplete(chunkIndex, totalChunks);
    }
    
    console.log(`✅ 청크 ${chunkIndex + 1}/${totalChunks} 완료`);
    
    // 마지막 청크이고 업로드 완료된 경우
    if (result.completed) {
      console.log('🎉 전체 파일 업로드 완료!');
      return {
        url: result.url,
        filename: result.filename,
        size: result.size
      };
    }
  }
  
  throw new Error('파일 업로드가 완료되지 않았습니다.');
}

// 일반 업로드와 청크 업로드를 자동으로 선택하는 함수
export async function smartUpload(
  file: File, 
  options: {
    onProgress?: (progress: number) => void;
    maxSingleUploadSize?: number; // 기본 1MB
  } = {}
): Promise<ChunkUploadResult> {
  const { onProgress, maxSingleUploadSize = 500 * 1024 } = options; // 500KB로 더 작게
  
  if (file.size <= maxSingleUploadSize) {
    // 작은 파일은 일반 업로드
    console.log('📦 일반 업로드 사용');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`업로드 실패: ${errorText}`);
    }
    
    const result = await response.json();
    if (onProgress) onProgress(100);
    
    return {
      url: result.url,
      filename: result.filename || file.name,
      size: file.size
    };
  } else {
    // 큰 파일은 청크 업로드
    console.log('🧩 청크 업로드 사용');
    return uploadFileInChunks({
      file,
      onProgress,
      chunkSize: 512 * 1024, // 512KB 청크
    });
  }
}