import json
import re
from datetime import datetime, date
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass

from utils.utils_mysql import Mysql
from utils.utils_log import setup_logger
from .models import (
    CREATE_TABLES_ORDER, 
    DEFAULT_KEYWORD_RULES
)

logger = setup_logger(__name__)


@dataclass 
class KeywordMatch:
    """키워드 매칭 결과"""
    keyword: str
    category: str
    weight: int
    field: str
    match_type: str


class DatabaseManager:
    """공공데이터 입찰공고 데이터베이스 관리자"""
    
    def __init__(self):
        self.mysql = None
    
    def get_connection(self):
        """데이터베이스 연결 반환"""
        if self.mysql is None:
            self.mysql = Mysql()
        return self.mysql
    
    def close_connection(self):
        """데이터베이스 연결 종료"""
        if self.mysql:
            self.mysql.close()
            self.mysql = None
    
    def create_tables(self, drop_existing: bool = False):
        """
        필요한 테이블들을 생성
        
        Args:
            drop_existing: 기존 테이블을 삭제하고 재생성할지 여부
        """
        mysql = self.get_connection()
        
        try:
            logger.info("데이터베이스 테이블 생성 시작")
            
            for table_name, table_sql in CREATE_TABLES_ORDER:
                try:
                    if drop_existing:
                        # 기존 테이블 삭제 (외래키 제약조건 때문에 순서 주의)
                        mysql.execute(f"DROP TABLE IF EXISTS {table_name}")
                        logger.info(f"기존 테이블 삭제: {table_name}")
                    
                    # 테이블 생성
                    mysql.execute(table_sql)
                    logger.info(f"테이블 생성 완료: {table_name}")
                    
                except Exception as e:
                    logger.error(f"테이블 {table_name} 생성 실패: {str(e)}")
                    raise
            
            # 기본 키워드 규칙 삽입 (테이블이 비어있는 경우만)
            self._insert_default_keyword_rules()
            
            logger.info("모든 테이블 생성 완료")
            
        except Exception as e:
            logger.error(f"테이블 생성 중 오류: {str(e)}")
            raise
    
    def _insert_default_keyword_rules(self):
        """기본 키워드 규칙 삽입"""
        mysql = self.get_connection()
        
        try:
            # 이미 데이터가 있는지 확인
            existing = mysql.find('keyword_rules', fields=['COUNT(*)'])
            if existing and existing[0][0] > 0:
                logger.info("키워드 규칙이 이미 존재합니다. 스킵합니다.")
                return
            
            logger.info("기본 키워드 규칙 삽입 시작")
            
            for rule in DEFAULT_KEYWORD_RULES:
                rule_data = {
                    'keyword': rule['keyword'],
                    'category': rule['category'],
                    'weight': rule['weight'],
                    'match_field': 'all',
                    'match_type': 'contains',
                    'is_negative': False,
                    'is_active': True,
                    'created_by': 'system'
                }
                mysql.insert('keyword_rules', rule_data)
            
            logger.info(f"{len(DEFAULT_KEYWORD_RULES)}개의 기본 키워드 규칙 삽입 완료")
            
        except Exception as e:
            logger.error(f"기본 키워드 규칙 삽입 실패: {str(e)}")
    
    def save_bid_notice(self, notice_data: Dict[str, Any]) -> Tuple[int, bool]:
        """
        입찰공고 데이터 저장 또는 업데이트
        
        Args:
            notice_data: 파싱된 입찰공고 데이터
            
        Returns:
            (저장된 ID, 신규 여부)
        """
        mysql = self.get_connection()
        
        try:
            bid_notice_no = notice_data.get('bid_notice_no')
            if not bid_notice_no:
                raise ValueError("입찰공고번호가 없습니다.")
            
            # 기존 데이터 확인
            existing = mysql.find(
                'public_bid_notices',
                fields=['id', 'updated_at'],
                addStr=f"WHERE bid_notice_no = '{bid_notice_no}'"
            )
            
            # JSON 필드 처리
            db_data = notice_data.copy()
            if db_data.get('attachments'):
                db_data['attachments'] = json.dumps(db_data['attachments'], ensure_ascii=False)
            if db_data.get('keywords'):
                db_data['keywords'] = json.dumps(db_data['keywords'], ensure_ascii=False)
            if db_data.get('raw_data'):
                db_data['raw_data'] = json.dumps(db_data['raw_data'], ensure_ascii=False)
            
            if existing:
                # 기존 데이터 업데이트
                notice_id = existing[0][0]
                mysql.update('public_bid_notices', db_data, f"id = {notice_id}")
                logger.debug(f"입찰공고 업데이트: {bid_notice_no} (ID: {notice_id})")
                return notice_id, False
            else:
                # 신규 데이터 삽입
                notice_id = mysql.insert('public_bid_notices', db_data)
                logger.debug(f"입찰공고 신규 삽입: {bid_notice_no} (ID: {notice_id})")
                return notice_id, True
                
        except Exception as e:
            logger.error(f"입찰공고 저장 실패: {str(e)}")
            raise
    
    def save_collection_log(
        self,
        api_endpoint: str,
        request_params: Dict[str, Any],
        result: CollectionResult,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        started_at: Optional[datetime] = None
    ) -> int:
        """
        API 수집 로그 저장
        
        Args:
            api_endpoint: API 엔드포인트
            request_params: 요청 파라미터
            result: 수집 결과
            start_date: 수집 시작일
            end_date: 수집 종료일
            started_at: 시작 시간
            
        Returns:
            저장된 로그 ID
        """
        mysql = self.get_connection()
        
        try:
            log_data = {
                'api_endpoint': api_endpoint,
                'request_params': json.dumps(request_params, ensure_ascii=False),
                'total_count': result.total_count,
                'collected_count': result.collected_count,
                'new_count': result.new_count,
                'updated_count': result.updated_count,
                'error_count': result.error_count,
                'start_date': start_date,
                'end_date': end_date,
                'status': 'completed' if result.error_count == 0 else 'failed',
                'started_at': started_at or datetime.now(),
                'completed_at': datetime.now(),
                'error_message': '; '.join(result.errors[:5]) if result.errors else None,  # 처음 5개만
                'error_details': json.dumps(result.errors, ensure_ascii=False) if result.errors else None
            }
            
            # 소요시간 계산
            if started_at:
                duration = (datetime.now() - started_at).total_seconds()
                log_data['duration_seconds'] = int(duration)
            
            log_id = mysql.insert('api_collection_logs', log_data)
            logger.info(f"수집 로그 저장 완료: ID {log_id}")
            
            return log_id
            
        except Exception as e:
            logger.error(f"수집 로그 저장 실패: {str(e)}")
            raise
    
    def apply_keyword_matching(self, limit: int = 100) -> int:
        """
        미처리 입찰공고들에 키워드 매칭 적용
        
        Args:
            limit: 한번에 처리할 최대 건수
            
        Returns:
            처리된 건수
        """
        mysql = self.get_connection()
        
        try:
            # 활성화된 키워드 규칙 조회
            keyword_rules = mysql.find(
                'keyword_rules',
                fields=['keyword', 'category', 'weight', 'match_field', 'match_type', 'is_negative'],
                addStr="WHERE is_active = 1"
            )
            
            if not keyword_rules:
                logger.warning("활성화된 키워드 규칙이 없습니다.")
                return 0
            
            # 미처리 공고 조회
            unprocessed = mysql.find(
                'public_bid_notices',
                fields=['id', 'bid_notice_name', 'dept_name', 'work_class_name', 'industry_name'],
                addStr=f"WHERE is_processed = 0 LIMIT {limit}"
            )
            
            if not unprocessed:
                logger.info("처리할 미처리 공고가 없습니다.")
                return 0
            
            processed_count = 0
            
            for notice in unprocessed:
                notice_id = notice[0]
                notice_name = notice[1] or ''
                dept_name = notice[2] or ''
                work_class = notice[3] or ''
                industry = notice[4] or ''
                
                matches = self._find_keyword_matches(
                    keyword_rules,
                    {
                        'title': notice_name,
                        'dept_name': dept_name,
                        'work_class': work_class,
                        'industry': industry,
                        'content': f"{notice_name} {dept_name} {work_class} {industry}"
                    }
                )
                
                # 매칭 결과 적용
                if matches:
                    category, keywords, total_score = self._calculate_match_results(matches)
                    
                    update_data = {
                        'category': category,
                        'keywords': json.dumps(keywords, ensure_ascii=False),
                        'score': total_score,
                        'is_matched': True,
                        'is_processed': True
                    }
                else:
                    update_data = {
                        'is_matched': False,
                        'is_processed': True
                    }
                
                mysql.update('public_bid_notices', update_data, f"id = {notice_id}")
                processed_count += 1
            
            logger.info(f"키워드 매칭 처리 완료: {processed_count}건")
            return processed_count
            
        except Exception as e:
            logger.error(f"키워드 매칭 처리 실패: {str(e)}")
            raise
    
    def _find_keyword_matches(
        self,
        keyword_rules: List[Tuple],
        content_fields: Dict[str, str]
    ) -> List[KeywordMatch]:
        """키워드 매칭 수행"""
        matches = []
        
        for rule in keyword_rules:
            keyword, category, weight, match_field, match_type, is_negative = rule
            
            # 매칭 대상 필드 선택
            if match_field == 'all':
                search_text = ' '.join(content_fields.values()).lower()
            else:
                search_text = content_fields.get(match_field, '').lower()
            
            if not search_text:
                continue
            
            # 매칭 수행
            is_match = False
            if match_type == 'exact':
                is_match = keyword.lower() == search_text
            elif match_type == 'contains':
                is_match = keyword.lower() in search_text
            elif match_type == 'regex':
                try:
                    is_match = bool(re.search(keyword, search_text, re.IGNORECASE))
                except re.error:
                    logger.warning(f"잘못된 정규식 패턴: {keyword}")
                    continue
            
            # 부정 키워드 처리
            if is_negative:
                is_match = not is_match
            
            if is_match:
                matches.append(KeywordMatch(
                    keyword=keyword,
                    category=category,
                    weight=weight,
                    field=match_field,
                    match_type=match_type
                ))
        
        return matches
    
    def _calculate_match_results(self, matches: List[KeywordMatch]) -> Tuple[str, List[str], int]:
        """매칭 결과에서 최종 카테고리, 키워드, 점수 계산"""
        if not matches:
            return None, [], 0
        
        # 카테고리별 점수 집계
        category_scores = {}
        matched_keywords = []
        total_score = 0
        
        for match in matches:
            if match.category not in category_scores:
                category_scores[match.category] = 0
            category_scores[match.category] += match.weight
            total_score += match.weight
            matched_keywords.append(match.keyword)
        
        # 최고 점수의 카테고리 선택
        best_category = max(category_scores.items(), key=lambda x: x[1])[0]
        
        return best_category, list(set(matched_keywords)), total_score
    
    def get_statistics(self) -> Dict[str, Any]:
        """데이터베이스 통계 정보 반환"""
        mysql = self.get_connection()
        
        try:
            stats = {}
            
            # 전체 공고 수
            total = mysql.find('public_bid_notices', fields=['COUNT(*)'])
            stats['total_notices'] = total[0][0] if total else 0
            
            # 처리된 공고 수
            processed = mysql.find('public_bid_notices', fields=['COUNT(*)'], addStr='WHERE is_processed = 1')
            stats['processed_notices'] = processed[0][0] if processed else 0
            
            # 매칭된 공고 수
            matched = mysql.find('public_bid_notices', fields=['COUNT(*)'], addStr='WHERE is_matched = 1')
            stats['matched_notices'] = matched[0][0] if matched else 0
            
            # 카테고리별 분포
            categories = mysql.find(
                'public_bid_notices',
                fields=['category', 'COUNT(*)'],
                addStr='WHERE category IS NOT NULL GROUP BY category'
            )
            stats['category_distribution'] = {cat[0]: cat[1] for cat in categories} if categories else {}
            
            # 최근 수집 로그
            recent_logs = mysql.find(
                'api_collection_logs',
                fields=['started_at', 'total_count', 'status'],
                addStr='ORDER BY started_at DESC LIMIT 5'
            )
            stats['recent_collections'] = [
                {
                    'date': log[0].strftime('%Y-%m-%d %H:%M:%S') if log[0] else None,
                    'count': log[1],
                    'status': log[2]
                } for log in recent_logs
            ] if recent_logs else []
            
            return stats
            
        except Exception as e:
            logger.error(f"통계 조회 실패: {str(e)}")
            raise


def test_database():
    """데이터베이스 관리자 테스트"""
    db_manager = DatabaseManager()
    
    try:
        # 테이블 생성 (테스트용이므로 기존 테이블 삭제)
        print("테이블 생성 중...")
        db_manager.create_tables(drop_existing=True)
        print("테이블 생성 완료")
        
        # 통계 조회
        stats = db_manager.get_statistics()
        print(f"\n=== 데이터베이스 통계 ===")
        for key, value in stats.items():
            print(f"{key}: {value}")
        
        # 키워드 매칭 테스트
        print(f"\n키워드 매칭 처리 중...")
        processed = db_manager.apply_keyword_matching()
        print(f"처리된 건수: {processed}")
        
    except Exception as e:
        print(f"테스트 실패: {str(e)}")
    finally:
        db_manager.close_connection()


if __name__ == "__main__":
    test_database()