'use client';

import React, { useState } from 'react';

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setResult('업로드 시작...');
    setProgress(0);
    
    try {
      console.log('업로드 시작:', {
        name: file.name,
        size: file.size,
        type: file.type,
        sizeMB: Math.round(file.size / 1024 / 1024 * 100) / 100
      });

      const formData = new FormData();
      formData.append('file', file);

      setProgress(50);
      setResult('업로드 중... 50%');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`업로드 실패: ${errorText}`);
      }

      const uploadResult = await response.json();

      setResult(`업로드 성공: ${uploadResult.url} (${uploadResult.filename || file.name})`);
      setProgress(100);
      
    } catch (error) {
      console.error('Upload error:', error);
      setResult(`업로드 에러: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">파일 업로드 테스트</h1>
      
      <div className="space-y-4">
        <div>
          <input
            type="file"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        {file && (
          <div className="text-sm text-gray-600">
            선택된 파일: {file.name} ({Math.round(file.size / 1024 / 1024 * 100) / 100}MB)
          </div>
        )}
        
        {loading && progress > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>업로드 진행률</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {loading ? '업로드 중...' : '업로드'}
        </button>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre>{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}