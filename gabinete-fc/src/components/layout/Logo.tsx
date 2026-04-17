import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  variant?: 'full' | 'text' | 'icon'
  className?: string
}

export function Logo({ variant = 'full', className = '' }: LogoProps) {
  if (variant === 'text') {
    return (
      <Link href="/" className={`flex items-center ${className}`}>
        <span
          className="text-2xl md:text-3xl leading-none uppercase text-primary"
          style={{ fontFamily: "'Barlow Condensed', 'Space Grotesk', sans-serif", fontWeight: 900, letterSpacing: '-0.01em' }}
        >
          GABINETE//FC
        </span>
      </Link>
    )
  }

  if (variant === 'icon') {
    return (
      <Link href="/" className={`flex items-center ${className}`}>
        <Image
          src="/logo/gabinete-fc-icon.png"
          alt="Gabinete FC"
          width={40}
          height={40}
          priority
          className="h-10 w-10 object-contain"
        />
      </Link>
    )
  }

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <Image
        src="/logo/gabinete-fc-logo.png"
        alt="Gabinete FC"
        width={200}
        height={70}
        priority
        className="h-12 w-auto object-contain"
      />
    </Link>
  )
}
