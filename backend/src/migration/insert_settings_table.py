#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Settings Tables Data Migration Script
변경되기 전 설정 테이블 데이터들의 필드명을 수정하고 새로운 데이터베이스에 입력하는 스크립트
"""

import csv
import os
import sys
import pymysql
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()


class SettingsDataMigrator:
    def __init__(self, database='ilmac_bid_db'):
        self.database = database
        self.config = {
            'host': os.getenv('MYSQL_HOST', 'localhost'),
            'user': os.getenv('MYSQL_USER', 'root'),
            'password': os.getenv('MYSQL_PASSWORD', ''),
            'port': int(os.getenv('MYSQL_PORT', 3306)),
            'charset': 'utf8mb4',
            'autocommit': True
        }
        
        # CSV 파일 경로
        self.data_dir = Path("/_exp/projects/bid-notice-web/backend/src/migration/data")
        
        # 테이블 매핑 정보
        self.table_mappings = {
            'settings_notice_list': 'settings_notice_list',
            'settings_notice_detail': 'settings_notice_detail', 
            'settings_notice_category': 'settings_notice_category',
            'settings_nas_path': 'settings_nas_path'
        }
        
        # 필드 매핑 정보 (각 테이블별)
        self.field_mappings = {
            'settings_notice_list': {
                '기관명': 'org_name',
                '제목': 'path_title',
                '상세페이지주소': 'path_detail_url', 
                '작성일': 'path_posted_date',
                '작성자': 'path_posted_by',
                '제외항목': 'path_exception',
                '지역': 'org_region',
                '등록': 'registration',
                '담당업체': 'company_in_charge',
                '담당자': 'org_man'
            },
            'settings_notice_detail': {
                '기관명': 'org_name',
                '제목': 'xpath_title',
                '본문': 'xpath_body',
                '파일이름': 'xpath_file_name',
                '파일주소': 'xpath_file_url',
                '미리보기': 'xpath_preview',
                '공고구분': 'xpath_notice_div',
                '공고번호': 'xpath_notice_num',
                '담당부서': 'xpath_org_dept',
                '담당자': 'xpath_org_man',
                '연락처': 'xpath_org_tel'
            },
            'settings_notice_category': {
                # 이 테이블은 한국어 필드가 없으므로 매핑 불필요
            },
            'settings_nas_path': {
                '기관명': 'org_name',
                '제목': 'title'
            }
        }
        
        self.conn = None
        self.cursor = None
        
    def connect(self):
        """데이터베이스 연결"""
        try:
            config = self.config.copy()
            config['database'] = self.database
            
            self.conn = pymysql.connect(**config)
            self.cursor = self.conn.cursor()
            
            print(f"✅ 데이터베이스 '{self.database}'에 연결되었습니다.")
            return True
        except pymysql.Error as err:
            print(f"❌ 데이터베이스 연결 실패: {err}")
            return False
    
    def disconnect(self):
        """데이터베이스 연결 종료"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
    
    def load_csv_data(self, csv_filename):
        """CSV 파일 데이터 로드"""
        csv_path = self.data_dir / csv_filename
        if not csv_path.exists():
            print(f"❌ CSV 파일이 없습니다: {csv_path}")
            return None
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                csv_reader = csv.DictReader(f)
                data = list(csv_reader)
            print(f"✅ CSV 데이터 로드 완료: {csv_filename} ({len(data)}행)")
            return data
        except Exception as e:
            print(f"❌ CSV 파일 로드 실패 ({csv_filename}): {e}")
            return None
    
    def map_field_names(self, data, table_name):
        """필드명을 새로운 이름으로 매핑"""
        if table_name not in self.field_mappings:
            return data  # 매핑이 없으면 원본 반환
        
        field_mapping = self.field_mappings[table_name]
        mapped_data = []
        
        for row in data:
            mapped_row = {}
            for old_field, value in row.items():
                # 매핑이 있으면 새 필드명 사용, 없으면 기존 필드명 사용
                new_field = field_mapping.get(old_field, old_field)
                mapped_row[new_field] = value
            mapped_data.append(mapped_row)
        
        print(f"✅ 필드명 매핑 완료: {table_name}")
        return mapped_data
    
    def clear_table(self, table_name):
        """테이블 데이터 초기화"""
        try:
            self.cursor.execute(f"TRUNCATE TABLE `{table_name}`")
            self.conn.commit()
            print(f"✅ 테이블 초기화 완료: {table_name}")
            return True
        except Exception as e:
            print(f"❌ 테이블 초기화 실패 ({table_name}): {e}")
            return False
    
    def insert_data_to_table(self, table_name, data):
        """데이터를 테이블에 삽입"""
        if not data:
            print(f"⚠️ 삽입할 데이터가 없습니다: {table_name}")
            return True
        
        try:
            # 컬럼명 추출
            columns = list(data[0].keys())
            placeholders = ', '.join(['%s'] * len(columns))
            columns_str = ', '.join([f'`{col}`' for col in columns])
            
            # INSERT 쿼리 생성
            insert_query = f"""
                INSERT INTO `{table_name}` ({columns_str}) 
                VALUES ({placeholders})
            """
            
            # 데이터 삽입
            insert_count = 0
            for row in data:
                try:
                    values = [row[col] for col in columns]
                    self.cursor.execute(insert_query, values)
                    insert_count += 1
                except Exception as e:
                    print(f"⚠️ 행 삽입 실패: {e}")
                    print(f"   데이터: {row}")
                    continue
            
            self.conn.commit()
            print(f"✅ 데이터 삽입 완료: {table_name} ({insert_count}/{len(data)}행)")
            return True
            
        except Exception as e:
            print(f"❌ 데이터 삽입 실패 ({table_name}): {e}")
            self.conn.rollback()
            return False
    
    def migrate_settings_notice_list(self):
        """settings_notice_list 테이블 마이그레이션"""
        print("\n" + "="*60)
        print("settings_notice_list 테이블 마이그레이션")
        print("="*60)
        
        # CSV 데이터 로드
        data = self.load_csv_data('settings_notice_list.csv')
        if not data:
            return False
        
        # 필드명 매핑
        mapped_data = self.map_field_names(data, 'settings_notice_list')
        
        # 테이블 초기화
        if not self.clear_table('settings_notice_list'):
            return False
        
        # 데이터 삽입
        return self.insert_data_to_table('settings_notice_list', mapped_data)
    
    def migrate_settings_notice_detail(self):
        """settings_notice_detail 테이블 마이그레이션"""
        print("\n" + "="*60)
        print("settings_notice_detail 테이블 마이그레이션")
        print("="*60)
        
        # CSV 데이터 로드
        data = self.load_csv_data('settings_notice_detail.csv')
        if not data:
            return False
        
        # 필드명 매핑
        mapped_data = self.map_field_names(data, 'settings_notice_detail')
        
        # 테이블 초기화
        if not self.clear_table('settings_notice_detail'):
            return False
        
        # 데이터 삽입
        return self.insert_data_to_table('settings_notice_detail', mapped_data)
    
    def migrate_settings_notice_category(self):
        """settings_notice_category 테이블 마이그레이션"""
        print("\n" + "="*60)
        print("settings_notice_category 테이블 마이그레이션")
        print("="*60)
        
        # CSV 데이터 로드
        data = self.load_csv_data('settings_notice_category.csv')
        if not data:
            return False
        
        # 이 테이블은 한국어 필드가 없으므로 매핑 없이 직접 삽입
        
        # 테이블 초기화
        if not self.clear_table('settings_notice_category'):
            return False
        
        # 데이터 삽입
        return self.insert_data_to_table('settings_notice_category', data)
    
    def migrate_settings_nas_path(self):
        """settings_nas_path 테이블 마이그레이션"""
        print("\n" + "="*60)
        print("settings_nas_path 테이블 마이그레이션")
        print("="*60)
        
        # CSV 데이터 로드
        data = self.load_csv_data('settings_nas_path.csv')
        if not data:
            return False
        
        # 필드명 매핑 (folder 컬럼의 한국어 템플릿 변수 변경)
        mapped_data = []
        for row in data:
            mapped_row = dict(row)
            # folder 컬럼의 한국어 템플릿 변수들을 영어로 변경
            if 'folder' in mapped_row:
                folder_value = mapped_row['folder']
                # 한국어 템플릿 변수를 영어로 변경
                folder_value = folder_value.replace('{기관명}', '{org_name}')
                folder_value = folder_value.replace('{제목}', '{title}')
                mapped_row['folder'] = folder_value
            mapped_data.append(mapped_row)
        
        print(f"✅ 템플릿 변수 매핑 완료: settings_nas_path")
        
        # 테이블 초기화
        if not self.clear_table('settings_nas_path'):
            return False
        
        # 데이터 삽입
        return self.insert_data_to_table('settings_nas_path', mapped_data)
    
    def verify_migration(self):
        """마이그레이션 결과 검증"""
        print("\n" + "="*60)
        print("마이그레이션 결과 검증")
        print("="*60)
        
        tables = [
            'settings_notice_list',
            'settings_notice_detail', 
            'settings_notice_category',
            'settings_nas_path'
        ]
        
        for table in tables:
            try:
                self.cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
                count = self.cursor.fetchone()[0]
                print(f"  {table}: {count}행")
            except Exception as e:
                print(f"  {table}: 검증 실패 - {e}")
    
    def run_migration(self):
        """전체 마이그레이션 실행"""
        print("="*60)
        print("설정 테이블 데이터 마이그레이션 시작")
        print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        # 데이터베이스 연결
        if not self.connect():
            return False
        
        try:
            # 각 테이블 마이그레이션 실행
            success_count = 0
            
            if self.migrate_settings_notice_list():
                success_count += 1
                
            if self.migrate_settings_notice_detail():
                success_count += 1
                
            if self.migrate_settings_notice_category():
                success_count += 1
                
            if self.migrate_settings_nas_path():
                success_count += 1
            
            # 결과 검증
            self.verify_migration()
            
            print("\n" + "="*60)
            print("마이그레이션 완료")
            print(f"성공한 테이블: {success_count}/4")
            print(f"완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("="*60)
            
            return success_count == 4
            
        finally:
            self.disconnect()


def main():
    """메인 실행 함수"""
    migrator = SettingsDataMigrator()
    success = migrator.run_migration()
    return success


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n작업이 사용자에 의해 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n예상치 못한 오류가 발생했습니다: {e}")
        sys.exit(1)