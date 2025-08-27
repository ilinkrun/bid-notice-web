## ilmac-bid backend

- python
- mysql
- uvicorn
- fastapi

- docker
- uv
 

```sh
# 사전 설치!!
apt-get update && apt-get install -y libxml2-dev libxslt-dev

# pyproject.toml 패키지 설치
cd "/_exp/apps/backends/ilmac-bid/bid-notice-scraper/app" && uv sync
```

## test

```sh
cd /_exp/apps/backends/bid-notice-scraper/app
uv run python mysql_basic.py
```