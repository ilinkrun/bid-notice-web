조달청_나라장터 입찰공고정보서비스 에서 getBidPblancListInfoServc(입찰공고목록 정보에 대한 용역조회)
https://www.data.go.kr/data/15129394/openapi.do#/API 목록/getBidPblancListInfoServc

를 사용하여, 나라장터 용역 입찰공고 목록을 조회하고, 데이터베이스에 저장하는 backend 부분을 구현하려고 해요.
python, mysql 기반으로 구현하려고 하는데 database는 mysql이 아닌 postgresql이 더 나을까요?


====
Parameters
OpenAPI 실행 준비
Name	Description
serviceKey *
string
(query)
공공데이터포털에서 받은 인증키

serviceKey
pageNo *
string
(query)
페이지번호

pageNo
numOfRows *
string
(query)
한 페이지 결과 수

numOfRows
type
string
(query)
타입

type
inqryDiv *
string
(query)
조회구분

inqryDiv
inqryBgnDt
string
(query)
조회시작일시

inqryBgnDt
inqryEndDt
string
(query)
조회종료일시

inqryEndDt
bidNtceNo
string
(query)
입찰공고번호

bidNtceNo


====


response

{
  "header": {
    "resultMsg": "string",
    "resultCode": "string"
  },
  "body": {
    "pageNo": "string",
    "items": {
      "item": {
        "bidGrntymnyPaymntYn": "string",
        "ntceSpecFileNm9": "string",
        "ntceSpecFileNm10": "string",
        "rbidPermsnYn": "string",
        "drwtPrdprcNum": "string",
        "ntceSpecDocUrl1": "string",
        "ntceSpecDocUrl2": "string",
        "ntceSpecDocUrl3": "string",
        "bidNtceNo": "string",
        "bidNtceOrd": "string",
        "pubPrcrmntLrgClsfcNm": "string",
        "pubPrcrmntMidClsfcNm": "string",
        "VAT": "string",
        "indutyVAT": "string",
        "chgNtceRsn": "string",
        "dminsttOfclEmailAdrs": "string",
        "indstrytyLmtYn": "string",
        "sucsfbidMthdNm": "string",
        "chgDt": "string",
        "sucsfbidMthdCd": "string",
        "ntceSpecDocUrl7": "string",
        "ntceSpecDocUrl8": "string",
        "ntceSpecDocUrl9": "string",
        "ntceSpecDocUrl10": "string",
        "purchsObjPrdctList": "string",
        "bfSpecRgstNo": "string",
        "infoBizYn": "string",
        "bidPrtcptLmtYn": "string",
        "prearngPrceDcsnMthdNm": "string",
        "totPrdprcNum": "string",
        "rgnDutyJntcontrctRt": "string",
        "dtlsBidYn": "string",
        "tpEvalApplClseDt": "string",
        "jntcontrctDutyRgnNm1": "string",
        "jntcontrctDutyRgnNm2": "string",
        "jntcontrctDutyRgnNm3": "string",
        "pqApplDocRcptMthdNm": "string",
        "pqApplDocRcptDt": "string",
        "bidWgrnteeRcptClseDt": "string",
        "ntceInsttCd": "string",
        "pubPrcrmntClsfcNm": "string",
        "cmmnSpldmdMethdNm": "string",
        "stdNtceDocUrl": "string",
        "brffcBidprcPermsnYn": "string",
        "bidNtceNm": "string",
        "ntceInsttNm": "string",
        "dminsttCd": "string",
        "dminsttNm": "string",
        "bidMethdNm": "string",
        "cntrctCnclsMthdNm": "string",
        "ntceInsttOfclNm": "string",
        "ntceInsttOfclTelNo": "string",
        "ntceInsttOfclEmailAdrs": "string",
        "exctvNm": "string",
        "bidQlfctRgstDt": "string",
        "cmmnSpldmdAgrmntRcptdocMethd": "string",
        "cmmnSpldmdAgrmntClseDt": "string",
        "cmmnSpldmdCorpRgnLmtYn": "string",
        "bidBeginDt": "string",
        "bidClseDt": "string",
        "opengDt": "string",
        "bidPrtcptFee": "string",
        "crdtrNm": "string",
        "ppswGnrlSrvceYn": "string",
        "srvceDivNm": "string",
        "prdctClsfcLmtYn": "string",
        "mnfctYn": "string",
        "untyNtceNo": "string",
        "cmmnSpldmdMethdCd": "string",
        "pubPrcrmntClsfcNo": "string",
        "refNo": "string",
        "ntceSpecFileNm1": "string",
        "ntceSpecFileNm2": "string",
        "ntceSpecDocUrl4": "string",
        "ntceSpecDocUrl5": "string",
        "ntceSpecDocUrl6": "string",
        "dsgntCmptYn": "string",
        "arsltCmptYn": "string",
        "tpEvalApplMthdNm": "string",
        "rbidOpengDt": "string",
        "dcmtgOprtnPlce": "string",
        "bidNtceDtlUrl": "string",
        "bidNtceUrl": "string",
        "bidPrtcptFeePaymntYn": "string",
        "ntceSpecFileNm3": "string",
        "ntceSpecFileNm4": "string",
        "ntceSpecFileNm5": "string",
        "asignBdgtAmt": "string",
        "presmptPrce": "string",
        "opengPlce": "string",
        "dcmtgOprtnDt": "string",
        "ntceSpecFileNm6": "string",
        "ntceSpecFileNm7": "string",
        "ntceSpecFileNm8": "string",
        "sucsfbidLwltRate": "string",
        "rgstDt": "string",
        "arsltReqstdocRcptDt": "string",
        "orderPlanUntyNo": "string",
        "rsrvtnPrceReMkngMthdNm": "string",
        "arsltApplDocRcptMthdNm": "string",
        "pqEvalYn": "string",
        "tpEvalYn": "string",
        "ntceDscrptYn": "string",
        "ntceKindNm": "string",
        "intrbidYn": "string",
        "bidNtceDt": "string",
        "reNtceYn": "string",
        "rgstTyNm": "string"
      }
    },
    "numOfRows": "string",
    "totalCount": "string"
  }
}