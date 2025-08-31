#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Final Korean Field Name Cleanup Script
남아있는 한국어 필드명들을 정리하는 최종 스크립트
"""

import csv
import os
import re
from pathlib import Path


class FinalCleanup:
    def __init__(self, src_dir, migration_csv_path):
        self.src_dir = Path(src_dir)
        self.migration_csv_path = migration_csv_path
        self.field_mappings = {}
        self.python_files = []
        
    def load_field_mappings(self):
        """CSV 파일에서 필드 매핑 정보 로드"""
        try:
            with open(self.migration_csv_path, 'r', encoding='utf-8') as f:
                csv_reader = csv.DictReader(f)
                
                for row in csv_reader:
                    old_field = row['field_src'].strip()
                    new_field = row['field_dst'].strip()
                    self.field_mappings[old_field] = new_field
            
            print(f"필드 매핑 정보 로드 완료: {len(self.field_mappings)}개 필드")
            return True
            
        except Exception as e:
            print(f"CSV 파일 로드 실패: {e}")
            return False
    
    def get_python_files(self):
        """Python 파일 목록 가져오기"""
        project_files = [
            "utils_log.py", "utils_lxml.py", "utils_mysql.py", "utils_data.py",
            "server_spider.py", "mysql_board.py", "server_mysql.py", "utils_search.py",
            "utils_nas.py", "spider_list.py", "spider_detail.py", "server_bid.py",
            "mysql_bid.py", "server_board.py"
        ]
        
        for filename in project_files:
            file_path = self.src_dir / filename
            if file_path.exists():
                self.python_files.append(file_path)
        
        return self.python_files
    
    def cleanup_file(self, file_path):
        """단일 파일 정리"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            changes = []
            
            for old_field, new_field in self.field_mappings.items():
                
                # 1. Pydantic 모델 필드 어노테이션 (예: 기관명: str)
                pattern = rf'(\s+){re.escape(old_field)}(\s*:\s*str)'
                replacement = rf'\1{new_field}\2'
                new_content, count = re.subn(pattern, replacement, content)
                if count > 0:
                    content = new_content
                    changes.append(f"  Pydantic 필드: {old_field} -> {new_field} ({count}건)")
                
                # 2. 리스트 언패킹 할당 (예: [기관명, category, 제목] = ...)
                pattern = rf'(\[.*?){re.escape(old_field)}(.*?\])'
                replacement = rf'\1{new_field}\2'
                new_content, count = re.subn(pattern, replacement, content)
                if count > 0:
                    content = new_content
                    changes.append(f"  리스트 언패킹: {old_field} -> {new_field} ({count}건)")
                
                # 3. 변수명으로 사용 (예: return [기관명, category])
                pattern = rf'(\breturn\s*\[.*?){re.escape(old_field)}(.*?\])'
                replacement = rf'\1{new_field}\2'
                new_content, count = re.subn(pattern, replacement, content)
                if count > 0:
                    content = new_content
                    changes.append(f"  return 문 변수: {old_field} -> {new_field} ({count}건)")
                
                # 4. .replace() 메서드 인자 (예: .replace('{담당업체}', str(담당업체)))
                pattern = rf"(\.replace\([^,]+,\s*str\(){re.escape(old_field)}(\))"
                replacement = rf'\1{new_field}\2'
                new_content, count = re.subn(pattern, replacement, content)
                if count > 0:
                    content = new_content
                    changes.append(f"  .replace() 인자: {old_field} -> {new_field} ({count}건)")
                
                # 5. 함수 인자로 사용 (예: get_notice_folder_num(제목, parent_path))
                pattern = rf'(\w+\(){re.escape(old_field)}(,)'
                replacement = rf'\1{new_field}\2'
                new_content, count = re.subn(pattern, replacement, content)
                if count > 0:
                    content = new_content
                    changes.append(f"  함수 인자: {old_field} -> {new_field} ({count}건)")
                
                # 6. WHERE 절 백틱 없는 필드명 (예: WHERE 기관명 = )
                pattern = rf"(WHERE\s+){re.escape(old_field)}(\s*=)"
                replacement = rf'\1{new_field}\2'
                new_content, count = re.subn(pattern, replacement, content)
                if count > 0:
                    content = new_content
                    changes.append(f"  WHERE 절: {old_field} -> {new_field} ({count}건)")
                
                # 7. 딕셔너리 키로 사용 (예: 'org_name': 기관명,)
                pattern = rf"(:\s*){re.escape(old_field)}(,)"
                replacement = rf'\1{new_field}\2'
                new_content, count = re.subn(pattern, replacement, content)
                if count > 0:
                    content = new_content
                    changes.append(f"  딕셔너리 값: {old_field} -> {new_field} ({count}건)")
            
            # 파일이 변경된 경우만 저장
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                print(f"\n✅ {file_path}")
                for change in changes:
                    print(change)
                return True
            
            return False
            
        except Exception as e:
            print(f"❌ 파일 처리 실패 ({file_path}): {e}")
            return False
    
    def process_all_files(self):
        """모든 파일 처리"""
        print("=== 최종 한국어 필드명 정리 ===")
        
        if not self.load_field_mappings():
            return False
        
        python_files = self.get_python_files()
        if not python_files:
            print("처리할 Python 파일이 없습니다.")
            return False
        
        updated_count = 0
        for file_path in python_files:
            if self.cleanup_file(file_path):
                updated_count += 1
        
        print(f"\n=== 정리 완료: {updated_count}개 파일 업데이트 ===")
        return True


def main():
    """메인 실행 함수"""
    src_dir = "/_exp/projects/bid-notice-web/backend/src"
    migration_csv = "/_exp/projects/bid-notice-web/backend/migration/data/table_migration_fields.csv"
    
    cleanup = FinalCleanup(src_dir, migration_csv)
    return cleanup.process_all_files()


if __name__ == "__main__":
    main()