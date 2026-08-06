import { ReactNode } from 'react'

interface MessageProps {
  msg: string
  className?: string
}

export function Message({ msg, className = '' }: MessageProps) {
  if (!msg) return null

  const isSuccess = msg.includes('sucesso')
  return (
    <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
      isSuccess
        ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
        : 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
    } ${className}`}>
      {msg}
    </div>
  )
}