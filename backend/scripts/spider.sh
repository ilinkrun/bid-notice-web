#!/bin/bash
cd /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src && uv run spider_list.py

# export PATH=/usr/local/bin:/usr/bin:/bin
# export PYTHONPATH=/app
# export PLAYWRIGHT_BROWSERS_PATH=/app/ms-playwright

# cd /app
# /usr/local/bin/python3 /app/spider_list.py