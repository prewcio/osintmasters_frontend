"use client"

import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react"
import Link from "next/link"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: never
}

type AnchorProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
}

type AnimatedButtonProps = ButtonProps | AnchorProps

const baseStyles = `
  relative inline-flex items-center justify-center
  px-4 sm:px-6 py-2 sm:py-3
  text-sm sm:text-base font-medium
  border border-[#39FF14] rounded-md
  bg-transparent text-white
  transition-all duration-300
  hover:bg-[#39FF14] hover:text-black
  focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:ring-offset-2 focus:ring-offset-black
  disabled:opacity-50 disabled:cursor-not-allowed
`

export default function AnimatedButton(props: AnimatedButtonProps) {
  const { children, className = "", ...rest } = props

  if ('href' in props) {
    return (
      <Link
        {...rest as AnchorProps}
        className={`${baseStyles} ${className}`}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      {...rest as ButtonProps}
      className={`${baseStyles} ${className}`}
    >
      {children}
    </button>
  )
}

