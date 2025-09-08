# start backend servers in parallel
cd /exposed/projects/bid-notice-web/backend/python/src/server && nohup uv run server_spider.py &
cd /exposed/projects/bid-notice-web/backend/python/src/server && nohup uv run server_bid.py &
cd /exposed/projects/bid-notice-web/backend/python/src/server && nohup uv run server_mysql.py &
cd /exposed/projects/bid-notice-web/backend/python/src/server && nohup uv run server_board.py &
