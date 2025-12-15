import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name: string
  email?: string
  photoUrl?: string
  size?: 'sm' | 'md' | 'lg'
  showInfo?: boolean
  className?: string
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const textSizeMap = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

export function UserAvatar({
  name,
  email,
  photoUrl,
  size = 'md',
  showInfo = false,
  className
}: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (showInfo) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Avatar className={sizeMap[size]}>
          <AvatarImage src={photoUrl} alt={name} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className={cn('font-semibold text-foreground', textSizeMap[size])}>
            {name}
          </span>
          {email && (
            <span className="text-xs text-muted-foreground">{email}</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <Avatar className={cn(sizeMap[size], className)}>
      <AvatarImage src={photoUrl} alt={name} />
      <AvatarFallback className="bg-primary text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
