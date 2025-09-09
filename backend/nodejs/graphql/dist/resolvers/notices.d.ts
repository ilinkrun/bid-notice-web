export declare const noticesResolvers: {
    Query: {
        noticesAll: (_: unknown, { gap }: {
            gap?: number;
        }) => Promise<any>;
        noticesByCategory: (_: unknown, { category, gap }: {
            category: string;
            gap?: number;
        }) => Promise<any>;
        noticesStatistics: (_: unknown, { gap }: {
            gap: number;
        }) => Promise<any>;
        noticesRegionStatistics: (_: unknown, { gap }: {
            gap?: number;
        }) => Promise<{
            region: string;
            noticeCount: number;
        }[]>;
        noticesSearch: (_: unknown, { keywords, nots, minPoint, addWhere }: {
            keywords: string;
            nots: string;
            minPoint: number;
            addWhere?: string;
        }) => Promise<any>;
        noticesOne: (_: unknown, { orgName, field }: {
            orgName: string;
            field?: string;
        }) => Promise<any>;
    };
    Mutation: {
        noticesUpsert: (_: unknown, { data }: {
            data: unknown[];
        }) => Promise<any>;
        noticesUpdateToProgress: (_: unknown, { nids }: {
            nids: number[];
        }) => Promise<{
            success: any;
            message: any;
        }>;
        noticesUpdateCategory: (_: unknown, { nids, category }: {
            nids: number[];
            category: string;
        }) => Promise<{
            success: any;
            message: any;
        }>;
        noticesExclude: (_: unknown, { nids }: {
            nids: number[];
        }) => Promise<{
            success: any;
            message: any;
        }>;
        noticesRestore: (_: unknown, { nids }: {
            nids: number[];
        }) => Promise<{
            success: any;
            message: any;
        }>;
    };
};
//# sourceMappingURL=notices.d.ts.map