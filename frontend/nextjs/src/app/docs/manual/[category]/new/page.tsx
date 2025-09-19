'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { DOCS_MANUAL_CREATE } from '../../graphql/mutations';
import { MAPPINGS_LANG_BY_AREA } from '../../graphql/queries';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

interface LangMapping {
  id: number;
  area: string;
  ko: string;
  en: string;
  remark?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function NewManualContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const category = params.category as string;
  const format = searchParams.get('format') || 'markdown';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [markdownSource, setMarkdownSource] = useState('');
  const [writer, setWriter] = useState('');
  const [email, setEmail] = useState('');
  const [isNotice, setIsNotice] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [langMappings, setLangMappings] = useState<LangMapping[]>([]);

  // 언어 매핑 데이터 조회
  useEffect(() => {
    const fetchLangMappings = async () => {
      try {
        const graphqlUrl = process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql';
        const response = await fetch(graphqlUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: MAPPINGS_LANG_BY_AREA,
            variables: {
              area: 'docs'
            },
          }),
        });

        const result = await response.json();
        if (result.data?.mappingsLangByArea) {
          setLangMappings(result.data.mappingsLangByArea);
        }
      } catch (err) {
        console.error('언어 매핑 조회 오류:', err);
        // 매핑 데이터를 가져올 수 없는 경우 기본값 사용
        setLangMappings([
          { id: 1, area: 'docs', ko: '운영가이드', en: 'op_guide', isActive: true, createdAt: '', updatedAt: '' },
          { id: 2, area: 'docs', ko: '시스템가이드', en: 'system_guide', isActive: true, createdAt: '', updatedAt: '' }
        ]);
      }
    };

    fetchLangMappings();
  }, []);

  const getCurrentCategoryKo = () => {
    const mapping = langMappings.find(m => m.en === category);
    return mapping ? mapping.ko : category;
  };

  const handleContentChange = (value?: string) => {
    const newContent = value || '';
    setContent(newContent);
    if (format === 'markdown') {
      setMarkdownSource(newContent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !writer.trim()) {
      alert('제목, 내용, 작성자는 필수입니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const graphqlUrl = process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:11401/graphql';
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: DOCS_MANUAL_CREATE,
          variables: {
            input: {
              title: title.trim(),
              content: content.trim(),
              markdown_source: format === 'markdown' ? markdownSource : null,
              format,
              category: getCurrentCategoryKo(),
              writer: writer.trim(),
              email: email.trim() || null,
              is_notice: isNotice,
              is_private: isPrivate,
            },
          },
        }),
      });

      const result = await response.json();

      if (result.errors) {
        console.error('매뉴얼 생성 오류:', result.errors);
        throw new Error(result.errors[0].message);
      }

      if (!result.data?.docsManualCreate) {
        throw new Error('매뉴얼 생성에 실패했습니다.');
      }

      alert('매뉴얼이 성공적으로 생성되었습니다.');
      router.push(`/docs/manual/${category}`);
    } catch (error) {
      console.error('매뉴얼 생성 오류:', error);
      alert('매뉴얼 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title || content || writer || email) {
      if (confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        router.push(`/docs/manual/${category}`);
      }
    } else {
      router.push(`/docs/manual/${category}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {getCurrentCategoryKo()} 매뉴얼 작성
            </h1>
            <div className="text-sm text-gray-500">
              형식: {format}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="writer" className="block text-sm font-medium text-gray-700 mb-2">
                  작성자 *
                </label>
                <input
                  type="text"
                  id="writer"
                  value={writer}
                  onChange={(e) => setWriter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="작성자명을 입력하세요"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="이메일을 입력하세요 (선택사항)"
                />
              </div>
            </div>

            {/* 제목 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="매뉴얼 제목을 입력하세요"
                required
              />
            </div>

            {/* 옵션 */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isNotice}
                  onChange={(e) => setIsNotice(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">공지사항</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">비공개</span>
              </label>
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 *
              </label>
              {format === 'markdown' ? (
                <div data-color-mode="light">
                  <MDEditor
                    value={content}
                    onChange={handleContentChange}
                    preview="edit"
                    hideToolbar={false}
                    height={400}
                  />
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={15}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="매뉴얼 내용을 입력하세요"
                  required
                />
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NewManualPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewManualContent />
    </Suspense>
  );
}