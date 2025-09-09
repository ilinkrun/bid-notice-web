export declare const spidersResolvers: {
    Query: {
        spidersCheckFetchList: (_: unknown, { orgName }: {
            orgName: string;
        }) => Promise<{
            orgName: any;
            success: any;
            errorCode: any;
            errorMessage: any;
            dataCount: any;
            data: any;
        }>;
        spidersHello: () => Promise<any>;
    };
    Mutation: {
        spidersTestCsv: (_: unknown, { csvData }: {
            csvData: string;
        }) => Promise<any>;
    };
};
//# sourceMappingURL=spiders.d.ts.map