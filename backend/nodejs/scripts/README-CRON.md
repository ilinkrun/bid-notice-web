# Cron Job Setup Guide

## Overview

이 문서는 입찰 공고 자동 수집을 위한 cron job 설정 방법을 설명합니다.

## 파일 구조

```
scripts/
├── cron-fetch-notices.sh    # Cron 실행 래퍼 스크립트
├── crontab-config.txt        # Crontab 설정 파일
└── README-CRON.md           # 이 파일
```

## 동작 방식

1. **cron-fetch-notices.sh**:
   - 환경변수 로드
   - npm 스크립트 실행
   - 로그 파일 생성 및 관리

2. **cron-fetch-notices.ts**:
   - DB에서 활성화된 모든 기관(use=1) 조회
   - `fetchListPages()` 함수로 모든 기관의 입찰 공고 수집
   - 수집 결과 출력

## 설치 방법

### 1. 실행 권한 부여

```bash
chmod +x /exposed/projects/ilmac-bid-web/backend/nodejs/scripts/cron-fetch-notices.sh
```

### 2. 수동 테스트 실행

```bash
# 스크립트 직접 실행
/exposed/projects/ilmac-bid-web/backend/nodejs/scripts/cron-fetch-notices.sh

# 또는 npm 스크립트로 실행
cd /exposed/projects/ilmac-bid-web/backend/nodejs
npm run cron:fetch-notices
```

### 3. Crontab 설치

```bash
# 현재 crontab 백업 (기존 설정이 있는 경우)
crontab -l > ~/crontab-backup-$(date +%Y%m%d).txt

# 새 crontab 설치
crontab /exposed/projects/ilmac-bid-web/backend/nodejs/scripts/crontab-config.txt

# 또는 기존 crontab에 추가하려면:
# 1. crontab 편집
crontab -e

# 2. 다음 라인들을 추가:
# PATH=/root/.nvm/versions/node/v22.20.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
# 0 11 * * * /exposed/projects/ilmac-bid-web/backend/nodejs/scripts/cron-fetch-notices.sh
# 0 23 * * * /exposed/projects/ilmac-bid-web/backend/nodejs/scripts/cron-fetch-notices.sh
```

### 4. Crontab 확인

```bash
# 설치된 crontab 확인
crontab -l
```

## 실행 일정

- **매일 오전 11시** (11:00 AM): 첫 번째 수집
- **매일 오후 11시** (11:00 PM): 두 번째 수집

## 로그 확인

로그는 `logs/` 디렉토리에 날짜별로 저장됩니다:

```bash
# 오늘 로그 확인
tail -f /exposed/projects/ilmac-bid-web/backend/nodejs/logs/cron-fetch-notices-$(date +%Y%m%d).log

# 특정 날짜 로그 확인
cat /exposed/projects/ilmac-bid-web/backend/nodejs/logs/cron-fetch-notices-20251017.log
```

로그 파일은 자동으로 30일 이상 된 파일을 삭제합니다.

## Crontab 제거

```bash
# 전체 crontab 제거
crontab -r

# 또는 특정 항목만 제거하려면
crontab -e
# 편집기에서 해당 라인 삭제
```

## 문제 해결

### Cron이 실행되지 않는 경우

1. **cron 서비스 확인**:
   ```bash
   service cron status
   # 또는
   systemctl status cron
   ```

2. **스크립트 실행 권한 확인**:
   ```bash
   ls -l /exposed/projects/ilmac-bid-web/backend/nodejs/scripts/cron-fetch-notices.sh
   ```

3. **PATH 환경변수 확인**:
   - crontab 파일에 올바른 NODE 경로가 설정되어 있는지 확인
   - `which node` 와 `which npm` 명령어로 경로 확인

4. **수동 실행 테스트**:
   ```bash
   /exposed/projects/ilmac-bid-web/backend/nodejs/scripts/cron-fetch-notices.sh
   ```

### 로그가 생성되지 않는 경우

```bash
# logs 디렉토리 생성
mkdir -p /exposed/projects/ilmac-bid-web/backend/nodejs/logs

# 권한 확인
ls -la /exposed/projects/ilmac-bid-web/backend/nodejs/logs
```

## 관련 파일

- `/exposed/projects/ilmac-bid-web/backend/nodejs/src/execs/cron-fetch-notices.ts` - TypeScript 실행 스크립트
- `/exposed/projects/ilmac-bid-web/backend/nodejs/src/utils/spiderGovBidList.ts` - 스크래핑 로직
- `/exposed/projects/ilmac-bid-web/.env` - 환경변수 설정

## 참고사항

- 데이터베이스 연결 정보는 `.env` 파일에서 로드됩니다
- 수집 대상은 `settings_notice_list` 테이블의 `use=1` 인 기관만 대상으로 합니다
- 각 실행마다 모든 활성 기관을 순차적으로 처리합니다
