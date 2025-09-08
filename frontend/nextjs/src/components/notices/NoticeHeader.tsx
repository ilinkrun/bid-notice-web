'use client';

interface NoticeHeaderProps {
  title: string;
}

export function NoticeHeader({ title }: NoticeHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}
