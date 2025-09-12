import os
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any
import argparse

from .api_client import DataGoKrApiClient
from .collector import BidNoticeCollector, CollectionResult
from .database import DatabaseManager
from utils.utils_log import setup_logger

logger = setup_logger(__name__)


class PublicBidNoticeService:
    """공공데이터 입찰공고 통합 서비스"""
    
    def __init__(self, service_key: str):
        """
        Args:
            service_key: 공공데이터포털 서비스키
        """
        self.service_key = service_key
        self.collector = BidNoticeCollector(service_key)
        self.db_manager = DatabaseManager()
    
    def initialize_database(self, drop_existing: bool = False):
        """
        데이터베이스 초기화
        
        Args:
            drop_existing: 기존 테이블 삭제 여부
        """
        logger.info("데이터베이스 초기화 시작")
        try:
            self.db_manager.create_tables(drop_existing=drop_existing)
            logger.info("데이터베이스 초기화 완료")
        except Exception as e:
            logger.error(f"데이터베이스 초기화 실패: {str(e)}")
            raise
    
    def collect_and_save_daily(
        self,
        target_date: Optional[date] = None,
        area_code: Optional[str] = None,
        org_name: Optional[str] = None,
        bid_kind: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        일일 입찰공고 수집 및 저장
        
        Args:
            target_date: 수집 대상 날짜 (기본값: 오늘)
            area_code: 지역코드 필터
            org_name: 기관명 필터
            bid_kind: 입찰종류 필터
            
        Returns:
            수집 및 저장 결과
        """
        if target_date is None:
            target_date = date.today()
        
        started_at = datetime.now()
        logger.info(f"일일 입찰공고 수집 시작: {target_date}")
        
        try:
            # 데이터 수집
            collection_result, parsed_notices = self.collector.collect_daily_notices(
                target_date=target_date,
                area_code=area_code,
                org_name=org_name,
                bid_kind=bid_kind
            )
            
            # 데이터 저장
            save_result = self._save_notices(parsed_notices)
            
            # 결과 통합
            final_result = CollectionResult(
                total_count=collection_result.total_count,
                collected_count=collection_result.collected_count,
                new_count=save_result['new_count'],
                updated_count=save_result['updated_count'],
                error_count=collection_result.error_count + save_result['error_count'],
                errors=collection_result.errors + save_result['errors']
            )
            
            # 수집 로그 저장
            log_id = self.db_manager.save_collection_log(
                api_endpoint='getBidPblancListInfoServc',
                request_params={
                    'target_date': target_date.isoformat(),
                    'area_code': area_code,
                    'org_name': org_name,
                    'bid_kind': bid_kind
                },
                result=final_result,
                start_date=target_date,
                end_date=target_date,
                started_at=started_at
            )
            
            # 키워드 매칭 처리 (신규 데이터가 있는 경우)
            if final_result.new_count > 0:
                matched_count = self.db_manager.apply_keyword_matching()
                logger.info(f"키워드 매칭 처리: {matched_count}건")
            
            logger.info(f"일일 수집 완료 - 신규: {final_result.new_count}, 업데이트: {final_result.updated_count}, 오류: {final_result.error_count}")
            
            return {
                'success': True,
                'log_id': log_id,
                'date': target_date.isoformat(),
                'total_count': final_result.total_count,
                'new_count': final_result.new_count,
                'updated_count': final_result.updated_count,
                'error_count': final_result.error_count,
                'errors': final_result.errors
            }
            
        except Exception as e:
            logger.error(f"일일 수집 처리 중 오류: {str(e)}")
            
            # 실패 로그 저장
            error_result = CollectionResult(error_count=1, errors=[str(e)])
            self.db_manager.save_collection_log(
                api_endpoint='getBidPblancListInfoServc',
                request_params={'target_date': target_date.isoformat()},
                result=error_result,
                start_date=target_date,
                end_date=target_date,
                started_at=started_at
            )
            
            return {
                'success': False,
                'error': str(e),
                'date': target_date.isoformat()
            }
        finally:
            self.db_manager.close_connection()
    
    def collect_and_save_period(
        self,
        start_date: date,
        end_date: date,
        area_code: Optional[str] = None,
        org_name: Optional[str] = None,
        bid_kind: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        기간별 입찰공고 수집 및 저장
        
        Args:
            start_date: 시작일
            end_date: 종료일
            area_code: 지역코드 필터
            org_name: 기관명 필터
            bid_kind: 입찰종류 필터
            
        Returns:
            수집 및 저장 결과
        """
        started_at = datetime.now()
        logger.info(f"기간별 입찰공고 수집 시작: {start_date} ~ {end_date}")
        
        try:
            # 데이터 수집
            collection_result, parsed_notices = self.collector.collect_period_notices(
                start_date=start_date,
                end_date=end_date,
                area_code=area_code,
                org_name=org_name,
                bid_kind=bid_kind
            )
            
            # 데이터 저장
            save_result = self._save_notices(parsed_notices)
            
            # 결과 통합
            final_result = CollectionResult(
                total_count=collection_result.total_count,
                collected_count=collection_result.collected_count,
                new_count=save_result['new_count'],
                updated_count=save_result['updated_count'],
                error_count=collection_result.error_count + save_result['error_count'],
                errors=collection_result.errors + save_result['errors']
            )
            
            # 수집 로그 저장
            log_id = self.db_manager.save_collection_log(
                api_endpoint='getBidPblancListInfoServc',
                request_params={
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'area_code': area_code,
                    'org_name': org_name,
                    'bid_kind': bid_kind
                },
                result=final_result,
                start_date=start_date,
                end_date=end_date,
                started_at=started_at
            )
            
            # 키워드 매칭 처리
            if final_result.new_count > 0:
                matched_count = self.db_manager.apply_keyword_matching()
                logger.info(f"키워드 매칭 처리: {matched_count}건")
            
            logger.info(f"기간별 수집 완료 - 신규: {final_result.new_count}, 업데이트: {final_result.updated_count}, 오류: {final_result.error_count}")
            
            return {
                'success': True,
                'log_id': log_id,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'total_count': final_result.total_count,
                'new_count': final_result.new_count,
                'updated_count': final_result.updated_count,
                'error_count': final_result.error_count,
                'errors': final_result.errors
            }
            
        except Exception as e:
            logger.error(f"기간별 수집 처리 중 오류: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
        finally:
            self.db_manager.close_connection()
    
    def _save_notices(self, notices: List[Dict[str, Any]]) -> Dict[str, Any]:
        """공고 데이터 저장"""
        save_result = {
            'new_count': 0,
            'updated_count': 0,
            'error_count': 0,
            'errors': []
        }
        
        for notice in notices:
            try:
                notice_id, is_new = self.db_manager.save_bid_notice(notice)
                if is_new:
                    save_result['new_count'] += 1
                else:
                    save_result['updated_count'] += 1
                    
            except Exception as e:
                error_msg = f"공고 저장 오류: {str(e)} | 공고번호: {notice.get('bid_notice_no', 'Unknown')}"
                logger.error(error_msg)
                save_result['errors'].append(error_msg)
                save_result['error_count'] += 1
        
        return save_result
    
    def get_statistics(self) -> Dict[str, Any]:
        """서비스 통계 정보"""
        try:
            return self.db_manager.get_statistics()
        except Exception as e:
            logger.error(f"통계 조회 실패: {str(e)}")
            return {'error': str(e)}
        finally:
            self.db_manager.close_connection()
    
    def process_keyword_matching(self, limit: int = 1000) -> Dict[str, Any]:
        """키워드 매칭 일괄 처리"""
        try:
            processed_count = self.db_manager.apply_keyword_matching(limit=limit)
            return {
                'success': True,
                'processed_count': processed_count
            }
        except Exception as e:
            logger.error(f"키워드 매칭 처리 실패: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
        finally:
            self.db_manager.close_connection()


def main():
    """CLI 실행 함수"""
    parser = argparse.ArgumentParser(description='공공데이터 입찰공고 수집 서비스')
    parser.add_argument('--service-key', required=True, help='공공데이터포털 서비스키')
    parser.add_argument('--action', required=True, 
                      choices=['init', 'daily', 'period', 'stats', 'keywords'],
                      help='수행할 작업')
    parser.add_argument('--date', help='수집 날짜 (YYYY-MM-DD)')
    parser.add_argument('--start-date', help='시작 날짜 (YYYY-MM-DD)')
    parser.add_argument('--end-date', help='종료 날짜 (YYYY-MM-DD)')
    parser.add_argument('--area-code', help='지역코드 필터')
    parser.add_argument('--org-name', help='기관명 필터')
    parser.add_argument('--bid-kind', help='입찰종류 필터')
    parser.add_argument('--drop-tables', action='store_true', help='기존 테이블 삭제 후 재생성')
    
    args = parser.parse_args()
    
    service = PublicBidNoticeService(args.service_key)
    
    try:
        if args.action == 'init':
            # 데이터베이스 초기화
            print("데이터베이스 초기화 중...")
            service.initialize_database(drop_existing=args.drop_tables)
            print("데이터베이스 초기화 완료")
            
        elif args.action == 'daily':
            # 일일 수집
            target_date = date.fromisoformat(args.date) if args.date else date.today()
            print(f"{target_date} 일일 입찰공고 수집 중...")
            
            result = service.collect_and_save_daily(
                target_date=target_date,
                area_code=args.area_code,
                org_name=args.org_name,
                bid_kind=args.bid_kind
            )
            
            if result['success']:
                print(f"수집 완료 - 신규: {result['new_count']}, 업데이트: {result['updated_count']}")
                if result['error_count'] > 0:
                    print(f"오류: {result['error_count']}건")
            else:
                print(f"수집 실패: {result['error']}")
                
        elif args.action == 'period':
            # 기간별 수집
            if not args.start_date or not args.end_date:
                print("기간별 수집은 --start-date와 --end-date 파라미터가 필요합니다.")
                return
                
            start_date = date.fromisoformat(args.start_date)
            end_date = date.fromisoformat(args.end_date)
            
            print(f"{start_date} ~ {end_date} 기간 입찰공고 수집 중...")
            
            result = service.collect_and_save_period(
                start_date=start_date,
                end_date=end_date,
                area_code=args.area_code,
                org_name=args.org_name,
                bid_kind=args.bid_kind
            )
            
            if result['success']:
                print(f"수집 완료 - 신규: {result['new_count']}, 업데이트: {result['updated_count']}")
                if result['error_count'] > 0:
                    print(f"오류: {result['error_count']}건")
            else:
                print(f"수집 실패: {result['error']}")
                
        elif args.action == 'stats':
            # 통계 조회
            print("통계 정보 조회 중...")
            stats = service.get_statistics()
            
            if 'error' not in stats:
                print(f"\n=== 데이터베이스 통계 ===")
                print(f"전체 공고 수: {stats.get('total_notices', 0):,}")
                print(f"처리된 공고 수: {stats.get('processed_notices', 0):,}")
                print(f"매칭된 공고 수: {stats.get('matched_notices', 0):,}")
                
                print(f"\n=== 카테고리별 분포 ===")
                for category, count in stats.get('category_distribution', {}).items():
                    print(f"{category}: {count:,}")
                
                print(f"\n=== 최근 수집 로그 ===")
                for log in stats.get('recent_collections', []):
                    print(f"{log['date']}: {log['count']}건 ({log['status']})")
            else:
                print(f"통계 조회 실패: {stats['error']}")
                
        elif args.action == 'keywords':
            # 키워드 매칭 처리
            print("키워드 매칭 처리 중...")
            result = service.process_keyword_matching()
            
            if result['success']:
                print(f"키워드 매칭 처리 완료: {result['processed_count']}건")
            else:
                print(f"키워드 매칭 처리 실패: {result['error']}")
                
    except Exception as e:
        logger.error(f"실행 중 오류: {str(e)}")
        print(f"오류 발생: {str(e)}")


if __name__ == "__main__":
    main()