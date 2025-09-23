/**
 * Database models and table definitions for Korean government bid notices (Nara)
 * Based on g2b_notices table schema
 */

export interface G2bNotice {
  id?: number;
  bidNtceNo: string;                          // 입찰공고번호
  bidNtceOrd?: string;                        // 입찰공고차수
  reNtceYn?: 'Y' | 'N';                       // 재공고여부
  rgstTyNm?: string;                          // 등록유형명
  ntceKindNm?: string;                        // 공고종류명
  intrbidYn?: 'Y' | 'N';                      // 국제입찰여부
  bidNtceDt?: Date;                           // 입찰공고일시
  refNo?: string;                             // 참조번호
  bidNtceNm: string;                          // 입찰공고명
  ntceInsttCd?: string;                       // 공고기관코드
  ntceInsttNm?: string;                       // 공고기관명
  dminsttCd?: string;                         // 수요기관코드
  dminsttNm?: string;                         // 수요기관명
  bidMethdNm?: string;                        // 입찰방식명
  cntrctCnclsMthdNm?: string;                 // 계약체결방법명
  ntceInsttOfclNm?: string;                   // 공고기관담당자명
  ntceInsttOfclTelNo?: string;                // 공고기관담당자전화번호
  ntceInsttOfclEmailAdrs?: string;            // 공고기관담당자이메일주소
  exctvNm?: string;                           // 집행관명
  bidQlfctRgstDt?: Date;                      // 입찰참가자격등록마감일시
  cmmnSpldmdAgrmntRcptdocMethd?: string;      // 공동수급협정서접수방식
  cmmnSpldmdAgrmntClseDt?: Date;              // 공동수급협정마감일시
  cmmnSpldmdCorpRgnLmtYn?: 'Y' | 'N';         // 공동수급업체지역제한여부
  bidBeginDt?: Date;                          // 입찰개시일시
  bidClseDt?: Date;                           // 입찰마감일시
  opengDt?: Date;                             // 개찰일시
  ntceSpecDocUrl1?: string;                   // 공고규격서URL1
  ntceSpecDocUrl2?: string;                   // 공고규격서URL2
  ntceSpecDocUrl3?: string;                   // 공고규격서URL3
  ntceSpecDocUrl4?: string;                   // 공고규격서URL4
  ntceSpecDocUrl5?: string;                   // 공고규격서URL5
  ntceSpecDocUrl6?: string;                   // 공고규격서URL6
  ntceSpecDocUrl7?: string;                   // 공고규격서URL7
  ntceSpecDocUrl8?: string;                   // 공고규격서URL8
  ntceSpecDocUrl9?: string;                   // 공고규격서URL9
  ntceSpecDocUrl10?: string;                  // 공고규격서URL10
  ntceSpecFileNm1?: string;                   // 공고규격파일명1
  ntceSpecFileNm2?: string;                   // 공고규격파일명2
  ntceSpecFileNm3?: string;                   // 공고규격파일명3
  ntceSpecFileNm4?: string;                   // 공고규격파일명4
  ntceSpecFileNm5?: string;                   // 공고규격파일명5
  ntceSpecFileNm6?: string;                   // 공고규격파일명6
  ntceSpecFileNm7?: string;                   // 공고규격파일명7
  ntceSpecFileNm8?: string;                   // 공고규격파일명8
  ntceSpecFileNm9?: string;                   // 공고규격파일명9
  ntceSpecFileNm10?: string;                  // 공고규격파일명10
  rbidPermsnYn?: 'Y' | 'N';                   // 재입찰허용여부
  pqApplDocRcptMthdNm?: string;               // PQ신청서접수방법명
  pqApplDocRcptDt?: Date;                     // PQ신청서접수일시
  tpEvalApplMthdNm?: string;                  // TP심사신청방법명
  tpEvalApplClseDt?: Date;                    // TP심사신청마감일시
  jntcontrctDutyRgnNm1?: string;              // 공동도급의무지역명1
  jntcontrctDutyRgnNm2?: string;              // 공동도급의무지역명2
  jntcontrctDutyRgnNm3?: string;              // 공동도급의무지역명3
  rgnDutyJntcontrctRt?: string;               // 지역의무공동도급비율
  dtlsBidYn?: 'Y' | 'N';                      // 내역입찰여부
  bidPrtcptLmtYn?: 'Y' | 'N';                 // 입찰참가제한여부
  prearngPrceDcsnMthdNm?: string;             // 예정가격결정방법명
  totPrdprcNum?: string;                      // 총예가건수
  drwtPrdprcNum?: string;                     // 추첨예가건수
  asignBdgtAmt?: number;                      // 배정예산금액
  presmptPrce?: number;                       // 추정가격
  opengPlce?: string;                         // 개찰장소
  dcmtgOprtnDt?: Date;                        // 설명회실시일시
  dcmtgOprtnPlce?: string;                    // 설명회실시장소
  bidNtceDtlUrl?: string;                     // 입찰공고상세URL
  bidNtceUrl?: string;                        // 입찰공고URL
  bidPrtcptFeePaymntYn?: string;              // 입찰참가수수료납부여부
  bidPrtcptFee?: number;                      // 입찰참가수수료
  bidGrntymnyPaymntYn?: string;               // 입찰보증금납부여부
  crdtrNm?: string;                           // 채권자명
  ppswGnrlSrvceYn?: 'Y' | 'N';                // 조달청일반용역여부
  srvceDivNm?: string;                        // 용역구분명
  prdctClsfcLmtYn?: 'Y' | 'N';                // 물품분류제한여부
  mnfctYn?: 'Y' | 'N';                        // 제조여부
  purchsObjPrdctList?: string;                // 구매대상물품목록
  untyNtceNo?: string;                        // 통합공고번호
  cmmnSpldmdMethdCd?: string;                 // 공동수급방식코드
  cmmnSpldmdMethdNm?: string;                 // 공동수급방식명
  stdNtceDocUrl?: string;                     // 표준공고서URL
  brffcBidprcPermsnYn?: 'Y' | 'N';            // 지사투찰허용여부
  dsgntCmptYn?: 'Y' | 'N';                    // 지명경쟁여부
  arsltCmptYn?: 'Y' | 'N';                    // 실적경쟁여부
  pqEvalYn?: 'Y' | 'N';                       // PQ심사여부
  tpEvalYn?: 'Y' | 'N';                       // TP심사여부
  ntceDscrptYn?: 'Y' | 'N';                   // 공고설명여부
  rsrvtnPrceReMkngMthdNm?: string;            // 예비가격재작성방법명
  arsltApplDocRcptMthdNm?: string;            // 실적신청서접수방법명
  arsltReqstdocRcptDt?: Date;                 // 실적신청서접수일시
  orderPlanUntyNo?: string;                   // 발주계획통합번호
  sucsfbidLwltRate?: number;                  // 낙찰하한율
  rgstDt?: Date;                              // 등록일시
  bfSpecRgstNo?: string;                      // 사전규격등록번호
  infoBizYn?: 'Y' | 'N';                      // 정보화사업여부
  sucsfbidMthdCd?: string;                    // 낙찰방법코드
  sucsfbidMthdNm?: string;                    // 낙찰방법명
  chgDt?: Date;                               // 변경일시
  dminsttOfclEmailAdrs?: string;              // 수요기관담당자이메일주소
  indstrytyLmtYn?: 'Y' | 'N';                 // 업종제한여부
  chgNtceRsn?: string;                        // 변경공고사유
  rbidOpengDt?: Date;                         // 재입찰개찰일시
  VAT?: number;                               // 부가가치세
  indutyVAT?: number;                         // 주공종부가가치세
  rgnLmtBidLocplcJdgmBssCd?: string;          // 지역제한입찰지역판단기준코드
  rgnLmtBidLocplcJdgmBssNm?: string;          // 지역제한입찰지역판단기준명
  pubPrcrmntLrgClsfcNm?: string;              // 공공조달대분류명
  pubPrcrmntMidClsfcNm?: string;              // 공공조달중분류명
  pubPrcrmntClsfcNo?: string;                 // 공공조달분류번호
  pubPrcrmntClsfcNm?: string;                 // 공공조달분류명
  createdAt?: Date;                           // 레코드 생성일시
  updatedAt?: Date;                           // 레코드 수정일시
}

export interface KeywordRule {
  id?: number;
  keyword: string;
  category: string;
  weight: number;
  match_field: 'all' | 'title' | 'dept_name' | 'work_class' | 'industry' | 'content';
  match_type: 'exact' | 'contains' | 'regex';
  is_negative: boolean;
  is_active: boolean;
  created_by?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ApiCollectionLog {
  id?: number;
  api_endpoint: string;
  request_params: string; // JSON
  total_count: number;
  collected_count: number;
  new_count: number;
  updated_count: number;
  error_count: number;
  start_date?: Date;
  end_date?: Date;
  status: 'completed' | 'failed' | 'running';
  started_at?: Date;
  completed_at?: Date;
  duration_seconds?: number;
  error_message?: string;
  error_details?: string; // JSON
}

export interface KeywordMatch {
  keyword: string;
  category: string;
  weight: number;
  field: string;
  match_type: string;
}

export interface CollectionResult {
  total_count: number;
  collected_count: number;
  new_count: number;
  updated_count: number;
  error_count: number;
  errors: string[];
}

// Table creation SQL statements
export const CREATE_TABLES_SQL = {
  g2b_notices: `
    CREATE TABLE IF NOT EXISTS g2b_notices (
      id bigint(20) NOT NULL AUTO_INCREMENT COMMENT '자동증가 기본키',
      bidNtceNo varchar(40) NOT NULL COMMENT '입찰공고번호 - 조달청나라장터 공고건 관리번호',
      bidNtceOrd varchar(3) DEFAULT NULL COMMENT '입찰공고차수 - 재공고/재입찰 시 증가',
      reNtceYn char(1) DEFAULT NULL COMMENT '재공고여부 (Y/N)',
      rgstTyNm varchar(100) DEFAULT NULL COMMENT '등록유형명 - 조달청 또는 나라장터 자체 공고건',
      ntceKindNm varchar(100) DEFAULT NULL COMMENT '공고종류명 - 일반/변경/취소/재입찰/연기/긴급 등',
      intrbidYn char(1) DEFAULT NULL COMMENT '국제입찰여부 (Y/N)',
      bidNtceDt datetime DEFAULT NULL COMMENT '입찰공고일시 - 공고서를 공고한 일시',
      refNo varchar(105) DEFAULT NULL COMMENT '참조번호 - 자체 전자조달시스템 관리번호',
      bidNtceNm varchar(500) NOT NULL COMMENT '입찰공고명 - 공사명/사업명',
      ntceInsttCd varchar(7) DEFAULT NULL COMMENT '공고기관코드 - 행자부코드 또는 조달청 부여코드',
      ntceInsttNm varchar(200) DEFAULT NULL COMMENT '공고기관명 - 공고하는 기관명',
      dminsttCd varchar(7) DEFAULT NULL COMMENT '수요기관코드 - 행자부코드 또는 조달청 부여코드',
      dminsttNm varchar(200) DEFAULT NULL COMMENT '수요기관명 - 실제 계약을 의뢰한 기관명',
      bidMethdNm varchar(200) DEFAULT NULL COMMENT '입찰방식명 - 전자입찰/직찰/우편 등',
      cntrctCnclsMthdNm varchar(200) DEFAULT NULL COMMENT '계약체결방법명 - 일반경쟁/제한경쟁/지명경쟁/수의계약',
      ntceInsttOfclNm varchar(35) DEFAULT NULL COMMENT '공고기관담당자명',
      ntceInsttOfclTelNo varchar(25) DEFAULT NULL COMMENT '공고기관담당자전화번호',
      ntceInsttOfclEmailAdrs varchar(100) DEFAULT NULL COMMENT '공고기관담당자이메일주소',
      exctvNm varchar(35) DEFAULT NULL COMMENT '집행관명',
      bidQlfctRgstDt datetime DEFAULT NULL COMMENT '입찰참가자격등록마감일시',
      cmmnSpldmdAgrmntRcptdocMethd varchar(30) DEFAULT NULL COMMENT '공동수급협정서접수방식 - 없음/전자문서/수기',
      cmmnSpldmdAgrmntClseDt datetime DEFAULT NULL COMMENT '공동수급협정마감일시',
      cmmnSpldmdCorpRgnLmtYn char(1) DEFAULT NULL COMMENT '공동수급업체지역제한여부 (Y/N)',
      bidBeginDt datetime DEFAULT NULL COMMENT '입찰개시일시 - 입찰서 제출 시작시간',
      bidClseDt datetime DEFAULT NULL COMMENT '입찰마감일시 - 입찰서 제출 마감시간',
      opengDt datetime DEFAULT NULL COMMENT '개찰일시 - 개찰 수행 가능 시작일시',
      ntceSpecDocUrl1 text DEFAULT NULL COMMENT '공고규격서URL1',
      ntceSpecDocUrl2 text DEFAULT NULL COMMENT '공고규격서URL2',
      ntceSpecDocUrl3 text DEFAULT NULL COMMENT '공고규격서URL3',
      ntceSpecDocUrl4 text DEFAULT NULL COMMENT '공고규격서URL4',
      ntceSpecDocUrl5 text DEFAULT NULL COMMENT '공고규격서URL5',
      ntceSpecDocUrl6 text DEFAULT NULL COMMENT '공고규격서URL6',
      ntceSpecDocUrl7 text DEFAULT NULL COMMENT '공고규격서URL7',
      ntceSpecDocUrl8 text DEFAULT NULL COMMENT '공고규격서URL8',
      ntceSpecDocUrl9 text DEFAULT NULL COMMENT '공고규격서URL9',
      ntceSpecDocUrl10 text DEFAULT NULL COMMENT '공고규격서URL10',
      ntceSpecFileNm1 varchar(256) DEFAULT NULL COMMENT '공고규격파일명1',
      ntceSpecFileNm2 varchar(256) DEFAULT NULL COMMENT '공고규격파일명2',
      ntceSpecFileNm3 varchar(256) DEFAULT NULL COMMENT '공고규격파일명3',
      ntceSpecFileNm4 varchar(256) DEFAULT NULL COMMENT '공고규격파일명4',
      ntceSpecFileNm5 varchar(256) DEFAULT NULL COMMENT '공고규격파일명5',
      ntceSpecFileNm6 varchar(256) DEFAULT NULL COMMENT '공고규격파일명6',
      ntceSpecFileNm7 varchar(256) DEFAULT NULL COMMENT '공고규격파일명7',
      ntceSpecFileNm8 varchar(256) DEFAULT NULL COMMENT '공고규격파일명8',
      ntceSpecFileNm9 varchar(256) DEFAULT NULL COMMENT '공고규격파일명9',
      ntceSpecFileNm10 varchar(256) DEFAULT NULL COMMENT '공고규격파일명10',
      rbidPermsnYn char(1) DEFAULT NULL COMMENT '재입찰허용여부 (Y/N)',
      pqApplDocRcptMthdNm varchar(30) DEFAULT NULL COMMENT 'PQ신청서접수방법명',
      pqApplDocRcptDt datetime DEFAULT NULL COMMENT 'PQ신청서접수일시',
      tpEvalApplMthdNm varchar(30) DEFAULT NULL COMMENT 'TP심사신청방법명',
      tpEvalApplClseDt datetime DEFAULT NULL COMMENT 'TP심사신청마감일시',
      jntcontrctDutyRgnNm1 varchar(200) DEFAULT NULL COMMENT '공동도급의무지역명1',
      jntcontrctDutyRgnNm2 varchar(200) DEFAULT NULL COMMENT '공동도급의무지역명2',
      jntcontrctDutyRgnNm3 varchar(200) DEFAULT NULL COMMENT '공동도급의무지역명3',
      rgnDutyJntcontrctRt varchar(20) DEFAULT NULL COMMENT '지역의무공동도급비율 (%)',
      dtlsBidYn char(1) DEFAULT NULL COMMENT '내역입찰여부 (Y/N)',
      bidPrtcptLmtYn char(1) DEFAULT NULL COMMENT '입찰참가제한여부 (Y/N)',
      prearngPrceDcsnMthdNm varchar(20) DEFAULT NULL COMMENT '예정가격결정방법명 - 복수예가/단일예가',
      totPrdprcNum varchar(20) DEFAULT NULL COMMENT '총예가건수',
      drwtPrdprcNum varchar(20) DEFAULT NULL COMMENT '추첨예가건수',
      asignBdgtAmt decimal(20,0) DEFAULT NULL COMMENT '배정예산금액 (원) - 배정된 예산액',
      presmptPrce decimal(20,0) DEFAULT NULL COMMENT '추정가격 (원) - 부가세/수수료 제외 금액',
      opengPlce varchar(100) DEFAULT NULL COMMENT '개찰장소',
      dcmtgOprtnDt datetime DEFAULT NULL COMMENT '설명회실시일시',
      dcmtgOprtnPlce varchar(100) DEFAULT NULL COMMENT '설명회실시장소',
      bidNtceDtlUrl text DEFAULT NULL COMMENT '입찰공고상세URL - 나라장터 상세화면 링크',
      bidNtceUrl varchar(500) DEFAULT NULL COMMENT '입찰공고URL',
      bidPrtcptFeePaymntYn varchar(30) DEFAULT NULL COMMENT '입찰참가수수료납부여부',
      bidPrtcptFee decimal(15,0) DEFAULT NULL COMMENT '입찰참가수수료 (원)',
      bidGrntymnyPaymntYn varchar(30) DEFAULT NULL COMMENT '입찰보증금납부여부',
      crdtrNm varchar(200) DEFAULT NULL COMMENT '채권자명 - 입찰보증금 보증채권자명',
      ppswGnrlSrvceYn char(1) DEFAULT NULL COMMENT '조달청일반용역여부 (Y/N)',
      srvceDivNm varchar(30) DEFAULT NULL COMMENT '용역구분명 - 일반용역/기술용역',
      prdctClsfcLmtYn char(1) DEFAULT NULL COMMENT '물품분류제한여부 (Y/N)',
      mnfctYn char(1) DEFAULT NULL COMMENT '제조여부 (Y/N)',
      purchsObjPrdctList text DEFAULT NULL COMMENT '구매대상물품목록',
      untyNtceNo varchar(11) DEFAULT NULL COMMENT '통합공고번호',
      cmmnSpldmdMethdCd varchar(15) DEFAULT NULL COMMENT '공동수급방식코드',
      cmmnSpldmdMethdNm varchar(100) DEFAULT NULL COMMENT '공동수급방식명',
      stdNtceDocUrl varchar(256) DEFAULT NULL COMMENT '표준공고서URL',
      brffcBidprcPermsnYn char(1) DEFAULT NULL COMMENT '지사투찰허용여부 (Y/N)',
      dsgntCmptYn char(1) DEFAULT NULL COMMENT '지명경쟁여부 (Y/N)',
      arsltCmptYn char(1) DEFAULT NULL COMMENT '실적경쟁여부 (Y/N)',
      pqEvalYn char(1) DEFAULT NULL COMMENT 'PQ심사여부 (Y/N)',
      tpEvalYn char(1) DEFAULT NULL COMMENT 'TP심사여부 (Y/N)',
      ntceDscrptYn char(1) DEFAULT NULL COMMENT '공고설명여부 (Y/N)',
      rsrvtnPrceReMkngMthdNm varchar(50) DEFAULT NULL COMMENT '예비가격재작성방법명',
      arsltApplDocRcptMthdNm varchar(50) DEFAULT NULL COMMENT '실적신청서접수방법명',
      arsltReqstdocRcptDt datetime DEFAULT NULL COMMENT '실적신청서접수일시',
      orderPlanUntyNo varchar(35) DEFAULT NULL COMMENT '발주계획통합번호',
      sucsfbidLwltRate decimal(8,3) DEFAULT NULL COMMENT '낙찰하한율 (%)',
      rgstDt datetime DEFAULT NULL COMMENT '등록일시 - 공고 등록일시',
      bfSpecRgstNo varchar(10) DEFAULT NULL COMMENT '사전규격등록번호',
      infoBizYn char(1) DEFAULT NULL COMMENT '정보화사업여부 (Y/N)',
      sucsfbidMthdCd varchar(9) DEFAULT NULL COMMENT '낙찰방법코드',
      sucsfbidMthdNm varchar(200) DEFAULT NULL COMMENT '낙찰방법명 - 낙찰자 결정방법',
      chgDt datetime DEFAULT NULL COMMENT '변경일시',
      dminsttOfclEmailAdrs varchar(100) DEFAULT NULL COMMENT '수요기관담당자이메일주소',
      indstrytyLmtYn char(1) DEFAULT NULL COMMENT '업종제한여부 (Y/N)',
      chgNtceRsn text DEFAULT NULL COMMENT '변경공고사유',
      rbidOpengDt datetime DEFAULT NULL COMMENT '재입찰개찰일시',
      VAT decimal(20,0) DEFAULT NULL COMMENT '부가가치세 (원)',
      indutyVAT decimal(20,0) DEFAULT NULL COMMENT '주공종부가가치세 (원)',
      rgnLmtBidLocplcJdgmBssCd varchar(10) DEFAULT NULL COMMENT '지역제한입찰지역판단기준코드',
      rgnLmtBidLocplcJdgmBssNm varchar(50) DEFAULT NULL COMMENT '지역제한입찰지역판단기준명',
      pubPrcrmntLrgClsfcNm varchar(100) DEFAULT NULL COMMENT '공공조달대분류명',
      pubPrcrmntMidClsfcNm varchar(100) DEFAULT NULL COMMENT '공공조달중분류명',
      pubPrcrmntClsfcNo varchar(10) DEFAULT NULL COMMENT '공공조달분류번호',
      pubPrcrmntClsfcNm varchar(100) DEFAULT NULL COMMENT '공공조달분류명',
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '레코드 생성일시',
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '레코드 수정일시',
      PRIMARY KEY (id),
      UNIQUE KEY uk_bidNtceNo_bidNtceOrd (bidNtceNo, bidNtceOrd),
      KEY idx_bidNtceDt (bidNtceDt),
      KEY idx_bidClseDt (bidClseDt),
      KEY idx_opengDt (opengDt),
      KEY idx_ntceInsttCd (ntceInsttCd),
      KEY idx_dminsttCd (dminsttCd),
      KEY idx_rgstDt (rgstDt),
      KEY idx_pubPrcrmntClsfcNo (pubPrcrmntClsfcNo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='입찰공고 정보 - 공공데이터포털 입찰공고 API 데이터 (camelCase)'
  `,

  keyword_rules: `
    CREATE TABLE IF NOT EXISTS keyword_rules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      keyword VARCHAR(200) NOT NULL,
      category VARCHAR(100) NOT NULL,
      weight INT DEFAULT 1,
      match_field ENUM('all', 'title', 'dept_name', 'work_class', 'industry', 'content') DEFAULT 'all',
      match_type ENUM('exact', 'contains', 'regex') DEFAULT 'contains',
      is_negative BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_by VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_category (category),
      INDEX idx_is_active (is_active),
      INDEX idx_keyword (keyword)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  api_collection_logs: `
    CREATE TABLE IF NOT EXISTS api_collection_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      api_endpoint VARCHAR(500) NOT NULL,
      request_params JSON,
      total_count INT DEFAULT 0,
      collected_count INT DEFAULT 0,
      new_count INT DEFAULT 0,
      updated_count INT DEFAULT 0,
      error_count INT DEFAULT 0,
      start_date DATE,
      end_date DATE,
      status ENUM('completed', 'failed', 'running') DEFAULT 'running',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      duration_seconds INT,
      error_message TEXT,
      error_details JSON,

      INDEX idx_api_endpoint (api_endpoint),
      INDEX idx_status (status),
      INDEX idx_started_at (started_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};

// Default keyword rules
export const DEFAULT_KEYWORD_RULES: Omit<KeywordRule, 'id' | 'created_at' | 'updated_at'>[] = [
  // IT/소프트웨어 관련
  { keyword: '소프트웨어', category: 'IT/소프트웨어', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '시스템', category: 'IT/소프트웨어', weight: 8, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '프로그램', category: 'IT/소프트웨어', weight: 8, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '어플리케이션', category: 'IT/소프트웨어', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '애플리케이션', category: 'IT/소프트웨어', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '웹사이트', category: 'IT/소프트웨어', weight: 9, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '홈페이지', category: 'IT/소프트웨어', weight: 9, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '데이터베이스', category: 'IT/소프트웨어', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: 'DB', category: 'IT/소프트웨어', weight: 9, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },

  // 하드웨어/네트워크 관련
  { keyword: '하드웨어', category: '하드웨어/네트워크', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '서버', category: '하드웨어/네트워크', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '네트워크', category: '하드웨어/네트워크', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '인프라', category: '하드웨어/네트워크', weight: 9, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '장비', category: '하드웨어/네트워크', weight: 8, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },

  // 컨설팅/용역 관련
  { keyword: '컨설팅', category: '컨설팅/용역', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '용역', category: '컨설팅/용역', weight: 9, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '설계', category: '컨설팅/용역', weight: 8, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '개발', category: '컨설팅/용역', weight: 9, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '구축', category: '컨설팅/용역', weight: 9, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },

  // 유지보수/운영 관련
  { keyword: '유지보수', category: '유지보수/운영', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '운영', category: '유지보수/운영', weight: 8, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '관리', category: '유지보수/운영', weight: 7, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '점검', category: '유지보수/운영', weight: 8, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },

  // 보안 관련
  { keyword: '보안', category: '보안', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '방화벽', category: '보안', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '백신', category: '보안', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' },
  { keyword: '암호화', category: '보안', weight: 10, match_field: 'all', match_type: 'contains', is_negative: false, is_active: true, created_by: 'system' }
];

// Table creation order (considering foreign key dependencies)
export const CREATE_TABLES_ORDER: [string, string][] = [
  ['keyword_rules', CREATE_TABLES_SQL.keyword_rules],
  ['g2b_notices', CREATE_TABLES_SQL.g2b_notices],
  ['api_collection_logs', CREATE_TABLES_SQL.api_collection_logs]
];