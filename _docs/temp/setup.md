```sh
# docker 구동(entrypoint.sh 실행 로그를 보면 구동 완료까지 시간이 많이 걸림림)
cd /volume1/docker/platforms/ubuntu
docker-compose down -v && docker-compose build --no-cache && docker-compose up -d

# 도커 내부로 들어가기
docker exec -it ubuntu-dev /bin/bash

# 수동 설치
playwright install-deps

crontab -e

python test.py

cd /nas/24_공사점검

```

```sh
# 서버 재시작
nohup uvicorn server_bid:app --host 0.0.0.0 --port 8003 > output.log 2>&1 &
nohup uvicorn server_bid:app --reload --host=0.0.0.0 --port=8003 > output.log 2>&1 &

# 서버 재시작2
nohup uvicorn server_mysql:app --reload --host=0.0.0.0 --port=8002 > output.log 2>&1 &
nohup uvicorn server_board:app --reload --host=0.0.0.0 --port=8007 > output.log 2>&1 &
```


```sh
# 패키지 설치
uv pip install -r requirements.txt

# 설치된 패키지를 TOML 형식으로 내보내기
uv export -o requirements.toml
```



##
```
netstat -tuln | grep 8001  # googlesheets
netstat -tuln | grep 8002  # googlesheets
netstat -tuln | grep 8003  # web bid
netstat -tuln | grep 8007  # web board

# 이전 프로세스 종료
pkill -f "uvicorn server_bid:app"

# 서버 재시작
nohup uvicorn server_bid:app --host 0.0.0.0 --port 8003 > output.log 2>&1 &
nohup uvicorn server_bid:app --reload --host=0.0.0.0 --port=8003 > output.log 2>&1 &

# 서버 재시작2
nohup uvicorn server_mysql:app --reload --host=0.0.0.0 --port=8002 > output.log 2>&1 &
nohup uvicorn server_board:app --reload --host=0.0.0.0 --port=8007 > output.log 2>&1 &


# 로그 확인
tail -f output.log

```

```sh
# start uvicorn
nohup uvicorn server_bid:app --reload --host=0.0.0.0 --port=8003 > output.log 2>&1 &

# check log
tail -f output.log

nohup: ignoring input
nohup: failed to run command 'uvicorn': No such file or directory

# install
uv pip install -r requirements.txt

# kill
pkill -f "uvicorn server_bid:app"
# start uvicorn
nohup uvicorn server_bid:app --reload --host=0.0.0.0 --port=8003 > output.log 2>&1 &
```


```sh
# install by pyproject.toml
uv pip install -e .
```


## cron

```sh
# cron 설정(terminal)
crontab -e

# cron 설정(파일일)
`/volume1/docker/platforms/ubuntu/config/crontab`

# cron log 확인(rsyslog)
tail -f /var/log/syslog | grep CRON
```

## docker
> - !!! 자동 설치 필요
```
<!-- playwright install -->
playwright install-deps
```