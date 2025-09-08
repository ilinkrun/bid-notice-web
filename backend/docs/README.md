# 입찰공고 스크래핑 시스템 문서

이 디렉토리는 한국 정부 입찰공고 스크래핑 시스템의 기술 문서들을 포함합니다.

## 문서 구조

- [프로젝트 개요](./01-project-overview.md) - 시스템 전체 개요 및 목적
- [백엔드 아키텍처](./02-backend-architecture.md) - 시스템 구조 및 설계
- [핵심 모듈 가이드](./03-core-modules.md) - 주요 모듈별 기능 및 함수 설명
- [API 레퍼런스](./04-api-reference.md) - 모든 API 엔드포인트 상세 설명
- [데이터베이스 스키마](./05-database-schema.md) - 데이터베이스 구조 및 테이블 설명

## 빠른 시작

1. [프로젝트 개요](./01-project-overview.md)에서 시스템에 대한 기본 이해를 얻으세요
2. [백엔드 아키텍처](./02-backend-architecture.md)에서 시스템 구조를 파악하세요
3. [API 레퍼런스](./04-api-reference.md)에서 필요한 API를 찾아 사용하세요

## 개발 환경 설정

```bash
# 의존성 설치
apt-get update && apt-get install -y libxml2-dev libxslt-dev
cd /exposed/apps/backends/bid-notice-scraper/app && uv sync

# 데이터베이스 연결 테스트
uv run python utils_mysql.py
```