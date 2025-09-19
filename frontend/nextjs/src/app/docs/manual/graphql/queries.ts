export const DOCS_MANUAL_ALL = `
  query GetManuals($category: String, $limit: Int, $offset: Int) {
    docsManualAll(category: $category, limit: $limit, offset: $offset) {
      manuals {
        id
        title
        content
        markdown_source
        format
        category
        file_path
        writer
        email
        created_at
        updated_at
        is_visible
        is_notice
        is_private
      }
      total_count
      page
      limit
    }
  }
`;

export const DOCS_MANUAL_ONE = `
  query GetManual($id: Int!) {
    docsManualOne(id: $id) {
      id
      title
      content
      markdown_source
      format
      category
      file_path
      writer
      email
      created_at
      updated_at
      is_visible
      is_notice
      is_private
    }
  }
`;

export const DOCS_MANUAL_SEARCH = `
  query SearchManuals($query: String!, $category: String, $limit: Int, $offset: Int) {
    docsManualSearch(query: $query, category: $category, limit: $limit, offset: $offset) {
      manuals {
        id
        title
        content
        markdown_source
        format
        category
        file_path
        writer
        email
        created_at
        updated_at
        is_visible
        is_notice
        is_private
      }
      total_count
      page
      limit
      query
    }
  }
`;

export const DOCS_CATEGORIES = `
  query GetCategories {
    docsCategories {
      categories
    }
  }
`;

export const MAPPINGS_LANG_BY_AREA = `
  query GetLangMappings($area: String!) {
    mappingsLangByArea(area: $area) {
      id
      ko
      en
      isActive
    }
  }
`;