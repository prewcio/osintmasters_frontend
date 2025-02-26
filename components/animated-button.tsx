import type React from "react"
import Link from "next/link"

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  href?: string
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ children, className, href, ...props }) => {
  const buttonClass = `inline-block bg-black text-white border border-[#39FF14] hover:bg-[#39FF14] hover:text-black transition-all duration-300 px-8 py-3 relative overflow-hidden shadow-[0_0_10px_#39FF14] ${className || ""}`

  if (href) {
    return (
      <Link href={href} className={buttonClass}>
        {children}
      </Link>
    )
  }

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  )
}

export default AnimatedButton

