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