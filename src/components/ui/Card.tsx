import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {title && <h2 className="text-lg font-semibold mb-4 dark:text-white">{title}</h2>}
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  action?: ReactNode
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold dark:text-white">{title}</h2>
      {action}
    </div>
  )
}