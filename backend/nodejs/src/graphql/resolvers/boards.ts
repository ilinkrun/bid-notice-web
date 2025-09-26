import { pool, executeQuery } from '@/utils/database/mysql';

// MySQL Row interfaces
interface BoardPostRow {
  id: number;
  title: string;
  content: string;
  markdown_source?: string;
  format: string;
  writer: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  is_visible: boolean;
  is_notice: boolean;
  is_private: boolean;
  reply_to?: number;
  reply_depth?: number;
}

interface BoardCommentRow {
  id: number;
  board: string;
  post_id: number;
  content: string;
  writer: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  is_visible: boolean;
}

// Helper functions
const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toISOString().replace('T', ' ').substring(0, 19);
};

const transformPostRow = (row: BoardPostRow) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  markdown_source: row.markdown_source || null,
  format: row.format,
  writer: row.writer,
  email: row.email,
  created_at: formatDate(row.created_at),
  updated_at: formatDate(row.updated_at),
  is_visible: Boolean(row.is_visible),
  is_notice: Boolean(row.is_notice),
  is_private: Boolean(row.is_private),
  reply_to: row.reply_to || null,
  reply_depth: row.reply_depth || 0
});

const transformCommentRow = (row: BoardCommentRow) => ({
  id: row.id,
  board: row.board,
  post_id: row.post_id,
  content: row.content,
  writer: row.writer,
  email: row.email,
  created_at: formatDate(row.created_at),
  updated_at: formatDate(row.updated_at),
  is_visible: Boolean(row.is_visible)
});

export interface PostInput {
  id?: number;
  title: string;
  content: string;
  markdown_source?: string;
  format?: string;
  writer: string;
  email: string;
  is_visible?: number | boolean;
  is_notice?: boolean;
  is_private?: boolean;
  reply_to?: number;
}

export interface CommentInput {
  id?: number;
  board: string;
  post_id: number;
  content: string;
  writer: string;
  email: string;
  is_visible?: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  success?: boolean;
}

export interface ErrorWithResponse {
  message?: string;
  response?: {
    data?: unknown;
    status?: number;
  };
  config?: {
    url?: string;
    method?: string;
    baseURL?: string;
  };
}

export const boardsResolvers = {
  Query: {
    boardsPostsAll: async (_: unknown, { board, user_email }: { board: string, user_email?: string }) => {
      try {
        console.log(`게시판 목록 조회 요청: ${board}`);

        // 조건 구성
        const conditions = ['is_visible = 1'];
        const params: any[] = [];

        // 비공개 게시글 필터링: 작성자 본인이거나 비공개가 아닌 경우만 보여줌
        if (user_email) {
          conditions.push('(is_private = 0 OR email = ?)');
          params.push(user_email);
        } else {
          conditions.push('is_private = 0');
        }

        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

        const query = `
          SELECT id, title, writer, email, created_at, updated_at, is_visible, is_notice, is_private, reply_to, reply_depth
          FROM ${board}
          ${whereClause}
          ORDER BY is_notice DESC, 
                   COALESCE(reply_to, id), 
                   reply_depth, 
                   created_at ASC
        `;

        const rows = await executeQuery(query, params) as BoardPostRow[];
        return rows.map(transformPostRow);
      } catch (error) {
        console.error('게시판 목록 조회 오류:', error);
        return [];
      }
    },
    boardsPostsOne: async (_: unknown, { id, board }: { id: number, board: string }) => {
      try {
        console.log(`게시글 상세 조회 요청: ${board}, ${id}`);

        const query = `
          SELECT id, title, content, markdown_source, format, writer, email,
                 created_at, updated_at, is_visible, is_notice, is_private, reply_to, reply_depth
          FROM ${board}
          WHERE id = ?
        `;

        const rows = await executeQuery(query, [id]) as BoardPostRow[];

        if (rows.length === 0) {
          return null;
        }

        return transformPostRow(rows[0]);
      } catch (error) {
        console.error('게시글 상세 조회 오류:', error);
        return null;
      }
    },
    boardsCommentsAll: async (_: unknown, { board, post_id, page = 1, per_page = 50 }: { board: string, post_id: number, page?: number, per_page?: number }) => {
      try {
        console.log(`댓글 목록 조회 요청: ${board}, ${post_id}, page=${page}, per_page=${per_page}`);

        // 전체 댓글 수 조회
        const countQuery = `
          SELECT COUNT(*) as total
          FROM comments_board
          WHERE board = ? AND post_id = ? AND is_visible = 1
        `;
        const countRows = await executeQuery(countQuery, [board, post_id]) as { total: number }[];
        const total_count = countRows[0].total;

        // 페이지네이션 적용하여 댓글 조회
        const offset = (page - 1) * per_page;
        const commentsQuery = `
          SELECT id, board, post_id, content, writer, email, created_at, updated_at, is_visible
          FROM comments_board
          WHERE board = ? AND post_id = ? AND is_visible = 1
          ORDER BY created_at ASC
          LIMIT ? OFFSET ?
        `;

        const rows = await executeQuery(commentsQuery, [board, post_id, per_page, offset]) as BoardCommentRow[];

        return {
          total_count,
          page,
          per_page,
          comments: rows.map(transformCommentRow)
        };
      } catch (error) {
        console.error('댓글 목록 조회 오류:', error);
        return {
          total_count: 0,
          page: page,
          per_page: per_page,
          comments: []
        };
      }
    },
    boardsCommentsOne: async (_: unknown, { id }: { id: number }) => {
      try {
        console.log(`댓글 상세 조회 요청: ${id}`);

        const query = `
          SELECT id, board, post_id, content, writer, email, created_at, updated_at, is_visible
          FROM comments_board
          WHERE id = ?
        `;

        const rows = await executeQuery(query, [id]) as BoardCommentRow[];

        if (rows.length === 0) {
          return null;
        }

        return transformCommentRow(rows[0]);
      } catch (error) {
        console.error('댓글 상세 조회 오류:', error);
        return null;
      }
    },
  },
  Mutation: {
    boardsPostCreate: async (_: unknown, { board, input }: { board: string, input: PostInput }) => {
      try {
        console.log(`게시글 생성 요청: ${board}`, input);

        // 이메일 유효성 검사
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(input.email)) {
          throw new Error('유효하지 않은 이메일 형식입니다.');
        }

        // format 유효성 검사
        const validFormats = ['text', 'markdown', 'html'];
        const format = input.format || 'text';
        if (!validFormats.includes(format)) {
          throw new Error('올바르지 않은 format입니다. text, markdown, html 중 하나여야 합니다.');
        }

        // reply_depth 계산
        let replyDepth = 0;
        if (input.reply_to) {
          // 답글 대상의 reply_depth를 조회하여 +1
          const parentQuery = `SELECT reply_depth FROM ${board} WHERE id = ?`;
          const parentRows = await executeQuery(parentQuery, [input.reply_to]) as { reply_depth: number }[];
          if (parentRows.length > 0) {
            replyDepth = (parentRows[0].reply_depth || 0) + 1;
          }
        }

        const insertQuery = `
          INSERT INTO ${board} (title, content, markdown_source, format, writer, email, is_visible, is_notice, is_private, reply_to, reply_depth)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          input.title,
          input.content,
          input.markdown_source || null,
          format,
          input.writer,
          input.email,
          input.is_visible !== false ? 1 : 0,
          input.is_notice ? 1 : 0,
          input.is_private ? 1 : 0,
          input.reply_to || null,
          replyDepth
        ];

        const result = await executeQuery(insertQuery, params) as { insertId: number; affectedRows: number };
        const postId = result.insertId;

        // 생성된 게시글 조회
        const selectQuery = `
          SELECT id, title, content, markdown_source, format, writer, email,
                 created_at, updated_at, is_visible, is_notice, is_private, reply_to, reply_depth
          FROM ${board}
          WHERE id = ?
        `;

        const rows = await executeQuery(selectQuery, [postId]) as BoardPostRow[];
        if (rows.length === 0) {
          throw new Error('생성된 게시글을 찾을 수 없습니다.');
        }

        return transformPostRow(rows[0]);
      } catch (error) {
        console.error('게시글 생성 오류:', error);
        if (error instanceof Error) {
          throw new Error(`게시글 생성에 실패했습니다: ${error.message}`);
        } else {
          throw new Error('게시글 생성에 실패했습니다.');
        }
      }
    },
    boardsPostUpdate: async (_: any, { board, input }: { board: string, input: any }) => {
      try {
        console.log(`게시글 수정 요청: ${board}, ${input.id}`, input);

        if (!input.email) {
          throw new Error('이메일을 입력해주세요.');
        }

        // 이메일 확인
        const emailCheckQuery = `SELECT email FROM ${board} WHERE id = ?`;
        const emailRows = await executeQuery(emailCheckQuery, [input.id]) as { email: string }[];

        if (emailRows.length === 0 || emailRows[0].email !== input.email) {
          throw new Error('작성자만 수정할 수 있습니다.');
        }

        // 수정할 데이터 구성
        const updateFields = [];
        const updateParams = [];

        if (input.title !== undefined) {
          updateFields.push('title = ?');
          updateParams.push(input.title);
        }
        if (input.content !== undefined) {
          updateFields.push('content = ?');
          updateParams.push(input.content);
        }
        if (input.markdown_source !== undefined) {
          updateFields.push('markdown_source = ?');
          updateParams.push(input.markdown_source);
        }
        if (input.format !== undefined) {
          const validFormats = ['text', 'markdown', 'html'];
          if (!validFormats.includes(input.format)) {
            throw new Error('올바르지 않은 format입니다.');
          }
          updateFields.push('format = ?');
          updateParams.push(input.format);
        }
        if (input.is_visible !== undefined) {
          updateFields.push('is_visible = ?');
          updateParams.push(input.is_visible ? 1 : 0);
        }
        if (input.is_notice !== undefined) {
          updateFields.push('is_notice = ?');
          updateParams.push(input.is_notice ? 1 : 0);
        }
        if (input.is_private !== undefined) {
          updateFields.push('is_private = ?');
          updateParams.push(input.is_private ? 1 : 0);
        }

        if (updateFields.length === 0) {
          throw new Error('수정할 내용이 없습니다.');
        }

        updateParams.push(input.id);
        const updateQuery = `UPDATE ${board} SET ${updateFields.join(', ')} WHERE id = ?`;

        await executeQuery(updateQuery, updateParams);

        // 수정된 게시글 조회
        const selectQuery = `
          SELECT id, title, content, markdown_source, format, writer, email,
                 created_at, updated_at, is_visible, is_notice, is_private, reply_to, reply_depth
          FROM ${board}
          WHERE id = ?
        `;

        const rows = await executeQuery(selectQuery, [input.id]) as BoardPostRow[];
        if (rows.length === 0) {
          throw new Error('수정된 게시글을 찾을 수 없습니다.');
        }

        return transformPostRow(rows[0]);
      } catch (error) {
        console.error('게시글 수정 오류:', error);
        if (error instanceof Error) {
          throw new Error(error.message);
        } else {
          throw new Error('게시글 수정에 실패했습니다.');
        }
      }
    },
    boardsPostDelete: async (_: any, { board, input }: { board: string, input: any }) => {
      try {
        console.log(`게시글 삭제 요청: ${board}, ${input.id}`);

        if (!input.email) {
          throw new Error('이메일을 입력해주세요.');
        }

        // 이메일 확인 및 기존 게시글 정보 조회
        const selectQuery = `
          SELECT id, title, content, markdown_source, format, writer, email,
                 created_at, updated_at, is_visible, is_notice, is_private, reply_to, reply_depth
          FROM ${board}
          WHERE id = ?
        `;

        const rows = await executeQuery(selectQuery, [input.id]) as BoardPostRow[];

        if (rows.length === 0) {
          throw new Error('게시글을 찾을 수 없습니다.');
        }

        if (rows[0].email !== input.email) {
          throw new Error('작성자만 삭제할 수 있습니다.');
        }

        // is_visible을 0으로 변경 (소프트 삭제)
        const deleteQuery = `UPDATE ${board} SET is_visible = 0 WHERE id = ?`;
        await executeQuery(deleteQuery, [input.id]);

        // 삭제된 게시글 정보 반환 (is_visible만 변경된 상태)
        const deletedPost = transformPostRow(rows[0]);
        deletedPost.is_visible = false;

        return deletedPost;
      } catch (error) {
        console.error('게시글 삭제 오류:', error);
        if (error instanceof Error) {
          throw new Error(error.message);
        } else {
          throw new Error('게시글 삭제에 실패했습니다.');
        }
      }
    },
    boardsCommentCreate: async (_: any, { input }: { input: any }) => {
      try {
        console.log('댓글 생성 요청:', input);

        // 필수 필드 검사
        const requiredFields = ['board', 'post_id', 'content', 'writer', 'email'];
        for (const field of requiredFields) {
          if (!input[field]) {
            throw new Error(`필수 필드가 누락되었습니다: ${field}`);
          }
        }

        // 이메일 형식 간단 검증
        if (!input.email.includes('@')) {
          throw new Error('올바른 이메일 형식이 아닙니다.');
        }

        const insertQuery = `
          INSERT INTO comments_board (board, post_id, content, writer, email, is_visible)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        const params = [
          input.board,
          parseInt(input.post_id),
          input.content,
          input.writer,
          input.email,
          input.is_visible !== false ? 1 : 0
        ];

        const result = await executeQuery(insertQuery, params) as { insertId: number; affectedRows: number };
        const commentId = result.insertId;

        // 생성된 댓글 조회
        const selectQuery = `
          SELECT id, board, post_id, content, writer, email, created_at, updated_at, is_visible
          FROM comments_board
          WHERE id = ?
        `;

        const rows = await executeQuery(selectQuery, [commentId]) as BoardCommentRow[];
        if (rows.length === 0) {
          throw new Error('생성된 댓글을 찾을 수 없습니다.');
        }

        return transformCommentRow(rows[0]);
      } catch (error: any) {
        console.error('댓글 생성 오류:', error);

        if (error instanceof Error) {
          throw new Error(`댓글 생성에 실패했습니다: ${error.message}`);
        } else {
          throw new Error('댓글 생성에 실패했습니다.');
        }
      }
    },
    boardsCommentUpdate: async (_: any, { input }: { input: any }) => {
      try {
        console.log(`댓글 수정 요청: ${input.id}`, input);

        if (!input.email) {
          throw new Error('이메일을 입력해주세요.');
        }

        // 이메일 확인 및 기존 댓글 정보 조회
        const selectQuery = `
          SELECT id, board, post_id, content, writer, email, created_at, updated_at, is_visible
          FROM comments_board
          WHERE id = ?
        `;

        const rows = await executeQuery(selectQuery, [input.id]) as BoardCommentRow[];

        if (rows.length === 0) {
          throw new Error('댓글을 찾을 수 없습니다.');
        }

        const existingComment = rows[0];

        if (existingComment.email.trim() !== input.email.trim()) {
          throw new Error('작성자만 수정할 수 있습니다.');
        }

        // 수정할 데이터 구성
        const updateFields = [];
        const updateParams = [];

        if (input.content !== undefined) {
          updateFields.push('content = ?');
          updateParams.push(input.content);
        }
        if (input.is_visible !== undefined) {
          updateFields.push('is_visible = ?');
          updateParams.push(input.is_visible ? 1 : 0);
        }

        if (updateFields.length === 0) {
          throw new Error('수정할 내용이 없습니다.');
        }

        updateParams.push(input.id);
        const updateQuery = `UPDATE comments_board SET ${updateFields.join(', ')} WHERE id = ?`;

        await executeQuery(updateQuery, updateParams);

        // 수정된 댓글 조회
        const updatedRows = await executeQuery(selectQuery, [input.id]) as BoardCommentRow[];
        if (updatedRows.length === 0) {
          throw new Error('수정된 댓글을 찾을 수 없습니다.');
        }

        return transformCommentRow(updatedRows[0]);
      } catch (error: any) {
        console.error('댓글 수정 오류:', error);

        if (error instanceof Error) {
          throw new Error(error.message);
        } else {
          throw new Error('댓글 수정에 실패했습니다.');
        }
      }
    },
    boardsCommentDelete: async (_: any, { input }: { input: any }) => {
      try {
        console.log(`댓글 삭제 요청: ${input.id}`);

        if (!input.email) {
          throw new Error('이메일을 입력해주세요.');
        }

        // 이메일 확인 및 기존 댓글 정보 조회
        const selectQuery = `
          SELECT id, board, post_id, content, writer, email, created_at, updated_at, is_visible
          FROM comments_board
          WHERE id = ?
        `;

        const rows = await executeQuery(selectQuery, [input.id]) as BoardCommentRow[];

        if (rows.length === 0) {
          throw new Error('댓글을 찾을 수 없습니다.');
        }

        const existingComment = rows[0];

        if (existingComment.email.trim() !== input.email.trim()) {
          throw new Error('작성자만 삭제할 수 있습니다.');
        }

        // 댓글 삭제 (물리적 삭제)
        const deleteQuery = `DELETE FROM comments_board WHERE id = ?`;
        await executeQuery(deleteQuery, [input.id]);

        // 삭제된 댓글 정보 반환 (is_visible을 false로 설정)
        const deletedComment = transformCommentRow(existingComment);
        deletedComment.is_visible = false;

        return deletedComment;
      } catch (error: any) {
        console.error('댓글 삭제 오류:', error);

        if (error instanceof Error) {
          throw new Error(error.message);
        } else {
          throw new Error('댓글 삭제에 실패했습니다.');
        }
      }
    },
  },
};
