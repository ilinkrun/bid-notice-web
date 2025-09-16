'use client';

import { ReactNode, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DarkModeSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  children: ReactNode;
  disabled?: boolean;
}

interface DarkModeButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
}

interface DarkModeInputProps {
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  disabled?: boolean;
  min?: string | number;
  max?: string | number;
  id?: string;
}

interface DarkModeLabelProps {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}

/**
 * 다크 모드를 지원하는 재사용 가능한 Select 컴포넌트
 */
export function DarkModeSelect({
  value,
  onValueChange,
  placeholder,
  className,
  children,
  disabled = false
}: DarkModeSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn(
        "bg-background dark:bg-background border-border dark:border-border",
        "text-foreground dark:text-foreground",
        "hover:bg-muted dark:hover:bg-muted",
        className
      )}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={cn(
        "bg-popover dark:bg-popover border-border dark:border-border",
        "text-popover-foreground dark:text-popover-foreground"
      )}>
        {children}
      </SelectContent>
    </Select>
  );
}

/**
 * 다크 모드를 지원하는 재사용 가능한 SelectItem 컴포넌트
 */
export function DarkModeSelectItem({
  value,
  children,
  className
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SelectItem
      value={value}
      className={cn(
        "text-popover-foreground dark:text-popover-foreground",
        "hover:bg-accent dark:hover:bg-accent",
        "focus:bg-accent dark:focus:bg-accent",
        className
      )}
    >
      {children}
    </SelectItem>
  );
}

/**
 * 다크 모드를 지원하는 재사용 가능한 Button 컴포넌트
 */
export function DarkModeButton({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  type = 'button',
  title
}: DarkModeButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      type={type}
      title={title}
      className={cn(
        // 입력 필드와 동일한 스타일 적용
        variant === 'outline' && "bg-background dark:bg-background border-border dark:border-border text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted",
        className
      )}
    >
      {children}
    </Button>
  );
}

/**
 * 다크 모드를 지원하는 재사용 가능한 Input 컴포넌트
 */
export function DarkModeInput({
  value,
  onChange,
  placeholder,
  className,
  type = 'text',
  disabled = false,
  min,
  max,
  id
}: DarkModeInputProps) {
  return (
    <Input
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
      min={min}
      max={max}
      className={cn(
        "bg-background dark:bg-background border-border dark:border-border",
        "text-foreground dark:text-foreground",
        "placeholder-muted-foreground dark:placeholder-muted-foreground",
        "focus:border-primary dark:focus:border-primary",
        disabled && "bg-muted dark:bg-muted",
        className
      )}
    />
  );
}

/**
 * 다크 모드를 지원하는 재사용 가능한 Label 컴포넌트
 */
export function DarkModeLabel({ children, htmlFor, className }: DarkModeLabelProps) {
  return (
    <Label
      htmlFor={htmlFor}
      className={cn(
        "text-foreground dark:text-foreground font-medium",
        className
      )}
    >
      {children}
    </Label>
  );
}

interface SearchInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  autoComplete?: string;
  type?: string;
  onCompositionStart?: () => void;
  onCompositionEnd?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

/**
 * 검색 아이콘이 포함된 재사용 가능한 검색 입력 컴포넌트
 * 아이콘과 텍스트 간격이 자동으로 조정됩니다
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  value,
  onChange,
  placeholder = "검색...",
  className,
  disabled = false,
  id,
  autoComplete = "off",
  type = "text",
  onCompositionStart,
  onCompositionEnd,
  onKeyDown,
  onBlur,
  ...props
}, ref) => {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        ref={ref}
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
        autoComplete={autoComplete}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        className={cn(
          "pl-8 bg-background dark:bg-background border-border dark:border-border",
          "text-foreground dark:text-foreground",
          "placeholder-muted-foreground dark:placeholder-muted-foreground",
          "focus:border-primary dark:focus:border-primary",
          // 아이콘과 텍스트 간격 자동 조정
          "search-input-universal",
          disabled && "bg-muted dark:bg-muted",
          className
        )}
        {...props}
      />
    </div>
  );
});

SearchInput.displayName = 'SearchInput';