네, 맞습니다. 프로덕션 환경에서도 동일한 포트를 사용하려면 `start` 스크립트도 수정해야 합니다.

`package.json`의 scripts 섹션을 다음과 같이 수정하세요:

```json
"scripts": {
  "dev": "next dev -p 3011",
  "build": "next build",
  "start": "next start -p 3011",
  "lint": "next lint"
}
```

이유:
1. `next dev`는 개발 환경에서 사용
2. `next start`는 프로덕션 환경(`npm run build` 후)에서 사용
3. 두 환경에서 동일한 포트를 사용하려면 두 스크립트 모두 포트를 지정해야 함

만약 포트를 다르게 사용하고 싶다면:
- 개발 환경: `"dev": "next dev -p 3011"`
- 프로덕션 환경: `"start": "next start -p 3000"` (기본값)

또는 환경 변수를 사용하여 동적으로 포트를 설정할 수도 있습니다:
```json
"scripts": {
  "dev": "next dev -p ${PORT:-3011}",
  "start": "next start -p ${PORT:-3011}"
}
```
