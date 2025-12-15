import { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: ReactNode
  trend?: {
    value: number
    label?: string
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
  className?: string
}

const variantStyles = {
  default: {
    card: 'border-border',
    icon: 'bg-muted text-muted-foreground',
    title: 'text-muted-foreground',
    value: 'text-foreground',
  },
  primary: {
    card: 'border-primary/20 bg-primary/5',
    icon: 'bg-primary/10 text-primary',
    title: 'text-primary/70',
    value: 'text-primary',
  },
  success: {
    card: 'border-green-500/20 bg-green-500/5',
    icon: 'bg-green-500/10 text-green-600 dark:text-green-500',
    title: 'text-green-600/70 dark:text-green-500/70',
    value: 'text-green-700 dark:text-green-500',
  },
  warning: {
    card: 'border-yellow-500/20 bg-yellow-500/5',
    icon: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500',
    title: 'text-yellow-600/70 dark:text-yellow-500/70',
    value: 'text-yellow-700 dark:text-yellow-500',
  },
  destructive: {
    card: 'border-destructive/20 bg-destructive/5',
    icon: 'bg-destructive/10 text-destructive',
    title: 'text-destructive/70',
    value: 'text-destructive',
  },
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant]
  const isPositiveTrend = trend && trend.value > 0
  const isNegativeTrend = trend && trend.value < 0

  return (
    <Card className={cn('shadow-md hover:shadow-lg transition-shadow', styles.card, className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className={cn('text-sm font-medium', styles.title)}>{title}</p>
          {icon && (
            <div className={cn('p-2 rounded-lg', styles.icon)}>
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className={cn('text-3xl font-bold tracking-tight', styles.value)}>
            {value}
          </p>

          {(description || trend) && (
            <div className="flex items-center gap-2 pt-1">
              {trend && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs gap-1',
                    isPositiveTrend && 'border-green-500/50 text-green-600 dark:text-green-500',
                    isNegativeTrend && 'border-red-500/50 text-red-600 dark:text-red-500'
                  )}
                >
                  {isPositiveTrend ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : isNegativeTrend ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  <span>
                    {trend.value > 0 ? '+' : ''}
                    {trend.value}%
                  </span>
                </Badge>
              )}

              {description && (
                <p className="text-xs text-muted-foreground">
                  {trend?.label || description}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
