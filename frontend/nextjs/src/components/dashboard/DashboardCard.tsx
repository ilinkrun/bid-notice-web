'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  children?: React.ReactNode;
}

export function DashboardCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  children
}: DashboardCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center text-xs",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            <span className={cn(
              "mr-1",
              trend.isPositive ? "▲" : "▼"
            )}>
              {trend.isPositive ? "▲" : "▼"}
            </span>
            {Math.abs(trend.value)}%
            <span className="text-muted-foreground ml-1">from last month</span>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}