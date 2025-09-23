/**
 * Bid notice data parser
 * Converts raw API data to database-compatible format
 */

import { G2bNotice } from './models.js';
import { BidNoticeRawItem } from './api-client.js';

export interface ParsedAttachment {
  field: string;
  value: string;
}

export class BidNoticeParser {
  /**
   * Parse date string to Date object
   */
  static parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    try {
      // YYYYMMDD format
      if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
        const day = parseInt(dateStr.substring(6, 8));
        return new Date(year, month, day);
      }

      // YYYY-MM-DD format
      if (dateStr.includes('-')) {
        const date = new Date(dateStr.substring(0, 10));
        return isNaN(date.getTime()) ? null : date;
      }

      return null;
    } catch (error) {
      console.warn(`[Parser] Date parsing failed: ${dateStr}`, error);
      return null;
    }
  }

  /**
   * Parse datetime string to Date object
   */
  static parseDateTime(datetimeStr: string): Date | null {
    if (!datetimeStr) return null;

    try {
      // YYYYMMDDHHMM format
      if (datetimeStr.length >= 12) {
        const cleanStr = datetimeStr.replace(/[^\d]/g, '');
        if (cleanStr.length >= 12) {
          const year = parseInt(cleanStr.substring(0, 4));
          const month = parseInt(cleanStr.substring(4, 6)) - 1; // Month is 0-indexed
          const day = parseInt(cleanStr.substring(6, 8));
          const hour = parseInt(cleanStr.substring(8, 10));
          const minute = parseInt(cleanStr.substring(10, 12));
          return new Date(year, month, day, hour, minute);
        }
      }

      // YYYY-MM-DD HH:MM:SS format
      if (datetimeStr.includes('-') && datetimeStr.includes(':')) {
        const date = new Date(datetimeStr.substring(0, 19));
        return isNaN(date.getTime()) ? null : date;
      }

      // YYYY-MM-DD format (time missing)
      if (datetimeStr.includes('-')) {
        const date = new Date(datetimeStr.substring(0, 10));
        return isNaN(date.getTime()) ? null : date;
      }

      return null;
    } catch (error) {
      console.warn(`[Parser] DateTime parsing failed: ${datetimeStr}`, error);
      return null;
    }
  }

  /**
   * Parse amount string to integer
   */
  static parseAmount(amountStr: string): number | null {
    if (!amountStr) return null;

    try {
      // Remove non-digit characters
      const cleanAmount = amountStr.toString().replace(/[^\d]/g, '');
      if (cleanAmount) {
        return parseInt(cleanAmount, 10);
      }
      return null;
    } catch (error) {
      console.warn(`[Parser] Amount parsing failed: ${amountStr}`, error);
      return null;
    }
  }

  /**
   * Parse attachments from raw data
   */
  static parseAttachments(rawData: BidNoticeRawItem): ParsedAttachment[] | null {
    const attachments: ParsedAttachment[] = [];

    // Search for attachment-related fields
    for (const [key, value] of Object.entries(rawData)) {
      if (key.toLowerCase().includes('file') || key.toLowerCase().includes('attach')) {
        if (value) {
          attachments.push({
            field: key,
            value: String(value)
          });
        }
      }
    }

    return attachments.length > 0 ? attachments : null;
  }

  /**
   * Convert raw API data to database-compatible format
   */
  static parseBidNotice(rawData: BidNoticeRawItem): G2bNotice {
    const parsed: G2bNotice = {
      // Required fields
      bidNtceNo: rawData.bidNtceNo || '',
      bidNtceNm: rawData.bidNtceNm || '',

      // Optional fields from API spec
      bidNtceOrd: rawData.bidNtceOrd || null,
      reNtceYn: rawData.reNtceYn === 'Y' ? 'Y' : (rawData.reNtceYn === 'N' ? 'N' : null),
      rgstTyNm: rawData.rgstTyNm || null,
      ntceKindNm: rawData.ntceKindNm || null,
      intrbidYn: rawData.intrbidYn === 'Y' ? 'Y' : (rawData.intrbidYn === 'N' ? 'N' : null),
      bidNtceDt: this.parseDateTime(rawData.bidNtceDt || ''),
      refNo: rawData.refNo || null,

      // Organization information
      ntceInsttCd: rawData.ntceInsttCd || null,
      ntceInsttNm: rawData.ntceInsttNm || null,
      dminsttCd: rawData.dminsttCd || null,
      dminsttNm: rawData.dminsttNm || null,

      // Bid method and contract information
      bidMethdNm: rawData.bidMethdNm || null,
      cntrctCnclsMthdNm: rawData.cntrctCnclsMthdNm || null,

      // Contact information
      ntceInsttOfclNm: rawData.ntceInsttOfclNm || null,
      ntceInsttOfclTelNo: rawData.ntceInsttOfclTelNo || null,
      ntceInsttOfclEmailAdrs: rawData.ntceInsttOfclEmailAdrs || null,
      exctvNm: rawData.exctvNm || null,

      // Schedule information
      bidQlfctRgstDt: this.parseDateTime(rawData.bidQlfctRgstDt || ''),
      cmmnSpldmdAgrmntRcptdocMethd: rawData.cmmnSpldmdAgrmntRcptdocMethd || null,
      cmmnSpldmdAgrmntClseDt: this.parseDateTime(rawData.cmmnSpldmdAgrmntClseDt || ''),
      cmmnSpldmdCorpRgnLmtYn: rawData.cmmnSpldmdCorpRgnLmtYn === 'Y' ? 'Y' : (rawData.cmmnSpldmdCorpRgnLmtYn === 'N' ? 'N' : null),
      bidBeginDt: this.parseDateTime(rawData.bidBeginDt || ''),
      bidClseDt: this.parseDateTime(rawData.bidClseDt || ''),
      opengDt: this.parseDateTime(rawData.opengDt || ''),

      // Document URLs and file names
      ntceSpecDocUrl1: rawData.ntceSpecDocUrl1 || null,
      ntceSpecDocUrl2: rawData.ntceSpecDocUrl2 || null,
      ntceSpecDocUrl3: rawData.ntceSpecDocUrl3 || null,
      ntceSpecDocUrl4: rawData.ntceSpecDocUrl4 || null,
      ntceSpecDocUrl5: rawData.ntceSpecDocUrl5 || null,
      ntceSpecDocUrl6: rawData.ntceSpecDocUrl6 || null,
      ntceSpecDocUrl7: rawData.ntceSpecDocUrl7 || null,
      ntceSpecDocUrl8: rawData.ntceSpecDocUrl8 || null,
      ntceSpecDocUrl9: rawData.ntceSpecDocUrl9 || null,
      ntceSpecDocUrl10: rawData.ntceSpecDocUrl10 || null,
      ntceSpecFileNm1: rawData.ntceSpecFileNm1 || null,
      ntceSpecFileNm2: rawData.ntceSpecFileNm2 || null,
      ntceSpecFileNm3: rawData.ntceSpecFileNm3 || null,
      ntceSpecFileNm4: rawData.ntceSpecFileNm4 || null,
      ntceSpecFileNm5: rawData.ntceSpecFileNm5 || null,
      ntceSpecFileNm6: rawData.ntceSpecFileNm6 || null,
      ntceSpecFileNm7: rawData.ntceSpecFileNm7 || null,
      ntceSpecFileNm8: rawData.ntceSpecFileNm8 || null,
      ntceSpecFileNm9: rawData.ntceSpecFileNm9 || null,
      ntceSpecFileNm10: rawData.ntceSpecFileNm10 || null,

      // Additional bid information
      rbidPermsnYn: rawData.rbidPermsnYn === 'Y' ? 'Y' : (rawData.rbidPermsnYn === 'N' ? 'N' : null),
      pqApplDocRcptMthdNm: rawData.pqApplDocRcptMthdNm || null,
      pqApplDocRcptDt: this.parseDateTime(rawData.pqApplDocRcptDt || ''),
      tpEvalApplMthdNm: rawData.tpEvalApplMthdNm || null,
      tpEvalApplClseDt: this.parseDateTime(rawData.tpEvalApplClseDt || ''),

      // Region information
      jntcontrctDutyRgnNm1: rawData.jntcontrctDutyRgnNm1 || null,
      jntcontrctDutyRgnNm2: rawData.jntcontrctDutyRgnNm2 || null,
      jntcontrctDutyRgnNm3: rawData.jntcontrctDutyRgnNm3 || null,
      rgnDutyJntcontrctRt: rawData.rgnDutyJntcontrctRt || null,

      // Bid details
      dtlsBidYn: rawData.dtlsBidYn === 'Y' ? 'Y' : (rawData.dtlsBidYn === 'N' ? 'N' : null),
      bidPrtcptLmtYn: rawData.bidPrtcptLmtYn === 'Y' ? 'Y' : (rawData.bidPrtcptLmtYn === 'N' ? 'N' : null),
      prearngPrceDcsnMthdNm: rawData.prearngPrceDcsnMthdNm || null,
      totPrdprcNum: rawData.totPrdprcNum || null,
      drwtPrdprcNum: rawData.drwtPrdprcNum || null,

      // Amount information
      asignBdgtAmt: this.parseAmount(rawData.asignBdgtAmt || ''),
      presmptPrce: this.parseAmount(rawData.presmptPrce || ''),

      // Location and meeting information
      opengPlce: rawData.opengPlce || null,
      dcmtgOprtnDt: this.parseDateTime(rawData.dcmtgOprtnDt || ''),
      dcmtgOprtnPlce: rawData.dcmtgOprtnPlce || null,

      // URLs
      bidNtceDtlUrl: rawData.bidNtceDtlUrl || null,
      bidNtceUrl: rawData.bidNtceUrl || null,

      // Fee information
      bidPrtcptFeePaymntYn: rawData.bidPrtcptFeePaymntYn || null,
      bidPrtcptFee: this.parseAmount(rawData.bidPrtcptFee || ''),
      bidGrntymnyPaymntYn: rawData.bidGrntymnyPaymntYn || null,
      crdtrNm: rawData.crdtrNm || null,

      // Service type
      ppswGnrlSrvceYn: rawData.ppswGnrlSrvceYn === 'Y' ? 'Y' : (rawData.ppswGnrlSrvceYn === 'N' ? 'N' : null),
      srvceDivNm: rawData.srvceDivNm || null,

      // Product classification
      prdctClsfcLmtYn: rawData.prdctClsfcLmtYn === 'Y' ? 'Y' : (rawData.prdctClsfcLmtYn === 'N' ? 'N' : null),
      mnfctYn: rawData.mnfctYn === 'Y' ? 'Y' : (rawData.mnfctYn === 'N' ? 'N' : null),
      purchsObjPrdctList: rawData.purchsObjPrdctList || null,

      // Additional codes
      untyNtceNo: rawData.untyNtceNo || null,
      cmmnSpldmdMethdCd: rawData.cmmnSpldmdMethdCd || null,
      cmmnSpldmdMethdNm: rawData.cmmnSpldmdMethdNm || null,
      stdNtceDocUrl: rawData.stdNtceDocUrl || null,

      // Competition type flags
      brffcBidprcPermsnYn: rawData.brffcBidprcPermsnYn === 'Y' ? 'Y' : (rawData.brffcBidprcPermsnYn === 'N' ? 'N' : null),
      dsgntCmptYn: rawData.dsgntCmptYn === 'Y' ? 'Y' : (rawData.dsgntCmptYn === 'N' ? 'N' : null),
      arsltCmptYn: rawData.arsltCmptYn === 'Y' ? 'Y' : (rawData.arsltCmptYn === 'N' ? 'N' : null),
      pqEvalYn: rawData.pqEvalYn === 'Y' ? 'Y' : (rawData.pqEvalYn === 'N' ? 'N' : null),
      tpEvalYn: rawData.tpEvalYn === 'Y' ? 'Y' : (rawData.tpEvalYn === 'N' ? 'N' : null),
      ntceDscrptYn: rawData.ntceDscrptYn === 'Y' ? 'Y' : (rawData.ntceDscrptYn === 'N' ? 'N' : null),

      // Additional information
      rsrvtnPrceReMkngMthdNm: rawData.rsrvtnPrceReMkngMthdNm || null,
      arsltApplDocRcptMthdNm: rawData.arsltApplDocRcptMthdNm || null,
      arsltReqstdocRcptDt: this.parseDateTime(rawData.arsltReqstdocRcptDt || ''),
      orderPlanUntyNo: rawData.orderPlanUntyNo || null,
      sucsfbidLwltRate: rawData.sucsfbidLwltRate ? parseFloat(rawData.sucsfbidLwltRate) : null,

      // Registration and change dates
      rgstDt: this.parseDateTime(rawData.rgstDt || ''),
      bfSpecRgstNo: rawData.bfSpecRgstNo || null,
      infoBizYn: rawData.infoBizYn === 'Y' ? 'Y' : (rawData.infoBizYn === 'N' ? 'N' : null),
      sucsfbidMthdCd: rawData.sucsfbidMthdCd || null,
      sucsfbidMthdNm: rawData.sucsfbidMthdNm || null,
      chgDt: this.parseDateTime(rawData.chgDt || ''),
      dminsttOfclEmailAdrs: rawData.dminsttOfclEmailAdrs || null,
      indstrytyLmtYn: rawData.indstrytyLmtYn === 'Y' ? 'Y' : (rawData.indstrytyLmtYn === 'N' ? 'N' : null),
      chgNtceRsn: rawData.chgNtceRsn || null,
      rbidOpengDt: this.parseDateTime(rawData.rbidOpengDt || ''),

      // Tax information
      VAT: this.parseAmount(rawData.VAT || ''),
      indutyVAT: this.parseAmount(rawData.indutyVAT || ''),

      // Regional limitation information
      rgnLmtBidLocplcJdgmBssCd: rawData.rgnLmtBidLocplcJdgmBssCd || null,
      rgnLmtBidLocplcJdgmBssNm: rawData.rgnLmtBidLocplcJdgmBssNm || null,

      // Public procurement classification
      pubPrcrmntLrgClsfcNm: rawData.pubPrcrmntLrgClsfcNm || null,
      pubPrcrmntMidClsfcNm: rawData.pubPrcrmntMidClsfcNm || null,
      pubPrcrmntClsfcNo: rawData.pubPrcrmntClsfcNo || null,
      pubPrcrmntClsfcNm: rawData.pubPrcrmntClsfcNm || null
    };

    return parsed;
  }

  /**
   * Batch parse multiple bid notices
   */
  static parseBidNotices(rawDataList: BidNoticeRawItem[]): G2bNotice[] {
    const parsed: G2bNotice[] = [];

    for (const rawData of rawDataList) {
      try {
        const parsedItem = this.parseBidNotice(rawData);
        parsed.push(parsedItem);
      } catch (error) {
        console.error('[Parser] Error parsing bid notice:', error, rawData);
      }
    }

    console.log(`[Parser] Successfully parsed ${parsed.length} out of ${rawDataList.length} bid notices`);
    return parsed;
  }

  /**
   * Validate parsed bid notice data
   */
  static validateBidNotice(notice: G2bNotice): boolean {
    // Minimum required fields
    if (!notice.bidNtceNo) {
      console.warn('[Parser] Validation failed: missing bidNtceNo');
      return false;
    }

    if (!notice.bidNtceNm) {
      console.warn('[Parser] Validation failed: missing bidNtceNm');
      return false;
    }

    // Additional validation rules can be added here
    return true;
  }

  /**
   * Filter valid bid notices
   */
  static filterValidNotices(notices: G2bNotice[]): G2bNotice[] {
    return notices.filter(notice => this.validateBidNotice(notice));
  }
}