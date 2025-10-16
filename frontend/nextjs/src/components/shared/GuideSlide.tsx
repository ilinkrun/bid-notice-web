'use client';

import React, { useState } from 'react';
import { Edit, Save, X, Plus } from 'lucide-react';
import { useQuery, useMutation } from '@apollo/client';
import { getClient } from '@/lib/api/graphqlClient';
import { GET_HELP_DOCUMENT, GET_HELP_DOCUMENT_BY_SCOPE, CREATE_HELP_DOCUMENT, UPDATE_HELP_DOCUMENT } from '@/lib/graphql/docs';
import { CONVERT_KO_TO_EN } from '@/lib/graphql/mappings';
import { useAuth } from '@/contexts/AuthContext';
import { marked } from 'marked';
import MDEditor from '@uiw/react-md-editor';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface GuideSlideProps {
  isOpen: boolean;
  title: string;
  category?: string;
  scope?: 'application' | 'domain' | 'page' | 'section' | 'component';
  scopeHierarchy?: string;
  defaultContent?: React.ReactNode;
  helpContent?: string; // 레거시 지원을 위한 prop
}

// 마크다운을 HTML로 변환하는 함수
const convertMarkdownToHtml = (markdown: string): string => {
  try {
    marked.setOptions({
      breaks: true, // 줄바꿈을 <br>로 변환하여 편집창 줄바꿈이 HTML에 반영되도록 함
      gfm: true, // GitHub Flavored Markdown 사용
      headerIds: false, // 헤더 ID 생성 안함
      mangle: false, // 이메일 주소 인코딩 안함
    });

    let result = marked(markdown || '');

    if (typeof result === 'string') {
      // 앞뒤 공백만 제거 (줄바꿈은 유지)
      result = result.trim();
    }


    return typeof result === 'string' ? result : markdown || '';
  } catch (error) {
    console.error('Markdown conversion error:', error);
    return markdown || '';
  }
};

// 저장 전 마크다운 후처리 함수 - 줄바꿈을 강제로 <br>로 변환
const postProcessMarkdown = (markdown: string): string => {
  if (!markdown) return '';


  try {
    // 매우 간단한 접근: 모든 단일 줄바꿈을 <br>로 변환
    let processedText = markdown
      // 단일 줄바꿈을 <br>로 변환 (클래스 없이)
      .replace(/\n/g, '<br>\n')
      // 시작과 끝의 불필요한 <br> 제거
      .replace(/^<br>\n/, '')
      .replace(/<br>\n$/, '');


    return processedText;
  } catch (error) {
    console.error('Markdown post-processing error:', error);
    return markdown;
  }
};

// 빈 줄 간격 조정 함수
const adjustEmptyLineSpacing = (container: HTMLElement) => {
  try {
    // 모든 br 태그 찾기
    const brTags = container.querySelectorAll('br');

    brTags.forEach((br, index) => {
      // 이전 br 태그와의 거리 확인
      const prevBr = brTags[index - 1];
      if (prevBr) {
        const distance = br.offsetTop - prevBr.offsetTop;
        // 거리가 매우 가까우면 빈 줄로 간주
        if (distance < 30) { // 30px 이하면 빈 줄로 간주
          br.style.height = '0.05em';
          br.style.lineHeight = '0.05';
          br.style.margin = '0';
          br.style.fontSize = '0.5em';
        }
      }

      // 다음 요소까지의 텍스트 내용 확인
      let nextElement = br.nextSibling;
      let hasContent = false;

      while (nextElement && nextElement !== brTags[index + 1]) {
        if (nextElement.nodeType === Node.TEXT_NODE && nextElement.textContent?.trim()) {
          hasContent = true;
          break;
        }
        if (nextElement.nodeType === Node.ELEMENT_NODE && (nextElement as Element).textContent?.trim()) {
          hasContent = true;
          break;
        }
        nextElement = nextElement.nextSibling;
      }

      // 내용이 없는 줄이면 간격 줄이기
      if (!hasContent) {
        br.style.height = '0.03em';
        br.style.lineHeight = '0.03';
        br.style.margin = '0';
        br.style.fontSize = '0.3em';
        br.style.display = 'block';
      }
    });

  } catch (error) {
    console.error('Error adjusting empty line spacing:', error);
  }
};

// URL 기반 scope_hierarchy 생성 함수 (정적 fallback용)
const generateScopeHierarchyFallback = (pathname: string, sectionTitle: string): string => {
  // URL을 경로별로 분해
  const pathParts = pathname.split('/').filter(part => part !== '');

  // 기본 구조: application.domain.page[.section]
  let hierarchy = 'application';

  if (pathParts.length > 0) {
    // 첫 번째 경로는 도메인 (예: mybids, settings)
    hierarchy += `.${pathParts[0]}`;

    if (pathParts.length > 1) {
      // 두 번째 경로는 페이지 (예: bidding, default)
      hierarchy += `.${pathParts[1]}`;
    }
  }

  // 섹션 타이틀에서 실제 섹션명 추출
  const sectionName = sectionTitle.includes(' > ')
    ? sectionTitle.split(' > ').pop()?.trim()
    : sectionTitle.replace('[가이드]', '').trim();

  if (sectionName) {
    // 기본 변환 (공백을 언더스코어로, 소문자로)
    const fallbackSection = sectionName.toLowerCase().replace(/\s+/g, '_');
    hierarchy += `.${fallbackSection}`;
  }

  return hierarchy;
};

// 동적 scope_hierarchy 생성 함수 (mappings_lang 활용)
const generateScopeHierarchyWithMapping = async (
  pathname: string,
  sectionTitle: string,
  apolloClient: any
): Promise<string> => {
  try {
    // URL을 경로별로 분해
    const pathParts = pathname.split('/').filter(part => part !== '');

    // 기본 구조: application.domain.page[.section]
    let hierarchy = 'application';

    if (pathParts.length > 0) {
      // 첫 번째 경로는 도메인 (예: mybids, settings)
      hierarchy += `.${pathParts[0]}`;

      if (pathParts.length > 1) {
        // 두 번째 경로는 페이지 (예: bidding, default)
        hierarchy += `.${pathParts[1]}`;
      }
    }

    // 섹션 타이틀에서 실제 섹션명 추출
    const sectionName = sectionTitle.includes(' > ')
      ? sectionTitle.split(' > ').pop()?.trim()
      : sectionTitle.replace('[가이드]', '').trim();

    if (sectionName) {
      try {
        console.log('=== MAPPING QUERY DEBUG ===');
        console.log('Querying mapping for sectionName:', sectionName);
        console.log('Query variables:', { scope: 'section', ko: sectionName });

        // mappings_lang에서 한글->영어 변환 시도
        const { data } = await apolloClient.query({
          query: CONVERT_KO_TO_EN,
          variables: { scope: 'section', ko: sectionName },
          fetchPolicy: 'network-only' // 캐시 무시하고 최신 데이터 조회
        });

        console.log('Mapping query response data:', data);

        const englishSection = data?.mappingsLangKoToEn;
        console.log('English section mapping result:', englishSection);

        if (englishSection) {
          hierarchy += `.${englishSection}`;
          console.log('Using mapped section:', englishSection);
        } else {
          // 매핑이 없으면 fallback 변환
          const fallbackSection = sectionName.toLowerCase().replace(/\s+/g, '_');
          hierarchy += `.${fallbackSection}`;
          console.log('No mapping found, using fallback:', fallbackSection);
        }
      } catch (error) {
        console.error('Error fetching mapping for section:', sectionName, error);
        console.error('Full error object:', error);
        // 에러 시 fallback 변환
        const fallbackSection = sectionName.toLowerCase().replace(/\s+/g, '_');
        hierarchy += `.${fallbackSection}`;
        console.log('Error occurred, using fallback:', fallbackSection);
      }
    }

    return hierarchy;
  } catch (error) {
    console.error('Error generating scope hierarchy:', error);
    // 전체 에러 시 fallback 함수 사용
    return generateScopeHierarchyFallback(pathname, sectionTitle);
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

    // 이미지 파일인 경우 이미지 마크다운, 그 외는 링크 마크다운
    let fileMarkdown;
    if (file.type.startsWith('image/')) {
      fileMarkdown = `![${result.filename || file.name}](<${result.url}>)`;
    } else {
      fileMarkdown = `[${result.filename || file.name}](<${result.url}>)`;
    }

    const newValue = `${editingMarkdown}\n\n${fileMarkdown}`;
    setEditingMarkdown(newValue);


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
  scope = "section",
  scopeHierarchy,
  defaultContent,
  helpContent
}: GuideSlideProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // scope="page"일 때는 반드시 scope 기반 쿼리 사용 (page 가이드는 scope=page에서만 검색)
  const shouldUseScope = scope === "page" ? true : (scope && scopeHierarchy);

  const { data, loading, error, refetch } = useQuery(
    shouldUseScope ? GET_HELP_DOCUMENT_BY_SCOPE : GET_HELP_DOCUMENT,
    {
      client: getClient(),
      variables: shouldUseScope
        ? { scope, scopeHierarchy }
        : { category, title },
      skip: !isOpen, // 열릴 때만 쿼리 실행
      fetchPolicy: 'cache-and-network',
    }
  );

  const [createDocument] = useMutation(CREATE_HELP_DOCUMENT, { client: getClient() });
  const [updateDocument] = useMutation(UPDATE_HELP_DOCUMENT, { client: getClient() });

  // 데이터베이스에서 가져온 문서가 있는지 확인
  const searchResult = data?.docsManualSearch; // 기존 쿼리만 사용
  const dbDocument = searchResult?.manuals?.[0];
  const hasDbContent = dbDocument && searchResult?.total_count > 0;


  // 가이드 컨텐츠가 렌더링될 때마다 빈 줄 간격 조정
  useEffect(() => {
    if (contentRef.current && hasDbContent && !isEditing) {
      // DOM이 완전히 렌더링된 후 실행하기 위해 timeout 사용
      setTimeout(() => {
        if (contentRef.current) {
          adjustEmptyLineSpacing(contentRef.current);
        }
      }, 100);
    }
  }, [hasDbContent, isEditing, data]);

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
      // 마크다운 후처리 적용
      const processedMarkdown = postProcessMarkdown(editContent);
      const contentToSave = convertMarkdownToHtml(processedMarkdown);

      // 사용자 email을 우선적으로 사용 (email이 없으면 name으로 대체)
      const writerEmail = user?.email || user?.name || '시스템';

      // scope_hierarchy 동적 생성 (mappings_lang 활용)
      let generatedScopeHierarchy = scopeHierarchy;

      if (!scopeHierarchy) {
        try {
          generatedScopeHierarchy = await generateScopeHierarchyWithMapping(pathname, title, getClient());
        } catch (error) {
          console.error('Error generating dynamic scope hierarchy:', error);
          generatedScopeHierarchy = generateScopeHierarchyFallback(pathname, title);
        }
      }

      console.log('=== SCOPE HIERARCHY DEBUG ===');
      console.log('pathname:', pathname);
      console.log('title:', title);
      console.log('scopeHierarchy prop:', scopeHierarchy);
      console.log('generated scope_hierarchy:', generatedScopeHierarchy);

      const input = {
        title,
        content: contentToSave, // HTML로 변환된 내용
        markdown_source: processedMarkdown, // 후처리된 마크다운
        format: 'markdown',
        category,
        scope: scope || 'section', // 기본값으로 'section' 사용
        scope_hierarchy: generatedScopeHierarchy,
        parent_scope_id: null, // 기본값으로 null 사용
        writer: writerEmail,
        email: user?.email || '', // email 필드 별도 추가
        is_visible: true,
        is_notice: false,
        is_private: false
      };



      if (hasDbContent) {
        // 수정 - 기존 writer가 비어있거나 '시스템'이면 현재 사용자 email로 업데이트
        const currentWriter = dbDocument.writer;
        const currentEmail = dbDocument.email;
        const shouldUpdateWriter = !currentWriter || currentWriter === '시스템' || currentWriter.trim() === '';
        const shouldUpdateEmail = !currentEmail || currentEmail.trim() === '';

        const finalWriter = shouldUpdateWriter ? writerEmail : currentWriter;
        const finalEmail = shouldUpdateEmail ? (user?.email || '') : currentEmail;

        const updateInput = {
          ...input,
          id: dbDocument.id,
          writer: finalWriter,
          email: finalEmail,
          // scope 관련 필드들 업데이트 (기존 값이 없으면 현재 값으로 설정)
          scope: dbDocument.scope || input.scope,
          scope_hierarchy: dbDocument.scope_hierarchy || input.scope_hierarchy,
          parent_scope_id: dbDocument.parent_scope_id || input.parent_scope_id
        };


        await updateDocument({
          variables: {
            input: updateInput
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
      console.error('Error details:', {
        message: error.message,
        graphQLErrors: error.graphQLErrors,
        networkError: error.networkError,
        extraInfo: error.extraInfo
      });

      let errorMessage = '저장에 실패했습니다.';
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage += ` (${error.graphQLErrors[0].message})`;
      } else if (error.networkError) {
        errorMessage += ` (네트워크 오류: ${error.networkError.message})`;
      }

      alert(errorMessage);
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
              ref={contentRef}
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
    } else if (helpContent) {
      // 레거시 helpContent 지원
      return (
        <div className="space-y-4">
          <div className="guide-content-container">
            <div className="guide-content text-foreground text-sm">
              {helpContent}
            </div>
          </div>
        </div>
      );
    } else {
      // scope="page"일 때 특별한 기본 메시지 표시
      const defaultMessage = scope === "page"
        ? "이 페이지에 대한 가이드가 아직 작성되지 않았습니다."
        : "도움말 문서가 없습니다. 새로 생성해주세요.";

      return (
        <div className="space-y-4">
          <div className="guide-content-container">
            <div className="guide-content text-muted-foreground">
              {defaultMessage}
            </div>
          </div>
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mt-2 bg-card border border-border rounded-lg">
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
                      remarkPlugins: [remarkBreaks, remarkGfm],
                      rehypePlugins: [rehypeRaw]
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