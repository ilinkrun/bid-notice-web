```sh
nohup npm run dev &
```

```sh
npm run build &

nohup npm run start &

# 로그 확인
tail -50 nohup.out


### 프로세스 아이디 알아내기
$ ps -ef | grep node

### 프로세스 종료
$ kill -9 <프로세스 아이디>
```
