import requests
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Any
from datetime import datetime, date
import json
import time
from urllib.parse import urlencode

from utils.utils_log import setup_logger

logger = setup_logger(__name__)


class DataGoKrApiClient:
    """공공데이터포털 조달청 나라장터 입찰공고정보서비스 API 클라이언트"""
    
    BASE_URL = "https://apis.data.go.kr/1230000/BidPublicInfoService04"
    
    def __init__(self, service_key: str, timeout: int = 30):
        """
        Args:
            service_key: 공공데이터포털에서 발급받은 서비스키
            timeout: API 요청 타임아웃 (초)
        """
        self.service_key = service_key
        self.timeout = timeout
        self.session = requests.Session()
    
    def _make_request(self, endpoint: str, params: Dict[str, Any]) -> requests.Response:
        """API 요청 실행"""
        url = f"{self.BASE_URL}/{endpoint}"
        
        # 기본 파라미터 추가
        params.update({
            'serviceKey': self.service_key,
            'type': 'xml'  # XML 응답 형식 지정
        })
        
        logger.info(f"API 요청: {url} | 파라미터: {params}")
        
        try:
            response = self.session.get(url, params=params, timeout=self.timeout)
            response.raise_for_status()
            
            logger.info(f"API 응답 성공: status_code={response.status_code}")
            return response
            
        except requests.exceptions.RequestException as e:
            logger.error(f"API 요청 실패: {str(e)}")
            raise
    
    def _parse_xml_response(self, response: requests.Response) -> Dict[str, Any]:
        """XML 응답 파싱"""
        try:
            root = ET.fromstring(response.content.decode('utf-8'))
            
            # 응답 헤더 정보 파싱
            header = root.find('.//header')
            if header is not None:
                result_code = header.find('resultCode')
                result_msg = header.find('resultMsg')
                
                if result_code is not None and result_code.text != '00':
                    error_msg = result_msg.text if result_msg is not None else '알 수 없는 오류'
                    logger.error(f"API 오류: {result_code.text} - {error_msg}")
                    raise Exception(f"API 오류: {result_code.text} - {error_msg}")
            
            # body 데이터 파싱
            items = []
            body = root.find('.//body')
            if body is not None:
                items_element = body.find('items')
                if items_element is not None:
                    for item in items_element.findall('item'):
                        item_data = {}
                        for child in item:
                            item_data[child.tag] = child.text
                        items.append(item_data)
                
                # 총 개수 정보
                total_count = body.find('totalCount')
                num_of_rows = body.find('numOfRows')
                page_no = body.find('pageNo')
                
                return {
                    'items': items,
                    'totalCount': int(total_count.text) if total_count is not None else 0,
                    'numOfRows': int(num_of_rows.text) if num_of_rows is not None else 0,
                    'pageNo': int(page_no.text) if page_no is not None else 1
                }
            
            return {'items': [], 'totalCount': 0, 'numOfRows': 0, 'pageNo': 1}
            
        except ET.ParseError as e:
            logger.error(f"XML 파싱 오류: {str(e)}")
            logger.error(f"응답 내용: {response.text[:1000]}")
            raise Exception(f"XML 파싱 오류: {str(e)}")
    
    def get_bid_list(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page_no: int = 1,
        num_of_rows: int = 100,
        area_code: Optional[str] = None,
        org_name: Optional[str] = None,
        bid_kind: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        입찰공고목록 정보 조회 (getBidPblancListInfoServc)
        
        Args:
            start_date: 검색 시작일 (기본값: 오늘)
            end_date: 검색 종료일 (기본값: 오늘)
            page_no: 페이지 번호 (기본값: 1)
            num_of_rows: 한 페이지 결과 수 (기본값: 100, 최대: 999)
            area_code: 지역코드
            org_name: 기관명
            bid_kind: 입찰종류 (01: 일반, 02: 제한, 03: 지명, 04: 턴키)
            
        Returns:
            입찰공고 목록 데이터
        """
        if start_date is None:
            start_date = date.today()
        if end_date is None:
            end_date = date.today()
        
        params = {
            'inqryBgnDt': start_date.strftime('%Y%m%d'),
            'inqryEndDt': end_date.strftime('%Y%m%d'),
            'pageNo': page_no,
            'numOfRows': min(num_of_rows, 999)  # 최대 999개로 제한
        }
        
        # 선택적 파라미터 추가
        if area_code:
            params['areaCd'] = area_code
        if org_name:
            params['instNm'] = org_name
        if bid_kind:
            params['bidKind'] = bid_kind
        
        response = self._make_request('getBidPblancListInfoServc', params)
        return self._parse_xml_response(response)
    
    def get_all_bid_list(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        area_code: Optional[str] = None,
        org_name: Optional[str] = None,
        bid_kind: Optional[str] = None,
        delay_seconds: float = 0.1
    ) -> List[Dict[str, Any]]:
        """
        전체 입찰공고목록 정보 조회 (페이지네이션 자동 처리)
        
        Args:
            start_date: 검색 시작일
            end_date: 검색 종료일
            area_code: 지역코드
            org_name: 기관명
            bid_kind: 입찰종류
            delay_seconds: 페이지 간 지연시간 (API 제한 고려)
            
        Returns:
            전체 입찰공고 목록
        """
        all_items = []
        page_no = 1
        num_of_rows = 999  # 최대값 사용
        
        logger.info(f"전체 입찰공고 조회 시작: {start_date} ~ {end_date}")
        
        while True:
            try:
                result = self.get_bid_list(
                    start_date=start_date,
                    end_date=end_date,
                    page_no=page_no,
                    num_of_rows=num_of_rows,
                    area_code=area_code,
                    org_name=org_name,
                    bid_kind=bid_kind
                )
                
                items = result.get('items', [])
                if not items:
                    break
                
                all_items.extend(items)
                logger.info(f"페이지 {page_no} 조회 완료: {len(items)}건 (누적: {len(all_items)}건)")
                
                # 마지막 페이지 확인
                if len(items) < num_of_rows:
                    break
                
                page_no += 1
                
                # API 제한을 고려한 지연
                if delay_seconds > 0:
                    time.sleep(delay_seconds)
                    
            except Exception as e:
                logger.error(f"페이지 {page_no} 조회 중 오류: {str(e)}")
                break
        
        logger.info(f"전체 입찰공고 조회 완료: 총 {len(all_items)}건")
        return all_items


def test_api():
    """API 테스트 함수"""
    # 테스트용 서비스키 (실제 사용시 환경변수에서 가져와야 함)
    service_key = "YOUR_SERVICE_KEY_HERE"
    
    client = DataGoKrApiClient(service_key)
    
    try:
        # 오늘 날짜로 테스트
        result = client.get_bid_list(num_of_rows=10)
        print(f"총 건수: {result['totalCount']}")
        print(f"조회된 건수: {len(result['items'])}")
        
        # 첫 번째 항목 출력
        if result['items']:
            item = result['items'][0]
            print("\n=== 첫 번째 입찰공고 ===")
            for key, value in item.items():
                print(f"{key}: {value}")
                
    except Exception as e:
        print(f"테스트 실패: {str(e)}")


if __name__ == "__main__":
    test_api()