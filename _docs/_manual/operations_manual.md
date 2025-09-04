# 입찰공고 관리 시스템 - 운영자 매뉴얼

## 목차
1. [시스템 개요](#시스템-개요)
2. [서버 관리](#서버-관리)
3. [데이터베이스 관리](#데이터베이스-관리)
4. [스크래핑 관리](#스크래핑-관리)
5. [모니터링](#모니터링)
6. [백업 및 복구](#백업-및-복구)
7. [보안 관리](#보안-관리)
8. [성능 튜닝](#성능-튜닝)
9. [장애 대응](#장애-대응)
10. [정기 유지보수](#정기-유지보수)

## 시스템 개요

**입찰공고 관리 시스템**은 24시간 자동으로 운영되는 웹 스크래핑 및 데이터 관리 시스템입니다.

### 운영 환경
- **서버**: Synology NAS Ubuntu Docker 컨테이너
- **포트**: 11301-11307 (백엔드), 11501 (프론트엔드), 11101 (MySQL)
- **자동화**: Cron 스케줄러로 일 2회 스크래핑 (10:00 AM/PM KST)
- **로그**: `/backend/logs/` 디렉토리에 자동 저장

### 주요 구성요소
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Frontend      │  │   Backend       │  │   Database      │
│   (Next.js)     │  │   (FastAPI)     │  │   (MySQL)       │
│   Port 11501    │  │   Port 11301-7  │  │   Port 11101    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 서버 관리

### 1. Docker 컨테이너 관리

#### 컨테이너 상태 확인
```bash
# 컨테이너 목록 및 상태 확인
docker ps -a

# 특정 컨테이너 상세 정보
docker inspect linux-server-dev

# 리소스 사용량 실시간 모니터링
docker stats linux-server-dev
```

#### 컨테이너 시작/중지
```bash
# Docker Compose로 전체 시스템 시작
cd /volume1/docker/platforms/linux-servers
docker-compose up -d

# 컨테이너 중지
docker-compose down

# 컨테이너 재시작
docker-compose restart

# 강제 재빌드
docker-compose down
docker rmi linux-servers-ubuntu-dev
docker-compose up -d --build
```

#### 컨테이너 접속
```bash
# SSH 접속 (권장)
ssh root@192.168.0.2 -p 11001

# Docker exec 접속
docker exec -it linux-server-dev /bin/bash

# 실행 중인 서비스 확인
cd /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web
ps aux | grep -E "(server_|npm)"
```

### 2. 백엔드 서버 관리

#### 서버 시작/중지
```bash
# 프로젝트 디렉토리로 이동
cd /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend

# 전체 서버 시작
./start_servers.sh

# 개별 서버 시작
nohup uv run server_spider.py > logs/server_spider.log 2>&1 &
nohup uv run server_mysql.py > logs/server_mysql.log 2>&1 &
nohup uv run server_bid.py > logs/server_bid.log 2>&1 &
nohup uv run server_board.py > logs/server_board.log 2>&1 &

# 서버 프로세스 확인
ps aux | grep server_

# 서버 중지
pkill -f "server_spider"
pkill -f "server_mysql" 
pkill -f "server_bid"
pkill -f "server_board"
```

#### 포트 사용량 확인
```bash
# 사용 중인 포트 확인
lsof -i :11301,11302,11303,11307

# 네트워크 연결 상태
netstat -tulpn | grep -E "1130[1-7]"

# 방화벽 설정 확인
ufw status
```

### 3. 프론트엔드 관리

#### Next.js 서버 관리
```bash
cd /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend

# 개발 모드 시작
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm run start

# 프로세스 확인
ps aux | grep "next"

# 포트 11501 사용 확인
lsof -i :11501
```

## 데이터베이스 관리

### 1. MySQL 서버 관리

#### 연결 및 상태 확인
```bash
# MySQL 접속
mysql -h localhost -P 11101 -u root -p

# 데이터베이스 상태 확인
SHOW DATABASES;
USE bid_notice;
SHOW TABLES;

# 서버 상태 정보
SHOW STATUS;
SHOW PROCESSLIST;
```

#### 주요 테이블 현황
```sql
-- 공고 수집 현황
SELECT org_name, COUNT(*) as notice_count,
       MAX(posted_at) as latest_notice
FROM notices 
GROUP BY org_name 
ORDER BY notice_count DESC;

-- 일별 수집 통계
SELECT DATE(posted_at) as date, 
       COUNT(*) as count,
       COUNT(DISTINCT org_name) as org_count
FROM notices 
WHERE posted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(posted_at)
ORDER BY date DESC;

-- 카테고리별 분포
SELECT category, COUNT(*) as count
FROM notices 
WHERE category IS NOT NULL
GROUP BY category;
```

### 2. 데이터 정리 및 최적화

#### 정기 데이터 정리
```sql
-- 90일 이전 로그 데이터 삭제
DELETE FROM scraping_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 중복 공고 제거
DELETE n1 FROM notices n1
INNER JOIN notices n2 
WHERE n1.nid > n2.nid 
  AND n1.title = n2.title 
  AND n1.org_name = n2.org_name;

-- 테이블 최적화
OPTIMIZE TABLE notices;
OPTIMIZE TABLE details;
OPTIMIZE TABLE files;
```

#### 인덱스 관리
```sql
-- 인덱스 상태 확인
SHOW INDEX FROM notices;

-- 누락된 인덱스 추가
CREATE INDEX idx_notices_org_posted ON notices(org_name, posted_at);
CREATE INDEX idx_notices_category ON notices(category);
CREATE INDEX idx_details_scraped ON details(scraped_at);

-- 인덱스 사용률 분석
SELECT * FROM sys.schema_unused_indexes;
```

## 스크래핑 관리

### 1. Cron 작업 관리

#### Cron 설정 확인
```bash
# 현재 cron 작업 목록
crontab -l

# cron 로그 확인
tail -f /var/log/cron
tail -f /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/logs/cron.log

# cron 서비스 상태
systemctl status cron

# cron 서비스 재시작
systemctl restart cron
```

#### 스크래핑 스케줄
```bash
# 현재 설정 (일 2회: 오전 10시, 오후 10시)
0 10,22 * * * cd /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend && uv run spider_list.py >> logs/cron.log 2>&1

# 스케줄 변경 (시간 조정)
crontab -e
```

### 2. 스크래핑 설정 관리

#### 기관별 설정 확인
```sql
-- 활성화된 기관 목록
SELECT org_name, url, use_status, 
       last_scraped, last_success
FROM settings_list 
WHERE use_status = 'Y'
ORDER BY org_name;

-- 스크래핑 실패 기관 확인
SELECT org_name, error_message, error_count
FROM settings_list 
WHERE use_status = 'Y' 
  AND (last_success IS NULL OR error_count > 3)
ORDER BY error_count DESC;
```

#### 기관 설정 업데이트
```sql
-- 특정 기관 비활성화
UPDATE settings_list 
SET use_status = 'N', 
    memo = '웹사이트 구조 변경으로 일시 중단'
WHERE org_name = '문제기관명';

-- XPath 설정 업데이트
UPDATE settings_list 
SET rowXpath = '//tr[@class="new-row-class"]',
    title = './/td[3]/a',
    updated_at = NOW()
WHERE org_name = '기관명';
```

### 3. 스크래핑 모니터링

#### 수동 스크래핑 테스트
```bash
cd /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend

# 특정 기관 테스트
uv run spider_list.py --org_name="가평군청" --test

# 전체 기관 스크래핑
uv run spider_list.py

# 에러 확인
tail -f logs/spider_list.log | grep ERROR
```

#### API를 통한 스크래핑 실행
```bash
# Spider 서버를 통한 스크래핑
curl -X POST "http://localhost:11301/spider/notice_list/가평군청"

# 결과 확인
curl "http://localhost:11301/spider/status/가평군청"
```

## 모니터링

### 1. 시스템 리소스 모니터링

#### CPU 및 메모리 사용량
```bash
# 실시간 시스템 상태
htop
top

# 메모리 사용량 상세
free -h
cat /proc/meminfo

# 디스크 사용량
df -h
du -sh /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/*
```

#### 프로세스 모니터링
```bash
# Python 프로세스 모니터링
ps aux | grep python | grep server_

# 네트워크 연결 모니터링
netstat -tulpn | grep -E "1130[1-7]|11501|11101"

# 로그 파일 크기 확인
ls -lh /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/logs/
```

### 2. 애플리케이션 모니터링

#### 로그 파일 모니터링
```bash
cd /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/logs

# 실시간 로그 모니터링
tail -f *.log

# 에러 로그 필터링
grep -i error *.log | tail -20
grep -i "exception\|traceback" *.log | tail -20

# 특정 시간대 로그 검색
grep "2024-09-04 10:" spider_list.log
```

#### 헬스 체크 스크립트
```bash
#!/bin/bash
# health_check.sh

# 서버 응답 확인
curl -f http://localhost:11301/health || echo "Spider server down"
curl -f http://localhost:11302/health || echo "MySQL server down" 
curl -f http://localhost:11303/health || echo "Bid server down"
curl -f http://localhost:11501 || echo "Frontend down"

# MySQL 연결 확인
mysql -h localhost -P 11101 -u root -p[password] -e "SELECT 1" 2>/dev/null || echo "MySQL connection failed"
```

### 3. 데이터 품질 모니터링

#### 일일 데이터 수집 현황
```sql
-- 오늘 수집된 공고 수
SELECT COUNT(*) as today_count
FROM notices 
WHERE DATE(created_at) = CURDATE();

-- 기관별 수집 현황
SELECT org_name, 
       COUNT(*) as count,
       MAX(created_at) as last_scraped
FROM notices 
WHERE DATE(created_at) = CURDATE()
GROUP BY org_name
ORDER BY count DESC;

-- 에러가 발생한 기관
SELECT org_name, error_message, error_count
FROM scraping_logs 
WHERE DATE(created_at) = CURDATE()
  AND status = 'ERROR'
ORDER BY error_count DESC;
```

## 백업 및 복구

### 1. 데이터베이스 백업

#### 자동 백업 스크립트
```bash
#!/bin/bash
# backup_database.sh

BACKUP_DIR="/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/_backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="bid_notice"

# 전체 데이터베이스 백업
mysqldump -h localhost -P 11101 -u root -p[password] \
  --single-transaction --routines --triggers \
  $DB_NAME > "$BACKUP_DIR/bid_notice_$DATE.sql"

# 압축
gzip "$BACKUP_DIR/bid_notice_$DATE.sql"

# 7일 이전 백업 파일 삭제
find $BACKUP_DIR -name "bid_notice_*.sql.gz" -mtime +7 -delete

echo "Backup completed: bid_notice_$DATE.sql.gz"
```

#### 수동 백업
```bash
# 전체 백업
mysqldump -h localhost -P 11101 -u root -p \
  --single-transaction bid_notice > backup_$(date +%Y%m%d).sql

# 특정 테이블만 백업
mysqldump -h localhost -P 11101 -u root -p \
  bid_notice notices details > notices_backup.sql

# 데이터만 백업 (구조 제외)
mysqldump -h localhost -P 11101 -u root -p \
  --no-create-info bid_notice > data_only.sql
```

### 2. 파일 시스템 백업

#### 중요 파일 백업
```bash
# 프로젝트 전체 백업
tar -czf bid_notice_backup_$(date +%Y%m%d).tar.gz \
  /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='logs' \
  --exclude='*.pyc'

# 설정 파일만 백업
cp /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/.env \
   /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/_backups/env_$(date +%Y%m%d)

# Docker 설정 백업
cp /volume1/docker/platforms/linux-servers/docker-compose.yml \
   /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/_backups/
```

### 3. 복구 절차

#### 데이터베이스 복구
```bash
# 백업에서 복구
mysql -h localhost -P 11101 -u root -p bid_notice < backup_20240903.sql

# 특정 테이블만 복구
mysql -h localhost -P 11101 -u root -p bid_notice < notices_backup.sql

# 복구 후 확인
mysql -h localhost -P 11101 -u root -p -e "SELECT COUNT(*) FROM bid_notice.notices;"
```

#### 서비스 복구
```bash
# 1. 컨테이너 중지
docker-compose down

# 2. 백업에서 파일 복구
tar -xzf bid_notice_backup_20240903.tar.gz

# 3. 권한 설정
chown -R root:root /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web
chmod +x /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/start_servers.sh

# 4. 컨테이너 재시작
docker-compose up -d

# 5. 서비스 확인
curl http://localhost:11301/health
```

## 보안 관리

### 1. 액세스 제어

#### SSH 키 관리
```bash
# 승인된 키 목록 확인
cat ~/.ssh/authorized_keys

# 새 키 추가
echo "ssh-rsa AAAAB3NzaC1yc2E... user@host" >> ~/.ssh/authorized_keys

# 키 권한 설정
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

#### 방화벽 설정
```bash
# UFW 상태 확인
ufw status verbose

# 허용된 포트 확인
ufw show added

# 새 포트 허용 (필요시)
ufw allow 11308/tcp comment 'New API server'

# 불필요한 포트 차단
ufw deny 3306/tcp comment 'Block external MySQL'
```

### 2. 환경변수 보안

#### .env 파일 보안
```bash
# .env 파일 권한 설정
chmod 600 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/.env

# 소유자 확인
ls -la /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/.env

# 백업 시 민감정보 제외
grep -v "PASSWORD\|SECRET\|KEY" .env > .env.template
```

### 3. 로그 보안

#### 민감정보 로그 필터링
```python
# 로그 설정에서 민감정보 마스킹
import logging
import re

class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        # 패스워드, 키 등 마스킹
        record.msg = re.sub(r'(password|key)=\w+', r'\1=***', record.msg)
        return True
```

#### 로그 접근 제한
```bash
# 로그 디렉토리 권한 설정
chmod 750 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/logs
chown root:root /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/logs

# 로그 파일 권한
find /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/logs -name "*.log" -exec chmod 640 {} \;
```

## 성능 튜닝

### 1. 데이터베이스 최적화

#### MySQL 설정 튜닝
```sql
-- 현재 설정 확인
SHOW VARIABLES LIKE 'innodb%';
SHOW VARIABLES LIKE 'query_cache%';

-- 슬로우 쿼리 확인
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 인덱스 사용률 분석
SELECT DISTINCT
    t.table_schema,
    t.table_name,
    s.index_name,
    s.cardinality,
    s.sub_part,
    s.nullable
FROM information_schema.tables t
LEFT JOIN information_schema.statistics s ON t.table_schema = s.table_schema 
    AND t.table_name = s.table_name
WHERE t.table_schema = 'bid_notice'
ORDER BY t.table_name, s.index_name;
```

#### 쿼리 최적화
```sql
-- 자주 사용되는 쿼리 최적화
EXPLAIN SELECT * FROM notices 
WHERE org_name = '가평군청' 
  AND posted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY posted_at DESC;

-- 필요한 인덱스 추가
CREATE INDEX idx_notices_org_posted_optimized 
ON notices(org_name, posted_at DESC);
```

### 2. 애플리케이션 최적화

#### Python 서버 튜닝
```python
# uvicorn 설정 최적화
uvicorn_config = {
    "workers": 4,  # CPU 코어 수에 맞게 조정
    "worker_class": "uvicorn.workers.UvicornWorker",
    "max_requests": 1000,
    "max_requests_jitter": 100,
    "timeout": 120,
    "keepalive": 5
}
```

#### 메모리 사용량 최적화
```bash
# Python 메모리 사용량 모니터링
pip install memory-profiler
python -m memory_profiler server_spider.py

# 메모리 누수 확인
valgrind --tool=memcheck --leak-check=full python server_spider.py
```

### 3. 시스템 리소스 최적화

#### Docker 리소스 제한
```yaml
# docker-compose.yml
services:
  ubuntu-dev:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

#### 로그 로테이션 설정
```bash
# logrotate 설정
cat > /etc/logrotate.d/bid-notice << EOF
/volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOF
```

## 장애 대응

### 1. 일반적인 장애 시나리오

#### 서비스 다운
```bash
# 1. 서비스 상태 확인
curl -f http://localhost:11301/health
curl -f http://localhost:11302/health
curl -f http://localhost:11303/health

# 2. 프로세스 확인
ps aux | grep server_

# 3. 로그 확인
tail -50 logs/server_*.log

# 4. 서비스 재시작
pkill -f server_
./start_servers.sh

# 5. 확인
curl http://localhost:11301/health
```

#### 데이터베이스 연결 실패
```bash
# 1. MySQL 서비스 상태 확인
docker exec mysql_container mysqladmin -u root -p ping

# 2. 연결 테스트
mysql -h localhost -P 11101 -u root -p -e "SELECT 1"

# 3. 연결 풀 확인
mysql -h localhost -P 11101 -u root -p -e "SHOW PROCESSLIST"

# 4. 필요시 MySQL 재시작
docker restart mysql_container
```

#### 스크래핑 실패
```bash
# 1. 에러 로그 확인
grep -i error logs/spider_list.log | tail -20

# 2. 특정 기관 테스트
uv run spider_list.py --org_name="실패기관" --debug

# 3. 웹사이트 접근 테스트
curl -I "http://실패기관웹사이트.com"

# 4. XPath 확인 및 업데이트
# 브라우저 개발자 도구로 구조 변경 확인
```

### 2. 응급 복구 절차

#### 서비스 전체 재시작
```bash
#!/bin/bash
# emergency_restart.sh

echo "=== 응급 복구 시작 ==="

# 1. 현재 상태 로깅
echo "Before restart:" > emergency_$(date +%Y%m%d_%H%M%S).log
docker ps >> emergency_$(date +%Y%m%d_%H%M%S).log
ps aux | grep -E "(server_|npm)" >> emergency_$(date +%Y%m%d_%H%M%S).log

# 2. 모든 서비스 중지
pkill -f "server_"
pkill -f "npm"

# 3. Docker 재시작
docker-compose restart

# 4. 백엔드 서비스 재시작
cd /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend
./start_servers.sh

# 5. 프론트엔드 재시작
cd ../frontend
nohup npm run start > ../backend/logs/frontend.log 2>&1 &

# 6. 상태 확인
sleep 10
curl http://localhost:11301/health
curl http://localhost:11501

echo "=== 응급 복구 완료 ==="
```

#### 데이터 손상 시 복구
```bash
# 1. 최신 백업 확인
ls -lt /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/_backups/

# 2. 데이터베이스 복구
mysql -h localhost -P 11101 -u root -p bid_notice < latest_backup.sql

# 3. 데이터 무결성 검사
mysql -h localhost -P 11101 -u root -p -e "CHECK TABLE bid_notice.notices"

# 4. 서비스 재시작
./start_servers.sh
```

## 정기 유지보수

### 1. 일일 점검 항목

#### 자동화된 체크리스트
```bash
#!/bin/bash
# daily_check.sh

echo "=== 일일 시스템 점검 $(date) ==="

# 1. 서비스 상태 확인
echo "1. 서비스 상태:"
curl -s http://localhost:11301/health && echo "Spider: OK" || echo "Spider: FAIL"
curl -s http://localhost:11302/health && echo "MySQL: OK" || echo "MySQL: FAIL"
curl -s http://localhost:11303/health && echo "Bid: OK" || echo "Bid: FAIL"
curl -s http://localhost:11501 && echo "Frontend: OK" || echo "Frontend: FAIL"

# 2. 디스크 사용량
echo -e "\n2. 디스크 사용량:"
df -h | grep -E "(/$|/volume1)"

# 3. 메모리 사용량
echo -e "\n3. 메모리 사용량:"
free -h

# 4. 오늘 수집된 데이터
echo -e "\n4. 오늘 수집 현황:"
mysql -h localhost -P 11101 -u root -p[password] -e "
SELECT COUNT(*) as today_notices 
FROM bid_notice.notices 
WHERE DATE(created_at) = CURDATE();" 2>/dev/null

# 5. 에러 로그 확인
echo -e "\n5. 에러 현황:"
grep -c ERROR logs/*.log 2>/dev/null || echo "로그 파일 없음"

# 6. 로그 파일 크기
echo -e "\n6. 로그 파일 크기:"
du -sh logs/ 2>/dev/null || echo "로그 디렉토리 없음"
```

### 2. 주간 유지보수

#### 매주 일요일 실행
```bash
#!/bin/bash
# weekly_maintenance.sh

# 1. 데이터베이스 최적화
mysql -h localhost -P 11101 -u root -p[password] -e "
OPTIMIZE TABLE bid_notice.notices;
OPTIMIZE TABLE bid_notice.details;
OPTIMIZE TABLE bid_notice.files;"

# 2. 로그 압축 및 정리
find logs/ -name "*.log" -mtime +7 -exec gzip {} \;
find logs/ -name "*.log.gz" -mtime +30 -delete

# 3. 임시 파일 정리
find /tmp -name "playwright*" -mtime +1 -delete
find /tmp -name "*.tmp" -mtime +1 -delete

# 4. 백업 실행
./backup_database.sh

# 5. 시스템 업데이트 확인
apt list --upgradable

# 6. 보고서 생성
python generate_weekly_report.py > reports/weekly_$(date +%Y%m%d).txt
```

### 3. 월간 유지보수

#### 매월 1일 실행
```bash
#!/bin/bash
# monthly_maintenance.sh

# 1. 오래된 데이터 아카이브
mysql -h localhost -P 11101 -u root -p[password] -e "
CREATE TABLE bid_notice.notices_archive_$(date +%Y%m) AS 
SELECT * FROM bid_notice.notices 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);

DELETE FROM bid_notice.notices 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);"

# 2. 인덱스 재구성
mysql -h localhost -P 11101 -u root -p[password] -e "
ALTER TABLE bid_notice.notices ENGINE=InnoDB;
ANALYZE TABLE bid_notice.notices;"

# 3. 백업 파일 정리
find _backups/ -name "*.sql.gz" -mtime +90 -delete

# 4. 성능 보고서 생성
python generate_performance_report.py > reports/performance_$(date +%Y%m).txt

# 5. 보안 업데이트 적용
apt update && apt upgrade -y

# 6. Docker 이미지 정리
docker image prune -f
```

---

## 알림 및 모니터링 도구

### 1. 슬랙/이메일 알림 설정
```python
# notifications.py
import requests
import smtplib
from email.mime.text import MIMEText

def send_slack_alert(message):
    webhook_url = "https://hooks.slack.com/services/..."
    payload = {"text": f"🚨 입찰공고 시스템 알림: {message}"}
    requests.post(webhook_url, json=payload)

def send_email_alert(subject, message):
    msg = MIMEText(message)
    msg['Subject'] = subject
    msg['From'] = "system@company.com"
    msg['To'] = "admin@company.com"
    
    server = smtplib.SMTP('localhost')
    server.send_message(msg)
    server.quit()
```

### 2. 대시보드 URL
- **시스템 현황**: http://localhost:11501/statistics
- **스크래핑 설정**: http://localhost:11501/settings
- **로그 뷰어**: http://localhost:11501/logs

### 3. 문서 및 연락처
- **개발팀 연락처**: dev-team@company.com
- **긴급 연락처**: emergency@company.com
- **기술 문서**: [개발자 매뉴얼](./developer_manual.md)
- **사용 가이드**: [사용자 매뉴얼](./user_manual.md)

---

이 운영자 매뉴얼을 통해 시스템의 안정적인 운영과 관리가 가능합니다. 정기적인 점검과 유지보수를 통해 최적의 성능을 유지하시기 바랍니다.