#!/bin/bash
set -ex  # 모든 명령어 출력 및 오류 발생 시 즉시 종료

# 로그 파일에 모든 출력 기록
exec > >(tee /logs/entrypoint.log) 2>&1

echo "Starting container setup... $(date)"

# 기본 패키지 설치
apt-get update

# 패키지 목록 생성 (필수 패키지 및 Playwright 의존성 포함)
PACKAGES="cron git ca-certificates curl vim net-tools rsyslog \
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

# logs 디렉토리 생성
mkdir -p /app/logs

# python 패키지 설치 전 디버그 정보 출력
echo "Python version: $(python --version)"
echo "pip version: $(pip --version)"
echo "uv version: $(uv --version)"

# 패키지 설치 (pyproject.toml 사용)
cd /app
echo "Installing Python packages from pyproject.toml..."
if [ -f "pyproject.toml" ]; then
    echo "Syncing dependencies with uv..."
    uv sync
    uv pip install --system -e .
else
    echo "pyproject.toml not found, creating requirements.txt..."
    # 기본 requirements.txt 생성
    cat > requirements.txt << EOF
requests==2.31.0
beautifulsoup4==4.12.2
lxml==4.9.3
playwright==1.41.2
fastapi==0.108.0
uvicorn==0.25.0
pydantic==2.5.2
EOF
    # requirements.txt로 설치
    uv pip install --system -r requirements.txt
fi

# 명시적으로 playwright 설치 (이미 설치되어 있는지 확인)
if ! python -c "import playwright" &>/dev/null; then
    echo "Installing Playwright..."
    uv pip install --system playwright
fi

# Playwright 브라우저 및 의존성 설치
echo "Creating Playwright browsers directory..."
mkdir -p /app/ms-playwright
chmod -R 777 /app/ms-playwright

# 환경 변수 설정
export PLAYWRIGHT_BROWSERS_PATH=/app/ms-playwright

echo "Installing Playwright browsers..."
playwright install
playwright install-deps

# 브라우저 설치 (존재 여부 확인 후)
# if [ ! -d "/app/ms-playwright/chromium-" ]; then
#     # playwright install chromium --with-deps
#     playwright install
#     playwright install-deps
#     echo "Playwright browsers installed successfully!"
# else
#     echo "Playwright browsers already installed."
# fi

# bashrc 설정 (환경 변수 포함)
cat > /root/.bashrc << EOF
export PLAYWRIGHT_BROWSERS_PATH=/app/ms-playwright
export PATH="/root/.local/bin:$PATH"
export PYTHONPATH=/app
EOF

# .bashrc 설정 적용
if [ -f "/config/bashrc" ]; then
    echo "Copying additional .bashrc configuration..."
    cat /config/bashrc >> /root/.bashrc
fi

# crontab 설정 적용
if [ -f "/config/crontab" ]; then
    echo "Applying crontab configuration..."
    cp /config/crontab /etc/cron.d/app-crontab
    chmod 0644 /etc/cron.d/app-crontab
    # 파일 끝에 빈 줄 추가 (필수)
    sed -i -e '$a\' /etc/cron.d/app-crontab
    # crontab 설치
    echo "Installing crontab from /etc/cron.d/app-crontab"
    crontab /etc/cron.d/app-crontab

    # rsyslog 서비스 시작
    echo "Starting rsyslog service..."
    service rsyslog start

    # crontab 설정 확인
    echo "Current crontab configuration:"
    crontab -l
    
    # cron 서비스 시작
    echo "Starting cron service..."
    # service cron start || cron -f
    service cron start
    
    echo "Cron setup completed!"
else
    echo "No cron jobs to set up. Crontab file not found."
fi


# 설치 확인
echo "Checking installed packages..."
pip list

# 수정된 부분: 명령어 실행
if [ $# -eq 0 ]; then
    echo "No command specified, keeping container running..."
    # 서버 시작
    cd /app
    
    # googlesheet 용
    if [ -f "server_mysql.py" ]; then
        echo "Starting MySQL server..."
        nohup uv run uvicorn server_mysql:app --reload --host=0.0.0.0 --port=11302 > /app/logs/server_mysql.log 2>&1 &
    fi
    # googlesheet 용
    if [ -f "server_spider.py" ]; then
        echo "Starting Spider server..."
        nohup uv run uvicorn server_spider:app --reload --host=0.0.0.0 --port=11301 > /app/logs/server_spider.log 2>&1 &
    fi
    # webapp bid
    if [ -f "server_bid.py" ]; then
        echo "Starting Bid server..."
        nohup uv run uvicorn server_bid:app --reload --host=0.0.0.0 --port=11303 > /app/logs/server_bid.log 2>&1 &
    fi
    # webapp board
    if [ -f "server_board.py" ]; then
        echo "Starting Board server..."
        nohup uv run uvicorn server_board:app --reload --host=0.0.0.0 --port=11307 > /app/logs/server_board.log 2>&1 &
    fi
    
    # 컨테이너를 계속 실행 상태로 유지
    echo "Container setup completed. Running indefinitely..."
    tail -f /dev/null
else
    echo "Executing command: $@"
    exec "$@"
fi