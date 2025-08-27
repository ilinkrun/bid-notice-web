#!/bin/bash
set -e

echo "Stopping all FastAPI servers..."

# 기존 서버 프로세스 찾기 및 종료
echo "Finding running uvicorn processes..."

# 새로운 포트들에서 실행 중인 프로세스 종료
for port in 11301 11302 11303 11307; do
    pid=$(lsof -ti:$port 2>/dev/null || echo "")
    if [ ! -z "$pid" ]; then
        echo "Stopping server on port $port (PID: $pid)"
        kill -TERM $pid 2>/dev/null || true
        sleep 1
        # SIGTERM이 안 먹히면 SIGKILL 사용
        if kill -0 $pid 2>/dev/null; then
            echo "Force killing process $pid"
            kill -KILL $pid 2>/dev/null || true
        fi
    else
        echo "No process found on port $port"
    fi
done

# 기존 포트들에서 실행 중인 프로세스도 종료 (혹시라도)
for port in 8001 8002 8003 8007; do
    pid=$(lsof -ti:$port 2>/dev/null || echo "")
    if [ ! -z "$pid" ]; then
        echo "Stopping legacy server on port $port (PID: $pid)"
        kill -TERM $pid 2>/dev/null || true
        sleep 1
        if kill -0 $pid 2>/dev/null; then
            echo "Force killing legacy process $pid"
            kill -KILL $pid 2>/dev/null || true
        fi
    fi
done

# uvicorn 프로세스 패턴으로 찾아서 종료
echo "Looking for remaining uvicorn processes..."
pkill -f "uvicorn.*server_" 2>/dev/null || echo "No uvicorn processes found"

echo "All servers stopped."