## docker build 에러

```sh
cd /volume1/docker/_playground/nextjs2/sites/ilmac-bid
docker-compose down -v && docker-compose build --no-cache && docker-compose up -d


[+] Building 2.0s (2/2) FINISHED
 => [app internal] load build definition from Dockerfile                                                           1.0s
 => => transferring dockerfile: 2B                                                                                 0.0s
 => [app internal] load .dockerignore                                                                              0.7s
 => => transferring context: 120B                                                                                  0.0s
failed to solve: failed to read dockerfile: open /volume1/@docker/tmp/buildkit-mount3324464817/Dockerfile: no such file or directory
```

### 해결(docker 없이 local 실행)

```sh
cd /volume1/docker/_playground/nextjs2/sites/ilmac-bid

nohup npm run dev &
```

