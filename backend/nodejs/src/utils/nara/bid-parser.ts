/**
 * Bid notice data parser
 * Converts raw API data to database-compatible format
 */

import { G2bNotice } from './models';
import { BidNoticeRawItem } from './api-client';

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
      if (datetimeStr.length === 12 && /^\d{12}$/.test(datetimeStr)) {
        const year = parseInt(datetimeStr.substring(0, 4));
        const month = parseInt(datetimeStr.substring(4, 6)) - 1;
        const day = parseInt(datetimeStr.substring(6, 8));
        const hour = parseInt(datetimeStr.substring(8, 10));
        const minute = parseInt(datetimeStr.substring(10, 12));
        return new Date(year, month, day, hour, minute);
      }

      // YYYY-MM-DD HH:MM format
      if (datetimeStr.includes('-') && datetimeStr.includes(':')) {
        const date = new Date(datetimeStr);
        return isNaN(date.getTime()) ? null : date;
      }

      return null;
    } catch (error) {
      console.warn(`[Parser] DateTime parsing failed: ${datetimeStr}`, error);
      return null;
    }
  }

  /**
   * Parse Y/N string to boolean
   */
  static parseYnToBoolean(ynStr: string): 'Y' | 'N' {
    return ynStr === 'Y' ? 'Y' : 'N';
  }

  /**
   * Clean and normalize text
   */
  static cleanText(text: string): string {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Parse raw bid notice item to database format
   */
  static parseToG2bNotice(rawItem: BidNoticeRawItem): G2bNotice {
    return {
      bidNtceNo: rawItem.bidNtceNo || '',
      bidNtceOrd: rawItem.bidNtceOrd,
      reNtceYn: rawItem.reNtceYn ? this.parseYnToBoolean(rawItem.reNtceYn) : undefined,
      rgstTyNm: this.cleanText(rawItem.rgstTyNm || ''),
      ntceKindNm: this.cleanText(rawItem.ntceKindNm || ''),
      intrbidYn: rawItem.intrbidYn ? this.parseYnToBoolean(rawItem.intrbidYn) : undefined,
      bidNtceDt: this.parseDateTime(rawItem.bidNtceDt || ''),
      refNo: rawItem.refNo,
      bidNtceNm: this.cleanText(rawItem.bidNtceNm || ''),
      ntceInsttCd: rawItem.ntceInsttCd,
      ntceInsttNm: this.cleanText(rawItem.ntceInsttNm || ''),
      dminsttCd: rawItem.dminsttCd,
      dminsttNm: this.cleanText(rawItem.dminsttNm || ''),
      bidMethdNm: this.cleanText(rawItem.bidMethdNm || ''),
      cntrctCnclsMthdNm: this.cleanText(rawItem.cntrctCnclsMthdNm || ''),
      ntceInsttOfclNm: this.cleanText(rawItem.ntceInsttOfclNm || ''),
      ntceInsttOfclTelNo: rawItem.ntceInsttOfclTelNo,
      ntceInsttOfclEmailAdrs: rawItem.ntceInsttOfclEmailAdrs,
      exctvNm: this.cleanText(rawItem.exctvNm || ''),
      bidQlfctRgstDt: this.parseDateTime(rawItem.bidQlfctRgstDt || ''),
      cmmnSpldmdAgrmntRcptdocMethd: this.cleanText(rawItem.cmmnSpldmdAgrmntRcptdocMethd || ''),
      cmmnSpldmdAgrmntClseDt: this.parseDateTime(rawItem.cmmnSpldmdAgrmntClseDt || ''),
      cmmnSpldmdCorpRgnLmtYn: rawItem.cmmnSpldmdCorpRgnLmtYn ? this.parseYnToBoolean(rawItem.cmmnSpldmdCorpRgnLmtYn) : undefined,
      bidBeginDt: this.parseDateTime(rawItem.bidBeginDt || ''),
      bidClseDt: this.parseDateTime(rawItem.bidClseDt || ''),
      opengDt: this.parseDateTime(rawItem.opengDt || ''),

      // Specification URLs
      ntceSpecDocUrl1: rawItem.ntceSpecDocUrl1,
      ntceSpecDocUrl2: rawItem.ntceSpecDocUrl2,
      ntceSpecDocUrl3: rawItem.ntceSpecDocUrl3,
      ntceSpecDocUrl4: rawItem.ntceSpecDocUrl4,
      ntceSpecDocUrl5: rawItem.ntceSpecDocUrl5,

      // Specification file names
      ntceSpecFileNm1: rawItem.ntceSpecFileNm1,
      ntceSpecFileNm2: rawItem.ntceSpecFileNm2,
      ntceSpecFileNm3: rawItem.ntceSpecFileNm3,
      ntceSpecFileNm4: rawItem.ntceSpecFileNm4,
      ntceSpecFileNm5: rawItem.ntceSpecFileNm5,

      rbidPermsnYn: rawItem.rbidPermsnYn ? this.parseYnToBoolean(rawItem.rbidPermsnYn) : undefined,
      pqApplDocRcptMthdNm: this.cleanText(rawItem.pqApplDocRcptMthdNm || ''),
      pqApplDocRcptDt: this.parseDateTime(rawItem.pqApplDocRcptDt || ''),
      tpEvalApplMthdNm: this.cleanText(rawItem.tpEvalApplMthdNm || ''),
      tpEvalApplClseDt: this.parseDateTime(rawItem.tpEvalApplClseDt || ''),

      prtcptLmtYn: rawItem.prtcptLmtYn ? this.parseYnToBoolean(rawItem.prtcptLmtYn) : undefined,
      prtcptLmtRgnNm: this.cleanText(rawItem.prtcptLmtRgnNm || ''),
      cntrctCnclsPosblDt: this.parseDateTime(rawItem.cntrctCnclsPosblDt || ''),
      presmptPrce: rawItem.presmptPrce,
      asignBdgtAmt: rawItem.asignBdgtAmt,
      prearngPrcePblctYn: rawItem.prearngPrcePblctYn ? this.parseYnToBoolean(rawItem.prearngPrcePblctYn) : undefined,
      dsgntCmptYn: rawItem.dsgntCmptYn ? this.parseYnToBoolean(rawItem.dsgntCmptYn) : undefined,

      indutyLclasNm: this.cleanText(rawItem.indutyLclasNm || ''),
      indutyMlsfcNm: this.cleanText(rawItem.indutyMlsfcNm || ''),
      indutyLmtYn: rawItem.indutyLmtYn ? this.parseYnToBoolean(rawItem.indutyLmtYn) : undefined,

      arsltApplDocRcptMthdNm: this.cleanText(rawItem.arsltApplDocRcptMthdNm || ''),
      arsltApplDocRcptDt: this.parseDateTime(rawItem.arsltApplDocRcptDt || ''),
      arsltPsblYn: rawItem.arsltPsblYn ? this.parseYnToBoolean(rawItem.arsltPsblYn) : undefined,

      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Parse multiple raw items to G2bNotice array
   */
  static parseMultiple(rawItems: BidNoticeRawItem[]): G2bNotice[] {
    if (!Array.isArray(rawItems)) {
      console.warn('[Parser] Invalid input: not an array');
      return [];
    }

    return rawItems.map(item => this.parseToG2bNotice(item));
  }

  /**
   * Extract attachment information from parsed notice
   */
  static extractAttachments(notice: G2bNotice): ParsedAttachment[] {
    const attachments: ParsedAttachment[] = [];

    // Extract spec documents
    for (let i = 1; i <= 10; i++) {
      const url = notice[`ntceSpecDocUrl${i}` as keyof G2bNotice] as string;
      const fileName = notice[`ntceSpecFileNm${i}` as keyof G2bNotice] as string;

      if (url || fileName) {
        attachments.push({
          field: `spec_doc_${i}`,
          value: JSON.stringify({ url, fileName })
        });
      }
    }

    // Extract drawing files
    for (let i = 1; i <= 5; i++) {
      const url = notice[`drgstFileUrl${i}` as keyof G2bNotice] as string;
      const fileName = notice[`drgstFileNm${i}` as keyof G2bNotice] as string;

      if (url || fileName) {
        attachments.push({
          field: `drawing_file_${i}`,
          value: JSON.stringify({ url, fileName })
        });
      }
    }

    return attachments;
  }
}