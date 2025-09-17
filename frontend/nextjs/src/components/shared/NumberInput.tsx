'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  id?: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: string | number;
  max?: string | number;
  className?: string;
  disabled?: boolean;
}

export function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  className,
  disabled = false
}: NumberInputProps) {
  const handleIncrement = () => {
    if (disabled) return;
    const newValue = value + 1;
    const maxVal = max ? Number(max) : Infinity;
    if (newValue <= maxVal) {
      const event = {
        target: { value: newValue.toString() }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  const handleDecrement = () => {
    if (disabled) return;
    const newValue = value - 1;
    const minVal = min ? Number(min) : -Infinity;
    if (newValue >= minVal) {
      const event = {
        target: { value: newValue.toString() }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  return (
    <div className="number-input-container">
      <Input
        id={id}
        type="number"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        className={cn("pr-6", className)}
      />
      <div className="number-input-arrows">
        <div
          className="number-input-arrow"
          onClick={handleIncrement}
        >
          <ChevronUp />
        </div>
        <div
          className="number-input-arrow"
          onClick={handleDecrement}
        >
          <ChevronDown />
        </div>
      </div>
    </div>
  );
}