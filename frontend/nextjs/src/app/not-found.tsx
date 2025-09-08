export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-4">페이지를 찾을 수 없습니다</p>
      <a
        href="/"
        className="text-blue-600 hover:text-blue-800 hover:underline"
      >
        홈으로 돌아가기
      </a>
    </div>
  );
} 