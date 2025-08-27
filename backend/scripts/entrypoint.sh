#!/bin/bash
set -ex  # 모든 명령어 출력 및 오류 발생 시 즉시 종료

# 로그 파일에 모든 출력 기록
exec > >(tee /logs/entrypoint.log) 2>&1

echo "Starting container setup... $(date)"

# 기본 패키지 설치
apt-get update

# 패키지 목록 생성 (필수 패키지 및 Playwright 의존성 포함)
PACKAGES="cron git ca-certificates curl vim net-tools rsyslog lsof \
libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
libdrm2 libdbus-1-3 libatspi2.0-0 libx11-6 libxcomposite1 \
libxdamage1 libxext6 libxfixes3 libxrandr2 libgbm1 libxcb1 \
libxkbcommon0 libpango-1.0-0 libcairo2 libasound2 libxshmfence1"

# 빌드 의존성 패키지 목록
BUILD_DEPS="build-essential gcc g++ python3-dev pkg-config cmake"

# 빌드 의존성 설치 여부 확인
if [ "$INSTALL_BUILD_DEPS" = "true" ]; then
    echo "Installing build dependencies..."
    PACKAGES="$PACKAGES $BUILD_DEPS"
fi

# 패키지 설치
echo "Installing packages: $PACKAGES"
apt-get install -y --no-install-recommends $PACKAGES

# 설치 완료 후 청소
apt-get clean
rm -rf /var/lib/apt/lists/*

# crontab 설정 적용
if [ -f "/config/crontab" ]; then
    echo "Applying crontab configuration..."
    cp /config/crontab /etc/cron.d/app-crontab
    chmod 0644 /etc/cron.d/app-crontab
    # 파일 끝에 빈 줄 추가 (필수)
    echo "" >> /etc/cron.d/app-crontab
    
    echo "Starting cron service..."
    service cron start
    
    echo "Cron setup completed!"
else
    echo "No cron jobs to set up. Crontab file not found."
fi

# 설치 확인
echo "Checking installed packages..."
pip list

# 서버 시작 함수 정의
start_server() {
    local server_file=$1
    local port=$2
    local server_name=$3
    
    if [ -f "$server_file" ]; then
        echo "Starting $server_name server on port $port..."
        
        # 기존 프로세스가 포트를 사용 중인지 확인
        if command -v lsof &> /dev/null; then
            existing_pid=$(lsof -ti:$port 2>/dev/null || echo "")
            if [ ! -z "$existing_pid" ]; then
                echo "Port $port is already in use by PID $existing_pid. Stopping it..."
                kill -TERM $existing_pid 2>/dev/null || true
                sleep 2
            fi
        fi
        
        # 서버 시작
        nohup uv run uvicorn ${server_file%.*}:app --reload --host=0.0.0.0 --port=$port > /app/logs/server_${server_name,,}.log 2>&1 &
        server_pid=$!
        
        # 서버가 제대로 시작되었는지 확인
        sleep 3
        if kill -0 $server_pid 2>/dev/null; then
            echo "$server_name server started successfully (PID: $server_pid)"
        else
            echo "Warning: $server_name server may have failed to start"
        fi
    else
        echo "$server_file not found, skipping $server_name server"
    fi
}

# 수정된 부분: 명령어 실행
if [ $# -eq 0 ]; then
    echo "No command specified, keeping container running..."
    
    # 서버 시작
    cd /app
    
    # 기존 서버들 정리 (재시작 시)
    echo "Cleaning up any existing server processes..."
    for port in 11301 11302 11303 11307; do
        if command -v lsof &> /dev/null; then
            existing_pid=$(lsof -ti:$port 2>/dev/null || echo "")
            if [ ! -z "$existing_pid" ]; then
                echo "Stopping existing process on port $port (PID: $existing_pid)"
                kill -TERM $existing_pid 2>/dev/null || true
            fi
        fi
    done
    
    # 잠시 대기
    sleep 2
    
    # 서버들 시작
    start_server "server_mysql.py" 11302 "MySQL"
    start_server "server_spider.py" 11301 "Spider" 
    start_server "server_bid.py" 11303 "Bid"
    start_server "server_board.py" 11307 "Board"
    
    # 컨테이너를 계속 실행 상태로 유지
    echo "Container setup completed. Running indefinitely..."
    tail -f /dev/null
else
    echo "Executing command: $@"
    exec "$@"
fi