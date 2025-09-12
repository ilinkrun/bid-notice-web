import re
import json
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from .api_client import DataGoKrApiClient
from utils.utils_log import setup_logger

logger = setup_logger(__name__)


@dataclass
class CollectionResult:
    """데이터 수집 결과"""
    total_count: int = 0
    collected_count: int = 0
    new_count: int = 0
    updated_count: int = 0
    error_count: int = 0
    errors: List[str] = None
    
    def __post_init__(self):
        if self.errors is None:
            self.errors = []


class BidNoticeParser:
    """입찰공고 데이터 파서"""
    
    @staticmethod
    def parse_date(date_str: str) -> Optional[date]:
        """날짜 문자열을 date 객체로 변환"""
        if not date_str:
            return None
        
        try:
            # YYYYMMDD 형식
            if len(date_str) == 8 and date_str.isdigit():
                return datetime.strptime(date_str, '%Y%m%d').date()
            
            # YYYY-MM-DD 형식
            if '-' in date_str:
                return datetime.strptime(date_str[:10], '%Y-%m-%d').date()
                
            return None
        except ValueError:
            logger.warning(f"날짜 파싱 실패: {date_str}")
            return None
    
    @staticmethod
    def parse_datetime(datetime_str: str) -> Optional[datetime]:
        """날짜시간 문자열을 datetime 객체로 변환"""
        if not datetime_str:
            return None
        
        try:
            # YYYYMMDD HHMM 형식
            if len(datetime_str) >= 12:
                clean_str = re.sub(r'[^\d]', '', datetime_str)
                if len(clean_str) >= 12:
                    return datetime.strptime(clean_str[:12], '%Y%m%d%H%M')
            
            # YYYY-MM-DD HH:MM:SS 형식
            if '-' in datetime_str and ':' in datetime_str:
                return datetime.strptime(datetime_str[:19], '%Y-%m-%d %H:%M:%S')
                
            # YYYY-MM-DD 형식 (시간 없음)
            if '-' in datetime_str:
                return datetime.strptime(datetime_str[:10], '%Y-%m-%d')
                
            return None
        except ValueError:
            logger.warning(f"날짜시간 파싱 실패: {datetime_str}")
            return None
    
    @staticmethod
    def parse_amount(amount_str: str) -> Optional[int]:
        """금액 문자열을 정수로 변환"""
        if not amount_str:
            return None
        
        try:
            # 숫자가 아닌 문자 제거
            clean_amount = re.sub(r'[^\d]', '', str(amount_str))
            if clean_amount:
                return int(clean_amount)
            return None
        except ValueError:
            logger.warning(f"금액 파싱 실패: {amount_str}")
            return None
    
    @classmethod
    def parse_bid_notice(cls, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        API 응답 데이터를 데이터베이스 저장 형식으로 변환
        
        Args:
            raw_data: API 응답의 단일 입찰공고 데이터
            
        Returns:
            파싱된 입찰공고 데이터
        """
        parsed = {
            # 기본 정보
            'bid_notice_no': raw_data.get('bidNtceNo', ''),
            'bid_notice_name': raw_data.get('bidNtceNm', ''),
            'bid_notice_url': raw_data.get('ntceInsttNm', ''),  # URL이 제공되지 않는 경우가 많음
            
            # 기관 정보
            'dept_code': raw_data.get('ntceInsttCd', ''),
            'dept_name': raw_data.get('ntceInsttNm', ''),
            'area_code': raw_data.get('dminsttCd', ''),
            'area_name': raw_data.get('dminsttNm', ''),
            
            # 입찰 정보
            'bid_kind_code': raw_data.get('bidMethdCd', ''),
            'bid_kind_name': raw_data.get('bidMethdNm', ''),
            'bid_method_code': raw_data.get('cntrctCnclsMthdCd', ''),
            'bid_method_name': raw_data.get('cntrctCnclsMthdNm', ''),
            'contract_kind_code': raw_data.get('rcptRegistNo', ''),  # 적절한 필드로 매핑 필요
            'contract_kind_name': raw_data.get('rcptRegistNm', ''),
            
            # 일정 정보
            'notice_date': cls.parse_date(raw_data.get('bidNtceDt', '')),
            'notice_start_date': cls.parse_datetime(raw_data.get('bidNtceStDt', '')),
            'notice_end_date': cls.parse_datetime(raw_data.get('bidNtceEndDt', '')),
            'bid_date': cls.parse_datetime(raw_data.get('opengDt', '')),
            
            # 금액 정보
            'budget_amount': cls.parse_amount(raw_data.get('asignBdgtAmt', '')),
            'estimated_price': cls.parse_amount(raw_data.get('presmptPrce', '')),
            
            # 업무 분류
            'work_class_code': raw_data.get('indstrytyLmttClCd', ''),
            'work_class_name': raw_data.get('indstrytyLmttClNm', ''),
            'industry_code': raw_data.get('prtcptCnditnCd', ''),  # 적절한 필드로 매핑 필요
            'industry_name': raw_data.get('prtcptCnditnNm', ''),
            
            # 기타 정보
            'bid_qualification': raw_data.get('prtcptCndtnCn', ''),
            'bid_condition': raw_data.get('bidNtceDtlCn', ''),
            'contract_period': raw_data.get('cntrctPrd', ''),
            'delivery_place': raw_data.get('dlvryPlce', ''),
            
            # 첨부파일 정보 (있는 경우)
            'attachments': cls._parse_attachments(raw_data),
            
            # 원본 데이터
            'raw_data': raw_data,
            
            # 수집 시간
            'scraped_at': datetime.now(),
            
            # 초기값
            'category': None,
            'keywords': None,
            'score': 0,
            'is_processed': False,
            'is_matched': False,
        }
        
        return parsed
    
    @staticmethod
    def _parse_attachments(raw_data: Dict[str, Any]) -> Optional[List[Dict[str, str]]]:
        """첨부파일 정보 파싱"""
        attachments = []
        
        # API 응답에서 첨부파일 관련 필드 검색
        for key, value in raw_data.items():
            if 'file' in key.lower() or 'attach' in key.lower():
                if value:
                    attachments.append({
                        'field': key,
                        'value': str(value)
                    })
        
        return attachments if attachments else None


class BidNoticeCollector:
    """입찰공고 수집기"""
    
    def __init__(self, service_key: str):
        self.api_client = DataGoKrApiClient(service_key)
        self.parser = BidNoticeParser()
    
    def collect_daily_notices(
        self,
        target_date: Optional[date] = None,
        area_code: Optional[str] = None,
        org_name: Optional[str] = None,
        bid_kind: Optional[str] = None
    ) -> CollectionResult:
        """
        특정 날짜의 입찰공고 수집
        
        Args:
            target_date: 수집 대상 날짜 (기본값: 오늘)
            area_code: 지역코드 필터
            org_name: 기관명 필터  
            bid_kind: 입찰종류 필터
            
        Returns:
            수집 결과
        """
        if target_date is None:
            target_date = date.today()
        
        logger.info(f"일일 입찰공고 수집 시작: {target_date}")
        
        result = CollectionResult()
        
        try:
            # API 호출
            api_result = self.api_client.get_all_bid_list(
                start_date=target_date,
                end_date=target_date,
                area_code=area_code,
                org_name=org_name,
                bid_kind=bid_kind
            )
            
            result.total_count = len(api_result)
            logger.info(f"API에서 {result.total_count}건의 공고를 받았습니다.")
            
            # 데이터 파싱
            parsed_notices = []
            for raw_item in api_result:
                try:
                    parsed_item = self.parser.parse_bid_notice(raw_item)
                    parsed_notices.append(parsed_item)
                    result.collected_count += 1
                except Exception as e:
                    error_msg = f"데이터 파싱 오류: {str(e)} | 데이터: {raw_item}"
                    logger.error(error_msg)
                    result.errors.append(error_msg)
                    result.error_count += 1
            
            logger.info(f"파싱 완료: {result.collected_count}건 성공, {result.error_count}건 실패")
            
            return result, parsed_notices
            
        except Exception as e:
            error_msg = f"입찰공고 수집 중 오류: {str(e)}"
            logger.error(error_msg)
            result.errors.append(error_msg)
            result.error_count += 1
            return result, []
    
    def collect_period_notices(
        self,
        start_date: date,
        end_date: date,
        area_code: Optional[str] = None,
        org_name: Optional[str] = None,
        bid_kind: Optional[str] = None
    ) -> Tuple[CollectionResult, List[Dict[str, Any]]]:
        """
        기간별 입찰공고 수집
        
        Args:
            start_date: 시작일
            end_date: 종료일
            area_code: 지역코드 필터
            org_name: 기관명 필터
            bid_kind: 입찰종류 필터
            
        Returns:
            (수집 결과, 파싱된 공고 목록)
        """
        logger.info(f"기간별 입찰공고 수집 시작: {start_date} ~ {end_date}")
        
        total_result = CollectionResult()
        all_parsed_notices = []
        
        current_date = start_date
        while current_date <= end_date:
            try:
                daily_result, daily_notices = self.collect_daily_notices(
                    target_date=current_date,
                    area_code=area_code,
                    org_name=org_name,
                    bid_kind=bid_kind
                )
                
                # 결과 합산
                total_result.total_count += daily_result.total_count
                total_result.collected_count += daily_result.collected_count
                total_result.error_count += daily_result.error_count
                total_result.errors.extend(daily_result.errors)
                
                all_parsed_notices.extend(daily_notices)
                
                logger.info(f"{current_date} 수집 완료: {daily_result.collected_count}건")
                
            except Exception as e:
                error_msg = f"{current_date} 수집 중 오류: {str(e)}"
                logger.error(error_msg)
                total_result.errors.append(error_msg)
                total_result.error_count += 1
            
            current_date += timedelta(days=1)
        
        logger.info(f"기간별 수집 완료: 총 {total_result.collected_count}건")
        return total_result, all_parsed_notices


def test_collector():
    """수집기 테스트 함수"""
    # 테스트용 서비스키 (실제 사용시 환경변수에서 가져와야 함)
    service_key = "YOUR_SERVICE_KEY_HERE"
    
    collector = BidNoticeCollector(service_key)
    
    try:
        # 오늘 날짜로 테스트
        result, notices = collector.collect_daily_notices()
        
        print(f"=== 수집 결과 ===")
        print(f"총 건수: {result.total_count}")
        print(f"수집 건수: {result.collected_count}")
        print(f"오류 건수: {result.error_count}")
        
        if result.errors:
            print(f"\n=== 오류 목록 ===")
            for error in result.errors:
                print(f"- {error}")
        
        if notices:
            print(f"\n=== 첫 번째 공고 (파싱된 데이터) ===")
            first_notice = notices[0]
            for key, value in first_notice.items():
                if key != 'raw_data':  # 원본 데이터는 너무 길어서 제외
                    print(f"{key}: {value}")
                    
    except Exception as e:
        print(f"테스트 실패: {str(e)}")


if __name__ == "__main__":
    test_collector()