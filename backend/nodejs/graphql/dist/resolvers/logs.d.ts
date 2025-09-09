interface LogScrapingInput {
    orgName?: string;
    errorCode?: string;
    errorMessage?: string;
    scrapedCount?: number;
    insertedCount?: number;
    time?: string;
}
export declare const logsResolvers: {
    Query: {
        logsScrapingAll: (_: unknown, { gap }: {
            gap?: number;
        }) => Promise<any>;
        logsErrorAll: (_: unknown, { gap }: {
            gap?: number;
        }) => Promise<any>;
    };
    Mutation: {
        logCreate: (_: unknown, { input }: {
            input: LogScrapingInput;
        }) => Promise<{
            createdAt: string;
            orgName?: string;
            errorCode?: string;
            errorMessage?: string;
            scrapedCount?: number;
            insertedCount?: number;
            time?: string;
            id: string;
        }>;
        logUpdate: (_: unknown, { id, input }: {
            id: string;
            input: LogScrapingInput;
        }) => Promise<{
            updatedAt: string;
            orgName?: string;
            errorCode?: string;
            errorMessage?: string;
            scrapedCount?: number;
            insertedCount?: number;
            time?: string;
            id: string;
        }>;
    };
};
export {};
//# sourceMappingURL=logs.d.ts.map