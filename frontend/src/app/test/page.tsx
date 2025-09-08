export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">
        Tailwind CSS 테스트 페이지
      </h1>
      
      <div className="space-y-4">
        {/* 기본 스타일링 테스트 */}
        <div className="bg-slate-100 p-4 rounded-lg shadow">
          <p className="text-lg text-gray-800">기본 스타일링 테스트</p>
        </div>

        {/* Flexbox 테스트 */}
        <div className="flex space-x-4">
          <div className="bg-blue-500 text-white p-4 rounded">Flex 아이템 1</div>
          <div className="bg-green-500 text-white p-4 rounded">Flex 아이템 2</div>
          <div className="bg-red-500 text-white p-4 rounded">Flex 아이템 3</div>
        </div>

        {/* Grid 테스트 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-purple-500 text-white p-4 rounded">Grid 아이템 1</div>
          <div className="bg-pink-500 text-white p-4 rounded">Grid 아이템 2</div>
          <div className="bg-yellow-500 text-white p-4 rounded">Grid 아이템 3</div>
        </div>

        {/* 호버 효과 테스트 */}
        <button className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors">
          호버 효과 테스트
        </button>

        {/* 반응형 테스트 */}
        <div className="bg-orange-500 text-white p-4 rounded text-center sm:bg-teal-500 md:bg-cyan-500 lg:bg-emerald-500">
          화면 크기에 따라 색상이 변경됩니다
        </div>
      </div>
    </div>
  );
} 