import { gql } from '@apollo/client';

// Help 문서 조회 쿼리 (category와 title로 특정 문서 조회)
export const GET_HELP_DOCUMENT = gql`
  query GetHelpDocument($category: String!, $title: String!) {
    docsManualSearch(query: $title, category: $category, limit: 1) {
      manuals {
        id
        title
        content
        markdown_source
        format
        category
        scope
        scope_hierarchy
        parent_scope_id
        writer
        created_at
        updated_at
        is_visible
        is_notice
        is_private
      }
      total_count
    }
  }
`;

// 계층적 scope로 Help 문서 조회 (scope_hierarchy로 검색)
export const GET_HELP_DOCUMENT_BY_SCOPE = gql`
  query GetHelpDocumentByScope($scope: String!, $scopeHierarchy: String!) {
    docsManualSearchByScope(scope: $scope, scope_hierarchy: $scopeHierarchy, limit: 1) {
      manuals {
        id
        title
        content
        markdown_source
        format
        category
        scope
        scope_hierarchy
        parent_scope_id
        writer
        created_at
        updated_at
        is_visible
        is_notice
        is_private
      }
      total_count
    }
  }
`;

// Help 문서 생성 뮤테이션
export const CREATE_HELP_DOCUMENT = gql`
  mutation CreateHelpDocument($input: DocsManualInput!) {
    docsManualCreate(input: $input) {
      id
      title
      content
      markdown_source
      format
      category
      scope
      scope_hierarchy
      parent_scope_id
      writer
      created_at
      updated_at
      is_visible
      is_notice
      is_private
    }
  }
`;

// Help 문서 수정 뮤테이션
export const UPDATE_HELP_DOCUMENT = gql`
  mutation UpdateHelpDocument($input: DocsManualInput!) {
    docsManualUpdate(input: $input) {
      id
      title
      content
      markdown_source
      format
      category
      scope
      scope_hierarchy
      parent_scope_id
      writer
      created_at
      updated_at
      is_visible
      is_notice
      is_private
    }
  }
`;

// Help 문서 삭제 뮤테이션
export const DELETE_HELP_DOCUMENT = gql`
  mutation DeleteHelpDocument($input: DocsManualDeleteInput!) {
    docsManualDelete(input: $input) {
      id
      title
    }
  }
`;