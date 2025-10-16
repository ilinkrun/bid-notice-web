## 개요
- synology NAS에 ubuntu 최신버전 docker 설치
- SSH 접속 backend, frontend server 개발/운영

## 개발 환경
### OS: ubuntu24.04
  - SSH:
    - VS Code, Cursor 등 IDE 원격접속
    - claude code
  - XRDP
    - chrome browser (향후 playwright에서 구글계정 로그인 프로필 사용 크롤링)
  - cron
  - playwright

### language
#### python
- python
- uv

## nodejs
- nvm
- claude code


## ubuntu docker

### volumes

> LINUX_ROOT: /volume1/docker/platforms/linux-servers
> NAS_ROOT: /volume1

- NAS_ROOT:/nas
- LINUX_ROOT/databases:/databases
- LINUX_ROOT/backends:/backends
- LINUX_ROOT/frontends:/frontends


### ports
> 우선 전체 사용 예정 포트(11000 ~ 11999)를 전체적으로 expose

- 사용포트(local): 11000 ~ 11999

#### 사용 계획

- OS service용: 11000 ~ 11099
  - ssh: 11001
  - xrdp: 11099
- database server용: 11100 ~ 11199
- backend server용: 11300 ~ 11399
  - python server용: 11300 ~ 11319
  - nodejs server용: 11330 ~ 11349
  - graphql server용
  - n8n server
- frontend server용: 11500 ~ 11599
  - react.js
  - next.js
  - sveltekit

---

npm install -g @anthropic-ai/claude-code

---

## 향후 확장

- database: mysql, postgre, sqlite, mongodb
- frontend: react.js, next.js, sveltekit


● VSCode에서 패스워드 입력 없이 Remote-SSH에 접속하려면 SSH 키 기반 인증을 설정해야
   합니다.

  1단계: SSH 키 생성 (이미 있다면 생략)
  ssh-keygen -t rsa -b 4096

  2단계: 공개키를 컨테이너에 복사
  ssh-copy-id -p 11001 root@192.168.0.2

  3단계: SSH config 파일 설정 (~/.ssh/config):
  Host linux-server-dev
      HostName 192.168.0.2
      Port 11001
      User root
      IdentityFile ~/.ssh/id_rsa

## macos

```sh
cd /volume1/docker/platforms/linux-servers
docker-compose up -d

ssh-copy-id -p 11001 root@192.168.0.2
ssh hsn_ubuntu

ssh root@192.168.0.2 -p 11001
root / password

```

## windows11
```sh
# 1. 공개키를 원격 서버에 복사
scp -P 11001 C:\Users\Jungsam\.ssh\id_rsa.pub root@1.231.118.217:~/temp_key.pub

# 2. 원격 서버에 접속해서 authorized_keys에 추가
ssh -p 11001 root@1.231.118.217 "mkdir -p ~/.ssh && cat ~/temp_key.pub >> ~/.ssh/authorized_keys && rm ~/temp_key.pub && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"
```


## rebuild
```sh
cd /volume1/docker/platforms/linux-servers
docker-compose down
docker rmi linux-servers-ubuntu-dev
docker-compose up -d --build

ssh-copy-id -p 11001 root@192.168.0.2
password
ssh hsn_ubuntu
```

---

```sh
# https://github.com/jnjsoftone/jna-cli
npm i -g jna-cli

github -u 
```

```sh
# repository list(json)
xgit -u jnjsoftone -e list

# copy repository(remote -> local)
xgit -u jnjsoftone -e copy -n jna-cli

# make repository(create remote + clone)
cd /volume1/docker/platforms/linux-servers/backups/frontends
xgit -u jnjsoftapp -e make -n next-test -d "nextjs test app For NAS ubuntu docker"
```


## 

```sh
## cli app(개발툴: xcli, xgit)
xgit -u jnjsoft -e make -n jna-cli

## 
xgit -u jnjsoftone -e copy -n jd-environments
xgit -u jnjsoftone -e copy -n jnu-abc
xgit -u jnjsoftone -e copy -n jnu-doc && xgit -u jnjsoftone -e copy -n jnu-web && xgit -u jnjsoftone -e copy -n jnu-google
xgit -u jnjsoftone -e copy -n jnu-cloud && xgit -u jnjsoftone -e copy -n jnu-mm && xgit -u jnjsoftone -e copy -n jnu-note
```

---

## database 수정

0. database 이름 변경
Bid -> bid_notice

1. field 이름 한글 -> 영어

2. 테이블이름 변경
bids -> notice_
details -> notice_detail
notices -> notice_list
files -> notice_files

settings_category -> settings_notice_category
settings_detail -> settings_notice_detail
settings_category -> settings_notice_keyword
settings_list -> settings_notice_list



====

```sh
# 도커 실행
docker-compose up -d

# 도커 내부 진입
docker exec -it linux-server-dev /bin/bash

# 서버 실행
# 방법 1(uv run 실행)
cd /exposed/apps/backends/bid-notice-scraper/app
uv run server_spider.py

uv run server_bid.py


# 방법 2(nohup uv run)
cd /exposed/apps/backends/bid-notice-scraper/app
nohup uvicorn server_bid:app --reload --host=0.0.0.0 --port=11303 > logs/server_bid-11303.log 2>&1 &


/exposed/apps/backends/bid-notice-scraper/app# nohup uvicorn server_bid:app --reload --host=0.0.0.0 --port=11303
[1]+  Exit 127                nohup uvicorn server_bid:app --reload --host=0.0.0.0 --port=11303 > logs/bid-11303.log 2>&1
nohup: ignoring input and appending output to 'nohup.out'
nohup: failed to run command 'uvicorn': No such file or directory



# 방법 3(script 실행)
nohup uv run uvicorn $module --reload --host=0.0.0.0 --port=$port > logs/$module-$port.log 2>&1 &


# cron 실행
```


chmod +x /exposed/apps/backends/bid-notice-scraper/scripts/start_servers.sh


---
## spider 테스트

```sh
cd /exposed/apps/backends/bid-notice-scraper
uv run spider_list.py
```

cd /exposed/apps/backends/bid-notice-scraper && uv run python -m playwright install


===

# docker

"""
docker-compose에서 설정된 volumes가 docker-compose.yml과 같은 디렉토리에 있을 경우 volumes에 있는 폴더, 파일들이 image 파일에 추가되나요?
"""

아니요, docker-compose에서 설정된 volumes가 docker-compose.yml과 같은 디렉토리에 있어도 **volumes의 폴더나 파일들이 image 파일에 추가되지 않습니다**.

이는 Docker의 기본 작동 방식 때문입니다:

## Volume과 Image의 차이점

**Volumes는 런타임에 마운트됩니다:**
- 컨테이너가 실행될 때 호스트의 디렉토리나 파일을 컨테이너 내부로 마운트
- Image 빌드 과정과는 완전히 분리됨
- Image 크기에 영향을 주지 않음

**Image에 파일을 포함시키려면 Dockerfile을 사용해야 합니다:**
```dockerfile
# Dockerfile에서만 파일이 image에 포함됨
COPY ./local-folder /app/folder
ADD ./local-file.txt /app/
```

## 예시로 확인

```yaml
# docker-compose.yml
version: '3'
services:
  app:
    build: .
    volumes:
      - ./data:/app/data  # 이 data 폴더는 image에 포함되지 않음
      - ./config.json:/app/config.json  # 이 파일도 image에 포함되지 않음
```

위 설정에서 `./data` 폴더와 `./config.json` 파일은:
- ✅ 컨테이너 실행 시 마운트됨
- ❌ Image에는 포함되지 않음

## 확인 방법

Image에 실제로 포함되었는지 확인하려면:
```bash
# Image 내용 확인
docker run --rm -it your-image ls -la /app/

# 또는 Image 히스토리 확인
docker history your-image
```

Volume으로 마운트된 파일들은 이 명령어로는 보이지 않고, 컨테이너 실행 시에만 나타납니다.

---

"""
docker 설치후, docker 내부에 새로 설치된 app들은 docker image 에 포함되나요?
"""


**아니요, 실행 중인 Docker 컨테이너 내부에 새로 설치한 앱들은 기본적으로 Docker image에 포함되지 않습니다.**

## Docker의 레이어 구조

Docker는 **읽기 전용 레이어(image)**와 **쓰기 가능한 레이어(컨테이너)**로 구분됩니다:

```
[컨테이너 레이어] ← 새로 설치한 앱들이 여기에 저장 (임시)
[Image 레이어 3] ← 읽기 전용
[Image 레이어 2] ← 읽기 전용  
[Image 레이어 1] ← 읽기 전용
```

## 예시 상황

```bash
# 1. 컨테이너 실행
docker run -it ubuntu:20.04 /bin/bash

# 2. 컨테이너 내부에서 앱 설치
apt update
apt install nginx vim curl

# 3. 컨테이너 종료
exit
```

→ **설치한 nginx, vim, curl은 컨테이너가 삭제되면 함께 사라집니다!**

## 변경사항을 Image에 포함시키는 방법

### 1. docker commit 사용 (권장하지 않음)
```bash
# 변경된 컨테이너를 새 이미지로 저장
docker commit container_id new-image:tag
```

### 2. Dockerfile 사용 (권장)
```dockerfile
FROM ubuntu:20.04

RUN apt update && apt install -y \
    nginx \
    vim \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 기타 설정들...
```

```bash
docker build -t my-custom-image .
```

## 데이터 영속성 확보 방법

### Volume 사용
```bash
docker run -v /host/data:/container/data my-image
```

### Bind Mount 사용
```bash
docker run --mount type=bind,source=/host/path,target=/container/path my-image
```

**핵심**: Docker 컨테이너의 변경사항은 기본적으로 임시적이므로, 영속성이 필요한 데이터나 설치된 앱은 적절한 방법으로 보존해야 합니다.

---

> Dockerfile에서 RUN과 CMD는 어떤 차이가 있나요? 
  entrypoint.sh에 있는 내용을 docker 로딩시 자동으로 
  실행하되, image에는 들어가지 않도록 하고싶어요.

● RUN vs CMD 차이:

  - RUN: 이미지 빌드 시점에 실행되어 결과가 이미지
  레이어에 저장됩니다
  - CMD: 컨테이너 시작 시점에 실행되며, 이미지에는
  명령어만 저장됩니다

  entrypoint.sh를 컨테이너 시작 시 자동 실행하되 이미지에 
  포함시키지 않으려면:

  현재 docker-compose.yml에서 command 부분을 수정하면
  됩니다:

● Read(docker-compose.yml)
  ⎿  Read 10 lines (ctrl+r to expand)

● Update(docker-compose.yml)
  ⎿  Updated docker-compose.yml with 1 addition          
       19        command: >
       20          /bin/sh -c "service ssh start && 
       21                      service cron start && 
       22 +                    
          + /exposed/projects/bid-notice-web_entrypoint.sh &
       23                      tail -f /dev/null"
       24        networks:
       25          - dev-network

● 이제 컨테이너 시작 시 entrypoint.sh가 자동으로
  실행되지만, 스크립트 파일은 볼륨 마운트를 통해
  호스트에서 관리되므로 이미지에는 포함되지 않습니다.


===

## ilmac-bid backend

- python
- mysql
- uvicorn
- fastapi

- docker
- uv
 

```sh
# 사전 설치!!
apt-get update && apt-get install -y libxml2-dev libxslt-dev

# pyproject.toml 패키지 설치
cd "/exposed/apps/backends/ilmac-bid/bid-notice-scraper/app" && uv sync
```

## test

```sh
cd /exposed/apps/backends/bid-notice-scraper/app
uv run python utils_mysql.py
```