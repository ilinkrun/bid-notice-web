# start backend servers in parallel
cd /exposed/projects/bid-notice-web/backend/python && PYTHONPATH=src nohup uv run src/server/server_spider.py > /exposed/projects/bid-notice-web/logs/nohup_spider.out 2>&1 &
cd /exposed/projects/bid-notice-web/backend/python && PYTHONPATH=src nohup uv run src/server/server_bid.py > /exposed/projects/bid-notice-web/logs/nohup_bid.out 2>&1 &
cd /exposed/projects/bid-notice-web/backend/python && PYTHONPATH=src nohup uv run src/server/server_mysql.py > /exposed/projects/bid-notice-web/logs/nohup_mysql.out 2>&1 &
cd /exposed/projects/bid-notice-web/backend/python && PYTHONPATH=src nohup uv run src/server/server_board.py > /exposed/projects/bid-notice-web/logs/nohup_board.out 2>&1 &

# cd /exposed/projects/bid-notice-web/backend/python && PYTHONPATH=src uv run src/server/server_spider.py
# cd /exposed/projects/bid-notice-web/backend/python && PYTHONPATH=src uv run src/server/server_bid.py