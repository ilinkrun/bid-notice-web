# Page Loading Flow Hook 사용 가이드

웹앱의 모든 페이지 이동시 통일된 로딩 플로우를 제공하는 Hook입니다.

## 플로우 순서

### 메뉴 클릭을 통한 페이지 이동 (1-9단계)
1. **메뉴 클릭** - 사용자가 네비게이션 메뉴 클릭
2. **URL 즉시 변경** - 브라우저 주소창 즉시 업데이트  
3. **Skeleton 렌더링** - 페이지 기본 구조 표시
4. **로딩 스피너 시작** - 200ms 후 스피너 표시 (빠른 응답에서는 스피너 없음)
5. **데이터 요청** - REST API 또는 GraphQL 호출
6. **데이터 로딩 대기** - 실제 서버 응답 시간만큼 대기
7. **데이터 완료 감지** - `data !== undefined` 확인
8. **UI 안정화** - 300ms 대기 (렌더링 완료 보장)
9. **스피너 제거** - 사용자에게 완성된 페이지 표시

### 직접 URL 입력 접근 (2-9단계)  
2단계부터 동일한 플로우로 진행됩니다.

## Hook 사용법

### 1. 기본 사용법

```typescript
import { usePageLoadingFlow } from '@/hooks/usePageLoadingFlow';

export default function MyPage() {
  const { notifyDataLoaded, isPageReady } = usePageLoadingFlow({
    customMessage: '데이터를 불러오는 중...'
  });

  // GraphQL 쿼리
  const { loading, data, error } = useQuery(MY_QUERY, {
    onCompleted: () => {
      // 7단계: 데이터 완료 감지
      notifyDataLoaded();
    },
    onError: () => {
      notifyDataLoaded();
    }
  });

  // 로딩 중일 때 Skeleton 표시
  if (loading) {
    return <MySkeleton />;
  }

  return <MyContent data={data} />;
}
```

### 2. 옵션 설정

```typescript
const { notifyDataLoaded } = usePageLoadingFlow({
  // 사용자 정의 로딩 메시지
  customMessage: '상품 목록을 불러오는 중...',
  
  // UI 안정화 대기 시간 (기본값: 300ms)
  uiStabilizationDelay: 500,
  
  // 스피너 표시 지연 시간 (기본값: 200ms)  
  spinnerDelay: 100,
});
```

### 3. 네비게이션에서 사용

```typescript
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';

export default function MenuComponent() {
  const { navigate } = useUnifiedNavigation();

  const handleMenuClick = () => {
    // 메뉴 클릭 네비게이션 (1-9단계 플로우)
    navigate('/settings/scrapping/5/list', { 
      isMenuNavigation: true 
    });
  };

  return (
    <button onClick={handleMenuClick}>
      설정 페이지로 이동
    </button>
  );
}
```

## 주요 특징

### 🚀 성능 최적화
- **빠른 응답 최적화**: 200ms 이내 응답시 스피너 표시 안함
- **UI 안정화**: 300ms 대기로 렌더링 완료 보장
- **메모리 효율**: 타이머 자동 정리

### 🎯 사용자 경험 개선  
- **즉시 피드백**: URL 즉시 변경으로 반응성 향상
- **일관된 로딩**: 모든 페이지에서 동일한 로딩 패턴
- **로딩 상태 시각화**: 단계별 콘솔 로그로 디버깅 지원

### 🔧 개발자 친화적
- **타입 안전**: TypeScript 완전 지원
- **디버깅**: 각 단계별 상세한 콘솔 로그
- **호환성**: 기존 `useUnifiedLoading` Hook과 호환

## 호환성

기존 코드와의 호환성을 위해 `finishLoading()`도 함께 호출합니다:

```typescript
useEffect(() => {
  if (!loading && data) {
    // 기존 방식 (호환성)
    finishLoading();
    // 새로운 플로우
    notifyDataLoaded();
  }
}, [loading, data, finishLoading, notifyDataLoaded]);
```

## 디버깅

브라우저 콘솔에서 다음과 같은 로그를 확인할 수 있습니다:

```
🖱️ [단계 1] 메뉴 클릭 - 네비게이션 시작: /settings/scrapping/5/list
📍 [단계 2] URL 즉시 변경  
🎨 [단계 3] Skeleton 렌더링 시작
⏳ [단계 4] 로딩 스피너 시작
📡 [단계 5] 데이터 요청 시작 (GraphQL/REST API 호출)
📊 [단계 6] 데이터 로딩 대기 완료
✅ [단계 7] 데이터 완료 감지 (data !== undefined)
🎯 [단계 8] UI 안정화 대기 (300ms)
🎉 [단계 9] 스피너 제거 - 완성된 페이지 표시
```

## 문제 해결

### 스피너가 너무 빨리 사라져요
- `uiStabilizationDelay`를 늘려보세요 (기본값: 300ms)

### 빠른 응답에서도 스피너가 보여요  
- `spinnerDelay`를 늘려보세요 (기본값: 200ms)

### 로딩이 완료되지 않아요
- `notifyDataLoaded()`가 호출되는지 확인하세요
- 10초 후 자동으로 타임아웃됩니다

이 Hook을 통해 모든 페이지에서 일관되고 부드러운 로딩 경험을 제공할 수 있습니다.