import { pool } from '@/utils/mysql';

interface G2bNoticeRow {
  id: number;
  bidNtceNo: string;
  bidNtceOrd?: string;
  reNtceYn?: string;
  rgstTyNm?: string;
  ntceKindNm?: string;
  intrbidYn?: string;
  bidNtceDt?: Date;
  refNo?: string;
  bidNtceNm: string;
  ntceInsttCd?: string;
  ntceInsttNm?: string;
  dminsttCd?: string;
  dminsttNm?: string;
  bidMethdNm?: string;
  cntrctCnclsMthdNm?: string;
  ntceInsttOfclNm?: string;
  ntceInsttOfclTelNo?: string;
  ntceInsttOfclEmailAdrs?: string;
  exctvNm?: string;
  bidQlfctRgstDt?: Date;
  cmmnSpldmdAgrmntRcptdocMethd?: string;
  cmmnSpldmdAgrmntClseDt?: Date;
  cmmnSpldmdCorpRgnLmtYn?: string;
  bidBeginDt?: Date;
  bidClseDt?: Date;
  opengDt?: Date;
  ntceSpecDocUrl1?: string;
  ntceSpecDocUrl2?: string;
  ntceSpecDocUrl3?: string;
  ntceSpecDocUrl4?: string;
  ntceSpecDocUrl5?: string;
  ntceSpecDocUrl6?: string;
  ntceSpecDocUrl7?: string;
  ntceSpecDocUrl8?: string;
  ntceSpecDocUrl9?: string;
  ntceSpecDocUrl10?: string;
  ntceSpecFileNm1?: string;
  ntceSpecFileNm2?: string;
  ntceSpecFileNm3?: string;
  ntceSpecFileNm4?: string;
  ntceSpecFileNm5?: string;
  ntceSpecFileNm6?: string;
  ntceSpecFileNm7?: string;
  ntceSpecFileNm8?: string;
  ntceSpecFileNm9?: string;
  ntceSpecFileNm10?: string;
  rbidPermsnYn?: string;
  pqApplDocRcptMthdNm?: string;
  pqApplDocRcptDt?: Date;
  tpEvalApplMthdNm?: string;
  tpEvalApplClseDt?: Date;
  jntcontrctDutyRgnNm1?: string;
  jntcontrctDutyRgnNm2?: string;
  jntcontrctDutyRgnNm3?: string;
  rgnDutyJntcontrctRt?: string;
  dtlsBidYn?: string;
  bidPrtcptLmtYn?: string;
  prearngPrceDcsnMthdNm?: string;
  totPrdprcNum?: string;
  drwtPrdprcNum?: string;
  asignBdgtAmt?: number;
  presmptPrce?: number;
  opengPlce?: string;
  dcmtgOprtnDt?: Date;
  dcmtgOprtnPlce?: string;
  bidNtceDtlUrl?: string;
  bidNtceUrl?: string;
  bidPrtcptFeePaymntYn?: string;
  bidPrtcptFee?: number;
  bidGrntymnyPaymntYn?: string;
  crdtrNm?: string;
  ppswGnrlSrvceYn?: string;
  srvceDivNm?: string;
  prdctClsfcLmtYn?: string;
  mnfctYn?: string;
  purchsObjPrdctList?: string;
  untyNtceNo?: string;
  cmmnSpldmdMethdCd?: string;
  cmmnSpldmdMethdNm?: string;
  stdNtceDocUrl?: string;
  brffcBidprcPermsnYn?: string;
  dsgntCmptYn?: string;
  arsltCmptYn?: string;
  pqEvalYn?: string;
  tpEvalYn?: string;
  ntceDscrptYn?: string;
  rsrvtnPrceReMkngMthdNm?: string;
  arsltApplDocRcptMthdNm?: string;
  arsltReqstdocRcptDt?: Date;
  orderPlanUntyNo?: string;
  sucsfbidLwltRate?: number;
  rgstDt?: Date;
  bfSpecRgstNo?: string;
  infoBizYn?: string;
  sucsfbidMthdCd?: string;
  sucsfbidMthdNm?: string;
  chgDt?: Date;
  dminsttOfclEmailAdrs?: string;
  indstrytyLmtYn?: string;
  chgNtceRsn?: string;
  rbidOpengDt?: Date;
  VAT?: number;
  indutyVAT?: number;
  rgnLmtBidLocplcJdgmBssCd?: string;
  rgnLmtBidLocplcJdgmBssNm?: string;
  pubPrcrmntLrgClsfcNm?: string;
  pubPrcrmntMidClsfcNm?: string;
  pubPrcrmntClsfcNo?: string;
  pubPrcrmntClsfcNm?: string;
  createdAt?: Date;
  updatedAt?: Date;
  category?: string;
  is_selected?: number;
}

// Helper function to format dates for GraphQL
const formatDate = (date: Date | null | undefined): string | null => {
  return date ? date.toISOString() : null;
};

// Helper function to transform database row to GraphQL type
const transformNoticeRow = (row: G2bNoticeRow) => {
  return {
    id: row.id.toString(),
    bidNtceNo: row.bidNtceNo,
    bidNtceOrd: row.bidNtceOrd || null,
    reNtceYn: row.reNtceYn || null,
    rgstTyNm: row.rgstTyNm || null,
    ntceKindNm: row.ntceKindNm || null,
    intrbidYn: row.intrbidYn || null,
    bidNtceDt: formatDate(row.bidNtceDt),
    refNo: row.refNo || null,
    bidNtceNm: row.bidNtceNm,
    ntceInsttCd: row.ntceInsttCd || null,
    ntceInsttNm: row.ntceInsttNm || null,
    dminsttCd: row.dminsttCd || null,
    dminsttNm: row.dminsttNm || null,
    bidMethdNm: row.bidMethdNm || null,
    cntrctCnclsMthdNm: row.cntrctCnclsMthdNm || null,
    ntceInsttOfclNm: row.ntceInsttOfclNm || null,
    ntceInsttOfclTelNo: row.ntceInsttOfclTelNo || null,
    ntceInsttOfclEmailAdrs: row.ntceInsttOfclEmailAdrs || null,
    exctvNm: row.exctvNm || null,
    bidQlfctRgstDt: formatDate(row.bidQlfctRgstDt),
    cmmnSpldmdAgrmntRcptdocMethd: row.cmmnSpldmdAgrmntRcptdocMethd || null,
    cmmnSpldmdAgrmntClseDt: formatDate(row.cmmnSpldmdAgrmntClseDt),
    cmmnSpldmdCorpRgnLmtYn: row.cmmnSpldmdCorpRgnLmtYn || null,
    bidBeginDt: formatDate(row.bidBeginDt),
    bidClseDt: formatDate(row.bidClseDt),
    opengDt: formatDate(row.opengDt),
    ntceSpecDocUrl1: row.ntceSpecDocUrl1 || null,
    ntceSpecDocUrl2: row.ntceSpecDocUrl2 || null,
    ntceSpecDocUrl3: row.ntceSpecDocUrl3 || null,
    ntceSpecDocUrl4: row.ntceSpecDocUrl4 || null,
    ntceSpecDocUrl5: row.ntceSpecDocUrl5 || null,
    ntceSpecDocUrl6: row.ntceSpecDocUrl6 || null,
    ntceSpecDocUrl7: row.ntceSpecDocUrl7 || null,
    ntceSpecDocUrl8: row.ntceSpecDocUrl8 || null,
    ntceSpecDocUrl9: row.ntceSpecDocUrl9 || null,
    ntceSpecDocUrl10: row.ntceSpecDocUrl10 || null,
    ntceSpecFileNm1: row.ntceSpecFileNm1 || null,
    ntceSpecFileNm2: row.ntceSpecFileNm2 || null,
    ntceSpecFileNm3: row.ntceSpecFileNm3 || null,
    ntceSpecFileNm4: row.ntceSpecFileNm4 || null,
    ntceSpecFileNm5: row.ntceSpecFileNm5 || null,
    ntceSpecFileNm6: row.ntceSpecFileNm6 || null,
    ntceSpecFileNm7: row.ntceSpecFileNm7 || null,
    ntceSpecFileNm8: row.ntceSpecFileNm8 || null,
    ntceSpecFileNm9: row.ntceSpecFileNm9 || null,
    ntceSpecFileNm10: row.ntceSpecFileNm10 || null,
    rbidPermsnYn: row.rbidPermsnYn || null,
    pqApplDocRcptMthdNm: row.pqApplDocRcptMthdNm || null,
    pqApplDocRcptDt: formatDate(row.pqApplDocRcptDt),
    tpEvalApplMthdNm: row.tpEvalApplMthdNm || null,
    tpEvalApplClseDt: formatDate(row.tpEvalApplClseDt),
    jntcontrctDutyRgnNm1: row.jntcontrctDutyRgnNm1 || null,
    jntcontrctDutyRgnNm2: row.jntcontrctDutyRgnNm2 || null,
    jntcontrctDutyRgnNm3: row.jntcontrctDutyRgnNm3 || null,
    rgnDutyJntcontrctRt: row.rgnDutyJntcontrctRt || null,
    dtlsBidYn: row.dtlsBidYn || null,
    bidPrtcptLmtYn: row.bidPrtcptLmtYn || null,
    prearngPrceDcsnMthdNm: row.prearngPrceDcsnMthdNm || null,
    totPrdprcNum: row.totPrdprcNum || null,
    drwtPrdprcNum: row.drwtPrdprcNum || null,
    asignBdgtAmt: row.asignBdgtAmt || null,
    presmptPrce: row.presmptPrce || null,
    opengPlce: row.opengPlce || null,
    dcmtgOprtnDt: formatDate(row.dcmtgOprtnDt),
    dcmtgOprtnPlce: row.dcmtgOprtnPlce || null,
    bidNtceDtlUrl: row.bidNtceDtlUrl || null,
    bidNtceUrl: row.bidNtceUrl || null,
    bidPrtcptFeePaymntYn: row.bidPrtcptFeePaymntYn || null,
    bidPrtcptFee: row.bidPrtcptFee || null,
    bidGrntymnyPaymntYn: row.bidGrntymnyPaymntYn || null,
    crdtrNm: row.crdtrNm || null,
    ppswGnrlSrvceYn: row.ppswGnrlSrvceYn || null,
    srvceDivNm: row.srvceDivNm || null,
    prdctClsfcLmtYn: row.prdctClsfcLmtYn || null,
    mnfctYn: row.mnfctYn || null,
    purchsObjPrdctList: row.purchsObjPrdctList || null,
    untyNtceNo: row.untyNtceNo || null,
    cmmnSpldmdMethdCd: row.cmmnSpldmdMethdCd || null,
    cmmnSpldmdMethdNm: row.cmmnSpldmdMethdNm || null,
    stdNtceDocUrl: row.stdNtceDocUrl || null,
    brffcBidprcPermsnYn: row.brffcBidprcPermsnYn || null,
    dsgntCmptYn: row.dsgntCmptYn || null,
    arsltCmptYn: row.arsltCmptYn || null,
    pqEvalYn: row.pqEvalYn || null,
    tpEvalYn: row.tpEvalYn || null,
    ntceDscrptYn: row.ntceDscrptYn || null,
    rsrvtnPrceReMkngMthdNm: row.rsrvtnPrceReMkngMthdNm || null,
    arsltApplDocRcptMthdNm: row.arsltApplDocRcptMthdNm || null,
    arsltReqstdocRcptDt: formatDate(row.arsltReqstdocRcptDt),
    orderPlanUntyNo: row.orderPlanUntyNo || null,
    sucsfbidLwltRate: row.sucsfbidLwltRate || null,
    rgstDt: formatDate(row.rgstDt),
    bfSpecRgstNo: row.bfSpecRgstNo || null,
    infoBizYn: row.infoBizYn || null,
    sucsfbidMthdCd: row.sucsfbidMthdCd || null,
    sucsfbidMthdNm: row.sucsfbidMthdNm || null,
    chgDt: formatDate(row.chgDt),
    dminsttOfclEmailAdrs: row.dminsttOfclEmailAdrs || null,
    indstrytyLmtYn: row.indstrytyLmtYn || null,
    chgNtceRsn: row.chgNtceRsn || null,
    rbidOpengDt: formatDate(row.rbidOpengDt),
    VAT: row.VAT || null,
    indutyVAT: row.indutyVAT || null,
    rgnLmtBidLocplcJdgmBssCd: row.rgnLmtBidLocplcJdgmBssCd || null,
    rgnLmtBidLocplcJdgmBssNm: row.rgnLmtBidLocplcJdgmBssNm || null,
    pubPrcrmntLrgClsfcNm: row.pubPrcrmntLrgClsfcNm || null,
    pubPrcrmntMidClsfcNm: row.pubPrcrmntMidClsfcNm || null,
    pubPrcrmntClsfcNo: row.pubPrcrmntClsfcNo || null,
    pubPrcrmntClsfcNm: row.pubPrcrmntClsfcNm || null,
    createdAt: formatDate(row.createdAt),
    updatedAt: formatDate(row.updatedAt),
    category: row.category || '무관',
    is_selected: row.is_selected || 0,

    // Computed fields for frontend compatibility
    title: row.bidNtceNm,
    orgName: row.ntceInsttNm || row.dminsttNm || '미지정',
    postedAt: formatDate(row.bidNtceDt || row.rgstDt),
    detailUrl: row.bidNtceDtlUrl || row.bidNtceUrl || '',
    region: extractRegionFromOrgName(row.ntceInsttNm || row.dminsttNm || ''),
    registration: formatDate(row.rgstDt) || formatDate(row.bidNtceDt) || ''
  };
};

// Helper function to extract region from organization name
const extractRegionFromOrgName = (orgName: string): string => {
  if (!orgName) return '미지정';

  const regions = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
  ];

  for (const region of regions) {
    if (orgName.includes(region)) {
      return region;
    }
  }

  return '기타';
};

// Note: Service functions removed to avoid path dependency issues
// Mutations that require the service will return error messages

export const noticesNaraResolvers = {
  Query: {
    naraNotices: async (_: unknown, { limit = 100, offset = 0, gap }: {
      limit?: number; offset?: number; gap?: number
    }) => {
      try {
        let query = `
          SELECT * FROM g2b_notices
          ORDER BY bidNtceDt DESC, rgstDt DESC, id DESC
          LIMIT ? OFFSET ?
        `;
        let params: any[] = [limit, offset];

        if (gap) {
          query = `
            SELECT * FROM g2b_notices
            WHERE bidNtceDt >= DATE_SUB(NOW(), INTERVAL ? DAY)
               OR rgstDt >= DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY bidNtceDt DESC, rgstDt DESC, id DESC
            LIMIT ? OFFSET ?
          `;
          params = [gap, gap, limit, offset];
        }

        const [rows] = await pool.execute(query, params) as [G2bNoticeRow[], any];
        console.log(`[naraNotices] Query executed: ${query}`);
        console.log(`[naraNotices] Params: ${JSON.stringify(params)}`);
        console.log(`[naraNotices] Found ${rows.length} rows`);
        if (rows.length > 0) {
          console.log(`[naraNotices] Sample row:`, rows[0]);
        }
        return rows.map(transformNoticeRow);
      } catch (error) {
        console.error('Error fetching Nara notices:', error);
        return [];
      }
    },

    naraNoticeById: async (_: unknown, { id }: { id: string }) => {
      try {
        const [rows] = await pool.execute(
          'SELECT * FROM g2b_notices WHERE id = ?',
          [parseInt(id)]
        ) as [G2bNoticeRow[], any];

        return rows.length > 0 ? transformNoticeRow(rows[0]) : null;
      } catch (error) {
        console.error('Error fetching Nara notice by ID:', error);
        return null;
      }
    },

    naraNoticeByBidNtceNo: async (_: unknown, { bidNtceNo }: { bidNtceNo: string }) => {
      try {
        const [rows] = await pool.execute(
          'SELECT * FROM g2b_notices WHERE bidNtceNo = ? ORDER BY bidNtceOrd DESC',
          [bidNtceNo]
        ) as [G2bNoticeRow[], any];

        return rows.map(transformNoticeRow);
      } catch (error) {
        console.error('Error fetching Nara notice by bidNtceNo:', error);
        return [];
      }
    },

    searchNaraNotices: async (_: unknown, { input }: { input: any }) => {
      try {
        const conditions: string[] = [];
        const params: any[] = [];

        if (input.bidNtceNm) {
          conditions.push('bidNtceNm LIKE ?');
          params.push(`%${input.bidNtceNm}%`);
        }

        if (input.ntceInsttNm) {
          conditions.push('ntceInsttNm LIKE ?');
          params.push(`%${input.ntceInsttNm}%`);
        }

        if (input.dminsttNm) {
          conditions.push('dminsttNm LIKE ?');
          params.push(`%${input.dminsttNm}%`);
        }

        if (input.bidNtceDtFrom) {
          conditions.push('bidNtceDt >= ?');
          params.push(input.bidNtceDtFrom);
        }

        if (input.bidNtceDtTo) {
          conditions.push('bidNtceDt <= ?');
          params.push(input.bidNtceDtTo);
        }

        if (input.bidClseDtFrom) {
          conditions.push('bidClseDt >= ?');
          params.push(input.bidClseDtFrom);
        }

        if (input.bidClseDtTo) {
          conditions.push('bidClseDt <= ?');
          params.push(input.bidClseDtTo);
        }

        if (input.opengDtFrom) {
          conditions.push('opengDt >= ?');
          params.push(input.opengDtFrom);
        }

        if (input.opengDtTo) {
          conditions.push('opengDt <= ?');
          params.push(input.opengDtTo);
        }

        if (input.pubPrcrmntClsfcNo) {
          conditions.push('pubPrcrmntClsfcNo = ?');
          params.push(input.pubPrcrmntClsfcNo);
        }

        if (input.pubPrcrmntClsfcNm) {
          conditions.push('pubPrcrmntClsfcNm LIKE ?');
          params.push(`%${input.pubPrcrmntClsfcNm}%`);
        }

        if (input.asignBdgtAmtMin) {
          conditions.push('asignBdgtAmt >= ?');
          params.push(input.asignBdgtAmtMin);
        }

        if (input.asignBdgtAmtMax) {
          conditions.push('asignBdgtAmt <= ?');
          params.push(input.asignBdgtAmtMax);
        }

        if (input.presmptPrceMin) {
          conditions.push('presmptPrce >= ?');
          params.push(input.presmptPrceMin);
        }

        if (input.presmptPrceMax) {
          conditions.push('presmptPrce <= ?');
          params.push(input.presmptPrceMax);
        }

        if (input.intrbidYn) {
          conditions.push('intrbidYn = ?');
          params.push(input.intrbidYn);
        }

        if (input.ppswGnrlSrvceYn) {
          conditions.push('ppswGnrlSrvceYn = ?');
          params.push(input.ppswGnrlSrvceYn);
        }

        if (input.srvceDivNm) {
          conditions.push('srvceDivNm = ?');
          params.push(input.srvceDivNm);
        }

        if (input.ntceKindNm) {
          conditions.push('ntceKindNm = ?');
          params.push(input.ntceKindNm);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const query = `
          SELECT * FROM g2b_notices
          ${whereClause}
          ORDER BY bidNtceDt DESC, rgstDt DESC, id DESC
          LIMIT ? OFFSET ?
        `;

        params.push(input.limit || 100, input.offset || 0);

        const [rows] = await pool.execute(query, params) as [G2bNoticeRow[], any];
        return rows.map(transformNoticeRow);
      } catch (error) {
        console.error('Error searching Nara notices:', error);
        return [];
      }
    },

    naraNoticesStatistics: async (_: unknown, { gap = 30 }: { gap?: number }) => {
      try {
        const [rows] = await pool.execute(`
          SELECT
            COALESCE(ntceInsttNm, dminsttNm, '미지정') as orgName,
            DATE(COALESCE(bidNtceDt, rgstDt)) as postedAt,
            CASE
              WHEN ntceInsttNm LIKE '%서울%' OR dminsttNm LIKE '%서울%' THEN '서울'
              WHEN ntceInsttNm LIKE '%부산%' OR dminsttNm LIKE '%부산%' THEN '부산'
              WHEN ntceInsttNm LIKE '%대구%' OR dminsttNm LIKE '%대구%' THEN '대구'
              WHEN ntceInsttNm LIKE '%인천%' OR dminsttNm LIKE '%인천%' THEN '인천'
              WHEN ntceInsttNm LIKE '%광주%' OR dminsttNm LIKE '%광주%' THEN '광주'
              WHEN ntceInsttNm LIKE '%대전%' OR dminsttNm LIKE '%대전%' THEN '대전'
              WHEN ntceInsttNm LIKE '%울산%' OR dminsttNm LIKE '%울산%' THEN '울산'
              WHEN ntceInsttNm LIKE '%세종%' OR dminsttNm LIKE '%세종%' THEN '세종'
              WHEN ntceInsttNm LIKE '%경기%' OR dminsttNm LIKE '%경기%' THEN '경기'
              WHEN ntceInsttNm LIKE '%강원%' OR dminsttNm LIKE '%강원%' THEN '강원'
              WHEN ntceInsttNm LIKE '%충북%' OR dminsttNm LIKE '%충북%' THEN '충북'
              WHEN ntceInsttNm LIKE '%충남%' OR dminsttNm LIKE '%충남%' THEN '충남'
              WHEN ntceInsttNm LIKE '%전북%' OR dminsttNm LIKE '%전북%' THEN '전북'
              WHEN ntceInsttNm LIKE '%전남%' OR dminsttNm LIKE '%전남%' THEN '전남'
              WHEN ntceInsttNm LIKE '%경북%' OR dminsttNm LIKE '%경북%' THEN '경북'
              WHEN ntceInsttNm LIKE '%경남%' OR dminsttNm LIKE '%경남%' THEN '경남'
              WHEN ntceInsttNm LIKE '%제주%' OR dminsttNm LIKE '%제주%' THEN '제주'
              ELSE '기타'
            END as region,
            pubPrcrmntClsfcNm
          FROM g2b_notices
          WHERE (bidNtceDt >= DATE_SUB(NOW(), INTERVAL ? DAY) OR rgstDt >= DATE_SUB(NOW(), INTERVAL ? DAY))
        `, [gap, gap]) as [any[], any];

        return rows.map(row => ({
          orgName: row.orgName,
          postedAt: row.postedAt?.toISOString()?.split('T')[0] || '',
          region: row.region,
          pubPrcrmntClsfcNm: row.pubPrcrmntClsfcNm || ''
        }));
      } catch (error) {
        console.error('Error fetching Nara notices statistics:', error);
        return [];
      }
    },

    naraNoticesRegionStatistics: async (_: unknown, { gap = 30 }: { gap?: number }) => {
      try {
        const [rows] = await pool.execute(`
          SELECT
            CASE
              WHEN ntceInsttNm LIKE '%서울%' OR dminsttNm LIKE '%서울%' THEN '서울'
              WHEN ntceInsttNm LIKE '%부산%' OR dminsttNm LIKE '%부산%' THEN '부산'
              WHEN ntceInsttNm LIKE '%대구%' OR dminsttNm LIKE '%대구%' THEN '대구'
              WHEN ntceInsttNm LIKE '%인천%' OR dminsttNm LIKE '%인천%' THEN '인천'
              WHEN ntceInsttNm LIKE '%광주%' OR dminsttNm LIKE '%광주%' THEN '광주'
              WHEN ntceInsttNm LIKE '%대전%' OR dminsttNm LIKE '%대전%' THEN '대전'
              WHEN ntceInsttNm LIKE '%울산%' OR dminsttNm LIKE '%울산%' THEN '울산'
              WHEN ntceInsttNm LIKE '%세종%' OR dminsttNm LIKE '%세종%' THEN '세종'
              WHEN ntceInsttNm LIKE '%경기%' OR dminsttNm LIKE '%경기%' THEN '경기'
              WHEN ntceInsttNm LIKE '%강원%' OR dminsttNm LIKE '%강원%' THEN '강원'
              WHEN ntceInsttNm LIKE '%충북%' OR dminsttNm LIKE '%충북%' THEN '충북'
              WHEN ntceInsttNm LIKE '%충남%' OR dminsttNm LIKE '%충남%' THEN '충남'
              WHEN ntceInsttNm LIKE '%전북%' OR dminsttNm LIKE '%전북%' THEN '전북'
              WHEN ntceInsttNm LIKE '%전남%' OR dminsttNm LIKE '%전남%' THEN '전남'
              WHEN ntceInsttNm LIKE '%경북%' OR dminsttNm LIKE '%경북%' THEN '경북'
              WHEN ntceInsttNm LIKE '%경남%' OR dminsttNm LIKE '%경남%' THEN '경남'
              WHEN ntceInsttNm LIKE '%제주%' OR dminsttNm LIKE '%제주%' THEN '제주'
              ELSE '기타'
            END as region,
            COUNT(*) as noticeCount
          FROM g2b_notices
          WHERE (bidNtceDt >= DATE_SUB(NOW(), INTERVAL ? DAY) OR rgstDt >= DATE_SUB(NOW(), INTERVAL ? DAY))
          GROUP BY region
          ORDER BY noticeCount DESC
        `, [gap, gap]) as [any[], any];

        return rows.map(row => ({
          region: row.region,
          noticeCount: row.noticeCount
        }));
      } catch (error) {
        console.error('Error fetching Nara notices region statistics:', error);
        return [];
      }
    },

    naraNoticesByClassification: async (_: unknown, {
      pubPrcrmntClsfcNo, pubPrcrmntClsfcNm, gap = 30, limit = 100
    }: {
      pubPrcrmntClsfcNo?: string; pubPrcrmntClsfcNm?: string; gap?: number; limit?: number
    }) => {
      try {
        const conditions: string[] = [];
        const params: any[] = [];

        // Add date filter
        conditions.push('(bidNtceDt >= DATE_SUB(NOW(), INTERVAL ? DAY) OR rgstDt >= DATE_SUB(NOW(), INTERVAL ? DAY))');
        params.push(gap, gap);

        if (pubPrcrmntClsfcNo) {
          conditions.push('pubPrcrmntClsfcNo = ?');
          params.push(pubPrcrmntClsfcNo);
        }

        if (pubPrcrmntClsfcNm) {
          conditions.push('pubPrcrmntClsfcNm LIKE ?');
          params.push(`%${pubPrcrmntClsfcNm}%`);
        }

        const query = `
          SELECT * FROM g2b_notices
          WHERE ${conditions.join(' AND ')}
          ORDER BY bidNtceDt DESC, rgstDt DESC, id DESC
          LIMIT ?
        `;
        params.push(limit);

        const [rows] = await pool.execute(query, params) as [G2bNoticeRow[], any];
        return rows.map(transformNoticeRow);
      } catch (error) {
        console.error('Error fetching Nara notices by classification:', error);
        return [];
      }
    },

    naraNoticesByOrg: async (_: unknown, {
      ntceInsttCd, ntceInsttNm, dminsttCd, dminsttNm, gap = 30, limit = 100
    }: {
      ntceInsttCd?: string; ntceInsttNm?: string; dminsttCd?: string; dminsttNm?: string;
      gap?: number; limit?: number
    }) => {
      try {
        const conditions: string[] = [];
        const params: any[] = [];

        // Add date filter
        conditions.push('(bidNtceDt >= DATE_SUB(NOW(), INTERVAL ? DAY) OR rgstDt >= DATE_SUB(NOW(), INTERVAL ? DAY))');
        params.push(gap, gap);

        if (ntceInsttCd) {
          conditions.push('ntceInsttCd = ?');
          params.push(ntceInsttCd);
        }

        if (ntceInsttNm) {
          conditions.push('ntceInsttNm LIKE ?');
          params.push(`%${ntceInsttNm}%`);
        }

        if (dminsttCd) {
          conditions.push('dminsttCd = ?');
          params.push(dminsttCd);
        }

        if (dminsttNm) {
          conditions.push('dminsttNm LIKE ?');
          params.push(`%${dminsttNm}%`);
        }

        const query = `
          SELECT * FROM g2b_notices
          WHERE ${conditions.join(' AND ')}
          ORDER BY bidNtceDt DESC, rgstDt DESC, id DESC
          LIMIT ?
        `;
        params.push(limit);

        const [rows] = await pool.execute(query, params) as [G2bNoticeRow[], any];
        return rows.map(transformNoticeRow);
      } catch (error) {
        console.error('Error fetching Nara notices by organization:', error);
        return [];
      }
    },

    recentNaraNotices: async (_: unknown, { days = 7, limit = 50 }: { days?: number; limit?: number }) => {
      try {
        const [rows] = await pool.execute(`
          SELECT * FROM g2b_notices
          WHERE (bidNtceDt >= DATE_SUB(NOW(), INTERVAL ? DAY) OR rgstDt >= DATE_SUB(NOW(), INTERVAL ? DAY))
          ORDER BY bidNtceDt DESC, rgstDt DESC, id DESC
          LIMIT ?
        `, [days, days, limit]) as [G2bNoticeRow[], any];

        return rows.map(transformNoticeRow);
      } catch (error) {
        console.error('Error fetching recent Nara notices:', error);
        return [];
      }
    },

    upcomingNaraBidDeadlines: async (_: unknown, { days = 7, limit = 50 }: { days?: number; limit?: number }) => {
      try {
        const [rows] = await pool.execute(`
          SELECT * FROM g2b_notices
          WHERE bidClseDt BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
          ORDER BY bidClseDt ASC
          LIMIT ?
        `, [days, limit]) as [G2bNoticeRow[], any];

        return rows.map(transformNoticeRow);
      } catch (error) {
        console.error('Error fetching upcoming Nara bid deadlines:', error);
        return [];
      }
    },

    naraNoticesByCategory: async (_: unknown, { category, gap = 30, limit = 100 }: {
      category: string; gap?: number; limit?: number
    }) => {
      try {
        const [rows] = await pool.execute(`
          SELECT * FROM g2b_notices
          WHERE category = ?
            AND (bidNtceDt >= DATE_SUB(NOW(), INTERVAL ? DAY) OR rgstDt >= DATE_SUB(NOW(), INTERVAL ? DAY))
          ORDER BY bidNtceDt DESC, rgstDt DESC, id DESC
          LIMIT ?
        `, [category, gap, gap, limit]) as [G2bNoticeRow[], any];

        return rows.map(transformNoticeRow);
      } catch (error) {
        console.error('Error fetching Nara notices by category:', error);
        return [];
      }
    },

    naraNoticesByCategories: async (_: unknown, { categories, gap = 30, limit = 100 }: {
      categories: string[]; gap?: number; limit?: number
    }) => {
      try {
        const categoryPlaceholders = categories.map(() => '?').join(',');
        const [rows] = await pool.execute(`
          SELECT * FROM g2b_notices
          WHERE category IN (${categoryPlaceholders})
            AND (bidNtceDt >= DATE_SUB(NOW(), INTERVAL ? DAY) OR rgstDt >= DATE_SUB(NOW(), INTERVAL ? DAY))
          ORDER BY bidNtceDt DESC, rgstDt DESC, id DESC
          LIMIT ?
        `, [...categories, gap, gap, limit]) as [G2bNoticeRow[], any];

        return rows.map(transformNoticeRow);
      } catch (error) {
        console.error('Error fetching Nara notices by categories:', error);
        return [];
      }
    },

    excludedNaraNotices: async (_: unknown, { gap = 30, limit = 100 }: {
      gap?: number; limit?: number
    }) => {
      try {
        const [rows] = await pool.execute(`
          SELECT * FROM g2b_notices
          WHERE is_selected = -1
            AND (bidNtceDt >= DATE_SUB(NOW(), INTERVAL ? DAY) OR rgstDt >= DATE_SUB(NOW(), INTERVAL ? DAY))
          ORDER BY bidNtceDt DESC, rgstDt DESC, id DESC
          LIMIT ?
        `, [gap, gap, limit]) as [G2bNoticeRow[], any];

        return rows.map(transformNoticeRow);
      } catch (error) {
        console.error('Error fetching excluded Nara notices:', error);
        return [];
      }
    }
  },

  Mutation: {
    collectNaraNotices: async () => {
      return {
        success: false,
        message: '나라장터 수집 기능은 별도 API 서버에서 제공됩니다.',
        totalCount: 0,
        collectedCount: 0,
        newCount: 0,
        updatedCount: 0,
        errorCount: 1
      };
    },

    collectTodayNaraNotices: async () => {
      return {
        success: false,
        message: '나라장터 수집 기능은 별도 API 서버에서 제공됩니다.',
        totalCount: 0,
        collectedCount: 0,
        newCount: 0,
        updatedCount: 0,
        errorCount: 1
      };
    },

    collectLatestNaraNotices: async () => {
      return {
        success: false,
        message: '나라장터 수집 기능은 별도 API 서버에서 제공됩니다.',
        totalCount: 0,
        collectedCount: 0,
        newCount: 0,
        updatedCount: 0,
        errorCount: 1
      };
    },

    upsertNaraNotice: async (_: unknown, { notice }: { notice: any }) => {
      try {
        // Convert input to database format
        const dbData = {
          ...notice,
          bidNtceDt: notice.bidNtceDt ? new Date(notice.bidNtceDt) : null,
          bidQlfctRgstDt: notice.bidQlfctRgstDt ? new Date(notice.bidQlfctRgstDt) : null,
          cmmnSpldmdAgrmntClseDt: notice.cmmnSpldmdAgrmntClseDt ? new Date(notice.cmmnSpldmdAgrmntClseDt) : null,
          bidBeginDt: notice.bidBeginDt ? new Date(notice.bidBeginDt) : null,
          bidClseDt: notice.bidClseDt ? new Date(notice.bidClseDt) : null,
          opengDt: notice.opengDt ? new Date(notice.opengDt) : null,
          pqApplDocRcptDt: notice.pqApplDocRcptDt ? new Date(notice.pqApplDocRcptDt) : null,
          tpEvalApplClseDt: notice.tpEvalApplClseDt ? new Date(notice.tpEvalApplClseDt) : null,
          dcmtgOprtnDt: notice.dcmtgOprtnDt ? new Date(notice.dcmtgOprtnDt) : null,
          arsltReqstdocRcptDt: notice.arsltReqstdocRcptDt ? new Date(notice.arsltReqstdocRcptDt) : null,
          rgstDt: notice.rgstDt ? new Date(notice.rgstDt) : null,
          chgDt: notice.chgDt ? new Date(notice.chgDt) : null,
          rbidOpengDt: notice.rbidOpengDt ? new Date(notice.rbidOpengDt) : null
        };

        // Check if notice exists
        const [existingRows] = await pool.execute(
          'SELECT id FROM g2b_notices WHERE bidNtceNo = ? AND bidNtceOrd = ?',
          [notice.bidNtceNo, notice.bidNtceOrd || '0']
        ) as [any[], any];

        let result;
        if (existingRows.length > 0) {
          // Update existing
          const fields = Object.keys(dbData).map(key => `${key} = ?`).join(', ');
          const values = Object.values(dbData);
          await pool.execute(
            `UPDATE g2b_notices SET ${fields} WHERE id = ?`,
            [...values, existingRows[0].id]
          );
          result = existingRows[0].id;
        } else {
          // Insert new
          const fields = Object.keys(dbData).join(', ');
          const placeholders = Object.keys(dbData).map(() => '?').join(', ');
          const values = Object.values(dbData);
          const [insertResult] = await pool.execute(
            `INSERT INTO g2b_notices (${fields}) VALUES (${placeholders})`,
            values
          ) as [any, any];
          result = insertResult.insertId;
        }

        // Fetch and return the upserted record
        const [rows] = await pool.execute(
          'SELECT * FROM g2b_notices WHERE id = ?',
          [result]
        ) as [G2bNoticeRow[], any];

        return transformNoticeRow(rows[0]);
      } catch (error) {
        console.error('Error upserting Nara notice:', error);
        throw new Error('Failed to upsert Nara notice');
      }
    },

    upsertNaraNotices: async (_: unknown, { notices }: { notices: any[] }) => {
      const results = [];

      for (const notice of notices) {
        try {
          const result = await noticesNaraResolvers.Mutation.upsertNaraNotice(_, { notice });
          results.push(result);
        } catch (error) {
          console.error('Error in batch upsert:', error);
          // Continue with other notices even if one fails
        }
      }

      return results;
    }
  }
};