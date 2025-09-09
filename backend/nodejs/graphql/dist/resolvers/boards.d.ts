interface PostInput {
    id?: number;
    title: string;
    content: string;
    markdown_source?: string;
    format?: string;
    writer: string;
    password: string;
    is_visible?: number | boolean;
}
interface ApiResponse<T = unknown> {
    data: T;
    success?: boolean;
}
export declare const boardsResolvers: {
    Query: {
        boardsPostsAll: (_: unknown, { board }: {
            board: string;
        }) => Promise<any>;
        boardsPostsOne: (_: unknown, { id, board }: {
            id: number;
            board: string;
        }) => Promise<ApiResponse<unknown> | null>;
        boardsCommentsAll: (_: unknown, { board, post_id, page, per_page }: {
            board: string;
            post_id: number;
            page?: number;
            per_page?: number;
        }) => Promise<ApiResponse<unknown> | {
            total_count: number;
            page: number;
            per_page: number;
            comments: never[];
        }>;
        boardsCommentsOne: (_: unknown, { id }: {
            id: number;
        }) => Promise<ApiResponse<unknown> | null>;
    };
    Mutation: {
        boardsPostCreate: (_: unknown, { board, input }: {
            board: string;
            input: PostInput;
        }) => Promise<any>;
        boardsPostUpdate: (_: any, { board, input }: {
            board: string;
            input: any;
        }) => Promise<any>;
        boardsPostDelete: (_: any, { board, input }: {
            board: string;
            input: any;
        }) => Promise<any>;
        boardsCommentCreate: (_: any, { input }: {
            input: any;
        }) => Promise<any>;
        boardsCommentUpdate: (_: any, { input }: {
            input: any;
        }) => Promise<{
            id: any;
            board: any;
            post_id: any;
            content: any;
            writer: any;
            created_at: any;
            updated_at: string;
            is_visible: any;
        }>;
        boardsCommentDelete: (_: any, { input }: {
            input: any;
        }) => Promise<{
            id: any;
            board: any;
            post_id: any;
            content: any;
            writer: any;
            created_at: any;
            updated_at: string;
            is_visible: boolean;
        }>;
    };
};
export {};
//# sourceMappingURL=boards.d.ts.map