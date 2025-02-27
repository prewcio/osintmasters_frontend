import type { ButtonHTMLAttributes } from "react"

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export default function AnimatedButton({ children, className = "", ...props }: AnimatedButtonProps) {
  return (
    <button
      {...props}
      className={`
        relative inline-flex items-center justify-center
        px-4 sm:px-6 py-2 sm:py-3
        text-sm sm:text-base font-medium
        border border-[#39FF14] rounded-md
        bg-transparent text-white
        transition-all duration-300
        hover:bg-[#39FF14] hover:text-black
        focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:ring-offset-2 focus:ring-offset-black
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  )
}

