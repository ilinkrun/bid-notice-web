'use client';

import React, { useState } from 'react';
import { Edit, Save, X, Plus } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { GET_HELP_DOCUMENT, CREATE_HELP_DOCUMENT, UPDATE_HELP_DOCUMENT } from '@/lib/graphql/docs';

interface GuideSlideProps {
  isOpen: boolean;
  title: string;
  category?: string;
  defaultContent?: React.ReactNode;
  className?: string;
}

export function GuideSlide({
  isOpen,
  title,
  category = "운영가이드",
  defaultContent,
  className = ""
}: GuideSlideProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [writer, setWriter] = useState('시스템');

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
      setWriter(dbDocument.writer || '시스템');
    } else {
      setEditContent('');
      setWriter('시스템');
    }
    setIsEditing(true);
  };

  // 저장 처리
  const handleSave = async () => {
    try {
      const input = {
        title,
        content: editContent,
        markdown_source: editContent,
        format: 'markdown',
        category,
        writer,
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
      return <div className="p-4 text-gray-500">로딩 중...</div>;
    }

    if (error) {
      console.error('Help 문서 로딩 에러:', error);
    }

    // 데이터베이스에 문서가 있으면 우선 사용, 없으면 defaultContent 사용
    if (hasDbContent) {
      return (
        <div className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: dbDocument.content }} />
          </div>
          <div className="text-xs text-gray-500 border-t pt-2">
            마지막 수정: {new Date(dbDocument.updated_at).toLocaleString()} | 작성자: {dbDocument.writer}
          </div>
        </div>
      );
    } else if (defaultContent) {
      // props로 전달된 정적 콘텐츠 사용
      return defaultContent;
    } else {
      return (
        <div className="text-gray-500">
          도움말 문서가 없습니다. 새로 생성해주세요.
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`mt-2 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
      {isEditing ? (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">가이드 편집</h4>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                <Save className="w-3 h-3" />
                저장
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                <X className="w-3 h-3" />
                취소
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                작성자
              </label>
              <input
                type="text"
                value={writer}
                onChange={(e) => setWriter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="작성자 이름"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                내용 (Markdown)
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-40 px-3 py-2 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Markdown 형식으로 도움말을 작성하세요..."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800">{title.replace('[가이드]', '')}</h4>
            <div className="flex gap-2">
              {hasDbContent ? (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded"
                  title="수정"
                >
                  <Edit className="w-3 h-3" />
                  수정
                </button>
              ) : (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded"
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