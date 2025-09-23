import { gql } from 'graphql-tag';

export const noticesNaraTypeDefs = gql`
  type NaraNotice {
    id: ID!
    bidNtceNo: String!
    bidNtceOrd: String
    reNtceYn: String
    rgstTyNm: String
    ntceKindNm: String
    intrbidYn: String
    bidNtceDt: String
    refNo: String
    bidNtceNm: String!
    ntceInsttCd: String
    ntceInsttNm: String
    dminsttCd: String
    dminsttNm: String
    bidMethdNm: String
    cntrctCnclsMthdNm: String
    ntceInsttOfclNm: String
    ntceInsttOfclTelNo: String
    ntceInsttOfclEmailAdrs: String
    exctvNm: String
    bidQlfctRgstDt: String
    cmmnSpldmdAgrmntRcptdocMethd: String
    cmmnSpldmdAgrmntClseDt: String
    cmmnSpldmdCorpRgnLmtYn: String
    bidBeginDt: String
    bidClseDt: String
    opengDt: String
    ntceSpecDocUrl1: String
    ntceSpecDocUrl2: String
    ntceSpecDocUrl3: String
    ntceSpecDocUrl4: String
    ntceSpecDocUrl5: String
    ntceSpecDocUrl6: String
    ntceSpecDocUrl7: String
    ntceSpecDocUrl8: String
    ntceSpecDocUrl9: String
    ntceSpecDocUrl10: String
    ntceSpecFileNm1: String
    ntceSpecFileNm2: String
    ntceSpecFileNm3: String
    ntceSpecFileNm4: String
    ntceSpecFileNm5: String
    ntceSpecFileNm6: String
    ntceSpecFileNm7: String
    ntceSpecFileNm8: String
    ntceSpecFileNm9: String
    ntceSpecFileNm10: String
    rbidPermsnYn: String
    pqApplDocRcptMthdNm: String
    pqApplDocRcptDt: String
    tpEvalApplMthdNm: String
    tpEvalApplClseDt: String
    jntcontrctDutyRgnNm1: String
    jntcontrctDutyRgnNm2: String
    jntcontrctDutyRgnNm3: String
    rgnDutyJntcontrctRt: String
    dtlsBidYn: String
    bidPrtcptLmtYn: String
    prearngPrceDcsnMthdNm: String
    totPrdprcNum: String
    drwtPrdprcNum: String
    asignBdgtAmt: Float
    presmptPrce: Float
    opengPlce: String
    dcmtgOprtnDt: String
    dcmtgOprtnPlce: String
    bidNtceDtlUrl: String
    bidNtceUrl: String
    bidPrtcptFeePaymntYn: String
    bidPrtcptFee: Float
    bidGrntymnyPaymntYn: String
    crdtrNm: String
    ppswGnrlSrvceYn: String
    srvceDivNm: String
    prdctClsfcLmtYn: String
    mnfctYn: String
    purchsObjPrdctList: String
    untyNtceNo: String
    cmmnSpldmdMethdCd: String
    cmmnSpldmdMethdNm: String
    stdNtceDocUrl: String
    brffcBidprcPermsnYn: String
    dsgntCmptYn: String
    arsltCmptYn: String
    pqEvalYn: String
    tpEvalYn: String
    ntceDscrptYn: String
    rsrvtnPrceReMkngMthdNm: String
    arsltApplDocRcptMthdNm: String
    arsltReqstdocRcptDt: String
    orderPlanUntyNo: String
    sucsfbidLwltRate: Float
    rgstDt: String
    bfSpecRgstNo: String
    infoBizYn: String
    sucsfbidMthdCd: String
    sucsfbidMthdNm: String
    chgDt: String
    dminsttOfclEmailAdrs: String
    indstrytyLmtYn: String
    chgNtceRsn: String
    rbidOpengDt: String
    VAT: Float
    indutyVAT: Float
    rgnLmtBidLocplcJdgmBssCd: String
    rgnLmtBidLocplcJdgmBssNm: String
    pubPrcrmntLrgClsfcNm: String
    pubPrcrmntMidClsfcNm: String
    pubPrcrmntClsfcNo: String
    pubPrcrmntClsfcNm: String
    createdAt: String
    updatedAt: String
    category: String
    is_selected: Int

    # Computed fields for compatibility with existing frontend
    title: String
    orgName: String
    postedAt: String
    detailUrl: String
    region: String
    registration: String
  }

  type NaraNoticeStatistics {
    orgName: String!
    postedAt: String!
    region: String!
    pubPrcrmntClsfcNm: String
  }

  type NaraRegionStatistics {
    region: String!
    noticeCount: Int!
  }

  type NaraCollectionResult {
    success: Boolean!
    message: String!
    totalCount: Int!
    collectedCount: Int!
    newCount: Int!
    updatedCount: Int!
    errorCount: Int!
  }

  input NaraNoticeSearchInput {
    bidNtceNm: String
    ntceInsttNm: String
    dminsttNm: String
    bidNtceDtFrom: String
    bidNtceDtTo: String
    bidClseDtFrom: String
    bidClseDtTo: String
    opengDtFrom: String
    opengDtTo: String
    pubPrcrmntClsfcNo: String
    pubPrcrmntClsfcNm: String
    asignBdgtAmtMin: Float
    asignBdgtAmtMax: Float
    presmptPrceMin: Float
    presmptPrceMax: Float
    intrbidYn: String
    ppswGnrlSrvceYn: String
    srvceDivNm: String
    ntceKindNm: String
    limit: Int = 100
    offset: Int = 0
  }

  extend type Query {
    # Get all Nara notices with optional filtering
    naraNotices(
      limit: Int = 100
      offset: Int = 0
      gap: Int
    ): [NaraNotice!]!

    # Get single Nara notice by ID
    naraNoticeById(id: ID!): NaraNotice

    # Get Nara notices by bidNtceNo
    naraNoticeByBidNtceNo(bidNtceNo: String!): [NaraNotice!]!

    # Search Nara notices with complex criteria
    searchNaraNotices(input: NaraNoticeSearchInput!): [NaraNotice!]!

    # Get Nara notice statistics
    naraNoticesStatistics(gap: Int = 30): [NaraNoticeStatistics!]!

    # Get region statistics for Nara notices
    naraNoticesRegionStatistics(gap: Int = 30): [NaraRegionStatistics!]!

    # Get Nara notices by classification
    naraNoticesByClassification(
      pubPrcrmntClsfcNo: String
      pubPrcrmntClsfcNm: String
      gap: Int = 30
      limit: Int = 100
    ): [NaraNotice!]!

    # Get Nara notices by organization
    naraNoticesByOrg(
      ntceInsttCd: String
      ntceInsttNm: String
      dminsttCd: String
      dminsttNm: String
      gap: Int = 30
      limit: Int = 100
    ): [NaraNotice!]!

    # Get Nara notices by category
    naraNoticesByCategory(
      category: String!
      gap: Int = 30
      limit: Int = 100
    ): [NaraNotice!]!

    # Get Nara notices by categories
    naraNoticesByCategories(
      categories: [String!]!
      gap: Int = 30
      limit: Int = 100
    ): [NaraNotice!]!

    # Get excluded Nara notices (is_selected = -1)
    excludedNaraNotices(
      gap: Int = 30
      limit: Int = 100
    ): [NaraNotice!]!

    # Get recent Nara notices (for dashboard)
    recentNaraNotices(days: Int = 7, limit: Int = 50): [NaraNotice!]!

    # Get upcoming bid deadlines
    upcomingNaraBidDeadlines(days: Int = 7, limit: Int = 50): [NaraNotice!]!
  }

  extend type Mutation {
    # Collect Nara notices from government API
    collectNaraNotices(
      startDate: String
      endDate: String
      areaCode: String
      orgName: String
      bidKind: String
      saveToDatabase: Boolean = true
      applyKeywordMatching: Boolean = true
    ): NaraCollectionResult!

    # Collect today's Nara notices
    collectTodayNaraNotices(
      saveToDatabase: Boolean = true
      applyKeywordMatching: Boolean = true
    ): NaraCollectionResult!

    # Collect latest Nara notices (last N days)
    collectLatestNaraNotices(
      days: Int = 3
      saveToDatabase: Boolean = true
      applyKeywordMatching: Boolean = true
    ): NaraCollectionResult!

    # Manual insert/update of Nara notice
    upsertNaraNotice(notice: NaraNoticeInput!): NaraNotice!

    # Batch upsert Nara notices
    upsertNaraNotices(notices: [NaraNoticeInput!]!): [NaraNotice!]!
  }

  input NaraNoticeInput {
    bidNtceNo: String!
    bidNtceOrd: String
    reNtceYn: String
    rgstTyNm: String
    ntceKindNm: String
    intrbidYn: String
    bidNtceDt: String
    refNo: String
    bidNtceNm: String!
    ntceInsttCd: String
    ntceInsttNm: String
    dminsttCd: String
    dminsttNm: String
    bidMethdNm: String
    cntrctCnclsMthdNm: String
    ntceInsttOfclNm: String
    ntceInsttOfclTelNo: String
    ntceInsttOfclEmailAdrs: String
    exctvNm: String
    bidQlfctRgstDt: String
    cmmnSpldmdAgrmntRcptdocMethd: String
    cmmnSpldmdAgrmntClseDt: String
    cmmnSpldmdCorpRgnLmtYn: String
    bidBeginDt: String
    bidClseDt: String
    opengDt: String
    ntceSpecDocUrl1: String
    ntceSpecDocUrl2: String
    ntceSpecDocUrl3: String
    ntceSpecDocUrl4: String
    ntceSpecDocUrl5: String
    ntceSpecDocUrl6: String
    ntceSpecDocUrl7: String
    ntceSpecDocUrl8: String
    ntceSpecDocUrl9: String
    ntceSpecDocUrl10: String
    ntceSpecFileNm1: String
    ntceSpecFileNm2: String
    ntceSpecFileNm3: String
    ntceSpecFileNm4: String
    ntceSpecFileNm5: String
    ntceSpecFileNm6: String
    ntceSpecFileNm7: String
    ntceSpecFileNm8: String
    ntceSpecFileNm9: String
    ntceSpecFileNm10: String
    rbidPermsnYn: String
    pqApplDocRcptMthdNm: String
    pqApplDocRcptDt: String
    tpEvalApplMthdNm: String
    tpEvalApplClseDt: String
    jntcontrctDutyRgnNm1: String
    jntcontrctDutyRgnNm2: String
    jntcontrctDutyRgnNm3: String
    rgnDutyJntcontrctRt: String
    dtlsBidYn: String
    bidPrtcptLmtYn: String
    prearngPrceDcsnMthdNm: String
    totPrdprcNum: String
    drwtPrdprcNum: String
    asignBdgtAmt: Float
    presmptPrce: Float
    opengPlce: String
    dcmtgOprtnDt: String
    dcmtgOprtnPlce: String
    bidNtceDtlUrl: String
    bidNtceUrl: String
    bidPrtcptFeePaymntYn: String
    bidPrtcptFee: Float
    bidGrntymnyPaymntYn: String
    crdtrNm: String
    ppswGnrlSrvceYn: String
    srvceDivNm: String
    prdctClsfcLmtYn: String
    mnfctYn: String
    purchsObjPrdctList: String
    untyNtceNo: String
    cmmnSpldmdMethdCd: String
    cmmnSpldmdMethdNm: String
    stdNtceDocUrl: String
    brffcBidprcPermsnYn: String
    dsgntCmptYn: String
    arsltCmptYn: String
    pqEvalYn: String
    tpEvalYn: String
    ntceDscrptYn: String
    rsrvtnPrceReMkngMthdNm: String
    arsltApplDocRcptMthdNm: String
    arsltReqstdocRcptDt: String
    orderPlanUntyNo: String
    sucsfbidLwltRate: Float
    rgstDt: String
    bfSpecRgstNo: String
    infoBizYn: String
    sucsfbidMthdCd: String
    sucsfbidMthdNm: String
    chgDt: String
    dminsttOfclEmailAdrs: String
    indstrytyLmtYn: String
    chgNtceRsn: String
    rbidOpengDt: String
    VAT: Float
    indutyVAT: Float
    rgnLmtBidLocplcJdgmBssCd: String
    rgnLmtBidLocplcJdgmBssNm: String
    pubPrcrmntLrgClsfcNm: String
    pubPrcrmntMidClsfcNm: String
    pubPrcrmntClsfcNo: String
    pubPrcrmntClsfcNm: String
  }
`;