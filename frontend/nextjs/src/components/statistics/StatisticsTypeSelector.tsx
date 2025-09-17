'use client';

import { OutlineSelectBox, OutlineSelectItem } from '@/components/shared/FormComponents';

interface StatisticsTypeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function StatisticsTypeSelector({ value, onValueChange }: StatisticsTypeSelectorProps) {
  return (
    <OutlineSelectBox
      value={value}
      onValueChange={onValueChange}
      placeholder="통계 유형 선택"
      className="w-[180px]"
    >
      <OutlineSelectItem value="category">유형별</OutlineSelectItem>
      <OutlineSelectItem value="region">지역별</OutlineSelectItem>
      <OutlineSelectItem value="organization">기관별</OutlineSelectItem>
    </OutlineSelectBox>
  );
} 