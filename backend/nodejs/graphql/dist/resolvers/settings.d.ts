interface SettingsNoticeListInput {
    oid?: number;
    orgName: string;
    url: string;
    iframe?: string;
    rowXpath?: string;
    paging?: string;
    startPage?: number;
    endPage?: number;
    login?: string;
    use?: number;
    orgRegion?: string;
    registration?: string;
    title?: string;
    detailUrl?: string;
    postedDate?: string;
    postedBy?: string;
    companyInCharge?: string;
    orgMan?: string;
    exceptionRow?: string;
}
interface SettingsNoticeDetailInput {
    oid?: number;
    orgName: string;
    title?: string;
    bodyHtml?: string;
    fileName?: string;
    fileUrl?: string;
    preview?: string;
    noticeDiv?: string;
    noticeNum?: string;
    orgDept?: string;
    orgMan?: string;
    orgTel?: string;
    use?: number;
    sampleUrl?: string;
    down?: string;
}
interface SettingsNoticeCategoryInput {
    sn?: number;
    keywords: string;
    nots: string;
    minPoint: number;
    category: string;
    creator?: string;
    memo?: string;
}
interface SettingsNasPathInput {
    id?: string;
    pathName: string;
    pathValue: string;
    description?: string;
    isActive?: boolean;
}
interface SettingsAppDefaultInput {
    id?: string;
    settingKey: string;
    settingValue: string;
    description?: string;
    category?: string;
}
export declare const settingsResolvers: {
    Query: {
        settingsNoticeListAll: () => Promise<any>;
        settingsNoticeListOne: (_: unknown, { oid }: {
            oid: number;
        }) => Promise<{
            oid: any;
            orgName: any;
            url: any;
            iframe: any;
            rowXpath: any;
            paging: any;
            startPage: any;
            endPage: any;
            login: any;
            use: any;
            orgRegion: any;
            registration: any;
            title: any;
            detailUrl: any;
            postedDate: any;
            postedBy: any;
            companyInCharge: any;
            orgMan: any;
            exceptionRow: any;
            elements: any;
        } | null>;
        settingListByOid: (_: unknown, { oid }: {
            oid: number;
        }) => Promise<{
            oid: any;
            orgName: any;
            url: any;
            detailUrl: any;
            iframe: any;
            rowXpath: any;
            paging: any;
            startPage: any;
            endPage: any;
            login: any;
            use: any;
            orgRegion: any;
            registration: any;
            title: any;
            postedDate: any;
            postedBy: any;
            companyInCharge: any;
            orgMan: any;
            exceptionRow: any;
            elements: any;
        } | null>;
        settingsNoticeListByOrg: (_: unknown, { orgName }: {
            orgName: string;
        }) => Promise<any>;
        settingsNoticeDetailAll: () => Promise<any>;
        settingsNoticeDetailOne: (_: unknown, { oid }: {
            oid: number;
        }) => Promise<{
            oid: any;
            orgName: any;
            title: any;
            bodyHtml: any;
            fileName: any;
            fileUrl: any;
            preview: any;
            noticeDiv: any;
            noticeNum: any;
            orgDept: any;
            orgMan: any;
            orgTel: any;
            use: any;
            sampleUrl: any;
            down: any;
        } | null>;
        settingsDetailByOid: (_: unknown, { oid }: {
            oid: number;
        }) => Promise<{
            oid: any;
            orgName: any;
            title: any;
            bodyHtml: any;
            fileName: any;
            fileUrl: any;
            preview: any;
            noticeDiv: any;
            noticeNum: any;
            orgDept: any;
            orgMan: any;
            orgTel: any;
            use: any;
            sampleUrl: any;
            down: any;
        } | null>;
        settingsNoticeDetailByOrg: (_: unknown, { orgName }: {
            orgName: string;
        }) => Promise<any>;
        settingsNoticeCategoryAll: () => Promise<any>;
        settingsNoticeCategoryByCategory: (_: unknown, { category }: {
            category: string;
        }) => Promise<any>;
        settingsNoticeCategoryParseKeywordWeights: (_: unknown, { keywordWeightStr }: {
            keywordWeightStr: string;
        }) => Promise<any>;
        settingsNasPathAll: () => Promise<any>;
        settingsNasPathOne: (_: unknown, { id }: {
            id: string;
        }) => Promise<{
            id: any;
            pathName: any;
            pathValue: any;
            description: any;
            isActive: any;
        } | null>;
        settingsAppDefaultAll: () => Promise<any>;
        settingsAppDefaultByCategory: (_: unknown, { category }: {
            category: string;
        }) => Promise<any>;
        settingsAppDefaultOne: (_: unknown, { settingKey }: {
            settingKey: string;
        }) => Promise<{
            id: any;
            settingKey: any;
            settingValue: any;
            description: any;
            category: any;
        } | null>;
    };
    Mutation: {
        settingsNoticeListCreate: (_: unknown, { input }: {
            input: SettingsNoticeListInput;
        }) => Promise<{
            oid: any;
            orgName: any;
            url: any;
            iframe: any;
            rowXpath: any;
            paging: any;
            startPage: any;
            endPage: any;
            login: any;
            use: any;
            orgRegion: any;
            registration: any;
            title: any;
            detailUrl: any;
            postedDate: any;
            postedBy: any;
            companyInCharge: any;
            orgMan: any;
            exceptionRow: any;
        }>;
        settingsNoticeListUpdate: (_: unknown, { input }: {
            input: SettingsNoticeListInput;
        }) => Promise<{
            oid: any;
            orgName: any;
            url: any;
            iframe: any;
            rowXpath: any;
            paging: any;
            startPage: any;
            endPage: any;
            login: any;
            use: any;
            orgRegion: any;
            registration: any;
            title: any;
            detailUrl: any;
            postedDate: any;
            postedBy: any;
            companyInCharge: any;
            orgMan: any;
            exceptionRow: any;
        }>;
        settingsNoticeListDelete: (_: unknown, { oid }: {
            oid: number;
        }) => Promise<boolean>;
        settingsNoticeDetailCreate: (_: unknown, { input }: {
            input: SettingsNoticeDetailInput;
        }) => Promise<{
            oid: any;
            orgName: any;
            title: any;
            bodyHtml: any;
            fileName: any;
            fileUrl: any;
            preview: any;
            noticeDiv: any;
            noticeNum: any;
            orgDept: any;
            orgMan: any;
            orgTel: any;
            use: any;
            sampleUrl: any;
            down: any;
        }>;
        settingsNoticeDetailUpdate: (_: unknown, { input }: {
            input: SettingsNoticeDetailInput;
        }) => Promise<{
            oid: any;
            orgName: any;
            title: any;
            bodyHtml: any;
            fileName: any;
            fileUrl: any;
            preview: any;
            noticeDiv: any;
            noticeNum: any;
            orgDept: any;
            orgMan: any;
            orgTel: any;
            use: any;
            sampleUrl: any;
            down: any;
        }>;
        settingsNoticeDetailDelete: (_: unknown, { oid }: {
            oid: number;
        }) => Promise<boolean>;
        upsertSettingsDetailByOid: (_: unknown, { oid, input }: {
            oid: number;
            input: SettingsNoticeDetailInput;
        }) => Promise<{
            oid: any;
            orgName: any;
            title: any;
            bodyHtml: any;
            fileName: any;
            fileUrl: any;
            preview: any;
            noticeDiv: any;
            noticeNum: any;
            orgDept: any;
            orgMan: any;
            orgTel: any;
            use: any;
            sampleUrl: any;
            down: any;
        }>;
        settingsNoticeCategoryCreate: (_: unknown, { input }: {
            input: SettingsNoticeCategoryInput;
        }) => Promise<{
            sn: any;
            keywords: any;
            nots: any;
            minPoint: any;
            category: any;
            creator: any;
            memo: any;
        }>;
        settingsNoticeCategoryUpdate: (_: unknown, { input }: {
            input: SettingsNoticeCategoryInput;
        }) => Promise<{
            sn: any;
            keywords: any;
            nots: any;
            minPoint: any;
            category: any;
            creator: any;
            memo: any;
        }>;
        settingsNoticeCategoryDelete: (_: unknown, { sn }: {
            sn: number;
        }) => Promise<boolean>;
        settingsNoticeCategoryWeightSearch: (_: unknown, { keywords, minPoint, field, tableName, addFields, addWhere }: {
            keywords: string;
            minPoint: number;
            field?: string;
            tableName?: string;
            addFields?: string[];
            addWhere?: string;
        }) => Promise<any>;
        settingsNoticeCategoryFilterNoticeList: (_: unknown, { notStr, dicts, field }: {
            notStr: string;
            dicts: unknown[];
            field?: string;
        }) => Promise<any>;
        settingsNasPathCreate: (_: unknown, { input }: {
            input: SettingsNasPathInput;
        }) => Promise<{
            id: any;
            pathName: any;
            pathValue: any;
            description: any;
            isActive: any;
        }>;
        settingsNasPathUpdate: (_: unknown, { input }: {
            input: SettingsNasPathInput;
        }) => Promise<{
            id: any;
            pathName: any;
            pathValue: any;
            description: any;
            isActive: any;
        }>;
        settingsNasPathDelete: (_: unknown, { id }: {
            id: string;
        }) => Promise<boolean>;
        settingsAppDefaultCreate: (_: unknown, { input }: {
            input: SettingsAppDefaultInput;
        }) => Promise<{
            id: any;
            settingKey: any;
            settingValue: any;
            description: any;
            category: any;
        }>;
        settingsAppDefaultUpdate: (_: unknown, { input }: {
            input: SettingsAppDefaultInput;
        }) => Promise<{
            id: any;
            settingKey: any;
            settingValue: any;
            description: any;
            category: any;
        }>;
        settingsAppDefaultDelete: (_: unknown, { id }: {
            id: string;
        }) => Promise<boolean>;
    };
};
export {};
//# sourceMappingURL=settings.d.ts.map