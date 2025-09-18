'use client';

import React, { ReactNode, forwardRef, useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  SelectItem,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';


interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  title?: string;
}

interface OutlineSelectBoxProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}

interface RadioButtonOption {
  value: string;
  label: string;
}

interface RadioButtonSetProps {
  options: RadioButtonOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface ButtonWithIconProps {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

interface InputWithIconProps {
  icon?: ReactNode;
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

interface ButtonWithColorIconProps {
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  color?: string; // 주색상 (예: 'blue', 'red', 'green', 'secondary', 'tertiary')
  mode?: 'outline' | 'filled' | 'active' | 'base'; // 버튼 스타일 모드
}

interface IsActiveProps {
  value: boolean;
  labels?: [string, string];
  colors?: [string, string];
  className?: string;
}


/**
 * 아이콘이 포함된 재사용 가능한 입력 컴포넌트
 * 아이콘과 텍스트 간격이 자동으로 조정됩니다
 * 기본 아이콘은 검색 아이콘입니다
 */
export const InputWithIcon = forwardRef<HTMLInputElement, InputWithIconProps>(({
  icon = <Search className="h-4 w-4" />,
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
      <div className="absolute left-2 top-2.5 h-4 w-4 z-10" style={{ color: 'hsl(var(--color-primary-muted))' }}>
        {icon}
      </div>
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
          "pl-8  dark:border-border dark:border-border",
          "text-color-primary-foreground dark:text-color-primary-foreground",
          "placeholder:text-color-primary-muted dark:placeholder:text-color-primary-muted",
          "focus:border-primary dark:focus:border-primary",
          // 아이콘과 텍스트 간격 자동 조정
          "search-input-universal",
          disabled && "dark:bg-color-primary-hovered",
          className
        )}
        style={{
          ...props.style,
          '--tw-placeholder-color': 'hsl(var(--color-primary-muted))'
        } as React.CSSProperties}
        {...props}
      />
    </div>
  );
});

InputWithIcon.displayName = 'InputWithIcon';

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
      className={cn("no-unified-style border bg-transparent", className)}
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
          e.currentTarget.style.backgroundColor = 'hsl(var(--color-primary-hovered))';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
      style={{
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
        overflow: 'hidden',
        borderColor: 'hsl(var(--color-primary-foreground))',
        color: 'hsl(var(--color-primary-foreground))'
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

/**
 * Outline SelectBox 컴포넌트
 * div 기반 커스텀 구현으로 CSS 오버라이드 문제 해결
 * 투명한 배경, 테이블 행과 동일한 색상, light/dark 모드 자동 지원
 */
export function OutlineSelectBox({
  value,
  onValueChange,
  placeholder,
  className,
  disabled = false,
  children
}: OutlineSelectBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');

  // children에서 선택된 값에 해당하는 label 찾기
  useEffect(() => {
    if (value && children) {
      const childArray = React.Children.toArray(children);
      const selectedChild = childArray.find((child: any) =>
        child.props && child.props.value === value
      );
      if (selectedChild) {
        setSelectedLabel((selectedChild as any).props.children);
      }
    } else {
      setSelectedLabel('');
    }
  }, [value, children]);

  const handleSelect = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
    setIsOpen(false);
  };

  return (
    <div className={cn("no-unified-style relative text-color-primary-foreground", className)} style={{ width: '120px' }}>
      {/* 드롭다운 버튼 */}
      <div
        className="border bg-transparent"
        style={{
          minHeight: '40px',
          padding: '0 12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: '0px',
          borderColor: 'hsl(var(--color-primary-foreground))'
        }}
        onClick={disabled ? undefined : () => setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'hsl(var(--color-primary-hovered))';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
        role="combobox"
        aria-expanded={isOpen}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <span>
          {selectedLabel || placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className=""
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'hsl(var(--color-primary-muted))'
          }}
        >
          <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
      </div>

      {/* 드롭다운 내용 - 기존 Select 사용 */}
      {isOpen && (
        <div
          className="dropdown-blur"
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            zIndex: 50,
            backgroundColor: 'transparent',
            border: '1px solid hsl(var(--color-primary-foreground))',
            borderRadius: '0px',
            padding: '0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
        >
          {React.Children.map(children, (child: any) => {
            if (child && child.props) {
              return (
                <div
                  key={child.props.value}
                  onClick={() => handleSelect(child.props.value)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'hsl(var(--color-primary-hovered) / 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'hsl(var(--color-primary-background) / 0.6)';
                  }}
                  style={{
                    backgroundColor: 'hsl(var(--color-primary-background) / 0.6)',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: '0px',
                    color: 'hsl(var(--color-primary-foreground))'
                  }}
                >
                  {child.props.children}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* 클릭 영역 외부 클릭 시 닫기 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            zIndex: 40
          }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Outline SelectBox Item 컴포넌트
 * 테이블 행과 동일한 스타일 적용
 */
export function OutlineSelectItem({
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
      className={cn("no-unified-style", className)}
      style={{
        backgroundColor: 'transparent',
        color: 'hsl(var(--color-primary-foreground))',
        borderRadius: '0px',
        padding: '8px 12px',
        margin: '0',
        cursor: 'pointer',
        border: 'none'
      }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.backgroundColor = 'hsl(var(--color-primary-hovered))';
        e.currentTarget.style.color = 'hsl(var(--color-primary-foreground))';
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'hsl(var(--color-primary-foreground))';
      }}
    >
      {children}
    </SelectItem>
  );
}

/**
 * RadioButtonSet 컴포넌트
 * 라디오 버튼 형태의 버튼 그룹
 */
export function RadioButtonSet({ options, value, onChange, className }: RadioButtonSetProps) {
  return (
    <div
      className={cn("inline-flex border rounded-md overflow-hidden", className)}
      style={{
        borderColor: 'hsl(var(--color-primary-foreground))'
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-9 px-3 text-sm font-medium transition-colors border-r last:border-r-0 flex items-center justify-center whitespace-nowrap",
            value === option.value
              ? "font-bold"
              : ""
          )}
          style={{
            color: 'hsl(var(--color-primary-foreground))',
            borderColor: 'hsl(var(--color-primary-foreground))',
            backgroundColor: value === option.value ? 'hsl(var(--color-primary-muted))' : 'transparent',
          }}
          onMouseEnter={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.backgroundColor = 'hsl(var(--color-primary-hovered))';
            }
          }}
          onMouseLeave={(e) => {
            if (value !== option.value) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * ButtonWithIcon 컴포넌트
 * 아이콘과 텍스트가 포함된 버튼
 * 일관된 스타일링과 hover 효과 제공
 */
export function ButtonWithIcon({
  icon,
  children,
  onClick,
  className,
  disabled = false,
  type = 'button'
}: ButtonWithIconProps) {
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors",
        "border bg-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "rounded-md",
        className
      )}
      style={{
        borderColor: 'hsl(var(--color-primary-foreground))',
        color: 'hsl(var(--color-primary-foreground))',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'hsl(var(--color-primary-hovered))';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * ButtonWithColorIcon 컴포넌트
 * 주색상을 받아 자동으로 색상 조정하는 버튼
 * outline 모드: 글자색/테두리색: 주색상-900, hover: 주색상-300, disabled: 주색상-400, active: 주색상-700
 * filled 모드: 배경색: 주색상-600, 글자색: white, hover: 주색상-700, disabled: 주색상-400
 */
export function ButtonWithColorIcon({
  icon,
  children,
  onClick,
  className,
  disabled = false,
  type = 'button',
  color = 'blue',
  mode = 'outline'
}: ButtonWithColorIconProps) {
  const getColorClasses = (baseColor: string, buttonMode: string) => {
    const colorMap: { [key: string]: {
      outline: { text: string; border: string; bg: string; hover: string; disabled: string; active: string };
      filled: { text: string; border: string; bg: string; hover: string; disabled: string; active: string };
      active?: { text: string; border: string; bg: string; hover: string; disabled: string; active: string };
      base?: { text: string; border: string; bg: string; hover: string; disabled: string; active: string };
    } } = {
      blue: {
        outline: {
          text: 'text-blue-900',
          border: 'border-blue-900',
          bg: 'bg-transparent',
          hover: 'hover:bg-blue-300',
          disabled: 'disabled:text-blue-400 disabled:border-blue-400',
          active: 'active:bg-blue-700'
        },
        filled: {
          text: 'text-white',
          border: 'border-blue-600',
          bg: 'bg-blue-600',
          hover: 'hover:bg-blue-700',
          disabled: 'disabled:bg-blue-400 disabled:border-blue-400',
          active: 'active:bg-blue-800'
        }
      },
      red: {
        outline: {
          text: 'text-red-900',
          border: 'border-red-900',
          bg: 'bg-transparent',
          hover: 'hover:bg-red-300',
          disabled: 'disabled:text-red-400 disabled:border-red-400',
          active: 'active:bg-red-700'
        },
        filled: {
          text: 'text-white',
          border: 'border-red-600',
          bg: 'bg-red-600',
          hover: 'hover:bg-red-700',
          disabled: 'disabled:bg-red-400 disabled:border-red-400',
          active: 'active:bg-red-800'
        },
        active: {
          text: 'text-white',
          border: 'border-red-600',
          bg: 'bg-red-600',
          hover: 'hover:bg-red-700',
          disabled: 'disabled:bg-red-400 disabled:border-red-400',
          active: 'active:bg-red-800'
        }
      },
      green: {
        outline: {
          text: 'text-green-900',
          border: 'border-green-900',
          bg: 'bg-transparent',
          hover: 'hover:bg-green-300',
          disabled: 'disabled:text-green-400 disabled:border-green-400',
          active: 'active:bg-green-700'
        },
        filled: {
          text: 'text-white',
          border: 'border-green-600',
          bg: 'bg-green-600',
          hover: 'hover:bg-green-700',
          disabled: 'disabled:bg-green-400 disabled:border-green-400',
          active: 'active:bg-green-800'
        },
        active: {
          text: 'text-white',
          border: 'border-green-600',
          bg: 'bg-green-600',
          hover: 'hover:bg-green-700',
          disabled: 'disabled:bg-green-400 disabled:border-green-400',
          active: 'active:bg-green-800'
        }
      },
      orange: {
        outline: {
          text: 'text-orange-900',
          border: 'border-orange-900',
          bg: 'bg-transparent',
          hover: 'hover:bg-orange-300',
          disabled: 'disabled:text-orange-400 disabled:border-orange-400',
          active: 'active:bg-orange-700'
        },
        filled: {
          text: 'text-white',
          border: 'border-orange-600',
          bg: 'bg-orange-600',
          hover: 'hover:bg-orange-700',
          disabled: 'disabled:bg-orange-400 disabled:border-orange-400',
          active: 'active:bg-orange-800'
        }
      },
      slate: {
        outline: {
          text: 'text-slate-900',
          border: 'border-slate-900',
          bg: 'bg-transparent',
          hover: 'hover:bg-slate-300',
          disabled: 'disabled:text-slate-400 disabled:border-slate-400',
          active: 'active:bg-slate-700'
        },
        filled: {
          text: 'text-white',
          border: 'border-slate-600',
          bg: 'bg-slate-600',
          hover: 'hover:bg-slate-700',
          disabled: 'disabled:bg-slate-400 disabled:border-slate-400',
          active: 'active:bg-slate-800'
        }
      },
      secondary: {
        outline: {
          text: 'text-color-primary-foreground',
          border: 'border-color-primary-foreground',
          bg: 'bg-transparent',
          hover: 'hover:bg-color-primary-hovered',
          disabled: 'disabled:text-color-primary-muted disabled:border-color-primary-muted',
          active: 'active:bg-color-primary-hovered'
        },
        filled: {
          text: 'text-white',
          border: 'border-color-secondary-active',
          bg: 'bg-color-secondary-active',
          hover: 'hover:bg-color-secondary-active',
          disabled: 'disabled:bg-color-primary-muted disabled:border-color-primary-muted',
          active: 'active:bg-color-secondary-active'
        },
        active: {
          text: 'text-white',
          border: 'border-color-secondary-active',
          bg: 'bg-color-secondary-active',
          hover: 'hover:bg-color-secondary-active',
          disabled: 'disabled:bg-color-primary-muted disabled:border-color-primary-muted',
          active: 'active:bg-color-secondary-active'
        },
        base: {
          text: 'text-color-primary-foreground',
          border: 'border-color-primary-foreground',
          bg: 'bg-transparent',
          hover: 'hover:bg-color-primary-hovered',
          disabled: 'disabled:text-color-primary-muted disabled:border-color-primary-muted',
          active: 'active:bg-color-primary-hovered'
        }
      },
      tertiary: {
        outline: {
          text: 'text-color-primary-foreground',
          border: 'border-color-primary-foreground',
          bg: 'bg-transparent',
          hover: 'hover:bg-color-primary-hovered',
          disabled: 'disabled:text-color-primary-muted disabled:border-color-primary-muted',
          active: 'active:bg-color-primary-hovered'
        },
        filled: {
          text: 'text-white',
          border: 'border-color-tertiary-base',
          bg: 'bg-color-tertiary-base',
          hover: 'hover:bg-color-tertiary-base',
          disabled: 'disabled:bg-color-primary-muted disabled:border-color-primary-muted',
          active: 'active:bg-color-tertiary-base'
        },
        active: {
          text: 'text-white',
          border: 'border-color-tertiary-base',
          bg: 'bg-color-tertiary-base',
          hover: 'hover:bg-color-tertiary-base',
          disabled: 'disabled:bg-color-primary-muted disabled:border-color-primary-muted',
          active: 'active:bg-color-tertiary-base'
        },
        base: {
          text: 'text-color-primary-foreground',
          border: 'border-color-primary-foreground',
          bg: 'bg-transparent',
          hover: 'hover:bg-color-primary-hovered',
          disabled: 'disabled:text-color-primary-muted disabled:border-color-primary-muted',
          active: 'active:bg-color-primary-hovered'
        }
      }
    };

    const colorSet = colorMap[baseColor] || colorMap.blue;
    return colorSet[buttonMode as keyof typeof colorSet] || colorSet.outline;
  };

  const colorClasses = getColorClasses(color, mode);

  // Check if this uses custom CSS properties that need manual hover handling
  const needsCustomHover = colorClasses.hover.includes('color-primary-hovered') ||
                          colorClasses.hover.includes('color-secondary-active') ||
                          colorClasses.hover.includes('color-tertiary-base');

  if (needsCustomHover) {
    // Use manual hover handling for CSS custom properties, like IconButton
    return (
      <button
        type={type}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors",
          "border rounded-md gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        style={{
          color: colorClasses.text.includes('color-primary-foreground') ? 'hsl(var(--color-primary-foreground))' : undefined,
          borderColor: colorClasses.border.includes('color-primary-foreground') ? 'hsl(var(--color-primary-foreground))' : undefined,
          backgroundColor: colorClasses.bg.includes('bg-transparent') ? 'transparent' :
                          colorClasses.bg.includes('color-secondary-active') ? 'hsl(var(--color-secondary-active))' :
                          colorClasses.bg.includes('color-tertiary-base') ? 'hsl(var(--color-tertiary-base))' : undefined,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            if (colorClasses.hover.includes('color-primary-hovered')) {
              e.currentTarget.style.backgroundColor = 'hsl(var(--color-primary-hovered))';
            } else if (colorClasses.hover.includes('color-secondary-active')) {
              e.currentTarget.style.backgroundColor = 'hsl(var(--color-secondary-active))';
            } else if (colorClasses.hover.includes('color-tertiary-base')) {
              e.currentTarget.style.backgroundColor = 'hsl(var(--color-tertiary-base))';
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            if (colorClasses.bg.includes('bg-transparent')) {
              e.currentTarget.style.backgroundColor = 'transparent';
            } else if (colorClasses.bg.includes('color-secondary-active')) {
              e.currentTarget.style.backgroundColor = 'hsl(var(--color-secondary-active))';
            } else if (colorClasses.bg.includes('color-tertiary-base')) {
              e.currentTarget.style.backgroundColor = 'hsl(var(--color-tertiary-base))';
            }
          }
        }}
      >
        {icon}
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors",
        "border rounded-md gap-2",
        colorClasses.text,
        colorClasses.border,
        colorClasses.bg,
        colorClasses.hover,
        colorClasses.disabled,
        colorClasses.active,
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/**
 * IsActive 컴포넌트
 * 활성/비활성 상태를 표시하는 컴포넌트
 * 기본값: ['활성', '비활성'], ['text-green-800 dark:text-green-400', 'text-red-800 dark:text-red-400']
 * CSS 커스텀 속성도 지원: ['text-color-secondary-active', 'text-color-primary-muted']
 */
export function IsActive({
  value,
  labels = ['활성', '비활성'],
  colors = ['text-green-800 dark:text-green-400', 'text-red-800 dark:text-red-400'],
  className
}: IsActiveProps) {
  const displayText = value ? labels[0] : labels[1];
  const colorClass = value ? colors[0] : colors[1];

  return (
    <span
      className={cn(colorClass, className)}
      style={
        // CSS 커스텀 속성 지원 (text-color-* 형태)
        colorClass.includes('text-color-') ? {
          color: `hsl(var(--${colorClass.replace('text-', '')}))`
        } : undefined
      }
    >
      {displayText}
    </span>
  );
}

// 드롭다운 섹션 헤더 컴포넌트
interface DropdownSectionHeaderProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  borderColor?: string;
  accentColor?: string;
}

export function DropdownSectionHeader({
  title,
  icon,
  isExpanded,
  onToggle,
  borderColor = '#d1d5db', // 기본 회색 테두리
  accentColor = '#6366f1'   // 기본 인디고 accent
}: DropdownSectionHeaderProps) {
  return (
    <button
      className="inline-flex items-center justify-between px-4 py-2 bg-white font-medium"
      style={{
        borderLeft: `8px solid ${accentColor}`,
        borderTop: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`,
        borderBottom: `1px solid ${borderColor}`,
        borderRadius: '8px',
        boxShadow: 'none',
        outline: 'none'
      }}
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold">{title}</span>
      </div>
      {isExpanded ? (
        <ChevronUp className="w-5 h-5" />
      ) : (
        <ChevronDown className="w-5 h-5" />
      )}
    </button>
  );
}

// 탭 헤더 컴포넌트
interface TabHeaderProps {
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabHeader({
  tabs,
  activeTab,
  onTabChange
}: TabHeaderProps) {
  return (
    <div className="flex border-b">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button px-4 py-2 font-medium text-sm flex items-center gap-2 ${
            activeTab === tab.id
              ? 'active'
              : 'text-color-primary-muted-foreground'
          } ${
            // 비활성화된 탭 처리 (activeTab이 빈 문자열이고 onTabChange가 빈 함수인 경우)
            activeTab === '' && onTabChange.toString() === '() => {}'
              ? 'cursor-not-allowed opacity-50'
              : ''
          }`}
          onClick={() => {
            // 비활성화된 탭이 아닌 경우만 클릭 처리
            if (!(activeTab === '' && onTabChange.toString() === '() => {}')) {
              onTabChange(tab.id);
            }
          }}
          disabled={activeTab === '' && onTabChange.toString() === '() => {}'}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// 탭 컨테이너 컴포넌트
interface TabContainerProps {
  children: React.ReactNode;
  borderColor?: string;
}

export function TabContainer({
  children,
  borderColor = 'var(--color-primary-foreground)'
}: TabContainerProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3" style={{borderColor}}>
      {children}
    </div>
  );
}