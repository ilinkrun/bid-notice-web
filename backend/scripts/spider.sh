#!/bin/bash
export PATH=/usr/local/bin:/usr/bin:/bin
export PYTHONPATH=/app
export PLAYWRIGHT_BROWSERS_PATH=/app/ms-playwright

cd /app
/usr/local/bin/python3 /app/spider_bid.py

