export const DOCS_MANUAL_CREATE = `
  mutation CreateManual($input: DocsManualInput!) {
    docsManualCreate(input: $input) {
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

export const DOCS_MANUAL_UPDATE = `
  mutation UpdateManual($input: DocsManualInput!) {
    docsManualUpdate(input: $input) {
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

export const DOCS_MANUAL_DELETE = `
  mutation DeleteManual($input: DocsManualDeleteInput!) {
    docsManualDelete(input: $input) {
      id
      title
    }
  }
`;