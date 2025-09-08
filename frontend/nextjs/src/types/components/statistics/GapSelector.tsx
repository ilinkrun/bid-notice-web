'use client';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useSearchParams } from 'next/navigation';
import { useUnifiedNavigation } from '@/hooks/useUnifiedNavigation';

interface GapSelectorProps {
  defaultValue: string;
}

export function GapSelector({ defaultValue }: GapSelectorProps) {
  const { navigate } = useUnifiedNavigation();
  const searchParams = useSearchParams();

  const handleGapChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('gap', value);
    navigate(`?${params.toString()}`);
  };

  return (
    <Select
      defaultValue={defaultValue}
      onValueChange={handleGapChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="기간 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="3">최근 3일</SelectItem>
        <SelectItem value="7">최근 7일</SelectItem>
        <SelectItem value="14">최근 14일</SelectItem>
      </SelectContent>
    </Select>
  );
} 