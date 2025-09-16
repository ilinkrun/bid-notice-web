
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
    const buttonStyle = {
        backgroundColor: variant === 'outline' ? 'transparent' : '#00ff00', // 초록색 (default variant)
        border: variant === 'outline' ? '3px solid #ff0000' : 'none', // 빨간색 테두리 (outline variant)
        color: variant === 'outline' ? '#ff0000' : '#000000', // outline은 빨간색 글자, default는 검은색 글자
        borderRadius: '0px',
        padding: size === 'sm' ? '0.375rem 0.75rem' : '0.5rem 1rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size === 'sm' ? '0.875rem' : '1rem',
        fontWeight: '500',
        transition: 'all 0.2s ease',
        minHeight: size === 'sm' ? '2rem' : '2.5rem',
        minWidth: size === 'sm' ? '2rem' : '2.5rem'
    } as React.CSSProperties;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            type={type}
            title={title}
            className={className}
            style={buttonStyle}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.backgroundColor = variant === 'outline' ? '#ffff00' : '#0000ff'; // outline은 노란색, default는 파란색
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    e.currentTarget.style.backgroundColor = variant === 'outline' ? 'transparent' : '#00ff00'; // 원래 색으로 복구
                }
            }}
        >
            CUSTOM_BUTTON_TEST
        </button>
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

interface OutlineButtonProps {
    children: ReactNode;
    onClick?: () => void;
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    title?: string;
}

interface IconButtonProps {
    icon: ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    title?: string;
}

/**
 * 투명한 배경에 테이블 행과 동일한 색상을 사용하는 Outline Button 컴포넌트
 * light/dark 모드 자동 지원
 */
export function OutlineButton({
    children,
    onClick,
    size = 'default',
    className,
    disabled = false,
    type = 'button',
    title
}: OutlineButtonProps) {
    const buttonStyle = {
        backgroundColor: 'transparent !important',
        border: '3px solid #ff0000 !important',
        color: '#ff0000 !important',
        borderRadius: '0px !important',
        padding: '0 !important',
        margin: '0 !important',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        fontSize: size === 'sm' ? '0.875rem !important' : size === 'lg' ? '1.125rem !important' : '1rem !important',
        fontWeight: '500 !important',
        transition: 'all 0.2s ease !important',
        width: '100% !important',
        height: '100% !important',
        boxSizing: 'border-box !important'
    } as React.CSSProperties;

    return (
        <div
            onClick={disabled ? undefined : onClick}
            title={title}
            className={cn(className)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    // 테이블 행의 hover 배경색과 동일하게 설정
                    e.currentTarget.style.backgroundColor = '#ffff00 !important';
                    e.currentTarget.style.color = '#000000 !important';
                    e.currentTarget.style.borderColor = '#000000 !important';
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    // 원래 상태로 복구
                    e.currentTarget.style.backgroundColor = 'transparent !important';
                    e.currentTarget.style.color = '#ff0000 !important';
                    e.currentTarget.style.borderColor = '#ff0000 !important';
                }
            }}
            style={{
                backgroundColor: 'transparent !important',
                border: '3px solid #ff0000 !important',
                color: '#ff0000 !important',
                borderRadius: '0px !important',
                padding: size === 'icon' ? '2px 0 !important' : '0 !important',
                margin: '0 !important',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                display: 'inline-flex !important',
                alignItems: 'center !important',
                justifyContent: 'center !important',
                width: size === 'icon' ? '40px !important' : 'auto !important',
                height: size === 'icon' ? '40px !important' : 'auto !important',
                minWidth: size === 'icon' ? '40px !important' : 'auto !important',
                minHeight: size === 'icon' ? '40px !important' : 'auto !important',
                maxWidth: size === 'icon' ? '40px !important' : 'none !important',
                maxHeight: size === 'icon' ? '40px !important' : 'none !important',
                boxSizing: 'border-box !important',
                flexShrink: '0 !important',
                overflow: 'hidden !important'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                margin: '0 !important',
                padding: '0 !important'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 !important',
                    padding: '0 !important',
                    lineHeight: '0 !important'
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

/**
 * 아이콘 버튼 컴포넌트
 * 투명한 배경, 테이블 행과 동일한 색상, light/dark 모드 자동 지원
 */
export function IconButton({
    icon,
    onClick,
    className,
    disabled = false,
    title
}: IconButtonProps) {
    return (
        <div
            onClick={disabled ? undefined : onClick}
            title={title}
            className={cn("no-unified-style", className)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                    e.currentTarget.style.color = 'hsl(var(--foreground))';
                    e.currentTarget.style.borderColor = 'hsl(var(--foreground))';
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'hsl(var(--foreground))';
                    e.currentTarget.style.borderColor = 'hsl(var(--foreground))';
                }
            }}
            style={{
                backgroundColor: 'transparent',
                border: '1px solid hsl(var(--foreground))',
                color: 'hsl(var(--foreground))',
                borderRadius: '0px',
                padding: '2px 0',
                margin: '0',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                minWidth: '40px',
                minHeight: '40px',
                maxWidth: '40px',
                maxHeight: '40px',
                boxSizing: 'border-box',
                flexShrink: '0',
                overflow: 'hidden'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                margin: '0',
                padding: '0'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0',
                    padding: '0',
                    lineHeight: '0'
                }}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
