'use client';

import React, { useState } from 'react';
import { Edit, Save, X, Plus } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { GET_HELP_DOCUMENT, CREATE_HELP_DOCUMENT, UPDATE_HELP_DOCUMENT } from '@/lib/graphql/docs';
import { useAuth } from '@/contexts/AuthContext';
import { marked } from 'marked';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface GuideSlideProps {
  isOpen: boolean;
  title: string;
  category?: string;
  defaultContent?: React.ReactNode;
  className?: string;
}

// 마크다운을 HTML로 변환하는 함수
const convertMarkdownToHtml = (markdown: string): string => {
  try {
    marked.setOptions({
      breaks: false, // 줄바꿈을 <br>로 변환하지 않음 (줄간격 최적화)
      gfm: true, // GitHub Flavored Markdown 사용
      headerIds: false, // 헤더 ID 생성 안함
      mangle: false, // 이메일 주소 인코딩 안함
    });

    let result = marked(markdown || '');

    if (typeof result === 'string') {
      // 불필요한 빈 줄과 공백 제거
      result = result
        .replace(/\n\s*\n\s*\n/g, '\n\n') // 연속된 빈 줄을 최대 1개로 제한
        .replace(/^\s+|\s+$/g, '') // 앞뒤 공백 제거
        .trim();
    }

    return typeof result === 'string' ? result : markdown || '';
  } catch (error) {
    console.error('Markdown conversion error:', error);
    return markdown || '';
  }
};


// 파일 업로드 헬퍼 함수
const uploadFile = async (
  file: File,
  setIsUploading: (loading: boolean) => void,
  editingMarkdown: string,
  setEditingMarkdown: (value: string) => void
) => {
  setIsUploading(true);
  try {
    console.log('🚀 파일 업로드 시작:', file.name, file.size, file.type);

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
    console.log('✅ 업로드 성공:', result);

    // 이미지 파일인 경우 이미지 마크다운, 그 외는 링크 마크다운
    let fileMarkdown;
    if (file.type.startsWith('image/')) {
      fileMarkdown = `![${result.filename || file.name}](<${result.url}>)`;
    } else {
      fileMarkdown = `[${result.filename || file.name}](<${result.url}>)`;
    }

    const newValue = `${editingMarkdown}\n\n${fileMarkdown}`;
    setEditingMarkdown(newValue);

    console.log(`✅ 파일 업로드 완료: ${result.filename || file.name}`);

  } catch (error) {
    console.error('파일 업로드 오류:', error);
    alert(`파일 업로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  } finally {
    setIsUploading(false);
  }
};

export function GuideSlide({
  isOpen,
  title,
  category = "운영가이드",
  defaultContent,
  className = ""
}: GuideSlideProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // GraphQL 훅들
  const { data, loading, error, refetch } = useQuery(GET_HELP_DOCUMENT, {
    client: getClient(),
    variables: { category, title },
    skip: !isOpen, // 열릴 때만 쿼리 실행
    fetchPolicy: 'cache-and-network'
  });

  const [createDocument] = useMutation(CREATE_HELP_DOCUMENT, { client: getClient() });
  const [updateDocument] = useMutation(UPDATE_HELP_DOCUMENT, { client: getClient() });

  // 데이터베이스에서 가져온 문서가 있는지 확인
  const dbDocument = data?.docsManualSearch?.manuals?.[0];
  const hasDbContent = dbDocument && data?.docsManualSearch?.total_count > 0;

  // 편집 모드 시작
  const handleEdit = () => {
    if (hasDbContent) {
      setEditContent(dbDocument.markdown_source || dbDocument.content || '');
    } else {
      setEditContent('');
    }
    setIsEditing(true);
  };

  // 저장 처리
  const handleSave = async () => {
    try {
      const contentToSave = convertMarkdownToHtml(editContent);
      const writerName = user?.name || user?.email || '시스템';

      const input = {
        title,
        content: contentToSave, // HTML로 변환된 내용
        markdown_source: editContent, // 원본 마크다운
        format: 'markdown',
        category,
        writer: writerName,
        is_visible: true,
        is_notice: false,
        is_private: false
      };

      if (hasDbContent) {
        // 수정
        await updateDocument({
          variables: {
            input: {
              ...input,
              id: dbDocument.id
            }
          }
        });
      } else {
        // 생성
        await createDocument({
          variables: { input }
        });
      }

      setIsEditing(false);
      refetch(); // 데이터 새로고침
      alert('저장이 완료되었습니다.');
    } catch (error) {
      console.error('Help 문서 저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };

  // 편집 취소
  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
  };

  // 콘텐츠 렌더링
  const renderContent = () => {
    if (loading) {
      return <div className="p-4 text-muted-foreground">로딩 중...</div>;
    }

    if (error) {
      console.error('Help 문서 로딩 에러:', error);
    }

    // 데이터베이스에 문서가 있으면 우선 사용, 없으면 defaultContent 사용
    if (hasDbContent) {
      return (
        <div className="space-y-4">
          <div className="guide-content-container">
            <div
              className="guide-content"
              dangerouslySetInnerHTML={{ __html: dbDocument.content }}
            />
          </div>
          <div className="text-xs text-muted-foreground border-t pt-2">
            마지막 수정: {new Date(dbDocument.updated_at).toLocaleString()} | 작성자: {dbDocument.writer}
          </div>
        </div>
      );
    } else if (defaultContent) {
      // props로 전달된 정적 콘텐츠 사용
      return defaultContent;
    } else {
      return (
        <div className="text-muted-foreground">
          도움말 문서가 없습니다. 새로 생성해주세요.
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`mt-2 bg-card border border-border rounded-lg ${className}`}>
      {isEditing ? (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-card-foreground">가이드 편집</h4>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                저장
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-2 bg-muted text-muted-foreground text-sm rounded-md hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4" />
                취소
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                마크다운 문법을 사용하여 작성하세요. 파일을 드래그 앤 드롭하거나 업로드할 수 있습니다.
              </p>
              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  파일을 업로드하는 중...
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      for (const file of files) {
                        await uploadFile(file, setIsUploading, editContent, setEditContent);
                      }
                    }}
                    style={{ display: 'none' }}
                    id="file-upload-guide"
                  />
                  <label
                    htmlFor="file-upload-guide"
                    className="inline-flex items-center px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer transition-colors"
                  >
                    📎 파일 업로드
                  </label>
                  <span className="text-xs text-muted-foreground">또는 파일을 드래그해서 놓으세요</span>
                </div>

                <div
                  onDrop={async (event) => {
                    event.preventDefault();
                    const files = Array.from(event.dataTransfer?.files || []);

                    for (const file of files) {
                      await uploadFile(file, setIsUploading, editContent, setEditContent);
                    }
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragEnter={(event) => event.preventDefault()}
                  onDragLeave={(event) => event.preventDefault()}
                >
                  <MDEditor
                    value={editContent || ''}
                    onChange={(value) => {
                      const newMarkdown = value || '';
                      setEditContent(newMarkdown);
                    }}
                    data-color-mode={undefined}
                    height={300}
                    preview="live"
                    previewOptions={{
                      remarkPlugins: [remarkBreaks, remarkGfm]
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-card-foreground">{title.replace('[가이드]', '')}</h4>
            <div className="flex gap-2">
              {hasDbContent ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
                  title="수정"
                >
                  <Edit className="w-3 h-3" />
                  수정
                </button>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded transition-colors"
                  title="생성"
                >
                  <Plus className="w-3 h-3" />
                  생성
                </button>
              )}
            </div>
          </div>
          <div className="max-w-full">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
}