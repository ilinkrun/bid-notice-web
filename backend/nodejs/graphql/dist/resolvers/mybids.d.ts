export declare const mybidsResolvers: {
    Query: {
        mybidsAll: () => Promise<any>;
        mybidsByStatus: (_: unknown, { status }: {
            status: string;
        }) => Promise<any>;
        mybidsOne: (_: unknown, { nid }: {
            nid: number;
        }) => Promise<{
            mid: number;
            nid: number;
            title: any;
            status: any;
            startedAt: any;
            endedAt: any;
            memo: any;
            orgName: any;
            postedAt: any;
            detail: any;
            category: any;
            region: any;
        } | null>;
    };
    Mutation: {
        mybidCreate: (_: unknown, { input }: {
            input: any;
        }) => Promise<any>;
        mybidUpdate: (_: unknown, { input }: {
            input: any;
        }) => Promise<any>;
        mybidDelete: (_: unknown, { mid }: {
            mid: number;
        }) => Promise<boolean>;
    };
};
//# sourceMappingURL=mybids.d.ts.map