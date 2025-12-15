import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface StatItem {
  label: string
  value: string | number
  icon?: ReactNode
}

interface PageHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
  stats?: StatItem[]
  variant?: 'default' | 'gradient'
  className?: string
}

export function PageHeader({
  title,
  description,
  icon,
  actions,
  stats,
  variant = 'default',
  className
}: PageHeaderProps) {
  const isGradient = variant === 'gradient'

  return (
    <Card
      className={cn(
        'border-0 shadow-lg',
        isGradient
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white'
          : 'bg-card',
        className
      )}
    >
      <div className="p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            {icon && (
              <div
                className={cn(
                  'p-3 rounded-xl',
                  isGradient
                    ? 'bg-white/20 backdrop-blur-sm'
                    : 'bg-primary/10 text-primary'
                )}
              >
                {icon}
              </div>
            )}
            <div className="flex-1">
              <h1
                className={cn(
                  'text-2xl font-bold tracking-tight',
                  isGradient ? 'text-white' : 'text-foreground'
                )}
              >
                {title}
              </h1>
              {description && (
                <p
                  className={cn(
                    'mt-1 text-sm',
                    isGradient ? 'text-white/80' : 'text-muted-foreground'
                  )}
                >
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* Stats Section */}
        {stats && stats.length > 0 && (
          <>
            <Separator
              className={cn(
                'my-4',
                isGradient ? 'bg-white/20' : 'bg-border'
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg',
                    isGradient
                      ? 'bg-white/10 backdrop-blur-sm'
                      : 'bg-muted/50'
                  )}
                >
                  {stat.icon && (
                    <div
                      className={cn(
                        'text-2xl',
                        isGradient ? 'opacity-80' : 'text-muted-foreground'
                      )}
                    >
                      {stat.icon}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-xs font-medium truncate',
                        isGradient ? 'text-white/70' : 'text-muted-foreground'
                      )}
                    >
                      {stat.label}
                    </p>
                    <p
                      className={cn(
                        'text-lg font-bold truncate',
                        isGradient ? 'text-white' : 'text-foreground'
                      )}
                    >
                      {stat.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
