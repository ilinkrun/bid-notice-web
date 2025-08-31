## 자동 로딩 안됨

### 수동 시작

```sh
ssh hsn
password

# ssh
admin@NAS:~$ cd /volume1/docker/platforms
admin@NAS:/volume1/docker/platforms$ cd ilmac-ubuntu-dev
admin@NAS:/volume1/docker/platforms/ilmac-ubuntu-dev$ docker-compose up -d

# docker 내부
cd /_exp/projects/bid-notice-web/frontend
npm run dev
```



```
● Bash(pkill -f "next dev")
  ⎿  Error: Error

● Bash(fuser -k 11501/tcp)
  ⎿  Error: /bin/bash: line 1: fuser: command not found

● Bash(lsof -ti:11501 | xargs kill -9)
```


---

"""
vscode에서 remote-ssh 로 docker에 연결하여 claude code를 사용할 때, docker를 재시작할 때마다, claude code를 새로 설치하지 않아도 사용가능하도록 하려면?
"""

Docker 컨테이너를 재시작할 때마다 Claude Code가 사라지는 문제를 해결하려면, 설치된 바이너리를 영구적으로 보존할 수 있는 방법들이 있습니다:

## 1. Volume 마운트 사용 (권장)
Claude Code를 특정 디렉토리에 설치하고, 해당 디렉토리를 호스트와 마운트:

```bash
# 컨테이너 실행 시
docker run -v /host/path/to/bin:/usr/local/bin -v /host/path/to/workspace:/workspace ...

# 또는 docker-compose.yml에서
volumes:
  - ./bin:/usr/local/bin
  - ./workspace:/workspace
```

## 2. Dockerfile에서 설치하기
컨테이너 이미지에 Claude Code를 미리 포함:

```dockerfile
FROM ubuntu:latest

# 필요한 패키지 설치
RUN apt-get update && apt-get install -y curl

# Claude Code 설치
RUN curl -fsSL https://docs.anthropic.com/en/docs/claude-code/installation | sh

# PATH에 추가
ENV PATH="/root/.local/bin:${PATH}"

# 나머지 설정...
```

## 3. 바인드 마운트로 HOME 디렉토리 보존
Claude Code는 보통 `~/.local/bin`에 설치되므로:

```bash
docker run -v /host/home:/home/user -v /host/workspace:/workspace ...
```

## 4. 설치 스크립트 자동화
컨테이너 시작 시 Claude Code가 없으면 자동 설치하는 스크립트 작성:

```bash
#!/bin/bash
# entrypoint.sh
if ! command -v claude &> /dev/null; then
    curl -fsSL https://docs.anthropic.com/en/docs/claude-code/installation | sh
fi
exec "$@"
```

가장 깨끗한 해결책은 **Dockerfile에서 미리 설치**하거나, **전용 볼륨을 마운트**하는 것입니다. 개발 환경의 지속성을 위해서는 볼륨 마운트가 더 유연할 수 있습니다.

어떤 방법이 현재 환경에 가장 적합한지 알려주시면 더 구체적인 도움을 드릴 수 있습니다.