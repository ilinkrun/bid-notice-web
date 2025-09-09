export declare const databaseResolvers: {
    Query: {
        databaseExecuteSql: (_: unknown, { sql }: {
            sql: string;
        }) => Promise<any>;
    };
    Mutation: {
        databaseSearchNoticesByWeight: (_: unknown, { keywords, nots, minPoint, addWhere, baseSql, addSql }: {
            keywords: string;
            nots: string;
            minPoint: number;
            addWhere?: string;
            baseSql?: string;
            addSql?: string;
        }) => Promise<any>;
    };
};
//# sourceMappingURL=database.d.ts.map