# start backend servers in parallel
cd /exposed/projects/bid-notice-web/backend/src/server && nohup uv run server_spider.py &
cd /exposed/projects/bid-notice-web/backend/src/server && nohup uv run server_bid.py &
cd /exposed/projects/bid-notice-web/backend/src/server && nohup uv run server_mysql.py &
cd /exposed/projects/bid-notice-web/backend/src/server && nohup uv run server_board.py &


# cd /exposed/projects/bid-notice-web/backend && PYTHONPATH=src uv run src/spider/spider_list.py
# !! 수정 예정
# cd /exposed/projects/bid-notice-web/backend && PYTHONPATH=src uv run src/spider/spider_list.py

# set -e

# echo "Starting multiple FastAPI servers..."

# cd /app || cd $(dirname "$0")/../app

# # 필요한 디렉토리 생성
# mkdir -p logs

# # 필요한 도구 설치 확인
# if ! command -v netstat &> /dev/null; then
#     echo "Installing net-tools for netstat..."
#     apt-get update && apt-get install -y net-tools
#     apt-get clean
# fi

# # uv 동기화
# echo "Syncing dependencies with uv..."
# uv sync

# # 서버 시작 함수
# start_server() {
#     local port=$1
#     local module=$2
    
#     if ! netstat -tuln | grep ":$port" > /dev/null; then
#         echo "Starting $module on port $port..."
#         nohup uv run uvicorn $module --reload --host=0.0.0.0 --port=$port > logs/$module-$port.log 2>&1 &
#         sleep 2
#         if netstat -tuln | grep ":$port" > /dev/null; then
#             echo "$module successfully started on port $port"
#         else
#             echo "Warning: $module may have failed to start on port $port"
#         fi
#     else
#         echo "Port $port is already in use, skipping $module"
#     fi
# }

# # 각 서버 시작
# start_server 11301 server_spider:app
# start_server 11302 server_mysql:app
# start_server 11303 server_bid:app
# start_server 11307 server_board:app

# # 서버 상태 확인
# echo "Server status:"
# ps aux | grep -v grep | grep uvicorn || echo "No uvicorn processes found"

# # cron 다시 시작 (시스템에서 사용 가능한 경우)
# if command -v service &> /dev/null; then
#     echo "Restarting cron service..."
#     service cron restart
# else
#     echo "Cron service not available, skipping..."
# fi

# echo "All servers have been started!"