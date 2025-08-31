import pymysql
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

class MySQLSchemaBackup:
    def __init__(self, host=None, user=None, password=None, database=None):
        self.config = {
            'host': host or os.getenv('MYSQL_HOST', 'localhost'),
            'user': user or os.getenv('MYSQL_USER', 'root'),
            'password': password or os.getenv('MYSQL_PASSWORD', ''),
            # 'database': database or os.getenv('MYSQL_DATABASE', 'Bid'),
            'database': 'ilmac_bid_db',
            'port': int(os.getenv('MYSQL_PORT', 3306)),
            'charset': 'utf8mb4',
            'autocommit': True
        }
        self.conn = None
        self.cursor = None
    
    def connect(self):
        """데이터베이스 연결"""
        try:
            self.conn = pymysql.connect(**self.config)
            self.cursor = self.conn.cursor()
            print(f"데이터베이스 '{self.config['database']}'에 연결되었습니다.")
            return True
        except pymysql.Error as err:
            print(f"연결 실패: {err}")
            return False
    
    def disconnect(self):
        """데이터베이스 연결 해제"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("데이터베이스 연결이 해제되었습니다.")
    
    def get_table_list(self):
        """모든 테이블 목록 가져오기"""
        try:
            self.cursor.execute("""
                SELECT table_name, table_comment, engine, table_rows
                FROM information_schema.tables 
                WHERE table_schema = %s AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """, (self.config['database'],))
            
            return self.cursor.fetchall()
        except pymysql.Error as err:
            print(f"테이블 목록 조회 실패: {err}")
            return []
    
    def get_create_statement(self, table_name):
        """특정 테이블의 CREATE 문 가져오기"""
        try:
            # 백틱으로 테이블명 감싸기
            sql = f"SHOW CREATE TABLE `{self.config['database']}`.`{table_name}`"
            self.cursor.execute(sql)
            result = self.cursor.fetchone()
            
            if result:
                return result[1]
            return None
        except pymysql.Error as err:
            print(f"테이블 {table_name} CREATE 문 조회 실패: {err}")
            return None
    
    def backup_all_tables(self, include_stats=True):
        """모든 테이블의 CREATE 문 백업"""
        if not self.connect():
            return None
        
        try:
            tables = self.get_table_list()
            if not tables:
                print("백업할 테이블이 없습니다.")
                return None
            
            all_statements = []
            header = f"""-- MySQL Schema Backup
-- Database: {self.config['database']}
-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Total Tables: {len(tables)}

"""
            all_statements.append(header)
            
            print(f"총 {len(tables)}개의 테이블을 백업합니다...")
            
            for table_info in tables:
                table_name = table_info[0]
                table_comment = table_info[1] or 'No comment'
                engine = table_info[2]
                table_rows = table_info[3] or 0
                
                print(f"처리 중: {table_name} ({engine}, {table_rows} rows)")
                
                create_statement = self.get_create_statement(table_name)
                
                if create_statement:
                    table_header = f"""-- =============================================
-- Table: {table_name}
-- Engine: {engine}
-- Rows: {table_rows}
-- Comment: {table_comment}
-- ============================================="""
                    
                    all_statements.append(f"{table_header}\n{create_statement}")
                else:
                    print(f"경고: {table_name} 테이블의 CREATE 문을 가져올 수 없습니다.")
            
            final_result = "\n\n".join(all_statements)
            return final_result
            
        except Exception as e:
            print(f"백업 중 오류 발생: {e}")
            return None
        finally:
            self.disconnect()
    
    def save_backup(self, content, filename=None):
        """백업 내용을 파일로 저장"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{self.config['database']}_schema_backup_{timestamp}.sql"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            
            file_size = os.path.getsize(filename)
            print(f"백업 완료!")
            print(f"파일명: {filename}")
            print(f"파일크기: {file_size:,} bytes")
            return filename
        except Exception as e:
            print(f"파일 저장 실패: {e}")
            return None

def main():
    # 데이터베이스 설정 (.env 파일에서 자동으로 로드)
    backup = MySQLSchemaBackup()
    
    # 백업 실행
    print("MySQL 스키마 백업을 시작합니다...")
    backup_content = backup.backup_all_tables()
    
    if backup_content:
        # 콘솔에 출력 (선택사항)
        print("\n" + "="*80)
        print("백업 내용 미리보기:")
        print("="*80)
        print(backup_content[:1000] + "..." if len(backup_content) > 1000 else backup_content)
        print("="*80)
        
        # 파일로 저장
        saved_file = backup.save_backup(backup_content)
        if saved_file:
            print(f"\n백업이 성공적으로 완료되었습니다: {saved_file}")
    else:
        print("백업에 실패했습니다.")

if __name__ == "__main__":
    main()
