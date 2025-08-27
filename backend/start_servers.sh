# start backend servers in parallel
cd /_exp/projects/bid-notice-web/backend/app && uv run server_spider.py &
cd /_exp/projects/bid-notice-web/backend/app && uv run server_bid.py &
cd /_exp/projects/bid-notice-web/backend/app && uv run server_mysql.py &
