#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Python Code Field Name Update Script
table_migration_fields.csv의 필드 변경 정보를 기준으로 
Python 코드의 필드명을 자동으로 업데이트합니다.
"""

import csv
import os
import re
import sys
from datetime import datetime
from pathlib import Path


class PythonCodeUpdater:
    def __init__(self, src_dir, migration_csv_path):
        self.src_dir = Path(src_dir)
        self.migration_csv_path = migration_csv_path
        self.field_mappings = {}  # {table_name: {old_field: new_field}}
        self.table_mappings = {  # 새로운 테이블명 매핑
            'details': 'notice_details',
            'files': 'notice_files', 
            'notices': 'notice_list',
            'settings_notice_detail': 'settings_notice_detail',
            'settings_notice_list': 'settings_notice_list'
        }
        self.updated_files = []
        self.total_replacements = 0
    
    def load_field_mappings(self):
        """CSV 파일에서 필드 매핑 정보 로드"""
        try:
            with open(self.migration_csv_path, 'r', encoding='utf-8') as f:
                csv_reader = csv.DictReader(f)
                
                for row in csv_reader:
                    table_name = row['table_name'].strip()
                    field_src = row['field_src'].strip()
                    field_dst = row['field_dst'].strip()
                    
                    if table_name not in self.field_mappings:
                        self.field_mappings[table_name] = {}
                    
                    self.field_mappings[table_name][field_src] = field_dst
            
            print(f"필드 매핑 정보 로드 완료:")
            for table_name, fields in self.field_mappings.items():
                print(f"  {table_name}: {len(fields)}개 필드")
            
            return True
            
        except Exception as e:
            print(f"CSV 파일 로드 실패: {e}")
            return False
    
    def get_python_files(self):
        """Python 파일 목록 가져오기 (프로젝트 파일들만)"""
        python_files = []
        
        # 직접 프로젝트 파일들만 찾기
        project_files = [
            "utils_log.py", "utils_lxml.py", "utils_mysql.py", "utils_data.py",
            "server_spider.py", "mysql_board.py", "server_mysql.py", "utils_search.py",
            "utils_nas.py", "spider_list.py", "spider_detail.py", "server_bid.py",
            "mysql_bid.py", "server_board.py"
        ]
        
        for filename in project_files:
            file_path = self.src_dir / filename
            if file_path.exists():
                python_files.append(file_path)
        
        print(f"\n처리할 Python 파일 {len(python_files)}개:")
        for file_path in python_files:
            print(f"  - {file_path}")
        
        return python_files
    
    def create_replacement_patterns(self):
        """필드명 교체 패턴 생성"""
        patterns = []
        
        for table_name, field_map in self.field_mappings.items():
            for old_field, new_field in field_map.items():
                # 다양한 패턴으로 필드가 사용될 수 있는 경우들
                
                # 1. SQL 쿼리에서 백틱으로 감싸진 필드명
                patterns.append({
                    'pattern': rf'`{re.escape(old_field)}`',
                    'replacement': f'`{new_field}`',
                    'description': f'SQL 백틱 필드: {old_field} -> {new_field}'
                })
                
                # 2. 큰따옴표로 감싸진 문자열
                patterns.append({
                    'pattern': rf'"{re.escape(old_field)}"',
                    'replacement': f'"{new_field}"',
                    'description': f'큰따옴표 문자열: {old_field} -> {new_field}'
                })
                
                # 3. 작은따옴표로 감싸진 문자열
                patterns.append({
                    'pattern': rf"'{re.escape(old_field)}'",
                    'replacement': f"'{new_field}'",
                    'description': f'작은따옴표 문자열: {old_field} -> {new_field}'
                })
                
                # 4. 리스트 첫 번째 요소 (예: ["기관명"])
                patterns.append({
                    'pattern': rf'(\[\s*["\'])({re.escape(old_field)})(["\'])',
                    'replacement': rf'\1{new_field}\3',
                    'description': f'리스트 첫 번째: {old_field} -> {new_field}'
                })
                
                # 5. 리스트 중간 요소 (예: , "기관명")
                patterns.append({
                    'pattern': rf'(,\s*["\'])({re.escape(old_field)})(["\'])',
                    'replacement': rf'\1{new_field}\3',
                    'description': f'리스트 중간: {old_field} -> {new_field}'
                })
                
                # 6. 딕셔너리 키 (예: data["기관명"])
                patterns.append({
                    'pattern': rf'(\[["\'])({re.escape(old_field)})(["\'][\]])',
                    'replacement': rf'\1{new_field}\3',
                    'description': f'딕셔너리 키: {old_field} -> {new_field}'
                })
                
                # 7. 함수 인자 (예: field="기관명")
                patterns.append({
                    'pattern': rf'(\w+\s*=\s*["\'])({re.escape(old_field)})(["\'])',
                    'replacement': rf'\1{new_field}\3',
                    'description': f'함수 인자: {old_field} -> {new_field}'
                })
                
                # 8. 상수 정의 (예: FIELD = "기관명")
                patterns.append({
                    'pattern': rf'([A-Z_]+\s*=\s*["\'])({re.escape(old_field)})(["\'])',
                    'replacement': rf'\1{new_field}\3',
                    'description': f'상수 정의: {old_field} -> {new_field}'
                })
                
                # 9. f-string이나 format에서 사용되는 경우
                patterns.append({
                    'pattern': rf'(\{{{re.escape(old_field)}\}})',
                    'replacement': f'{{{new_field}}}',
                    'description': f'f-string/format: {old_field} -> {new_field}'
                })
                
                # 10. WHERE 절에서 따옴표 없는 필드명 (예: WHERE 기관명 = )
                patterns.append({
                    'pattern': rf'(WHERE\s+)({re.escape(old_field)})(\s*[=<>!])',
                    'replacement': rf'\1{new_field}\3',
                    'description': f'WHERE 절 필드: {old_field} -> {new_field}'
                })
                
                # 11. SELECT 절의 필드명 (예: SELECT 기관명, 제목)
                patterns.append({
                    'pattern': rf'(SELECT\s+.*?)({re.escape(old_field)})([\s,])',
                    'replacement': rf'\1{new_field}\3',
                    'description': f'SELECT 절 필드: {old_field} -> {new_field}'
                })
                
                # 12. ORDER BY, GROUP BY 절의 필드명
                patterns.append({
                    'pattern': rf'((ORDER|GROUP)\s+BY\s+.*?)({re.escape(old_field)})([\s,)])',
                    'replacement': rf'\1{new_field}\4',
                    'description': f'ORDER/GROUP BY 절: {old_field} -> {new_field}'
                })
                
                # 13. 주석에서 필드명
                patterns.append({
                    'pattern': rf'(#.*?)({re.escape(old_field)})(.*)',
                    'replacement': rf'\1{new_field}\3',
                    'description': f'주석 내 필드명: {old_field} -> {new_field}'
                })
                
                # 14. 튜플이나 괄호 안의 문자열
                patterns.append({
                    'pattern': rf'(\(\s*["\'])({re.escape(old_field)})(["\'])',
                    'replacement': rf'\1{new_field}\3',
                    'description': f'튜플/괄호 안: {old_field} -> {new_field}'
                })
                
                # 15. 딕셔너리 값 할당 (예: key: "기관명")
                patterns.append({
                    'pattern': rf'(:\s*["\'])({re.escape(old_field)})(["\'])',
                    'replacement': rf'\1{new_field}\3',
                    'description': f'딕셔너리 값: {old_field} -> {new_field}'
                })
        
        print(f"\n생성된 교체 패턴: {len(patterns)}개")
        return patterns
    
    def update_file_content(self, file_path, patterns):
        """단일 파일의 내용 업데이트"""
        try:
            # 파일 읽기
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            updated_content = original_content
            file_replacements = 0
            changes_made = []
            
            # 각 패턴에 대해 교체 수행
            for pattern_info in patterns:
                pattern = pattern_info['pattern']
                replacement = pattern_info['replacement']
                description = pattern_info['description']
                
                if callable(replacement):
                    # 람다 함수인 경우
                    new_content, count = re.subn(pattern, replacement, updated_content)
                else:
                    # 문자열인 경우
                    new_content, count = re.subn(pattern, replacement, updated_content)
                
                if count > 0:
                    updated_content = new_content
                    file_replacements += count
                    changes_made.append(f"  {description}: {count}건")
            
            # 파일이 변경된 경우만 저장
            if file_replacements > 0:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                
                print(f"\n✅ {file_path}")
                for change in changes_made:
                    print(change)
                print(f"  총 변경: {file_replacements}건")
                
                self.updated_files.append(str(file_path))
                self.total_replacements += file_replacements
                return True
            
            return False
            
        except Exception as e:
            print(f"❌ 파일 처리 실패 ({file_path}): {e}")
            return False
    
    def update_table_names_in_code(self, file_path):
        """코드에서 테이블명도 함께 업데이트"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            table_replacements = 0
            
            for old_table, new_table in self.table_mappings.items():
                # SQL 쿼리에서 테이블명 업데이트
                patterns = [
                    rf'FROM\s+`{re.escape(old_table)}`',
                    rf'INTO\s+`{re.escape(old_table)}`', 
                    rf'UPDATE\s+`{re.escape(old_table)}`',
                    rf'DELETE\s+FROM\s+`{re.escape(old_table)}`',
                    rf'[\'\"]{re.escape(old_table)}[\'\"]'
                ]
                
                for pattern in patterns:
                    new_content, count = re.subn(
                        pattern, 
                        lambda m: m.group(0).replace(old_table, new_table), 
                        content, 
                        flags=re.IGNORECASE
                    )
                    if count > 0:
                        content = new_content
                        table_replacements += count
            
            if table_replacements > 0:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  테이블명 변경: {table_replacements}건")
                return table_replacements
                
            return 0
            
        except Exception as e:
            print(f"테이블명 업데이트 실패 ({file_path}): {e}")
            return 0
    
    def process_all_files(self):
        """모든 Python 파일 처리"""
        print("\n" + "="*60)
        print("Python 코드 필드명 업데이트 시작")
        print("="*60)
        
        # 1. 필드 매핑 정보 로드
        if not self.load_field_mappings():
            return False
        
        # 2. Python 파일 목록 가져오기
        python_files = self.get_python_files()
        if not python_files:
            print("처리할 Python 파일이 없습니다.")
            return False
        
        # 3. 교체 패턴 생성
        patterns = self.create_replacement_patterns()
        
        # 4. 각 파일 처리
        print(f"\n파일 처리 시작...")
        for file_path in python_files:
            # 필드명 업데이트
            field_updated = self.update_file_content(file_path, patterns)
            
            # 테이블명 업데이트
            if field_updated:
                self.update_table_names_in_code(file_path)
        
        # 5. 결과 요약
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """처리 결과 요약 출력"""
        print("\n" + "="*60)
        print("처리 결과 요약")
        print("="*60)
        print(f"업데이트된 파일: {len(self.updated_files)}개")
        print(f"총 변경 사항: {self.total_replacements}건")
        
        if self.updated_files:
            print(f"\n업데이트된 파일 목록:")
            for file_path in self.updated_files:
                print(f"  - {file_path}")
        
        print(f"\n필드 매핑 정보:")
        for table_name, field_map in self.field_mappings.items():
            new_table_name = self.table_mappings.get(table_name, table_name)
            print(f"  {table_name} -> {new_table_name}: {len(field_map)}개 필드")


def main():
    """메인 실행 함수"""
    print("=== Python Code Field Name Update ===")
    print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 경로 설정
    src_dir = "/_exp/projects/bid-notice-web/backend/src"
    migration_csv = "/_exp/projects/bid-notice-web/backend/migration/data/table_migration_fields.csv"
    
    # 파일 존재 확인
    if not os.path.exists(src_dir):
        print(f"소스 디렉토리가 없습니다: {src_dir}")
        return False
    
    if not os.path.exists(migration_csv):
        print(f"마이그레이션 CSV 파일이 없습니다: {migration_csv}")
        return False
    
    # 업데이터 실행
    updater = PythonCodeUpdater(src_dir, migration_csv)
    success = updater.process_all_files()
    
    print(f"\n완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=== Python 코드 업데이트 완료 ===")
    
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