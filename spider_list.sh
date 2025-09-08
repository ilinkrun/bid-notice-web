#!/bin/bash

# 로그 디렉토리 생성
mkdir -p /exposed/projects/bid-notice-web/logs

# 실행 시작 시간 로그
echo "$(date '+%Y-%m-%d %H:%M:%S') - Spider list script started" >> /exposed/projects/bid-notice-web/logs/spider_list.log

# 스크립트 실행
cd /exposed/projects/bid-notice-web/backend && PYTHONPATH=src uv run src/spider/spider_list.py

# 실행 종료 시간 로그
echo "$(date '+%Y-%m-%d %H:%M:%S') - Spider list script completed (Exit code: $?)" >> /exposed/projects/bid-notice-web/logs/spider_list.log