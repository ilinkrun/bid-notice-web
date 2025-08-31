'use client';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface StatisticsTypeSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function StatisticsTypeSelector({ value, onValueChange }: StatisticsTypeSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="통계 유형 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="category">유형별</SelectItem>
        <SelectItem value="region">지역별</SelectItem>
        <SelectItem value="organization">기관별</SelectItem>
      </SelectContent>
    </Select>
  );
} 