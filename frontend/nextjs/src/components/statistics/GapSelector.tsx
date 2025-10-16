'use client';

import { OutlineSelectBox, OutlineSelectItem } from '@/components/shared/FormComponents';
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
    <OutlineSelectBox
      value={defaultValue}
      onValueChange={handleGapChange}
      placeholder="기간 선택"
      className="w-[180px]"
    >
      <OutlineSelectItem value="3">최근 3일</OutlineSelectItem>
      <OutlineSelectItem value="7">최근 7일</OutlineSelectItem>
      <OutlineSelectItem value="14">최근 14일</OutlineSelectItem>
    </OutlineSelectBox>
  );
} 